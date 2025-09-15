// utils/logger.js
import winston from 'winston';

const { combine, timestamp, errors, json, simple, colorize, printf } = winston.format;

// Custom format for development
const devFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp(),
    process.env.NODE_ENV === 'development' 
      ? combine(colorize(), devFormat)
      : json()
  ),
  defaultMeta: { 
    service: 'webshop-backend',
    environment: process.env.NODE_ENV 
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true
    })
  ],
  exitOnError: false
});

// Add file transports for production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    format: combine(timestamp(), json())
  }));

  logger.add(new winston.transports.File({
    filename: 'logs/combined.log',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    format: combine(timestamp(), json())
  }));
}

// Create logs directory if it doesn't exist
import { mkdir } from 'fs/promises';
try {
  await mkdir('logs', { recursive: true });
} catch (error) {
  // Directory might already exist
}

export default logger;