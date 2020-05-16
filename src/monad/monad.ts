import { IMonad, Map } from './monad.interface'

export abstract class Monad<T> implements IMonad<T>  {
  abstract of(x: T): IMonad<T>
  abstract flatMap<R>(fn: Map<T, IMonad<R>>): IMonad<R>
}
