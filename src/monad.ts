// tslint:disable:readonly-array
export type mapping<T, U> = (x: T, ...args: any[]) => U

export interface IMonad<T> {
  of(x: T, ...args: any[]): IMonad<T>
  flatMap<U>(f: mapping<T, IMonad<U>>): IMonad<U>
}

export function monad<T>(x: T, ...args: any[]): IMonad<T> {
  return {
    of: (x: T, ...args: any[]) => monad<T>(x, ...args),
    flatMap: <U>(f: mapping<T, IMonad<U>>) => f(x, ...args)
  }
}
