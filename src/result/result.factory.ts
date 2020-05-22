import { Result } from './result'
import { IResult, Predicate } from './result.interface'

export function ok<TOk, TFail>(value: TOk): IResult<TOk, TFail> {
  return Result.ok<TOk, TFail>(value)
}

export function fail<TOk, TFail>(value: TFail): IResult<TOk, TFail> {
  return Result.fail<TOk, TFail>(value)
}

export function result<TOk, TFail>(predicate: Predicate, okValue: TOk, failValue: TFail): IResult<TOk, TFail> {
  return predicate()
    ? ok(okValue)
    : fail(failValue)
}
