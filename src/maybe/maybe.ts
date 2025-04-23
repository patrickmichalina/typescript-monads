import type { IResult } from '../result/result.interface'
import type { IMaybePattern, IMaybe } from './maybe.interface'
import { FailResult, OkResult } from '../result/result'

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

  /**
   * Creates a Maybe from a Promise.
   * 
   * Creates a Maybe that will resolve to:
   * - Some containing the resolved value if the promise resolves successfully
   * - None if the promise rejects or resolves to null/undefined
   * 
   * @param promise The promise to convert to a Maybe
   * @returns A Promise that resolves to a Maybe containing the result
   * 
   * @example
   * // Convert a promise to a Maybe
   * const userMaybe = await Maybe.fromPromise(api.fetchUser(userId));
   * 
   * userMaybe.match({
   *   some: user => console.log(user.name),
   *   none: () => console.log('User not found')
   * });
   */
  /**
   * Creates a Maybe from a Promise.
   * 
   * Creates a Promise that will resolve to a Maybe that is:
   * - Some containing the resolved value if the promise resolves successfully to a non-nullish value
   * - None if the promise rejects or resolves to null/undefined
   * 
   * Note on resolution preservation: This static method maps the Promise resolution semantics
   * to the Maybe context in a natural way:
   * - Promise resolution (success) becomes Some (presence of value)
   * - Promise rejection (failure) becomes None (absence of value)
   * 
   * This provides a clean way to convert from error-based to optional-based handling,
   * which is often more appropriate for values that might legitimately be missing.
   * 
   * @param promise The promise to convert to a Maybe
   * @returns A Promise that resolves to a Maybe containing the result
   * 
   * @example
   * // Convert a promise to a Maybe and use in a chain
   * Maybe.fromPromise(api.fetchUser(userId))
   *   .then(userMaybe => userMaybe.match({
   *     some: user => renderUser(user),
   *     none: () => showUserNotFound()
   *   }));
   */
  public static fromPromise<T>(promise: Promise<T>): Promise<IMaybe<NonNullable<T>>> {
    return promise
      .then((value: T) => new Maybe<NonNullable<T>>(value as NonNullable<T>))
      .catch(() => new Maybe<NonNullable<T>>())
  }

  /**
   * Creates a Maybe from an Observable.
   * 
   * Creates a Promise that will resolve to a Maybe that is:
   * - Some containing the first emitted value if the observable emits a non-nullish value
   * - None if the observable completes without emitting, errors, or emits a nullish value
   * 
   * Note on resolution transformation: This method transforms the reactive semantics of
   * an Observable to the optional semantics of a Maybe:
   * - Observable emissions (data) become Some values (presence)
   * - Observable completion without emissions (empty success) becomes None (absence)
   * - Observable errors (failure) become None (absence)
   * 
   * Note on timing model: This transformation changes from a continuous/reactive model
   * to a one-time asynchronous result. Only the first emission is captured, and the 
   * reactive nature of the Observable is lost after transformation.
   * 
   * @param observable The observable to convert to a Maybe
   * @returns A Promise that resolves to a Maybe containing the first emitted value
   * 
   * @requires rxjs@^7.0
   * @example
   * // Convert an observable to a Maybe and use in a chain
   * Maybe.fromObservable(userService.getUser(userId))
   *   .then(userMaybe => userMaybe
   *     .map(user => user.name)
   *     .valueOr('Guest'))
   *   .then(name => displayUserName(name));
   */
  public static fromObservable<T>(observable: import('rxjs').Observable<T>): Promise<IMaybe<NonNullable<T>>> {
    const { firstValueFrom, EMPTY } = require('rxjs')
    const { take, map, catchError } = require('rxjs/operators')
    
    return firstValueFrom(
      observable.pipe(
        take(1),
        map((value: unknown) => new Maybe<NonNullable<T>>(value as NonNullable<T>)),
        catchError(() => EMPTY)
      )
    ).then(
      (maybeValue: IMaybe<NonNullable<T>>) => maybeValue,
      () => new Maybe<NonNullable<T>>()
    )
  }

  /**
   * Transforms an array of Maybe values into a Maybe containing an array of values.
   * 
   * If all Maybes in the input array are Some, returns a Some containing an array of all values.
   * If any Maybe in the input array is None, returns None.
   * 
   * @param maybes An array of Maybe values
   * @returns A Maybe containing an array of all values if all inputs are Some, otherwise None
   * 
   * @example
   * // All Maybes are Some
   * const result1 = Maybe.sequence([maybe(1), maybe(2), maybe(3)]);
   * // result1 is Some([1, 2, 3])
   * 
   * // One Maybe is None
   * const result2 = Maybe.sequence([maybe(1), maybe(null), maybe(3)]);
   * // result2 is None
   */
  public static sequence<T>(maybes: ReadonlyArray<IMaybe<T>>): IMaybe<ReadonlyArray<T>> {
    if (maybes.length === 0) {
      return new Maybe<ReadonlyArray<T>>([])
    }

    const values: T[] = []
    for (const m of maybes) {
      if (m.isNone()) {
        return new Maybe<ReadonlyArray<T>>()
      }
      values.push(m.valueOrThrow())
    }
    return new Maybe<ReadonlyArray<T>>(values)
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

  public tapThru(val: Partial<IMaybePattern<T, void>>): IMaybe<T> {
    this.tap(val)
    return this
  }

  public tapThruNone(fn: () => void): IMaybe<T> {
    this.tapNone(fn)
    return this
  }

  public tapThruSome(fn: (val: T) => void): IMaybe<T> {
    this.tapSome(fn)
    return this
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

  public project<R extends T[keyof T]>(fn: (d: NonNullable<T>) => R): IMaybe<NonNullable<R>> {
    return this.flatMapAuto(fn)
  }

  public filter(fn: (f: NonNullable<T>) => boolean): IMaybe<T> {
    return this.isNone()
      ? new Maybe<T>()
      : fn(this.value as NonNullable<T>)
        ? new Maybe<T>(this.value as NonNullable<T>)
        : new Maybe<T>()
  }

  public apply<R>(maybeFn: IMaybe<(t: NonNullable<T>) => R>): IMaybe<NonNullable<R>> {
    return this.flatMap(v => maybeFn.flatMapAuto(f => f(v)))
  }

  public toResult<E>(error: E): IResult<T, E> {
    return this
      .map<IResult<T, E>>(b => new OkResult<T, E>(b))
      .valueOr(new FailResult<T, E>(error))
  }

  public flatMapPromise<R>(fn: (val: NonNullable<T>) => Promise<R>): Promise<IMaybe<NonNullable<R>>> {
    if (this.isNone()) {
      return Promise.resolve(new Maybe<NonNullable<R>>())
    }
    
    return fn(this.value as NonNullable<T>)
      .then((value: R) => new Maybe<NonNullable<R>>(value as NonNullable<R>))
      .catch(() => new Maybe<NonNullable<R>>())
  }

  public flatMapObservable<R>(fn: (val: NonNullable<T>) => import('rxjs').Observable<R>): Promise<IMaybe<NonNullable<R>>> {
    if (this.isNone()) {
      return Promise.resolve(new Maybe<NonNullable<R>>())
    }
    
    const { firstValueFrom, EMPTY } = require('rxjs')
    const { take, map, catchError } = require('rxjs/operators')
    
    return firstValueFrom(
      fn(this.value as NonNullable<T>).pipe(
        take(1),
        map((value: unknown) => new Maybe<NonNullable<R>>(value as NonNullable<R>)),
        catchError(() => EMPTY)
      )
    ).then(
      (maybeValue: IMaybe<NonNullable<R>>) => maybeValue,
      () => new Maybe<NonNullable<R>>()
    )
  }

  public flatMapMany<R>(fn: (val: NonNullable<T>) => Promise<R>[]): Promise<IMaybe<NonNullable<R>[]>> {
    if (this.isNone()) {
      return Promise.resolve(new Maybe<NonNullable<R>[]>())
    }

    return Promise.all(fn(this.value as NonNullable<T>))
      .then((values: R[]) => new Maybe<NonNullable<R>[]>(values as NonNullable<R>[]))
      .catch(() => new Maybe<NonNullable<R>[]>())
  }

  public zipWith<U extends NonNullable<unknown>, R>(other: IMaybe<U>, fn: (a: NonNullable<T>, b: U) => NonNullable<R>): IMaybe<R> {
    return this.flatMap(a => other.map(b => fn(a, b)))
  }
}
