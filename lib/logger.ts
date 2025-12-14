/**
 * Simple logger utility that only logs in development mode
 * Prevents debug spam in production builds
 */

export function logDebug(...args: any[]): void {
  if (__DEV__) {
    console.log(...args);
  }
}

export function logWarn(...args: any[]): void {
  if (__DEV__) {
    console.warn(...args);
  }
}

export function logError(...args: any[]): void {
  // Always log errors, even in production
  console.error(...args);
}

