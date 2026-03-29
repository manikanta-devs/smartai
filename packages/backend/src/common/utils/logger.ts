/**
 * Logger utility for structured logging
 */

export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error || '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data || '');
  },
  debug: (message: string, data?: any) => {
    if (process.env.DEBUG) {
      console.log(`[DEBUG] ${message}`, data || '');
    }
  },
};
