export type Map<T, U> = (x: T) => U

export interface IMonad<T> {
  of(x: T): IMonad<T>
  flatMap<U>(fn: Map<T, IMonad<U>>): IMonad<U>
}
