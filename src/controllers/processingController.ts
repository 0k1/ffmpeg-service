import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { uploadMiddleware } from '../middleware/upload';
import { authMiddleware } from '../middleware/auth';
import { validateCommand, validateJobId } from '../utils/validators';
import { processFFmpegCommand } from '../services/ffmpegService';
import { storeFile, generateFileUrl } from '../services/storageService';
import { logger } from '../utils/logger';
import { updateJobStatus } from '../services/jobService';
import config from '../config';

const router = Router();

router.post(
  '/process',
  authMiddleware,
  uploadMiddleware.single('inputFile'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get request data
      const { command, jobId, outputFormat } = req.body;
      
      // Validate input
      if (!validateJobId(jobId)) {
        return res.status(400).json({ success: false, error: 'Invalid job ID' });
      }
      
      if (!validateCommand(command)) {
        return res.status(400).json({ success: false, error: 'Invalid FFmpeg command' });
      }
      
      if (!outputFormat || typeof outputFormat !== 'string') {
        return res.status(400).json({ success: false, error: 'Output format is required' });
      }
      
      // Handle direct URL input or uploaded file
      let inputPath: string;
      let inputUrl: string | undefined;
      
      if (req.file) {
        // File was uploaded
        inputPath = req.file.path;
        logger.info(`Processing uploaded file: ${inputPath}`);
      } else if (req.body.inputUrl) {
        // URL was provided
        inputUrl = req.body.inputUrl;
        // Add a type assertion to tell TypeScript that inputUrl is definitely a string here
        const extension = (inputUrl as string).split('.').pop() || 'mp4'; // Add fallback extension
        const inputFileName = `input-${uuidv4()}.${extension}`;
        inputPath = path.join(config.paths.uploads, inputFileName);
        logger.info(`Processing from URL: ${inputUrl}`);
      } else {
        return res.status(400).json({ success: false, error: 'No input file or URL provided' });
      }
      
      // Update job status to "processing"
      await updateJobStatus(jobId, 'processing');
      
      // Generate output path
      const outputFileName = `output-${uuidv4()}.${outputFormat}`;
      const outputPath = path.join(config.paths.output, outputFileName);
      
      // Process the FFmpeg command
      try {
        // If we have a URL, download it first
        if (inputUrl && !req.file) {
          // File path will be updated after download
          inputPath = await downloadFile(inputUrl, inputPath);
        }
        
        // Process the FFmpeg command
        await processFFmpegCommand({
          command,
          inputPath,
          outputPath,
        });
        
        // Store the file locally instead of S3
        const { key } = await storeFile(outputPath, outputFormat);
        
        // Generate URL
        const fileUrl = generateFileUrl(key);
        
        // Update job status to completed
        await updateJobStatus(jobId, 'completed', fileUrl);
        
        // Return success response
        res.json({ success: true, outputUrl: fileUrl });
      } catch (error) {
        // Log error
        logger.error('FFmpeg processing error', error);
        
        // Update job status to failed
        await updateJobStatus(jobId, 'failed');
        
        // Return error response
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown processing error'
        });
      } finally {
        // Clean up temporary files
        cleanupFiles(inputPath, outputPath);
      }
    } catch (error) {
      next(error);
    }
  }
);

// Download a file from a URL
async function downloadFile(url: string, filePath: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }
  
  const fileStream = fs.createWriteStream(filePath);
  const buffer = Buffer.from(await response.arrayBuffer());
  
  return new Promise<string>((resolve, reject) => {
    fileStream.write(buffer);
    fileStream.on('finish', () => resolve(filePath));
    fileStream.on('error', reject);
    fileStream.end();
  });
}

// Clean up temporary files
function cleanupFiles(...filePaths: string[]) {
  for (const path of filePaths) {
    if (fs.existsSync(path)) {
      fs.unlink(path, (err) => {
        if (err) {
          logger.error(`Error deleting file ${path}:`, err);
        }
      });
    }
  }
}

export default router;