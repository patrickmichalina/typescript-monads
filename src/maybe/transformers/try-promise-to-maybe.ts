import { IMaybe } from '../maybe.interface'
import { Maybe } from '../maybe'

/**
 * Wraps a function that returns a Promise to catch errors and return a Maybe.
 *
 * **IMPORTANT**: This function takes a **function that returns a Promise**, not a Promise directly.
 * This allows lazy evaluation and proper error catching. If you already have a Promise,
 * use `promiseToMaybe()` instead.
 *
 * Executes the provided function and converts the result:
 * - If the function's Promise resolves, returns a Some containing the result
 * - If the function's Promise rejects, returns None
 *
 * This is particularly useful for handling API calls or other operations that may fail,
 * allowing for more functional error handling without explicit try/catch blocks.
 *
 * @param fn A function that returns a Promise (not the Promise itself)
 * @returns A Promise that resolves to a Maybe containing the result if successful
 *
 * @example
 * // ✅ CORRECT: Pass a function that returns a Promise
 * tryPromiseToMaybe(() => api.fetchUserData(userId))
 *   .then(userDataMaybe => userDataMaybe.match({
 *     some: data => displayUserData(data),
 *     none: () => showErrorMessage('Could not load user data')
 *   }));
 *
 * // ❌ INCORRECT: Don't pass a Promise directly
 * // tryPromiseToMaybe(api.fetchUserData(userId)) // This won't work!
 *
 * // If you already have a Promise, use promiseToMaybe instead:
 * const promise = api.fetchUserData(userId);
 * promiseToMaybe(promise).then(userDataMaybe => { ... });
 *
 * @see promiseToMaybe - Use this if you already have a Promise
 */
export function tryPromiseToMaybe<T>(fn: () => Promise<T>): Promise<IMaybe<NonNullable<T>>> {
  return fn()
    .then(result => new Maybe<NonNullable<T>>(result as NonNullable<T>))
    .catch(() => new Maybe<NonNullable<T>>())
}
