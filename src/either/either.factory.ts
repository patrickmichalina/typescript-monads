import { Either } from './either'
import { IEither } from './either.interface'

export function either<L, R>(left?: L, right?: R): IEither<L, R> {
  return new Either(left, right)
}
