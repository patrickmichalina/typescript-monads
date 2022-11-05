import { IResult } from '../result.interface'

export function resultToPromise<TOk, TFail>(result: IResult<TOk, TFail>): Promise<TOk> {
  return result.isOk()
    ? Promise.resolve(result.unwrap())
    : Promise.reject(result.unwrapFail())
}
