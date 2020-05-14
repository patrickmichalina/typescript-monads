import { Monad } from '../monad/monad'
import { Mapping, IMonad } from '../monad/monad.interface'
import { IMaybePattern } from './maybe.interface'

export class Maybe<T> extends Monad<T> {
  constructor(private readonly value?: T) {
    super()
  }

  public static none<T>() {
    return new Maybe<T>()
  }

  public static some<T>(value: T) {
    return new Maybe<T>(value)
  }

  public of<T>(x: T, ...args: readonly any[]): Monad<T> {
    throw new Error('Method not implemented.')
  }

  public flatMap<U>(fn: Mapping<T, IMonad<U>>): IMonad<U> {
    throw new Error('Method not implemented.')
  }

  public isSome(): boolean {
    return !this.isNone()
  }

  public isNone(): boolean {
    return this.value === null || this.value === undefined
  }

  public valueOr(value: T) {
    return this.isSome() ? this.value : value as NonNullable<T>
  }

  public valueOrUndefined(): NonNullable<T> | undefined {
    return this.isSome() ? this.value as NonNullable<T> : undefined
  }

  public valueOrCompute(fn: () => NonNullable<T>): T {
    return this.isSome() ? this.value as NonNullable<T> : fn()
  }

  public valueOrThrow(msg?: string): NonNullable<T> {
    return this.isNone() ? (() => { throw new Error(msg) })() : this.value as NonNullable<T>
  }

  public valueOrThrowErr(err?: Error): NonNullable<T> {
    return this.isNone()
      ? (() => err instanceof Error ? (() => { throw err })() : (() => { throw new Error() })())()
      : this.value as NonNullable<T>
  }

  public tap(obj: Partial<IMaybePattern<T, void>>) {
    return this.isNone()
      ? obj.none && obj.none()
      : obj.some && obj.some(this.value as NonNullable<T>)
  }

  public tapNone(fn: () => void): void {
    (this.isNone()) && fn()
  }

  public tapSome(fn: (val: NonNullable<T>) => void): void {
    (this.isSome()) && fn(this.value as NonNullable<T>)
  }

  public match<R>(pattern: IMaybePattern<T, R>) {
    return this.isNone()
      ? pattern.none()
      : pattern.some(this.value as NonNullable<T>)
  }

  public toArray() {
    return this.isNone()
      ? []
      : Array.isArray(this.value)
        ? this.value
        : [this.value as NonNullable<T>]
  }

  map<R>(fn: (t: NonNullable<T>) => R) {
    return this.isSome()
      ? new Maybe<R>(fn(this.value as NonNullable<T>))
      : new Maybe<R>()
  }

  // const flatMap = <T>(value?: T) => <R>(fn: (d: NonNullable<T>) => IMaybe<R>) => isEmpty(value) ? maybe<R>() : fn(value as NonNullable<T>)
  // const apply = <T>(value?: T) => <R>(maybeFn: IMaybe<(t: T) => R>) => maybeFn.flatMap(f => map(value)(f))
  // const flatMapAuto = <T>(value?: T) => <R>(fn: (d: NonNullable<T>) => R) => isEmpty(value) ? maybe<R>() : maybe<R>(fn(value as NonNullable<T>))
  // const filter = <T>(value?: T) =>
  //   (fn: (d: NonNullable<T>) => boolean) =>
  //     isEmpty(value)
  //       ? maybe<T>()
  //       : fn(value as NonNullable<T>)
  //         ? maybe(value as NonNullable<T>)
  //         : maybe<T>()

}

export function maybe<T>(value?: T) {
  return Maybe.some(value)
}

export function none<T>() {
  return Maybe.none<T>()
}

export function some<T>(value: T) {
  return maybe(value)
}

// export const maybe = <T>(value?: T): IMaybe<NonNullable<T>> => {
//   return {
//     of: maybe,
//     isSome: isSome(value),
//     isNone: isNone(value),
//     valueOr: valueOr(value),
//     valueOrUndefined: valueOrUndefined(value),
//     valueOrCompute: valueOrCompute(value),
//     valueOrThrow: valueOrThrow(value),
//     valueOrThrowErr: valueOrThrowErr(value),
//     toArray: toArray(value),
//     tap: tap(value),
//     tapNone: tapNone(value),
//     tapSome: tapSome(value),
//     match: match(value),
//     map: map(value),
//     flatMap: flatMap(value),
//     flatMapAuto: flatMapAuto(value),
//     filter: filter(value),
//     apply: apply(value)
//   }
// }

