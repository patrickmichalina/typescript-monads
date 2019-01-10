import { mapping, IMonad } from '../interfaces'

// tslint:disable:readonly-array
export const monad = <T>(x: T, ...args: any[]): IMonad<T> => {
  return {
    of: (x: T, ...args: any[]) => monad<T>(x, ...args),
    flatMap: <U>(f: mapping<T, IMonad<U>>) => f(x, ...args)
  }
}
