import { IMaybe } from '../maybe.interface'

export function maybeToPromise<TResolve, TReject>(catchResponse?: TReject) {
  return function maybeToPromise(maybe: IMaybe<TResolve>): Promise<TResolve> {
    return maybe.isSome()
      ? Promise.resolve(maybe.valueOrThrow())
      : Promise.reject(catchResponse)
  }
}
