import { IMaybe } from '../maybe.interface'

export const maybeToPromise =
  <TReject>(catchResponse?: TReject) =>
    <TResolve>(maybe: IMaybe<TResolve>): Promise<TResolve> => maybe.isSome()
      ? Promise.resolve(maybe.valueOrUndefined() as TResolve)
      : Promise.reject(catchResponse as TReject)
