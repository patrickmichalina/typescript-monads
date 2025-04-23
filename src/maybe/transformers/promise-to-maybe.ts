import { maybe } from '../maybe.factory'
import { IMaybe } from '../maybe.interface'

/**
 * Converts a Promise to a Maybe monad
 * 
 * Creates a Maybe from a Promise that resolves to a value.
 * If the promise resolves successfully, returns Some with the resolved value.
 * If the promise rejects or resolves to null/undefined, returns None.
 * 
 * Note on resolution preservation: This transformation preserves resolution
 * semantics by converting:
 * - Promise rejections to None values (representing failure/absence)
 * - Promise resolutions to Some values (representing success/presence)
 * 
 * The asynchronous nature is maintained by returning a Promise that resolves to a Maybe,
 * rather than a Maybe directly. This allows for proper handling in asynchronous chains.
 * 
 * @param promise The promise to convert to a Maybe
 * @returns A Promise that resolves to a Maybe containing the result
 * 
 * @example
 * // Convert a promise to a Maybe and use in a chain
 * api.fetchUser(userId)
 *   .then(promiseToMaybe)
 *   .then(userMaybe => userMaybe.match({
 *     some: user => console.log(user.name),
 *     none: () => console.log('User not found')
 *   }))
 */
export function promiseToMaybe<T>(promise: Promise<T>): Promise<IMaybe<T>> {
  return promise
    .then(value => maybe(value))
    .catch(() => maybe<T>())
}