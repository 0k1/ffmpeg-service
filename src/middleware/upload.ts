import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.paths.uploads);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}-${file.originalname.replace(/\s+/g, '-')}`;
    cb(null, uniqueFilename);
  },
});

// File filter
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept video and audio files
  const allowedMimeTypes = [
    'video/mp4', 'video/webm', 'video/x-msvideo', 'video/quicktime',
    'audio/mpeg', 'audio/wav', 'audio/ogg',
    'image/jpeg', 'image/png', 'image/gif'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`));
  }
};

// Create multer upload instance
export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max file size
  },
});