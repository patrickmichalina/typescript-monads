import { IMaybe } from "../interfaces"
import { maybe } from "./maybe"

const returnTrue = () => true
const returnFalse = () => false
const returnValue = <T>(val: T) => () => val
const returnMaybe = <T>(val: T) => () => maybe<T>(val)
const throwReferenceError = (message: string) => () => { throw new ReferenceError(message) }
type Predicate = () => boolean

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
    unwrapFail: throwReferenceError('Cannot unwrap a success')
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
    unwrapFail: returnValue(err)
  }
}

/**
 * Utility function to quickly create ok/fail pairs.
 */
export const result = <T, E>(predicate: Predicate, okValue: T, failValue: E): IResult<T, E> =>
  predicate()
    ? ok<T, E>(okValue)
    : fail<T, E>(failValue)

// /**
//  * Utility function to quickly create ok/fail pairs in curried form.
//  */
// export const curriedResult =
//   <T, E>(predicate: Predicate) =>
//     (okValue: T) =>
//       (failValue: E): IResult<T, E> =>
//         predicate()
//           ? ok<T, E>(okValue)
//           : fail<T, E>(failValue)