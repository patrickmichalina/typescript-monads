import { EMPTY, Observable, of } from 'rxjs'
import { take } from 'rxjs/operators'
import { IMaybe } from '../maybe.interface'

/**
 * Convert a Maybe into an observable
 *
 * If the Maybe is empty, the observable will immediately complete without emitting a value, otherwise it will emit
 * the value contained and complete.
 *
 * @requires rxjs@^6.0
 * @example
 * of(maybe(5)).pipe(
 *   flatMap(maybeToObservable)
 * ).subscribe(a => console.log(a))
 * // prints 5 and completes
 *
 * of(maybe()).pipe(
 *   flatMap(maybeToObservable)
 * ).subscribe(a => console.log(a))
 * // immediately completes with no emitted value
 */
export const maybeToObservable = <A>(m: IMaybe<A>): Observable<A> => {
  return m.isNone()
    ? EMPTY
    : of(m.valueOrThrow('isNone returned false for empty IMaybe.'))
      .pipe(take(1))
}
