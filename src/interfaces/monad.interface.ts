// tslint:disable:readonly-array
export type mapping<T, U> = (x: T, ...args: any[]) => U

export interface IMonad<T> {
  of(x: T, ...args: any[]): IMonad<T>
  flatMap<U>(f: mapping<T, IMonad<U>>): IMonad<U>
}
