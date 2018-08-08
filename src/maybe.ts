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
export interface IMaybe<T> {
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
  caseOf<R>(val: IMaybePattern<T, R>): R

  /**
   * Combine multiple maybe
   */
  map<R>(f: (t: T) => R): IMaybe<R>

  /**
   * Combine multiple maybe
   */
  flatMap<R>(f: (t: T) => IMaybe<R>): IMaybe<R>
}

export function maybe<T>(value?: T): IMaybe<T> {
  return {
    valueOr: (val: T) => value === null || value === undefined ? val : value,
    valueOrCompute: (f: () => T) => value === null || value === undefined ? f() : value,
    tap: (obj: IMaybePattern<T, void>) => value === null || value === undefined ? obj.none() : obj.some(value),
    caseOf: <R>(obj: IMaybePattern<T, R>) => value === null || value === undefined ? obj.none() : obj.some(value),
    map: <R>(f: (t: T) => R) => value === null || value === undefined ? maybe<R>() : maybe<R>(f(value)),
    flatMap: <R>(f: (d: T) => IMaybe<R>) => value === null || value === undefined ? maybe<R>() : f(value)
  }
}