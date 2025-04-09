import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import config from '../config';
import { logger } from '../utils/logger';

// Initialize S3 client
const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

/**
 * Upload a file to S3
 */
export async function uploadToS3(
  filePath: string,
  key: string,
  outputFormat: string
): Promise<void> {
  try {
    const fileContent = fs.readFileSync(filePath);
    
    const params = {
      Bucket: config.aws.bucketName,
      Key: key,
      Body: fileContent,
      ContentType: getContentType(outputFormat),
    };
    
    await s3Client.send(new PutObjectCommand(params));
    logger.info(`Successfully uploaded file to S3: ${key}`);
  } catch (error) {
    logger.error('Error uploading to S3', error);
    throw new Error(`S3 upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a signed URL for a file in S3
 */
export async function generateSignedUrl(key: string, expiresIn = 86400): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: config.aws.bucketName,
      Key: key,
    });
    
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    logger.info(`Generated signed URL for file: ${key}`);
    return url;
  } catch (error) {
    logger.error('Error generating signed URL', error);
    throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

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