/**
 * Retries a given function up to a maximum number of attempts.
 * @param fn - The asynchronous function to retry, which should return a Promise.
 * @param maxAttempts - The maximum number of attempts to make.
 * @param delay - The delay between attempts in milliseconds.
 * @return A Promise that resolves with the result of the function or rejects after all attempts fail.
 */
export async function retryWithDelay<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let attempts = 0;

  const attempt = async (): Promise<T> => {
    try {
      return await fn();
    } catch (error) {
      attempts += 1;
      if (attempts < maxAttempts) {
        // console.log(`Attempt ${attempts} failed, retrying...`)
        return new Promise<T>((resolve) =>
          setTimeout(() => resolve(attempt()), delay)
        );
      } else {
        throw error;
      }
    }
  };

  return attempt();
}

/**
 * Retries a given asynchronous function up to a maximum number of attempts with a timeout for each attempt.
 * @param fn - The asynchronous function to retry, which should return a Promise.
 * @param maxAttempts - The maximum number of attempts to make.
 * @param delay - The delay between attempts in milliseconds.
 * @param timeout - The maximum time to wait for each attempt in milliseconds.
 * @return A Promise that resolves with the result of the function or rejects after all attempts fail.
 */
export async function retryWithDelayAndTimeout<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000,
  timeout: number = 10000
): Promise<T> {
  for (let attempt = 0; attempt <= maxAttempts; attempt++) {
    try {
      // Create a race between the function and the timeout
      const result = await Promise.race([
        fn(),
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error("Request timed out")), timeout)
        )
      ]);
      return result;
    } catch (error) {
      if (attempt < maxAttempts) {
        // console.log(`Attempt ${attempt} failed: ${error.message}. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }

  // Final fallback error
  throw new Error("Max attempts reached without success.");
}
