import { IMaybe } from "../interfaces"
import { maybe } from "./maybe"

const returnTrue = () => true
const returnFalse = () => false
const returnValue = <T>(val: T) => () => val
const returnMaybe = <T>(val: T) => () => maybe<T>(val)
const throwError = (message: string) => () => { throw new Error(message) }

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
    maybeOk: returnMaybe(val),
    maybeFail: maybe,
    unwrap: returnValue(val),
    unwrapOr: _ => val,
    unwrapFail: throwError('Cannot unwrap a success')
  }
}

export const fail = <T, E>(err: E): IResultFail<T, E> => {
  return {
    isOk: returnFalse,
    isFail: returnTrue,
    maybeOk: maybe,
    maybeFail: returnMaybe(err),
    unwrap: throwError('Cannot unwrap a failure'),
    unwrapOr: opt => opt,
    unwrapFail: returnValue(err)
  }
}
