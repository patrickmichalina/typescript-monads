import { IMaybe, IMaybePattern } from "../interfaces"

export function maybe<T>(value?: T): IMaybe<T> {
  return {
    of: (x) => maybe(x),
    valueOr: (val: T) => value === null || value === undefined ? val : value,
    valueOrCompute: (f: () => T) => value === null || value === undefined ? f() : value,
    tap: (obj: IMaybePattern<T, void>) => value === null || value === undefined ? obj.none() : obj.some(value),
    match: <R>(pattern: IMaybePattern<T, R>) => value === null || value === undefined ? pattern.none() : pattern.some(value),
    map: <R>(f: (t: T) => R) => value === null || value === undefined ? maybe<R>() : maybe<R>(f(value)),
    flatMap: <R>(f: (d: T) => IMaybe<R>) => value === null || value === undefined ? maybe<R>() : f(value)
  }
}