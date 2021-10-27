import { IResult } from '../result/result.interface'
import { FailResult, OkResult } from '../result/result'
import { IMaybePattern, IMaybe } from './maybe.interface'

export class Maybe<T> implements IMaybe<T>  {

  constructor(private readonly value?: T | null) { }

  public of(value: T): IMaybe<T> {
    return new Maybe<T>(value)
  }

  public static none<T>(): IMaybe<T> {
    return new Maybe<T>()
  }

  public static some<T>(value: T): IMaybe<T> {
    return new Maybe<T>(value)
  }

  public isSome(): boolean {
    return !this.isNone()
  }

  public isNone(): boolean {
    return this.value === null || this.value === undefined
  }

  public valueOr(value: NonNullable<T>): NonNullable<T> {
    return this.isSome() ? this.value as NonNullable<T> : value
  }

  public valueOrUndefined(): T | undefined {
    return this.isSome() ? this.value as NonNullable<T> : undefined
  }

  public valueOrNull(): T | null {
    return this.isSome() ? this.value as NonNullable<T> : null
  }

  public valueOrCompute(fn: () => NonNullable<T>): NonNullable<T> {
    return this.isSome() ? this.value as NonNullable<T> : fn()
  }

  public valueOrThrow(msg?: string): NonNullable<T> {
    return this.isNone() ? ((): never => { throw new Error(msg) })() : this.value as NonNullable<T>
  }

  public valueOrThrowErr(err?: Error): NonNullable<T> {
    return this.isNone()
      ? ((): never => err instanceof Error ? ((): never => { throw err })() : ((): never => { throw new Error() })())()
      : this.value as NonNullable<T>
  }

  public tap(obj: Partial<IMaybePattern<T, void>>): void {
    this.isNone()
      ? typeof obj.none === 'function' && obj.none()
      : typeof obj.some === 'function' && obj.some(this.value as NonNullable<T>)
  }

  public tapNone(fn: () => void): void {
    (this.isNone()) && fn()
  }

  public tapSome(fn: (val: NonNullable<T>) => void): void {
    (this.isSome()) && fn(this.value as NonNullable<T>)
  }

  public match<R>(pattern: IMaybePattern<T, R>): R {
    return this.isNone()
      ? pattern.none()
      : pattern.some(this.value as NonNullable<T>)
  }

  public toArray(): ReadonlyArray<T> {
    return this.isNone()
      ? []
      : Array.isArray(this.value)
        ? this.value
        : [this.value as NonNullable<T>]
  }

  public map<R>(fn: (t: NonNullable<T>) => NonNullable<R>): IMaybe<R> {
    return this.isSome()
      ? new Maybe<R>(fn(this.value as NonNullable<T>))
      : new Maybe<R>()
  }

  public mapTo<R>(t: NonNullable<R>): IMaybe<R> {
    return this.isSome()
      ? new Maybe<R>(t)
      : new Maybe<R>()
  }

  public flatMap<R>(fn: (d: NonNullable<T>) => IMaybe<R>): IMaybe<R> {
    return this.isNone() ? new Maybe<R>() : fn(this.value as NonNullable<T>)
  }

  public flatMapAuto<R>(fn: (d: NonNullable<T>) => R): IMaybe<NonNullable<R>> {
    return this.isNone()
      ? new Maybe<NonNullable<R>>()
      : new Maybe<NonNullable<R>>(fn(this.value as NonNullable<T>) as NonNullable<R>)
  }

  public filter(fn: (f: NonNullable<T>) => boolean): IMaybe<T> {
    return this.isNone()
      ? new Maybe<T>()
      : fn(this.value as NonNullable<T>)
        ? new Maybe<T>(this.value as NonNullable<T>)
        : new Maybe<T>()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public apply(maybe: IMaybe<ReturnType<T extends (...args: any) => any ? T : any>>): IMaybe<NonNullable<T>> {
    return maybe.flatMap(a => this.map(b => typeof b === 'function' ? b(a) : a))
  }

  public toResult<E>(error: E): IResult<T, E> {
    return this
      .map<IResult<T, E>>(b => new OkResult<T, E>(b))
      .valueOr(new FailResult<T, E>(error))
  }

}
