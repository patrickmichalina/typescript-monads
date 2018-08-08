interface CaseOf<TIn, TOut> {
  readonly some: (val: TIn) => TOut
  readonly none: () => TOut
}

export interface Maybe<T> {
  /**
   * Unwrap a Maybe with a default value
   */
  readonly valueOr: (val: T) => T,

  /**
   * Unwrap a Maybe with a default computed value
   */
  readonly valueOrCompute: (f: () => T) => T,
  readonly map: <R>(val: CaseOf<T, R>) => R
  readonly do: (val: CaseOf<T, void>) => void,
  readonly bind: <R>(f: (maybe: T) => Maybe<R>) => Maybe<R>
}

export function maybe<T>(value?: T): Maybe<T> {
  return {
    valueOr: (val: T) => value || val,
    valueOrCompute: (f: () => T) => value || f(),
    map: <R>(obj: CaseOf<T, R>) => value ? obj.some(value) : obj.none(),
    do: (obj: CaseOf<T, void>) => value ? obj.some(value) : obj.none(),
    bind: <R>(f: (d: T) => Maybe<R>) => value ? f(value) : maybe<R>()
  }
}