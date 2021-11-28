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
  mapAsync<M>(fn: (val: T) => Promise<M>): Promise<IResult<M, E>>
  flatMap<M>(fn: (val: T) => IResult<M, E>): IResult<M, E>
  flatMapAsync<M>(fn: (val: T) => Promise<IResult<M, E>>): Promise<IResult<M, E>>
}

export interface IResultOk<T, E = never> extends IResult<T, E> {
  unwrap(): T
  unwrapOr(opt: T): T
  unwrapFail(): never
  match<M>(fn: IResultMatchPattern<T, never, M>): M
  map<M>(fn: (val: T) => M): IResultOk<M, never>
  mapAsync<M>(fn: (val: T) => Promise<M>): Promise<IResultOk<M, never>>
  mapFail<M>(fn: (err: E) => M): IResultOk<T, never>
}

export interface IResultFail<T, E> extends IResult<T, E> {
  unwrap(): never
  unwrapOr(opt: T): T
  unwrapFail(): E
  match<M>(fn: IResultMatchPattern<never, E, M>): M
  map<M>(fn: (val: T) => M): IResultFail<never, E>
  mapAsync<M>(fn: (val: T) => Promise<M>): Promise<IResultFail<never, E>>
  mapFail<M>(fn: (err: E) => M): IResultFail<never, M>
  flatMap<M>(fn: (val: T) => IResult<M, E>): IResultFail<never, E>
  flatMapAsync<M>(fn: (val: T) => Promise<IResult<M, E>>): Promise<IResultFail<never, E>>
}
