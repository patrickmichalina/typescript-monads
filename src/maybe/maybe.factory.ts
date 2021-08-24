import { Maybe } from './maybe'
import { IMaybe } from './maybe.interface'

export function maybe<T>(value?: T | null): Maybe<T> {
  return new Maybe<T>(value)
}

export function none<T>(): IMaybe<T> {
  return Maybe.none<T>()
}

export function some<T>(value: T): IMaybe<T> {
  return maybe(value)
}
