import { IMaybe } from '../maybe.interface'
import { Maybe } from '../maybe'

/**
 * Wraps an async function to catch errors and return a Maybe.
 * 
 * Executes the provided function within a try/catch block and converts the result:
 * - If the function succeeds, returns a Some containing the result
 * - If the function throws an error, returns None
 * 
 * This is particularly useful for handling API calls or other operations that may fail,
 * allowing for more functional error handling without explicit try/catch blocks.
 * 
 * @param fn The function to execute
 * @returns A Promise that resolves to a Maybe containing the result if successful
 * 
 * @example
 * // Without using tryPromiseToMaybe
 * try {
 *   const data = await api.fetchUserData(userId);
 *   return maybe(data);
 * } catch (error) {
 *   return none();
 * }
 * 
 * // Using tryPromiseToMaybe
 * const userDataMaybe = await tryPromiseToMaybe(() => api.fetchUserData(userId));
 * 
 * // Then use the Maybe as normal
 * userDataMaybe.match({
 *   some: data => displayUserData(data),
 *   none: () => showErrorMessage('Could not load user data')
 * });
 */
export async function tryPromiseToMaybe<T>(fn: () => Promise<T>): Promise<IMaybe<NonNullable<T>>> {
  try {
    const result = await fn()
    return new Maybe<NonNullable<T>>(result as NonNullable<T>)
  } catch (error) {
    return new Maybe<NonNullable<T>>()
  }
}
