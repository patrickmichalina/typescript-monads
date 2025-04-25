import { ok, fail } from '../result.factory'
import { IResult } from '../result.interface'

/**
 * Converts a Promise to a Result monad
 * 
 * Creates a Result from a Promise:
 * - If the promise resolves, returns an Ok Result with the resolved value
 * - If the promise rejects, returns a Fail Result with the rejection reason
 * 
 * Note on error typing: The error type defaults to unknown because JavaScript promises
 * can reject with any value. In TypeScript, you may need to use type assertions or
 * create a more specific version of this function if you know the exact error type.
 * 
 * @param promise The promise to convert to a Result
 * @returns A Promise that resolves to a Result containing either the resolved value or rejection reason
 * 
 * @example
 * // Convert a promise to a Result
 * fetchData()
 *   .then(promiseToResult)
 *   .then(result => result.match({
 *     ok: data => renderData(data),
 *     fail: error => showError(error)
 *   }));
 * 
 * // With Promise chaining
 * promiseToResult(fetchData())
 *   .then(result => {
 *     if (result.isOk()) {
 *       const data = result.unwrap();
 *       return renderData(data);
 *     } else {
 *       const error = result.unwrapFail();
 *       return showError(error);
 *     }
 *   });
 */
export function promiseToResult<T, E = unknown>(promise: Promise<T>): Promise<IResult<T, E>> {
  return promise
    .then((value: T) => ok<T, E>(value))
    .catch((error: E) => fail<T, E>(error))
}
