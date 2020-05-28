import { IMaybe, maybe, none } from '../maybe/public_api'
import { IResultMatchPattern, IResult } from './result.interface'

export abstract class Result<TOk, TFail> implements IResult<TOk, TFail> {
  public static ok<TOk, TFail>(value: TOk): IResult<TOk, TFail> {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new OkResult<TOk, TFail>(value)
  }

  public static fail<TOk, TFail>(value: TFail): IResult<TOk, TFail> {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new FailResult<TOk, TFail>(value)
  }

  abstract isOk(): boolean
  abstract isFail(): boolean
  abstract unwrap(): TOk | never
  abstract unwrapOr(opt: TOk): TOk
  abstract unwrapFail(): TFail | never
  abstract maybeOk(): IMaybe<NonNullable<TOk>>
  abstract maybeFail(): IMaybe<TFail>
  abstract match<M>(fn: IResultMatchPattern<TOk, TFail, M>): M
  abstract map<M>(fn: (val: TOk) => M): IResult<M, TFail>
  abstract mapFail<M>(fn: (err: TFail) => M): IResult<TOk, M>
  abstract flatMap<M>(fn: (val: TOk) => IResult<M, TFail>): IResult<M, TFail>
}

export class OkResult<TOk, TFail> extends Result<TOk, TFail> {
  constructor(private readonly successValue: TOk) {
    super()
  }

  isOk(): boolean {
    return true
  }

  isFail(): boolean {
    return false
  }

  unwrap(): TOk {
    return this.successValue
  }

  unwrapOr(): TOk {
    return this.unwrap()
  }

  unwrapFail(): never {
    throw new ReferenceError('Cannot unwrap a success as a failure')
  }

  maybeOk(): IMaybe<NonNullable<TOk>> {
    return maybe(this.successValue as NonNullable<TOk>)
  }

  maybeFail(): IMaybe<TFail> {
    return none()
  }

  match<M>(fn: IResultMatchPattern<TOk, TFail, M>): M {
    return fn.ok(this.successValue)
  }

  map<M>(fn: (val: TOk) => M): IResult<M, TFail> {
    return Result.ok<M, TFail>(fn(this.successValue))
  }

  mapFail<M>(): IResult<TOk, M> {
    return Result.ok(this.successValue)
  }

  flatMap<M>(fn: (val: TOk) => IResult<M, TFail>): IResult<M, TFail> {
    return fn(this.successValue)
  }

}

export class FailResult<TOk, TFail> extends Result<TOk, TFail> implements IResult<TOk, TFail>  {
  constructor(private readonly value: TFail) {
    super()
  }

  isOk(): boolean {
    return false
  }

  isFail(): boolean {
    return true
  }

  unwrap(): TOk {
    throw new Error('Cannot unwrap a failure')
  }

  unwrapOr(opt: TOk): TOk {
    return opt
  }

  unwrapFail(): TFail {
    return this.value
  }

  maybeOk(): IMaybe<NonNullable<TOk>> {
    return none()
  }

  maybeFail(): IMaybe<TFail> {
    return maybe(this.value)
  }

  match<M>(fn: IResultMatchPattern<TOk, TFail, M>): M {
    return fn.fail(this.value)
  }

  mapFail<M>(fn: (err: TFail) => M): IResult<TOk, M> {
    return Result.fail(fn(this.value))
  }

  map<M>(): IResult<M, TFail> {
    return Result.fail(this.value)
  }

  flatMap<M>(): IResult<M, TFail> {
    return Result.fail(this.value)
  }
}
