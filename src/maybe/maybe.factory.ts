import type { IMaybe } from './maybe.interface'
import { Maybe } from './maybe'

export function maybe<T>(value?: T | null): IMaybe<T> {
  return new Maybe<T>(value)
}

export function none<T>(): IMaybe<T> {
  return Maybe.none<T>()
}

export function some<T>(value: T): IMaybe<T> {
  return maybe(value)
}
