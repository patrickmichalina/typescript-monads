import { IMaybePattern, IMaybe } from './maybe.interface'

export class Maybe<T> implements IMaybe<T>  {

  constructor(private readonly value?: T) { }

  public of(value: T): IMaybe<T> {
    return new Maybe<T>(value)
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

  public valueOr(value: NonNullable<T>): NonNullable<T> {
    return this.isSome() ? this.value as NonNullable<T> : value
  }

  public valueOrUndefined(): T | undefined {
    return this.isSome() ? this.value as NonNullable<T> : undefined
  }

  public valueOrCompute(fn: () => NonNullable<T>): NonNullable<T> {
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
      ? typeof obj.none === 'function' && obj.none()
      : typeof obj.some === 'function' && obj.some(this.value as NonNullable<T>)
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

  public toArray(): ReadonlyArray<T> {
    return this.isNone()
      ? []
      : Array.isArray(this.value)
        ? this.value
        : [this.value as NonNullable<T>]
  }

  public map<R>(fn: (t: NonNullable<T>) => R): IMaybe<R> {
    return this.isSome()
      ? new Maybe<R>(fn(this.value as NonNullable<T>))
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

  public apply<R>(fab: IMaybe<(v: T) => R>): IMaybe<R> {
    return this.flatMap(b => fab.map(fn => fn(b)))
  }
}
