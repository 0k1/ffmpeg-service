import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  logger.error(err);
  
  // Prevent leaking sensitive error details in production
  const isProduction = process.env.NODE_ENV === 'production';
  
  const errorResponse = {
    success: false,
    error: isProduction ? 'Internal Server Error' : err.message,
    ...(isProduction ? {} : { stack: err.stack }),
  };
  
  res.status(500).json(errorResponse);
}