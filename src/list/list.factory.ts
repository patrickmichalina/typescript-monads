import { List } from './list'

export function listOf<T>(...args: T[]) {
  return List.of(args)
}

// export function listFrom<T>(value?: T) {
//   return List.from<T>()
// }

// export function none<T>() {
//   return Maybe.none<T>()
// }

// export function some<T>(value: T) {
//   return maybe(value)
// }
