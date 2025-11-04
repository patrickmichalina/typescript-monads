import type { IResult } from './result.interface'
import { Result } from './result'

/**
 * AsyncResult is a thin wrapper around `Promise<Result<Ok, Fail>>` that preserves
 * the point-free, chainable API developers expect from Result while crossing
 * async boundaries.
 *
 * ## Purpose
 *
 * When working with async operations that return Results, you typically end up with
 * `Promise<Result<T, E>>`. This leads to mixing `.then()` calls with Result methods,
 * breaking the clean functional chain. AsyncResult solves this by wrapping the Promise
 * and providing all Result operations that return AsyncResult, maintaining the chain.
 *
 * ## Key Features
 *
 * - **Point-free style**: Chain operations without `.then()` until the very end
 * - **Non-throwing invariant**: Async errors are caught and converted to Fail Results
 * - **Type-safe**: Full TypeScript type inference throughout the chain
 * - **Short-circuiting**: Operations like `all()` stop on first failure
 *
 * ## Usage
 *
 * @example
 * // Without AsyncResult - mixing .then() and Result methods
 * fetchUser(id)
 *   .then(result => result.map(user => user.name))
 *   .then(result => result.flatMap(name => validateName(name)))
 *   .then(result => result.match({
 *     ok: name => console.log(name),
 *     fail: err => console.error(err)
 *   }));
 *
 * @example
 * // With AsyncResult - clean point-free chain
 * AsyncResult.fromPromise(fetchUser(id))
 *   .map(user => user.name)
 *   .flatMap(name => validateName(name))
 *   .match({
 *     ok: name => console.log(name),
 *     fail: err => console.error(err)
 *   });
 *
 * @example
 * // Composing multiple async operations
 * AsyncResult.fromPromise(fetchUser(id))
 *   .mapAsync(user => fetchUserProfile(user.id))
 *   .flatMapAsync(profile => validateProfile(profile))
 *   .chain(validProfile => saveProfile(validProfile))
 *   .match({
 *     ok: saved => console.log('Profile saved'),
 *     fail: err => console.error('Failed:', err)
 *   });
 *
 * @typeParam TOk - The type of the success value
 * @typeParam TFail - The type of the failure value
 */
export class AsyncResult<TOk, TFail> {
  private readonly promise: Promise<IResult<TOk, TFail>>

  private constructor(promise: Promise<IResult<TOk, TFail>>) {
    this.promise = promise
  }

  // ============================================================================
  // Static Factory Methods
  // ============================================================================

  /**
   * Creates an AsyncResult representing a successful value.
   *
   * @param value - The success value
   * @returns An AsyncResult wrapping an Ok Result
   *
   * @example
   * AsyncResult.ok(42)
   *   .map(n => n * 2)
   *   .match({
   *     ok: n => console.log(n), // 84
   *     fail: err => console.error(err)
   *   });
   */
  static ok<TOk, TFail = never>(value: TOk): AsyncResult<TOk, TFail> {
    return new AsyncResult<TOk, TFail>(Promise.resolve(Result.ok<TOk, TFail>(value)))
  }

  /**
   * Creates an AsyncResult representing a failure.
   *
   * @param error - The error value
   * @returns An AsyncResult wrapping a Fail Result
   *
   * @example
   * AsyncResult.fail<number, string>('error')
   *   .map(n => n * 2) // Skipped
   *   .match({
   *     ok: n => console.log(n),
   *     fail: err => console.error(err) // 'error'
   *   });
   */
  static fail<TOk = never, TFail = unknown>(error: TFail): AsyncResult<TOk, TFail> {
    return new AsyncResult<TOk, TFail>(Promise.resolve(Result.fail<TOk, TFail>(error)))
  }

  /**
   * Creates an AsyncResult from a Result or Promise<Result>.
   *
   * **Non-throwing invariant**: If a Promise<Result> rejects (which shouldn't happen
   * in normal usage), the rejection is caught and converted to a Fail Result.
   *
   * @param result - A Result or Promise that resolves to a Result
   * @returns An AsyncResult wrapping the provided Result
   *
   * @example
   * const syncResult = ok(42);
   * AsyncResult.fromResult(syncResult)
   *   .map(n => n * 2)
   *   .match({ ok: console.log, fail: console.error });
   *
   * @example
   * const asyncResult = fetchData(); // Returns Promise<Result<T, E>>
   * AsyncResult.fromResult(asyncResult)
   *   .map(data => processData(data))
   *   .match({ ok: console.log, fail: console.error });
   */
  static fromResult<TOk, TFail>(result: IResult<TOk, TFail> | Promise<IResult<TOk, TFail>>): AsyncResult<TOk, TFail> {
    // Normalize sync values and thenables; convert unexpected rejections into Fail
    const p = Promise
      .resolve(result)
      .catch((e) => Result.fail<TOk, TFail>(e as TFail))
    return new AsyncResult<TOk, TFail>(p)
  }

  /**
   * Creates an AsyncResult from a Promise<Result>.
   *
   * Similar to `fromResult` but more explicit about expecting a Promise.
   *
   * **Non-throwing invariant**: If the Promise rejects, the rejection is caught
   * and converted to a Fail Result.
   *
   * @param promise - A Promise that resolves to a Result
   * @returns An AsyncResult wrapping the Promise
   *
   * @example
   * const promise: Promise<Result<User, Error>> = fetchUser(id);
   * AsyncResult.fromResultPromise(promise)
   *   .map(user => user.name)
   *   .match({ ok: console.log, fail: console.error });
   */
  static fromResultPromise<TOk, TFail>(promise: Promise<IResult<TOk, TFail>>): AsyncResult<TOk, TFail> {
    const p = promise.catch((e) => Result.fail<TOk, TFail>(e as TFail))
    return new AsyncResult<TOk, TFail>(p)
  }

  /**
   * Creates an AsyncResult from a Promise, converting resolve/reject to Ok/Fail.
   *
   * @param promise - A Promise that resolves to a value
   * @returns An AsyncResult where resolve becomes Ok and reject becomes Fail
   *
   * @example
   * AsyncResult.fromPromise(fetch('/api/user'))
   *   .mapAsync(response => response.json())
   *   .map(user => user.name)
   *   .match({
   *     ok: name => console.log(name),
   *     fail: err => console.error(err)
   *   });
   */
  static fromPromise<TOk, TFail = unknown>(promise: Promise<TOk>): AsyncResult<TOk, TFail> {
    return new AsyncResult<TOk, TFail>(Result.fromPromise<TOk, TFail>(promise))
  }

  /**
   * Creates an AsyncResult from an Observable, taking the first emission.
   *
   * @param observable - An RxJS Observable
   * @param defaultError - Error to use if the Observable completes without emitting
   * @returns An AsyncResult containing the first emitted value or an error
   *
   * @requires rxjs@^7.0
   * @example
   * AsyncResult.fromObservable(userService.getUser$(id), new Error('User not found'))
   *   .map(user => user.name)
   *   .match({
   *     ok: name => console.log(name),
   *     fail: err => console.error(err)
   *   });
   */
  static fromObservable<TOk, TFail>(
    observable: import('rxjs').Observable<TOk>,
    defaultError: TFail
  ): AsyncResult<TOk, TFail> {
    return new AsyncResult<TOk, TFail>(Result.fromObservable<TOk, TFail>(observable, defaultError))
  }

  /**
   * Aggregates a list of AsyncResult values, short-circuiting on the first Fail.
   *
   * **Important**: Evaluation is sequential to enable early exit. This method does not
   * guarantee concurrent execution of inputs. If you need parallel execution, await
   * all AsyncResults first, then use this method.
   *
   * @param items - Array of AsyncResults to aggregate
   * @returns An AsyncResult containing an array of all Ok values, or the first Fail
   *
   * @example
   * const results = [
   *   AsyncResult.fromPromise(fetchUser(1)),
   *   AsyncResult.fromPromise(fetchUser(2)),
   *   AsyncResult.fromPromise(fetchUser(3))
   * ];
   *
   * AsyncResult.all(results).match({
   *   ok: users => console.log('All users:', users),
   *   fail: err => console.error('Failed:', err)
   * });
   */
  static all<T, E>(items: ReadonlyArray<AsyncResult<T, E>>): AsyncResult<ReadonlyArray<T>, E> {
    const run = async (): Promise<IResult<ReadonlyArray<T>, E>> => {
      const acc: T[] = []
      for (const ar of items) {
        const r = await ar.toPromise()
        if (r.isFail()) return Result.fail<ReadonlyArray<T>, E>(r.unwrapFail())
        acc.push(r.unwrap())
      }
      return Result.ok<ReadonlyArray<T>, E>(acc)
    }
    return new AsyncResult<ReadonlyArray<T>, E>(run())
  }

  /**
   * Alias for `all()` - aggregates AsyncResults, short-circuiting on first Fail.
   *
   * @see {@link all}
   */
  static sequence<T, E>(items: ReadonlyArray<AsyncResult<T, E>>): AsyncResult<ReadonlyArray<T>, E> {
    return AsyncResult.all(items)
  }

  // ============================================================================
  // Transformation Methods
  // ============================================================================

  /**
   * Maps the Ok value using a synchronous function.
   *
   * If this AsyncResult is Fail, the function is not called and Fail propagates.
   *
   * @param fn - Function to transform the Ok value
   * @returns A new AsyncResult with the transformed value
   *
   * @example
   * AsyncResult.ok(5)
   *   .map(n => n * 2)
   *   .map(n => n + 1)
   *   .match({ ok: console.log, fail: console.error }); // 11
   */
  map<M>(fn: (val: TOk) => M): AsyncResult<M, TFail> {
    const p = this.promise.then(r => r.map(fn))
    return new AsyncResult<M, TFail>(p)
  }

  /**
   * Maps the Fail value using a synchronous function.
   *
   * If this AsyncResult is Ok, the function is not called and Ok propagates.
   *
   * @param fn - Function to transform the Fail value
   * @returns A new AsyncResult with the transformed error
   *
   * @example
   * AsyncResult.fail<number, Error>(new Error('boom'))
   *   .mapFail(err => err.message)
   *   .match({
   *     ok: n => console.log(n),
   *     fail: msg => console.error(msg) // 'boom'
   *   });
   */
  mapFail<M>(fn: (err: TFail) => M): AsyncResult<TOk, M> {
    const p = this.promise.then(r => r.mapFail(fn))
    return new AsyncResult<TOk, M>(p)
  }

  /**
   * Chains a function that returns a Result.
   *
   * If this AsyncResult is Fail, the function is not called and Fail propagates.
   *
   * @param fn - Function that takes the Ok value and returns a Result
   * @returns A new AsyncResult with the flattened Result
   *
   * @example
   * AsyncResult.ok('42')
   *   .flatMap(s => {
   *     const n = parseInt(s);
   *     return isNaN(n) ? fail('not a number') : ok(n);
   *   })
   *   .match({ ok: console.log, fail: console.error }); // 42
   */
  flatMap<M>(fn: (val: TOk) => IResult<M, TFail>): AsyncResult<M, TFail> {
    const p = this.promise.then(r => r.flatMap(fn))
    return new AsyncResult<M, TFail>(p)
  }

  /**
   * Maps the Ok value using an async function that returns a plain value.
   *
   * **Error handling**: If the async function throws or rejects, the error is caught
   * and converted to a Fail Result. If this AsyncResult is already Fail, the function
   * is not called.
   *
   * @param fn - Async function to transform the Ok value
   * @returns A new AsyncResult with the transformed value
   *
   * @example
   * AsyncResult.ok(userId)
   *   .mapAsync(id => fetchUser(id)) // Returns Promise<User>
   *   .map(user => user.name)
   *   .match({ ok: console.log, fail: console.error });
   */
  mapAsync<M>(fn: (val: TOk) => Promise<M>): AsyncResult<M, TFail> {
    // Delegate to flatMapAsync so async error handling is centralized.
    return this.flatMapAsync(async (v) => Result.ok<M, TFail>(await fn(v)))
  }

  /**
   * Chains a function that returns Promise<Result>.
   *
   * **Error handling**: If the async function throws or rejects, the error is caught
   * and converted to a Fail Result. If this AsyncResult is already Fail, the function
   * is not called.
   *
   * @param fn - Async function that returns a Result
   * @returns A new AsyncResult with the flattened Result
   *
   * @example
   * AsyncResult.ok(userId)
   *   .flatMapAsync(id => validateAndFetchUser(id)) // Returns Promise<Result<User, Error>>
   *   .map(user => user.name)
   *   .match({ ok: console.log, fail: console.error });
   */
  flatMapAsync<M>(fn: (val: TOk) => Promise<IResult<M, TFail>>): AsyncResult<M, TFail> {
    const p = this.promise.then(async r => {
      if (r.isOk()) {
        try {
          const next = await fn(r.unwrap())
          return next
        } catch (e) {
          return Result.fail<M, TFail>(e as TFail)
        }
      }
      return Result.fail<M, TFail>(r.unwrapFail())
    })
    return new AsyncResult<M, TFail>(p)
  }

  /**
   * Maps the Ok value to an Observable and returns the first emission.
   *
   * **Error handling**: If the Observable errors or completes without emitting,
   * the provided default error is used. If this AsyncResult is already Fail,
   * the function is not called.
   *
   * @param fn - Function that takes the Ok value and returns an Observable
   * @param defaultError - Error to use if Observable completes without emitting
   * @returns A new AsyncResult with the first emitted value
   *
   * @requires rxjs@^7.0
   * @example
   * AsyncResult.ok(userId)
   *   .flatMapObservable(
   *     id => userService.watchUser$(id),
   *     new Error('User stream ended')
   *   )
   *   .map(user => user.name)
   *   .match({ ok: console.log, fail: console.error });
   */
  flatMapObservable<M>(
    fn: (val: TOk) => import('rxjs').Observable<M>,
    defaultError: TFail
  ): AsyncResult<M, TFail> {
    const p = this.promise.then(r => r.flatMapObservable(fn, defaultError))
    return new AsyncResult<M, TFail>(p)
  }

  /**
   * Chains a function that returns another AsyncResult.
   *
   * **Error handling**: If the function throws synchronously, the error is caught
   * and converted to a Fail Result. If this AsyncResult is already Fail, the function
   * is not called.
   *
   * @param fn - Function that takes the Ok value and returns an AsyncResult
   * @returns A new AsyncResult with the flattened result
   *
   * @example
   * const fetchAndValidate = (id: number): AsyncResult<User, string> =>
   *   AsyncResult.fromPromise(fetchUser(id))
   *     .flatMap(user => validateUser(user));
   *
   * AsyncResult.ok(42)
   *   .chain(id => fetchAndValidate(id))
   *   .map(user => user.name)
   *   .match({ ok: console.log, fail: console.error });
   */
  chain<M>(fn: (val: TOk) => AsyncResult<M, TFail>): AsyncResult<M, TFail> {
    const p = this.promise.then(async (r): Promise<IResult<M, TFail>> => {
      if (!r.isOk()) return Result.fail<M, TFail>(r.unwrapFail())
      try {
        return await fn(r.unwrap()).toPromise()
      } catch (e) {
        return Result.fail<M, TFail>(e as TFail)
      }
    })
    return new AsyncResult<M, TFail>(p)
  }

  // ============================================================================
  // Error Recovery Methods
  // ============================================================================

  /**
   * Recovers from a Fail by providing a fallback Ok value.
   *
   * If this AsyncResult is Ok, returns it unchanged. If Fail, transforms the error
   * into an Ok value using the provided function.
   *
   * @param fn - Function to transform Fail into Ok value
   * @returns An AsyncResult that is guaranteed to be Ok
   *
   * @example
   * AsyncResult.fromPromise(fetchUser(id))
   *   .recover(err => ({ id: 0, name: 'Guest' })) // Fallback user
   *   .map(user => user.name)
   *   .match({ ok: console.log, fail: console.error }); // Always succeeds
   */
  recover(fn: (err: TFail) => TOk): AsyncResult<TOk, TFail> {
    const p = this.promise.then(r => r.recover(fn))
    return new AsyncResult<TOk, TFail>(p)
  }

  /**
   * Recovers from a Fail by providing another Result.
   *
   * If this AsyncResult is Ok, returns it unchanged. If Fail, calls the function
   * to produce an alternative Result (which itself might be Ok or Fail).
   *
   * @param fn - Function to transform Fail into another Result
   * @returns A new AsyncResult from recovery
   *
   * @example
   * AsyncResult.fromPromise(fetchFromPrimary())
   *   .recoverWith(err => {
   *     console.log('Primary failed, trying backup');
   *     return fetchFromBackup(); // Returns Result<T, E>
   *   })
   *   .match({ ok: console.log, fail: console.error });
   */
  recoverWith(fn: (err: TFail) => IResult<TOk, TFail>): AsyncResult<TOk, TFail> {
    const p = this.promise.then(r => r.recoverWith(fn))
    return new AsyncResult<TOk, TFail>(p)
  }

  /**
   * Returns this AsyncResult if Ok, otherwise returns the fallback.
   *
   * @param fallback - The AsyncResult to use if this one is Fail
   * @returns This AsyncResult if Ok, otherwise the fallback
   *
   * @example
   * AsyncResult.fromPromise(fetchFromCache(id))
   *   .orElse(AsyncResult.fromPromise(fetchFromDatabase(id)))
   *   .orElse(AsyncResult.ok(defaultValue))
   *   .match({ ok: console.log, fail: console.error });
   */
  orElse(fallback: AsyncResult<TOk, TFail>): AsyncResult<TOk, TFail> {
    const p = this.promise.then(async r => {
      if (r.isOk()) return r
      return fallback.toPromise()
    })
    return new AsyncResult<TOk, TFail>(p)
  }

  // ============================================================================
  // Side Effect Methods
  // ============================================================================

  /**
   * Executes side effects without changing the AsyncResult.
   *
   * @param pattern - Functions to execute for Ok and Fail cases
   * @returns The original AsyncResult unchanged
   *
   * @example
   * AsyncResult.fromPromise(saveUser(user))
   *   .tap({
   *     ok: saved => console.log('User saved:', saved.id),
   *     fail: err => console.error('Save failed:', err)
   *   })
   *   .map(saved => saved.id); // Continue the chain
   */
  tap(pattern: Partial<{ ok: (val: TOk) => void; fail: (err: TFail) => void }>): AsyncResult<TOk, TFail> {
    const p = this.promise.then(r => {
      r.tap(pattern)
      return r
    })
    return new AsyncResult<TOk, TFail>(p)
  }

  /**
   * Executes a side effect if this AsyncResult is Ok.
   *
   * @param fn - Function to execute with the Ok value
   * @returns The original AsyncResult unchanged
   *
   * @example
   * AsyncResult.ok(user)
   *   .tapOk(u => console.log('Processing user:', u.id))
   *   .map(u => u.name);
   */
  tapOk(fn: (val: TOk) => void): AsyncResult<TOk, TFail> {
    return this.tap({ ok: fn })
  }

  /**
   * Executes a side effect if this AsyncResult is Fail.
   *
   * @param fn - Function to execute with the Fail value
   * @returns The original AsyncResult unchanged
   *
   * @example
   * AsyncResult.fromPromise(fetchData())
   *   .tapFail(err => logger.error('Fetch failed:', err))
   *   .recover(err => defaultData);
   */
  tapFail(fn: (err: TFail) => void): AsyncResult<TOk, TFail> {
    return this.tap({ fail: fn })
  }

  // ============================================================================
  // Inspection and Unwrapping Methods
  // ============================================================================

  /**
   * Checks if this AsyncResult is Ok.
   *
   * @returns A Promise that resolves to true if Ok, false if Fail
   *
   * @example
   * const isOk = await AsyncResult.ok(42).isOk(); // true
   * const isFail = await AsyncResult.fail('error').isOk(); // false
   */
  isOk(): Promise<boolean> {
    return this.promise.then(r => r.isOk())
  }

  /**
   * Checks if this AsyncResult is Fail.
   *
   * @returns A Promise that resolves to true if Fail, false if Ok
   *
   * @example
   * const isOk = await AsyncResult.ok(42).isFail(); // false
   * const isFail = await AsyncResult.fail('error').isFail(); // true
   */
  isFail(): Promise<boolean> {
    return this.promise.then(r => r.isFail())
  }

  /**
   * Unwraps the Ok value or returns a default.
   *
   * @param defaultValue - The value to return if this AsyncResult is Fail
   * @returns A Promise that resolves to the Ok value or default
   *
   * @example
   * const value = await AsyncResult.ok(42).unwrapOr(0); // 42
   * const fallback = await AsyncResult.fail('error').unwrapOr(0); // 0
   */
  unwrapOr(defaultValue: TOk): Promise<TOk> {
    return this.promise.then(r => r.unwrapOr(defaultValue))
  }

  /**
   * Unwraps the Ok value or throws if Fail.
   *
   * **Warning**: This method can throw! Only use when you're certain the Result is Ok.
   *
   * @returns A Promise that resolves to the Ok value
   * @throws If the AsyncResult is Fail
   *
   * @example
   * const value = await AsyncResult.ok(42).unwrap(); // 42
   * const throws = await AsyncResult.fail('error').unwrap(); // Throws!
   */
  unwrap(): Promise<TOk> {
    return this.promise.then(r => r.unwrap())
  }

  /**
   * Unwraps the Fail value or throws if Ok.
   *
   * **Warning**: This method can throw! Only use when you're certain the Result is Fail.
   *
   * @returns A Promise that resolves to the Fail value
   * @throws If the AsyncResult is Ok
   *
   * @example
   * const error = await AsyncResult.fail('boom').unwrapFail(); // 'boom'
   * const throws = await AsyncResult.ok(42).unwrapFail(); // Throws!
   */
  unwrapFail(): Promise<TFail> {
    return this.promise.then(r => r.unwrapFail())
  }

  /**
   * Swaps Ok and Fail values.
   *
   * @returns A new AsyncResult with Ok and Fail types swapped
   *
   * @example
   * const swapped = await AsyncResult.ok(42).swap().toPromise();
   * // swapped is Fail(42)
   */
  swap(): AsyncResult<TFail, TOk> {
    const p = this.promise.then(r => r.swap())
    return new AsyncResult<TFail, TOk>(p)
  }

  // ============================================================================
  // Pattern Matching and Finalization
  // ============================================================================

  /**
   * Pattern matches on the Result with synchronous handlers.
   *
   * @param pattern - Object with `ok` and `fail` handlers
   * @returns A Promise that resolves to the result of the matching handler
   *
   * @example
   * const message = await AsyncResult.fromPromise(fetchUser(id))
   *   .match({
   *     ok: user => `Hello, ${user.name}`,
   *     fail: err => `Error: ${err}`
   *   });
   * console.log(message);
   */
  match<M>(pattern: { ok: (val: TOk) => M; fail: (err: TFail) => M }): Promise<M> {
    return this.promise.then(r => r.match(pattern))
  }

  /**
   * Pattern matches on the Result with async handlers.
   *
   * @param pattern - Object with async `ok` and `fail` handlers
   * @returns A Promise that resolves to the result of the matching handler
   *
   * @example
   * await AsyncResult.fromPromise(fetchUser(id))
   *   .matchAsync({
   *     ok: async user => await renderUser(user),
   *     fail: async err => await showError(err)
   *   });
   */
  matchAsync<M>(pattern: { ok: (val: TOk) => Promise<M>; fail: (err: TFail) => Promise<M> }): Promise<M> {
    return this.promise.then(r => (r.isOk() ? pattern.ok(r.unwrap()) : pattern.fail(r.unwrapFail())))
  }

  /**
   * Unwraps the AsyncResult to a Promise<Result>.
   *
   * Use this when you need to exit the AsyncResult chain and work with the
   * underlying Promise<Result> directly.
   *
   * @returns The underlying Promise<Result>
   *
   * @example
   * const result: Result<User, Error> = await AsyncResult.fromPromise(fetchUser(id))
   *   .map(user => user.name)
   *   .toPromise();
   *
   * if (result.isOk()) {
   *   console.log(result.unwrap());
   * }
   */
  toPromise(): Promise<IResult<TOk, TFail>> {
    return this.promise
  }
}
