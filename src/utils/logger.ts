import pino from 'pino';
import pinoHttp from 'pino-http';
import config from '../config';

// Create the logger instance
export const logger = pino({
  level: config.logLevel,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: config.env !== 'production',
    },
  },
  redact: {
    paths: ['req.headers.authorization'],
    censor: '***REDACTED***',
  },
});

// Create HTTP logger middleware
export const httpLogger = pinoHttp({
  logger,
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} completed with status ${res.statusCode}`;
  },
  customErrorMessage: (req, res, err) => {
    return `${req.method} ${req.url} failed with status ${res.statusCode}: ${err.message}`;
  },
  customProps: (req, res) => {
    return {
      environment: config.env,
    };
  },
});