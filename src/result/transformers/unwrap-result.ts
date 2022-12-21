import { map, Observable } from 'rxjs'
import { IResult } from '../result.interface'

export function unwrapResultAsObservable<T, E>() {
  return function unwrapResultAsObservable1(
    source: Observable<IResult<T, E>>
  ): Observable<T> {
    return source.pipe(
      map(result => {
        if (result.isOk()) return result.unwrap()
        throw result.unwrapFail()
      })
    ) as Observable<T>
  }
}
