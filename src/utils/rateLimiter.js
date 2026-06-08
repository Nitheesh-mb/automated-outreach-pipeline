import { logger } from './logger.js';

// Simple delay function
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Retry function for handling rate limits (status 429) or temporary server errors
export async function callWithRetry(apiCallFn, maxRetries = 3, initialDelay = 2000) {
  let attempt = 1;
  let delay = initialDelay;

  while (attempt <= maxRetries) {
    try {
      return await apiCallFn();
    } catch (error) {
      const isRateLimit = error.response && (error.response.status === 429 || error.response.status === 402);
      
      if (attempt === maxRetries) {
        throw error;
      }

      // Check if server told us how long to wait
      const retryAfter = error.response?.headers?.['retry-after'];
      const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : delay;

      logger.warn(
        `API failed (Attempt ${attempt}/${maxRetries}): ${error.message}. ` +
        `Waiting ${waitTime / 1000}s to retry...`
      );

      await sleep(waitTime);
      
      delay *= 2; // double delay for next time
      attempt++;
    }
  }
}
