import type { IMaybe } from './maybe.interface'
import { Maybe } from './maybe'

export function maybe<T>(value?: T | null): IMaybe<T> {
  return new Maybe<T>(value)
}

export function none<T>(): IMaybe<T> {
  return Maybe.none<T>()
}

export function some<T>(value: T): IMaybe<T> {
  return maybe(value)
}

/**
 * Creates a function that returns a Maybe for the given property path.
 * 
 * This is a powerful utility for safely navigating nested object structures.
 * It creates a type-safe property accessor function that returns a Maybe
 * containing the value at the specified path if it exists, or None if any
 * part of the path is missing.
 * 
 * @param path A dot-separated string path to the desired property
 * @returns A function that takes an object and returns a Maybe of the property value
 * 
 * @example
 * const getEmail = maybeProps<User>('profile.contact.email');
 * 
 * // Later in code
 * const emailMaybe = getEmail(user);
 * // Returns Some(email) if user.profile.contact.email exists
 * // Returns None if any part of the path is undefined/null
 * 
 * // Use with filter
 * const validEmail = getEmail(user).filter(email => email.includes('@'));
 * 
 * // Use with match
 * getEmail(user).match({
 *   some: email => sendVerification(email),
 *   none: () => showEmailPrompt()
 * });
 */
export function maybeProps<T, R = unknown>(path: string): (obj: T) => IMaybe<R> {
  const segments = path.split('.')
  
  return (obj: T): IMaybe<R> => {
    let current = obj as unknown
    
    for (const segment of segments) {
      if (current === null || current === undefined || !(segment in (current as Record<string, unknown>))) {
        return none<R>()
      }
      current = (current as Record<string, unknown>)[segment]
    }
    
    return maybe<R>(current as R)
  }
}
