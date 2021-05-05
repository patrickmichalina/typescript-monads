import { IResult } from '../result.interface'

export const resultToPromise =
  <TOk, TFail>(result: IResult<TOk, TFail>): Promise<TOk> => result.isOk()
    ? Promise.resolve(result.unwrap() as TOk)
    : Promise.reject(result.unwrapFail() as TFail)
