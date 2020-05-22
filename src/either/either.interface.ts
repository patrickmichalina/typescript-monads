export interface IEither<L, R> {
  isLeft(): boolean
  isRight(): boolean
  match<T>(pattern: IEitherPattern<L, R, T>): T
  tap<T>(pattern: Partial<IEitherPattern<L, R, T>>): void
  map<T>(f: (r: R) => T): IEither<L, T>
  flatMap<T>(f: (r: R) => IEither<L, T>): IEither<L, T>
}

export interface IEitherPattern<L, R, T> {
  left(l: L): T
  right(r: R): T
}
