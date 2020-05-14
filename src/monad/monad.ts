import { IMonad, Mapping } from './monad.interface'

export abstract class Monad<T> implements IMonad<T> {
  abstract of<T>(x: T, ...args: readonly any[]): Monad<T>
  abstract flatMap<U>(fn: Mapping<T, IMonad<U>>): IMonad<U>
}
