import { IEither, IEitherPattern } from "../interfaces"

function exists<T>(t: T) {
  return t !== null && t !== undefined
}

function bothExist<L, R>(left?: L) {
  return function (right?: R) {
    return exists(left) && exists(right)
  }
}

function neitherExist<L, R>(left?: L) {
  return function (right?: R) {
    return !exists(left) && !exists(right)
  }
}

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
    isLeft() {
      return exists(left)
    },
    isRight() {
      return exists(right)
    },
    match<T>(pattern: IEitherPattern<L, R, T>) {
      return exists(right)
        ? pattern.right(right as R)
        : pattern.left(left as L)
    },
    map<T>(f: (r: R) => T) {
      return exists(right)
        ? either<L, T>(undefined, f(right as R))
        : either<L, T>(left)
    },
    flatMap<T>(f: (r: R) => IEither<L, T>) {
      return exists(right) ?
        f(right as R) :
        either<L, T>(left)
    }
  }
}