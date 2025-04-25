import { ok, fail } from '../result.factory'
import { IResult } from '../result.interface'

/**
 * Converts a Promise to a Result monad with a custom error mapping function
 * 
 * Creates a Result from a Promise with control over error handling:
 * - If the promise resolves, returns an Ok Result with the resolved value
 * - If the promise rejects, maps the error using the provided function and returns a Fail Result
 * 
 * This function provides more control over error handling than promiseToResult by allowing
 * you to transform the rejection reason (typically Error objects) to a domain-specific
 * error type of your choosing.
 * 
 * @param promise The promise to convert to a Result
 * @param errorMapper A function to transform the rejection reason to your error type
 * @returns A Promise that resolves to a Result containing either the resolved value or mapped error
 * 
 * @example
 * // Define a domain-specific error type
 * interface ApiError {
 *   code: string;
 *   message: string;
 *   timestamp: Date;
 * }
 * 
 * // Map raw errors to your domain-specific format
 * const mapError = (error: unknown): ApiError => {
 *   if (error instanceof Error) {
 *     return {
 *       code: 'ERR_API',
 *       message: error.message,
 *       timestamp: new Date()
 *     };
 *   }
 *   return {
 *     code: 'ERR_UNKNOWN',
 *     message: String(error),
 *     timestamp: new Date()
 *   };
 * };
 * 
 * // Convert the promise with your error mapper
 * tryPromiseToResult(fetchData(), mapError)
 *   .then(result => {
 *     // Use the result with your specific error type
 *     return result.match({
 *       ok: data => renderData(data),
 *       fail: (error: ApiError) => {
 *         logError(error.code, error.message);
 *         showErrorWithCode(error.code, error.message);
 *       }
 *     });
 *   });
 */
export function tryPromiseToResult<T, E>(
  promise: Promise<T>, 
  errorMapper: (error: unknown) => E
): Promise<IResult<T, E>> {
  return promise
    .then((value: T) => ok<T, E>(value))
    .catch((error: unknown) => fail<T, E>(errorMapper(error)))
}
