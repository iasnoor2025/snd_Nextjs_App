// Logging configuration to control debug output
export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
} as const;

export type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';

// Set this to control logging verbosity
export const CURRENT_LOG_LEVEL: LogLevel =
  process.env.NODE_ENV === 'development' ? 'INFO' : 'ERROR';

export function shouldLog(level: LogLevel): boolean {
  // Only log in development or when explicitly enabled
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  // In production, only log errors and warnings
  if (process.env.NODE_ENV === 'production') {
    return level === 'ERROR' || level === 'WARN';
  }
  
  // Default to false for other environments
  return false;
}

export function log(level: LogLevel, message: string, ...args: any[]): void {
  if (shouldLog(level)) {
    const prefix = `[${level}]`;
    switch (level) {
      case 'ERROR':
        console.error(prefix, message, ...args);
        break;
      case 'WARN':
        console.warn(prefix, message, ...args);
        break;
      case 'INFO':
        console.info(prefix, message, ...args);
        break;
      case 'DEBUG':
        console.log(prefix, message, ...args);
        break;
    }
  }
}

// Convenience functions
export const logError = (message: string, ...args: any[]) => log('ERROR', message, ...args);
export const logWarn = (message: string, ...args: any[]) => log('WARN', message, ...args);
export const logInfo = (message: string, ...args: any[]) => log('INFO', message, ...args);
export const logDebug = (message: string, ...args: any[]) => log('DEBUG', message, ...args);
