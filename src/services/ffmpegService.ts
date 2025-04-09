import { spawn } from 'child_process';
import { logger } from '../utils/logger';
import config from '../config';

interface FFmpegOptions {
  command: string;
  inputPath: string;
  outputPath: string;
}

export async function processFFmpegCommand(options: FFmpegOptions): Promise<void> {
  const { command, inputPath, outputPath } = options;
  
  // Process command, replacing placeholders
  const processedCommand = command
    .replace(/\[input\]/g, inputPath)
    .replace(/\[output\]/g, outputPath);
  
  logger.info(`Executing FFmpeg command: ${processedCommand}`);
  
  return new Promise<void>((resolve, reject) => {
    // Split the command into arguments
    const args = processedCommand.split(' ').filter(arg => arg.trim() !== '');
    
    // Create FFmpeg process
    const ffmpegProcess = spawn('ffmpeg', args);
    
    let stderr = '';
    let stdout = '';
    let isTimeout = false;
    
    // Set timeout for the process
    const timeout = setTimeout(() => {
      isTimeout = true;
      ffmpegProcess.kill('SIGTERM');
      reject(new Error('FFmpeg process timed out'));
    }, config.ffmpeg.maxProcessingTime);
    
    // Collect stderr output
    ffmpegProcess.stderr.on('data', (data) => {
      const chunk = data.toString();
      stderr += chunk;
      logger.debug(`FFmpeg: ${chunk}`);
    });
    
    // Collect stdout output
    ffmpegProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    // Handle process exit
    ffmpegProcess.on('close', (code) => {
      clearTimeout(timeout);
      
      if (isTimeout) {
        return; // Already handled by timeout
      }
      
      if (code === 0) {
        logger.info('FFmpeg process completed successfully');
        resolve();
      } else {
        logger.error(`FFmpeg process exited with code ${code}`);
        reject(new Error(`FFmpeg process failed with code ${code}: ${stderr}`));
      }
    });
    
    // Handle process error
    ffmpegProcess.on('error', (err) => {
      clearTimeout(timeout);
      logger.error('Failed to start FFmpeg process', err);
      reject(new Error(`Failed to start FFmpeg process: ${err.message}`));
    });
  });
}