import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileExists, getFilePathFromKey } from '../services/storageService';
import { authMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Serve a file by its key
router.get('/:key', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const key = decodeURIComponent(req.params.key);
    
    if (!fileExists(key)) {
      return res.status(404).json({ 
        success: false, 
        error: 'File not found or has expired' 
      });
    }
    
    const filePath = getFilePathFromKey(key);
    
    // Determine content type
    const extension = path.extname(filePath).toLowerCase().substring(1);
    const contentType = getContentType(extension);
    
    // Set headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
    
    // Send the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
});

/**
 * Get content type based on file extension
 */
function getContentType(format: string): string {
  const formatMap: Record<string, string> = {
    // Video formats
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    'mkv': 'video/x-matroska',
    
    // Audio formats
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    
    // Image formats
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
  };
  
  return formatMap[format.toLowerCase()] || 'application/octet-stream';
}

export default router;