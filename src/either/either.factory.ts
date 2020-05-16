import { Either } from './either'

export function either<L, R>(left?: L, right?: R) {
  return new Either(left, right)
}