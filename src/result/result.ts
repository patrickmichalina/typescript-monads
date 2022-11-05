import { IMaybe, maybe, none } from '../maybe/public_api'
import { IResultMatchPattern, IResult } from './result.interface'

function handleTap<TOk, TFail>(val: TOk | TFail, fn?: (val: TOk | TFail) => void): void {
  typeof fn === 'function' && fn(val)
}

export abstract class Result<TOk, TFail> implements IResult<TOk, TFail> {
  public static ok<TOk, TFail>(value: TOk): IResult<TOk, TFail> {
    return new OkResult<TOk, TFail>(value)
  }

  public static fail<TOk, TFail>(value: TFail): IResult<TOk, TFail> {
    return new FailResult<TOk, TFail>(value)
  }

  abstract isOk(): this is OkResult<TOk, TFail>
  abstract isFail(): this is FailResult<TOk, TFail>
  abstract unwrap(): TOk | never
  abstract unwrapOr(opt: TOk): TOk
  abstract unwrapFail(): TFail | never
  abstract maybeOk(): IMaybe<NonNullable<TOk>>
  abstract maybeFail(): IMaybe<TFail>
  abstract match<M>(fn: IResultMatchPattern<TOk, TFail, M>): M
  abstract map<M>(fn: (val: TOk) => M): IResult<M, TFail>
  abstract mapFail<M>(fn: (err: TFail) => M): IResult<TOk, M>
  abstract flatMap<M>(fn: (val: TOk) => IResult<M, TFail>): IResult<M, TFail>
  abstract toFailWhenOk(fn: (val: TOk) => TFail): IResult<TOk, TFail>
  abstract toFailWhenOkFrom(val: TFail): IResult<TOk, TFail>
  abstract tap(val: IResultMatchPattern<TOk, TFail, void>): void
  abstract tapOk(f: (val: TOk) => void): void
  abstract tapFail(f: (val: TFail) => void): void
}

export class OkResult<TOk, TFail> extends Result<TOk, TFail> {
  constructor(private readonly successValue: TOk) {
    super()
  }

  isOk(): this is OkResult<TOk, TFail> {
    return true
  }

  isFail(): this is FailResult<TOk, TFail> {
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

  toFailWhenOk(fn: (val: TOk) => TFail): IResult<TOk, TFail> {
    return Result.fail(fn(this.successValue))
  }

  toFailWhenOkFrom(val: TFail): IResult<TOk, TFail> {
    return Result.fail(val)
  }

  tap(val: Partial<IResultMatchPattern<TOk, TFail, void>>): void {
    handleTap(this.successValue, val.ok)
  }

  tapOk(fn: (val: TOk) => void): void {
    fn(this.successValue)
  }

  tapFail(): void { }
}

export class FailResult<TOk, TFail> extends Result<TOk, TFail> implements IResult<TOk, TFail>  {
  constructor(private readonly failureValue: TFail) {
    super()
  }

  isOk(): this is OkResult<TOk, TFail> {
    return false
  }

  isFail(): this is FailResult<TOk, TFail> {
    return true
  }

  unwrap(): TOk {
    throw new Error('Cannot unwrap a failure')
  }

  unwrapOr(opt: TOk): TOk {
    return opt
  }

  unwrapFail(): TFail {
    return this.failureValue
  }

  maybeOk(): IMaybe<NonNullable<TOk>> {
    return none()
  }

  maybeFail(): IMaybe<TFail> {
    return maybe(this.failureValue)
  }

  match<M>(fn: IResultMatchPattern<TOk, TFail, M>): M {
    return fn.fail(this.failureValue)
  }

  mapFail<M>(fn: (err: TFail) => M): IResult<TOk, M> {
    return Result.fail(fn(this.failureValue))
  }

  map<M>(): IResult<M, TFail> {
    return Result.fail(this.failureValue)
  }

  flatMap<M>(): IResult<M, TFail> {
    return Result.fail(this.failureValue)
  }

  toFailWhenOk(): IResult<TOk, TFail> {
    return this
  }

  toFailWhenOkFrom(val: TFail): IResult<TOk, TFail> {
    return Result.fail(val)
  }

  tap(val: Partial<IResultMatchPattern<TOk, TFail, void>>): void {
    handleTap(this.failureValue, val.fail)
  }

  tapOk(): void { }

  tapFail(fn: (val: TFail) => void): void {
    fn(this.failureValue)
  }
}
