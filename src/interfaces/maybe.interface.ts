import { IMonad } from "./monad.interface"

/**
 * Define a contract to unwrap Maybe object
 */
export interface IMaybePattern<TIn, TOut> {
  /**
   * Function to handle when a value exists.
   */
  some(val: NonNullable<TIn>): TOut

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
  valueOr(val: NonNullable<T>): T

  /**
   * Unwrap a Maybe with a default computed value
   */
  valueOrCompute(f: () => NonNullable<T>): T

  /**
   * Execute functions with side-effects.
   */
  tap(val: Partial<IMaybePattern<T, void>>): void
  
  /**
   * Execute a function with side-effects when maybe is a none.
   */
  tapNone(f: () => void): void
  
  /**
   * Execute a function with side-effects when maybe is a some.
   */
  tapSome(f: (val: T) => void): void

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
  
  filter(fn: (t: T) => boolean): IMaybe<T>
}