import { IMaybe } from '../maybe/maybe.interface'

export type Predicate = () => boolean

export interface IResultMatchPattern<T, E, U> {
  readonly ok: (val: T) => U
  readonly fail: (val: E) => U
}

export interface IResult<T, E> {
  isOk(): boolean
  isFail(): boolean
  maybeOk(): IMaybe<NonNullable<T>>
  maybeFail(): IMaybe<E>
  unwrap(): T | never
  unwrapOr(opt: T): T
  unwrapFail(): E | never
  match<M>(fn: IResultMatchPattern<T, E, M>): M
  map<M>(fn: (val: T) => M): IResult<M, E>
  mapFail<M>(fn: (err: E) => M): IResult<T, M>
  flatMap<M>(fn: (val: T) => IResult<M, E>): IResult<M, E>

  /**
   * Execute functions with side-effects.
   */
  tap(val: Partial<IResultMatchPattern<T, E, void>>): void

  /**
   * Execute a function with side-effects when maybe is a Fail.
   */
  tapFail(f: (val: E) => void): void

  /**
   * Execute a function with side-effects when maybe is an Ok.
   */
  tapOk(f: (val: T) => void): void

  /**
   * Convert Ok result into Fail using projected value from Ok
   */
  toFailWhenOk(fn: (val: T) => E): IResult<T, E>

  /**
   * Convert Ok result into Fail using a provided value
   */
  toFailWhenOkFrom(val: E): IResult<T, E>

  /**
   * Execute a function with side-effects.
   * Returns this to continue operations
   */
  tapThru(val: Partial<IResultMatchPattern<T, E, void>>): IResult<T, E>

  /**
   * Execute a function with side-effects when maybe is a OK.
   * Returns this to continue operations
   */
  tapOkThru(fn: (val: T) => void): IResult<T, E>

  /**
   * Execute a function with side-effects when maybe is a Fail.
   * Returns this to continue operations
   */
  tapFailThru(fn: (val: E) => void): IResult<T, E>
}

export interface IResultOk<T, E = never> extends IResult<T, E> {
  unwrap(): T
  unwrapOr(opt: T): T
  unwrapFail(): never
  match<M>(fn: IResultMatchPattern<T, never, M>): M
  map<M>(fn: (val: T) => M): IResultOk<M, never>
  mapFail<M>(fn: (err: E) => M): IResultOk<T, never>
}

export interface IResultFail<T, E> extends IResult<T, E> {
  unwrap(): never
  unwrapOr(opt: T): T
  unwrapFail(): E
  match<M>(fn: IResultMatchPattern<never, E, M>): M
  map<M>(fn: (val: T) => M): IResultFail<never, E>
  mapFail<M>(fn: (err: E) => M): IResultFail<never, M>
  flatMap<M>(fn: (val: T) => IResult<M, E>): IResultFail<never, E>
}
