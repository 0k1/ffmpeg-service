import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';
import { logger } from '../utils/logger';

// Base storage directory for output files
const STORAGE_DIR = path.join(process.cwd(), 'storage');

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

/**
 * Store a file in local storage
 */
export async function storeFile(
  filePath: string,
  outputFormat: string
): Promise<{ key: string, path: string }> {
  try {
    // Generate a unique filename
    const fileName = `${uuidv4()}.${outputFormat}`;
    const storageKey = `output/${fileName}`;
    const storagePath = path.join(STORAGE_DIR, fileName);
    
    // Copy the file to storage
    fs.copyFileSync(filePath, storagePath);
    
    // Store metadata about when to expire the file (3 hours from now)
    const metadata = {
      expiresAt: Date.now() + (3 * 60 * 60 * 1000), // 3 hours in milliseconds
      originalName: path.basename(filePath),
      format: outputFormat,
      createdAt: Date.now()
    };
    
    const metadataPath = `${storagePath}.meta.json`;
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    
    logger.info(`Stored file in local storage: ${storagePath}`);
    return { key: storageKey, path: storagePath };
  } catch (error) {
    logger.error('Error storing file', error);
    throw new Error(`File storage failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a URL for a stored file
 */
export function generateFileUrl(key: string): string {
  // In a production environment, you might want to use a proper URL with
  // your domain and a token-based authentication system
  return `/api/files/${encodeURIComponent(key)}`;
}

/**
 * Get the file path from a storage key
 */
export function getFilePathFromKey(key: string): string {
  const fileName = path.basename(key);
  return path.join(STORAGE_DIR, fileName);
}

/**
 * Check if a file exists and has not expired
 */
export function fileExists(key: string): boolean {
  try {
    const filePath = getFilePathFromKey(key);
    const metadataPath = `${filePath}.meta.json`;
    
    if (!fs.existsSync(filePath) || !fs.existsSync(metadataPath)) {
      return false;
    }
    
    // Check if file has expired
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    if (metadata.expiresAt < Date.now()) {
      // File has expired, clean it up
      try {
        fs.unlinkSync(filePath);
        fs.unlinkSync(metadataPath);
      } catch (error) {
        logger.error(`Error deleting expired file ${filePath}`, error);
      }
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error(`Error checking file existence for ${key}`, error);
    return false;
  }
}

/**
 * Clean up expired files
 */
export function cleanupExpiredFiles(): void {
  try {
    logger.info('Running expired files cleanup');
    const now = Date.now();
    
    // Check all files in the storage directory
    const files = fs.readdirSync(STORAGE_DIR);
    
    for (const file of files) {
      // Skip metadata files in this loop
      if (file.endsWith('.meta.json')) continue;
      
      const filePath = path.join(STORAGE_DIR, file);
      const metadataPath = `${filePath}.meta.json`;
      
      // Skip if no metadata (shouldn't happen but just in case)
      if (!fs.existsSync(metadataPath)) continue;
      
      try {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        
        // If expired, delete both the file and its metadata
        if (metadata.expiresAt < now) {
          logger.info(`Deleting expired file: ${filePath}`);
          fs.unlinkSync(filePath);
          fs.unlinkSync(metadataPath);
        }
      } catch (error) {
        logger.error(`Error processing file ${filePath} during cleanup`, error);
      }
    }
    
    logger.info('Expired files cleanup completed');
  } catch (error) {
    logger.error('Error during expired files cleanup', error);
  }
}

// Schedule cleanup every hour
export function scheduleCleanup(): void {
  // Run once at startup
  cleanupExpiredFiles();
  
  // Then schedule every hour
  setInterval(cleanupExpiredFiles, 60 * 60 * 1000);
  
  logger.info('Scheduled hourly cleanup of expired files');
}