import { IMaybe, IMaybePattern } from "../interfaces"

const isEmpty = <T>(value: T) => value === null || value === undefined
const isNotEmpty = <T>(value: T) => !isEmpty(value)
const valueOr = <T>(value?: T) => (val: NonNullable<T>) => isEmpty(value) ? val : value as NonNullable<T>
const valueOrUndefined = <T>(value?: T) => () => isEmpty(value) ? undefined : value as NonNullable<T>
const valueOrCompute = <T>(value?: T) => (fn: () => NonNullable<T>) => isEmpty(value) ? fn() : value as NonNullable<T>
const tap = <T>(value?: T) => (obj: Partial<IMaybePattern<T, void>>) => isEmpty(value) ? obj.none && obj.none() : obj.some && obj.some(value as NonNullable<T>)
const tapNone = <T>(value?: T) => (fn: () => void) => (isEmpty(value)) && fn()
const tapSome = <T>(value?: T) => (fn: (val: NonNullable<T>) => void) => isNotEmpty(value) && fn(value as NonNullable<T>)
const match = <T>(value?: T) => <R>(pattern: IMaybePattern<T, R>) => isEmpty(value) ? pattern.none() : pattern.some(value as NonNullable<T>)
const map = <T>(value?: T) => <R>(fn: (t: NonNullable<T>) => R) => isEmpty(value) ? maybe<R>() : maybe<R>(fn(value as NonNullable<T>))
const flatMap = <T>(value?: T) => <R>(fn: (d: NonNullable<T>) => IMaybe<R>) => isEmpty(value) ? maybe<R>() : fn(value as NonNullable<T>)

export const maybe = <T>(value?: T): IMaybe<NonNullable<T>> => {
  return {
    of: maybe,
    valueOr: valueOr(value),
    valueOrUndefined: valueOrUndefined(value),
    valueOrCompute: valueOrCompute(value),
    tap: tap(value),
    tapNone: tapNone(value),
    tapSome: tapSome(value),
    match: match(value),
    map: map(value),
    flatMap: flatMap(value),
    filter: (fn: (d: NonNullable<T>) => boolean) => isEmpty(value)
      ? maybe()
      : fn(value as NonNullable<T>)
        ? maybe(value as NonNullable<T>)
        : maybe()
  }
}
