import { Observable, EMPTY, firstValueFrom } from 'rxjs'
import { catchError, take, map } from 'rxjs/operators'
import { maybe } from '../maybe.factory'
import { IMaybe } from '../maybe.interface'

/**
 * Converts an Observable to a Maybe monad
 * 
 * Creates a Maybe from the first value emitted by an Observable.
 * If the observable emits a value, returns Some with that value.
 * If the observable completes without emitting or errors, returns None.
 * 
 * Note on resolution transformation: This function transforms the resolution semantics
 * in a meaningful way:
 * - Observable emissions (success) become Some values
 * - Observable completion without emissions or errors (empty success) becomes None
 * - Observable errors (failure) become None
 * 
 * Note on timing: This function changes the timing model by taking only the first
 * emission and converting the asynchronous stream to a Promise of a Maybe.
 * The result is no longer reactive after this transformation.
 * 
 * @param observable The observable to convert to a Maybe
 * @returns A Promise that resolves to a Maybe containing the first emitted value
 * 
 * @requires rxjs@^7.0
 * @example
 * // Convert an observable to a Maybe and use in a chain
 * userService.getUser(userId)
 *   .pipe(take(1))
 *   .toPromise()
 *   .then(promiseToMaybe)
 *   .then(userMaybe => userMaybe
 *     .map(user => user.name)
 *     .valueOr('Guest'))
 *   .then(name => console.log(name))
 */
export function observableToMaybe<T>(observable: Observable<T>): Promise<IMaybe<T>> {
  return firstValueFrom(
    observable.pipe(
      take(1),
      map(value => maybe(value)),
      catchError(() => EMPTY)
    )
  ).then(
    maybeValue => maybeValue,
    () => maybe<T>()
  )
}