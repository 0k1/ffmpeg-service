import { Request, Response, NextFunction } from 'express';
import config from '../config';
import { logger } from '../utils/logger';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Missing or invalid auth header' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (token !== config.apiSecretKey) {
      logger.warn('Invalid API key attempt', {
        ip: req.ip,
        path: req.path,
      });
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid API key' });
    }
    
    next();
  } catch (error) {
    logger.error('Auth middleware error', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}