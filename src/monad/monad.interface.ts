export type Mapping<T, U> = (x: T, ...args: readonly any[]) => U

export interface IMonad<T> {
  of(x: T, ...args: readonly any[]): IMonad<T>
  flatMap<U>(fn: Mapping<T, IMonad<U>>): IMonad<U>
}
