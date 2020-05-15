import { Monad } from '../monad/monad'
import { IMaybePattern, IMaybe } from './maybe.interface'

export class Maybe<T> extends Monad<T>  {

  constructor(private readonly value?: T) {
    super()
  }

  of<T>(): Monad<T> {
    throw new Error('Method not implemented.')
  }

  public static none<T>() {
    return new Maybe<T>()
  }

  public static some<T>(value: T) {
    return new Maybe<T>(value)
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

  public map<R>(fn: (t: NonNullable<T>) => R) {
    return this.isSome()
      ? new Maybe<R>(fn(this.value as NonNullable<T>))
      : new Maybe<R>()
  }

  public flatMap<R>(fn: (d: NonNullable<T>) => IMaybe<R>) {
    return this.isNone() ? new Maybe<R>() : fn(this.value as NonNullable<T>)
  }

  public flatMapAuto<R>(fn: (d: NonNullable<T>) => R) {
    return this.isNone() ? new Maybe<R>() : new Maybe<R>(fn(this.value as NonNullable<T>))
  }

  public filter(fn: (f: NonNullable<T>) => boolean) {
    return this.isNone()
      ? new Maybe<T>()
      : fn(this.value as NonNullable<T>)
        ? new Maybe<T>(this.value as NonNullable<T>)
        : new Maybe<T>()
  }

  // const map = <T>(value?: T) => <R>(fn: (t: NonNullable<T>) => R) => isEmpty(value) ? maybe<R>() : maybe<R>(fn(value as NonNullable<T>))

  // public apply<R>(maybeFn: IMaybe<(t: T) => R>) {
  //   return maybeFn.flatMap(f => this.map(a =>this.value as NonNullable<T>)(f))
  // }

  // public apply<R>(maybeFn: IMaybe<(t: T) => R>) {
  // const apply = <R>(maybeFn: IMaybe<(t: T) => R>) => maybeFn.flatMap(f => map(value)(f))
  //   return maybeFn.flatMap(f => this.map(this.value as NonNullable<T>)(f))
  // }
}

export function maybe<T>(value?: T) {
  return new Maybe<T>(value)
}

export function none<T>() {
  return Maybe.none<T>()
}

export function some<T>(value: T) {
  return maybe(value)
}
