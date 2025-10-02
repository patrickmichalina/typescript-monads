import type { IResult } from './result.interface'
import { Result } from './result'

/**
* AsyncResult is a thin wrapper around Promise<Result<Ok, Fail>> that preserves
* the point-free, chainable API developers expect from Result while crossing
* async boundaries. Methods return AsyncResult so you can keep chaining without
* mixing in `.then` calls until the very end (use `toPromise()` to unwrap).
*/
export class AsyncResult<TOk, TFail> {
  private readonly promise: Promise<IResult<TOk, TFail>>

  private constructor(promise: Promise<IResult<TOk, TFail>>) {
    this.promise = promise
  }

  // Constructors / factories
  static ok<TOk, TFail = never>(value: TOk): AsyncResult<TOk, TFail> {
    return new AsyncResult<TOk, TFail>(Promise.resolve(Result.ok<TOk, TFail>(value)))
  }

  static fail<TOk = never, TFail = unknown>(error: TFail): AsyncResult<TOk, TFail> {
    return new AsyncResult<TOk, TFail>(Promise.resolve(Result.fail<TOk, TFail>(error)))
  }

  static fromResult<TOk, TFail>(result: IResult<TOk, TFail> | Promise<IResult<TOk, TFail>>): AsyncResult<TOk, TFail> {
    const p = result instanceof Promise ? result : Promise.resolve(result)
    return new AsyncResult<TOk, TFail>(p)
  }

  static fromResultPromise<TOk, TFail>(promise: Promise<IResult<TOk, TFail>>): AsyncResult<TOk, TFail> {
    return new AsyncResult<TOk, TFail>(promise)
  }

  static fromPromise<TOk, TFail = unknown>(promise: Promise<TOk>): AsyncResult<TOk, TFail> {
    return new AsyncResult<TOk, TFail>(Result.fromPromise<TOk, TFail>(promise))
  }

  static all<T, E>(items: ReadonlyArray<AsyncResult<T, E>>): AsyncResult<ReadonlyArray<T>, E> {
    const p = Promise.all(items.map(i => i.promise)).then(results => Result.sequence(results))
    return new AsyncResult<ReadonlyArray<T>, E>(p)
  }

  // Core instance methods
  map<M>(fn: (val: TOk) => M): AsyncResult<M, TFail> {
    const p = this.promise.then(r => r.map(fn))
    return new AsyncResult<M, TFail>(p)
  }

  mapFail<M>(fn: (err: TFail) => M): AsyncResult<TOk, M> {
    const p = this.promise.then(r => r.mapFail(fn))
    return new AsyncResult<TOk, M>(p)
  }

  flatMap<M>(fn: (val: TOk) => IResult<M, TFail>): AsyncResult<M, TFail> {
    const p = this.promise.then(r => r.flatMap(fn))
    return new AsyncResult<M, TFail>(p)
  }

  mapAsync<M>(fn: (val: TOk) => Promise<M>): AsyncResult<M, TFail> {
    const p = this.promise.then(r => r.flatMapPromise(fn))
    return new AsyncResult<M, TFail>(p)
  }

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

  chain<M>(fn: (val: TOk) => AsyncResult<M, TFail>): AsyncResult<M, TFail> {
    const p = this.promise.then(r => {
      if (r.isOk()) {
        return fn(r.unwrap()).promise
      }
      return Promise.resolve(Result.fail<M, TFail>(r.unwrapFail()))
    })
    return new AsyncResult<M, TFail>(p)
  }

  match<M>(pattern: { ok: (val: TOk) => M; fail: (err: TFail) => M }): Promise<M> {
    return this.promise.then(r => r.match(pattern))
  }

  matchAsync<M>(pattern: { ok: (val: TOk) => Promise<M>; fail: (err: TFail) => Promise<M> }): Promise<M> {
    return this.promise.then(r => (r.isOk() ? pattern.ok(r.unwrap()) : pattern.fail(r.unwrapFail())))
  }

  toPromise(): Promise<IResult<TOk, TFail>> {
    return this.promise
  }
}
