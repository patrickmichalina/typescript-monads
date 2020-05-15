import { Maybe } from './maybe'

export function maybe<T>(value?: T) {
  return new Maybe<T>(value)
}

export function none<T>() {
  return Maybe.none<T>()
}

export function some<T>(value: T) {
  return maybe(value)
}
