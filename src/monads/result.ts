import { IMaybe } from '../interfaces'
import { maybe } from './maybe'

const returnTrue = () => true
const returnFalse = () => false
const returnValue = <T>(val: T) => () => val
const returnMaybe = <T>(val: T) => () => maybe<T>(val)
const throwReferenceError = (message: string) => () => { throw new ReferenceError(message) }

type Predicate = () => boolean

export interface IResultMatchPattern<T, E, U> {
  readonly ok: (val: T) => U
  readonly fail: (val: E) => U
}

export interface IResult<T, E> {
  isOk(): boolean
  isFail(): boolean
  maybeOk(): IMaybe<T>
  maybeFail(): IMaybe<E>
  unwrap(): T | never
  unwrapOr(opt: T): T
  unwrapFail(): E | never
  match<M>(fn: IResultMatchPattern<T, E, M>): M
  map<M>(fn: (val: T) => M): IResult<M, E>
  mapFail<M>(fn: (err: E) => M): IResult<T, M>
  flatMap<M>(fn: (val: T) => IResult<M, E>): IResult<M, E>
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

export const ok = <T, E = never>(val: T): IResultOk<T, E> => {
  return {
    isOk: returnTrue,
    isFail: returnFalse,
    maybeOk: returnMaybe(val),
    maybeFail: maybe,
    unwrap: returnValue(val),
    unwrapOr: _ => val,
    unwrapFail: throwReferenceError('Cannot unwrap a success'),
    map: <M>(fn: (val: T) => M) => ok(fn(val)),
    mapFail: <M>(_: (err: E) => M) => ok(val),
    flatMap: <M>(fn: (val: T) => IResult<M, E>) => fn(val),
    match: <M>(fn: IResultMatchPattern<T, E, M>) => fn.ok(val)
  }
}

export const fail = <T, E>(err: E): IResultFail<T, E> => {
  return {
    isOk: returnFalse,
    isFail: returnTrue,
    maybeOk: maybe,
    maybeFail: returnMaybe(err),
    unwrap: throwReferenceError('Cannot unwrap a failure'),
    unwrapOr: opt => opt,
    unwrapFail: returnValue(err),
    map: <M>(_: (val: T) => M) => fail(err),
    mapFail: <M>(fn: (err: E) => M) => fail(fn(err)),
    flatMap: <M>(_: (val: T) => IResult<M, E>) => fail(err),
    match: <M>(fn: IResultMatchPattern<T, E, M>) => fn.fail(err)
  }
}

/**
 * Utility function to quickly create ok/fail pairs.
 */
export const result = <T, E>(predicate: Predicate, okValue: T, failValue: E): IResult<T, E> =>
  predicate()
    ? ok<T, E>(okValue)
    : fail<T, E>(failValue)

/**
* Utility function to quickly create ok/fail pairs, curried variant.
*/
export const curriedResult =
  <T, E>(predicate: Predicate) =>
    (okValue: T) =>
      (failValue: E): IResult<T, E> =>
        result(predicate, okValue, failValue)
