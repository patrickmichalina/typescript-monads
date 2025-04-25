import { IMaybe } from '../maybe.interface'
import { Maybe } from '../maybe'

/**
 * Wraps a function that returns a Promise to catch errors and return a Maybe.
 * 
 * Executes the provided function and converts the result:
 * - If the function's Promise resolves, returns a Some containing the result
 * - If the function's Promise rejects, returns None
 * 
 * This is particularly useful for handling API calls or other operations that may fail,
 * allowing for more functional error handling without explicit try/catch blocks.
 * 
 * @param fn The function that returns a Promise 
 * @returns A Promise that resolves to a Maybe containing the result if successful
 * 
 * @example
 * // Without using tryPromiseToMaybe
 * function fetchUserData(userId) {
 *   return api.fetchUserData(userId)
 *     .then(data => maybe(data))
 *     .catch(() => none());
 * }
 * 
 * // Using tryPromiseToMaybe
 * tryPromiseToMaybe(() => api.fetchUserData(userId))
 *   .then(userDataMaybe => {
 *     // Then use the Maybe as normal
 *     userDataMaybe.match({
 *       some: data => displayUserData(data),
 *       none: () => showErrorMessage('Could not load user data')
 *     });
 *   });
 */
export function tryPromiseToMaybe<T>(fn: () => Promise<T>): Promise<IMaybe<NonNullable<T>>> {
  return fn()
    .then(result => new Maybe<NonNullable<T>>(result as NonNullable<T>))
    .catch(() => new Maybe<NonNullable<T>>())
}
