import { Observable, of, throwError } from 'rxjs'
import { IResult } from '../result.interface'

export function resultToObservable<TOk, TFail>(result: IResult<TOk, TFail>): Observable<TOk> {
  if (result.isOk()) {
    return of(result.unwrap())
  } else {
    return throwError(() => result.unwrapFail())
  }
}
