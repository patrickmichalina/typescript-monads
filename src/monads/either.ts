import { IEither, IEitherPattern } from "../interfaces"

const exists = <T>(t: T) => t !== null && t !== undefined
const bothExist = <L, R>(left?: L) => (right?: R) => exists(left) && exists(right)
const neitherExist = <L, R>(left?: L) => (right?: R) => !exists(left) && !exists(right)
const existFunc = <T>(side?: T) => () => exists(side)

const tap = <L, R>(left?: L) => (right?: R) => <T>(pattern: Partial<IEitherPattern<L, R, T>>) =>
  exists(right)
    ? pattern.right && pattern.right(right as R)
    : pattern.left && pattern.left(left as L)

const match = <L, R>(left?: L) => (right?: R) => <T>(pattern: IEitherPattern<L, R, T>) => exists(right)
  ? pattern.right(right as R)
  : pattern.left(left as L)

export function either<L, R>(left?: L, right?: R): IEither<L, R> {
  // tslint:disable-next-line:no-if-statement
  if (bothExist(left)(right)) {
    throw new TypeError('Either cannot have both a left and a right')
  }
  // tslint:disable-next-line:no-if-statement
  if (neitherExist(left)(right)) {
    throw new TypeError('Either requires a left or a right')
  }

  return {
    isLeft: existFunc(left),
    isRight: existFunc(right),
    match: match(left)(right),
    tap: tap(left)(right),
    map: <T>(f: (r: R) => T) => exists(right)
      ? either<L, T>(undefined, f(right as R))
      : either<L, T>(left),
    flatMap: <T>(f: (r: R) => IEither<L, T>) => exists(right) ?
      f(right as R) :
      either<L, T>(left)
  }
}