import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import { httpLogger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import processingRoutes from './controllers/processingController';
import config from './config';

const app = express();

// Create necessary directories
const dirs = ['./uploads', './output'];
for (const dir of dirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigins,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per window
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
app.use(limiter);

// Request logging
app.use(httpLogger);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', processingRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Error handling
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  
  // Close server
  // Clean temp files
  for (const dir of dirs) {
    if (fs.existsSync(dir)) {
      fs.readdirSync(dir).forEach(file => {
        fs.unlinkSync(path.join(dir, file));
      });
    }
  }
  
  process.exit(0);
});

export default app;