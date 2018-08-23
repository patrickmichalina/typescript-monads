import { IMonad } from "./monad.interface"

/**
 * Define a contract to unwrap Maybe object
 */
export interface IMaybePattern<TIn, TOut> {
  /**
   * Function to handle when a value exists.
   */
  some(val: TIn): TOut

  /**
   * Function to handle when a value is undefined.
   */
  none(): TOut
}

/**
 * Abstraction for handling possibility of undefined values
 */
export interface IMaybe<T> extends IMonad<T> {
  /**
   * Unwrap a Maybe with a default value
   */
  valueOr(val: T): T

  /**
   * Unwrap a Maybe with a default computed value
   */
  valueOrCompute(f: () => T): T

  /**
   * Execute functions with side-effects.
   */
  tap(val: IMaybePattern<T, void>): void

  /**
   * Unwrap and apply MaybePattern functions
   */
  match<R>(pattern: IMaybePattern<T, R>): R

  /**
   * Combine multiple maybe
   */
  map<R>(f: (t: T) => R): IMaybe<R>

  /**
   * Combine multiple maybe
   */
  flatMap<R>(f: (t: T) => IMaybe<R>): IMaybe<R>

  // tslint:disable-next-line:readonly-array
  of(x?: T, ...args: any[]): IMaybe<T>
}