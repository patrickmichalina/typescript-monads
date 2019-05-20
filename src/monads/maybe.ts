import { IMaybe, IMaybePattern } from '../interfaces'

const isEmpty = <T>(value: T) => value === null || value === undefined
const isNotEmpty = <T>(value: T) => !isEmpty(value)
const isSome = <T>(value: T) => () => isNotEmpty(value)
const isNone = <T>(value: T) => () => isEmpty(value)
const valueOr = <T>(value?: T) => (val: NonNullable<T>) => isEmpty(value) ? val : value as NonNullable<T>
const valueOrUndefined = <T>(value?: T) => () => isEmpty(value) ? undefined : value as NonNullable<T>
const toArray = <T>(value?: T) => () => isEmpty(value) ? [] : Array.isArray(value) ? value : [value as NonNullable<T>]
const valueOrCompute = <T>(value?: T) => (fn: () => NonNullable<T>) => isEmpty(value) ? fn() : value as NonNullable<T>
const tap = <T>(value?: T) => (obj: Partial<IMaybePattern<T, void>>) => isEmpty(value) ? obj.none && obj.none() : obj.some && obj.some(value as NonNullable<T>)
const tapNone = <T>(value?: T) => (fn: () => void) => (isEmpty(value)) && fn()
const tapSome = <T>(value?: T) => (fn: (val: NonNullable<T>) => void) => isNotEmpty(value) && fn(value as NonNullable<T>)
const match = <T>(value?: T) => <R>(pattern: IMaybePattern<T, R>) => isEmpty(value) ? pattern.none() : pattern.some(value as NonNullable<T>)
const map = <T>(value?: T) => <R>(fn: (t: NonNullable<T>) => R) => isEmpty(value) ? maybe<R>() : maybe<R>(fn(value as NonNullable<T>))
const flatMap = <T>(value?: T) => <R>(fn: (d: NonNullable<T>) => IMaybe<R>) => isEmpty(value) ? maybe<R>() : fn(value as NonNullable<T>)
const flatMapAuto = <T>(value?: T) => <R>(fn: (d: NonNullable<T>) => R) => isEmpty(value) ? maybe<R>() : maybe<R>(fn(value as NonNullable<T>))
const valueOrThrow = <T>(value?: T) => (msg?: string) => isEmpty(value) ? (() => { throw Error(msg) })() : value as NonNullable<T>

const filter = <T>(value?: T) =>
  (fn: (d: NonNullable<T>) => boolean) =>
    isEmpty(value)
      ? maybe<T>()
      : fn(value as NonNullable<T>)
        ? maybe(value as NonNullable<T>)
        : maybe<T>()

export const maybe = <T>(value?: T): IMaybe<NonNullable<T>> => {
  return {
    of: maybe,
    isSome: isSome(value),
    isNone: isNone(value),
    valueOr: valueOr(value),
    valueOrUndefined: valueOrUndefined(value),
    valueOrCompute: valueOrCompute(value),
    valueOrThrow: valueOrThrow(value),
    toArray: toArray(value),
    tap: tap(value),
    tapNone: tapNone(value),
    tapSome: tapSome(value),
    match: match(value),
    map: map(value),
    flatMap: flatMap(value),
    flatMapAuto: flatMapAuto(value),
    filter: filter(value)
  }
}

export const maybeToPromise =
  (catchResponse: any = 'not found') =>
    <T>(maybe: IMaybe<T>) => maybe.isSome()
      ? Promise.resolve(maybe.valueOrUndefined() as T)
      : Promise.reject(catchResponse)
