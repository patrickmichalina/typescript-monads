import { IMaybe } from "../interfaces"
import { maybe } from "./maybe"

const returnTrue = () => true
const returnFalse = () => false

export interface IResult<T, E> {
  isOk(): boolean
  isFail(): boolean
  maybeOk(): IMaybe<T>
  maybeFail(): IMaybe<E>
  unwrap(): T | never
  unwrapOr(opt: T): T
  unwrapFail(): E | never
  // map<M>(fn: (val: T) => M): IResult<M, E>
  // match<U>(fn: Match<T, E, U>): U
  // map_err<U>(fn: (err: E) => U): Result<T, U>
  // and_then<U>(fn: (val: T) => Result<U, E>): Result<U, E>
}

export interface IResultOk<T, E = never> extends IResult<T, E> {
  unwrap(): T
  unwrapOr(opt: T): T
  unwrapFail(): never
}
export interface IResultFail<T, E> extends IResult<T, E> {
  unwrap(): never
  unwrapOr(opt: T): T
  unwrapFail(): E
}

export const ok = <T, E = never>(val: T): IResultOk<T, E> => {
  return {
    isOk: returnTrue,
    isFail: returnFalse,
    maybeOk: () => maybe(val),
    maybeFail: maybe,
    unwrap: () => val,
    unwrapOr: _ => val,
    unwrapFail: () => { throw new Error() }
  }
}

export const fail = <T, E>(err: E): IResultFail<T, E> => {
  return {
    isOk: returnTrue,
    isFail: returnFalse,
    maybeOk: maybe,
    maybeFail: () => maybe(err),
    unwrap: () => { throw new Error('Cannot unwrap a failure') },
    unwrapOr: opt => opt,
    unwrapFail: () => err
  }
}
