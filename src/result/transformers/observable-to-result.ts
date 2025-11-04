import { ok, fail } from '../result.factory'
import { IResult } from '../result.interface'
import { Observable, firstValueFrom } from 'rxjs'
import { catchError, take, map } from 'rxjs/operators'

/**
 * Converts an Observable to a Result monad
 * 
 * Creates a Result from the first value emitted by an Observable:
 * - If the observable emits a value, returns an Ok Result with that value
 * - If the observable completes without emitting or errors, returns a Fail Result with the provided error
 * - If the observable errors, returns a Fail Result with the error
 * 
 * This function transforms the resolution semantics of an Observable to the Result context:
 * - Observable emissions (data) become Ok values (success)
 * - Observable completion without emissions (empty success) becomes Fail (failure with default error)
 * - Observable errors (failure) become Fail (failure with error)
 * 
 * Note that the timing model changes from a continuous/reactive model to a one-time
 * asynchronous result. Only the first emission is captured, and the observable is
 * no longer reactive after transformation.
 * 
 * @param observable The observable to convert to a Result
 * @param defaultError The error to use if the observable completes without emitting a value
 * @returns A Promise that resolves to a Result containing either the emitted value or an error
 * 
 * @requires rxjs@^7.0
 * @example
 * // Convert an observable to a Result
 * userService.getUser(userId)
 *   .pipe(take(1))
 *   .toPromise()
 *   .then(promiseToResult)
 *   .then(result => result.match({
 *     ok: user => renderUser(user),
 *     fail: error => showUserNotFound(error)
 *   }));
 * 
 * // Using observableToResult directly
 * observableToResult(
 *   userService.getUser(userId), 
 *   new Error('User not found')
 * ).then(result => {
 *   if (result.isOk()) {
 *     return renderUser(result.unwrap());
 *   } else {
 *     return showError(result.unwrapFail());
 *   }
 * });
 */
export function observableToResult<T, E = Error>(
  observable: Observable<T>, 
  defaultError: E
): Promise<IResult<T, E>> {
  return firstValueFrom(
    observable.pipe(
      take(1),
      map(value => ok<T, E>(value)),
      catchError((error: unknown) => {
        // Return as array - RxJS automatically converts arrays to observables
        // This allows catchError to return a Result value rather than EMPTY
        return [fail<T, E>(error as E)]
      })
    )
  ).then(
    (result: IResult<T, E>) => result,
    () => fail<T, E>(defaultError) // Handle the case where firstValueFrom rejects
  )
}
