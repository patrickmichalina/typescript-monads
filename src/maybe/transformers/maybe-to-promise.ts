import { IMaybe } from '../maybe.interface'

/**
 * Convert a Maybe to a Promise
 * 
 * By default:
 * - Some values are converted to resolved promises with the contained value
 * - None values are converted to rejected promises with an optional rejection value
 * 
 * When handleNoneAsResolved is true:
 * - None values are converted to resolved promises with the fallback value
 * 
 * Note on resolution loss: This transformation loses the Maybe context. 
 * Once converted to a Promise, you can no longer distinguish between a 
 * None and a Some directly; you must handle this through promise rejection
 * or by examining the resolved value.
 * 
 * @param catchResponse Optional value to use when rejecting the promise for None values
 * @param handleNoneAsResolved Optional flag to handle None as a resolved promise with fallbackValue
 * @param fallbackValue Optional value to resolve with when None is encountered and handleNoneAsResolved is true
 * @returns A function that converts a Maybe to a Promise
 * 
 * @example
 * // Converting None to a rejected promise
 * maybe(user)
 *   .flatMap(u => maybe(u.profile))
 *   .then(maybeToPromise(new Error('Profile not found')))
 *   .then(profile => console.log(profile.name))
 *   .catch(err => console.error(err.message)) // 'Profile not found'
 * 
 * // Converting None to a resolved promise with a default value
 * maybe(user)
 *   .flatMap(u => maybe(u.profile))
 *   .then(maybeToPromise(null, true, { name: 'Anonymous' }))
 *   .then(profile => console.log(profile.name)) // 'Anonymous' when profile is None
 */
export function maybeToPromise<TResolve, TReject = unknown>(
  catchResponse?: TReject,
  handleNoneAsResolved = false,
  fallbackValue?: TResolve
) {
  return function maybeToPromiseConverter(maybe: IMaybe<TResolve>): Promise<TResolve> {
    if (maybe.isSome()) {
      return Promise.resolve(maybe.valueOrThrow())
    }
    
    return handleNoneAsResolved
      ? Promise.resolve(fallbackValue as TResolve)
      : Promise.reject(catchResponse)
  }
}