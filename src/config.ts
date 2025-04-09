import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  apiSecretKey: process.env.API_SECRET_KEY || 'default_secret_key_change_this',
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // AWS S3 Configuration
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    bucketName: process.env.S3_BUCKET_NAME || '',
  },
  
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
  },
  
  // FFmpeg settings
  ffmpeg: {
    maxProcessingTime: 30 * 60 * 1000, // 30 minutes
    timeoutThreshold: 2 * 60 * 1000, // 2 minutes
  }
};

export default config;