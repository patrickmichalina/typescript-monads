import { EMPTY, Observable, of } from 'rxjs'
import { IMaybe } from '../maybe.interface'

/**
 * Convert a Maybe into an observable
 *
 * If the Maybe is None, the observable will immediately complete without emitting a value,
 * otherwise it will emit the value contained and complete.
 * 
 * Note on resolution loss: This transformation loses the Maybe context.
 * Once converted to an Observable, None becomes an empty stream (no emissions),
 * rather than an emission with a special "None" value. This means:
 * 1. You cannot directly distinguish between an empty source and a None value
 * 2. Operators like `defaultIfEmpty()` are needed to handle the None case properly
 *
 * @requires rxjs@^7.0
 * @example
 * // Convert a Maybe to an Observable and subscribe
 * maybeToObservable(maybe(5)).subscribe(
 *   value => console.log(value),
 *   err => console.error(err),
 *   () => console.log('Complete')
 * )
 * // prints 5 and 'Complete'
 *
 * // Use with RxJS operators and handle None case
 * maybeToObservable(maybe(user))
 *   .pipe(
 *     map(user => user.name),
 *     defaultIfEmpty('Guest'), // Handle None case
 *     tap(name => console.log(`Hello ${name}`))
 *   )
 *   .subscribe()
 */
export function maybeToObservable<A>(m: IMaybe<A>): Observable<A> {
  return m.isNone() ? EMPTY : of(m.valueOrThrow())
}