import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  apiSecretKey: process.env.API_SECRET_KEY || 'default_secret_key_change_this',
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // CloudFFmpeg API
  cloudffmpeg: {
    apiUrl: process.env.CLOUDFFMPEG_API_URL || 'http://localhost:3000',
  },
  
  // CORS settings
  corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',
  
  // File paths
  paths: {
    uploads: path.resolve(process.cwd(), 'uploads'),
    output: path.resolve(process.cwd(), 'output'),
    storage: path.resolve(process.cwd(), 'storage'),
  },
  
  // FFmpeg settings
  ffmpeg: {
    maxProcessingTime: 30 * 60 * 1000, // 30 minutes
    timeoutThreshold: 2 * 60 * 1000, // 2 minutes
  },
  
  // Storage configuration
  storage: {
    retentionHours: 3, // Keep files for 3 hours
    cleanupInterval: 60 * 60 * 1000, // Run cleanup every hour
  },
};

export default config;