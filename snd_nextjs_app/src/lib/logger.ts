// Production-safe logging utility
export const logger = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
    }
  },
  error: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(...args);
    }
  },
  warn: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(...args);
    }
  },
};

