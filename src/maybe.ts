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
   * Unwrap and apply MaybePattern functions
   */
  map<R>(val: IMaybePattern<T, R>): R

  /**
   * Execute functions with side-effects.
   */
  do(val: IMaybePattern<T, void>): void

  /**
   * Combine multiple maybe
   */
  bind<R>(f: (t: T) => IMaybe<R>): IMaybe<R>
}

export function maybe<T>(value?: T): IMaybe<T> {
  return {
    valueOr: (val: T) => value || val,
    valueOrCompute: (f: () => T) => value || f(),
    map: <R>(obj: IMaybePattern<T, R>) => value ? obj.some(value) : obj.none(),
    do: (obj: IMaybePattern<T, void>) => value ? obj.some(value) : obj.none(),
    bind: <R>(f: (d: T) => IMaybe<R>) => value ? f(value) : maybe<R>()
  }
}