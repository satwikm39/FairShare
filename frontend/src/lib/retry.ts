/** Delay helper for exponential-style backoff between attempts. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs `fn` up to `maxRetries + 1` times. Waits `delays[i]` ms after failure `i` before the next attempt.
 * Throws the last error if all attempts fail.
 */
export async function withRetries<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  delaysMs: number[]
): Promise<T> {
  let lastError: unknown;
  const totalAttempts = maxRetries + 1;
  for (let attempt = 0; attempt < totalAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (attempt < maxRetries) {
        const wait = delaysMs[attempt] ?? delaysMs[delaysMs.length - 1] ?? 1000;
        await sleep(wait);
      }
    }
  }
  throw lastError;
}
