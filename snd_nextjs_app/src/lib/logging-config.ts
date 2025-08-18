// Logging configuration to control debug output
export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
} as const;

export type LogLevel = keyof typeof LOG_LEVELS;

// Set this to control logging verbosity
export const CURRENT_LOG_LEVEL: LogLevel =
  process.env.NODE_ENV === 'development' ? 'INFO' : 'ERROR';

export function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] <= LOG_LEVELS[CURRENT_LOG_LEVEL];
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
        console.log(prefix, message, ...args);
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
