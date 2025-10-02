import { ok, fail } from './result.factory'
import { AsyncResult } from './async-result'

describe(AsyncResult.name, () => {
  it('should allow point-free async chaining with map/mapAsync/flatMap/flatMapAsync', async () => {
    const res = AsyncResult.ok<number, string>(2)
      .map(n => n + 1) // 3
      .mapAsync(async n => n * 2) // 6
      .flatMap(x => ok<string, string>(String(x))) // Ok('6')
      .flatMapAsync(async s => ok<string, string>(s + '!')) // Ok('6!')

    const final = await res.toPromise()
    expect(final.isOk()).toBe(true)
    expect(final.unwrap()).toBe('6!')
  })

  it('should propagate failures across async boundaries', async () => {
    const res = AsyncResult.ok<number, string>(1)
      .mapAsync(async () => {
        throw 'bad'
      })
      .map(n => n + 1)
      .flatMap(() => ok<number, string>(999))

    const final = await res.toPromise()
    expect(final.isFail()).toBe(true)
    expect(final.unwrapFail()).toBe('bad')
  })

  it('fromPromise should wrap resolve/reject into Result and support chaining', async () => {
    const okAr = AsyncResult.fromPromise<number, string>(Promise.resolve(5)).map(n => n * 2)
    const okFinal = await okAr.toPromise()
    expect(okFinal.isOk()).toBe(true)
    expect(okFinal.unwrap()).toBe(10)

    const failAr = AsyncResult.fromPromise<number, string>(Promise.reject('nope')).map(n => n * 2)
    const failFinal = await failAr.toPromise()
    expect(failFinal.isFail()).toBe(true)
    expect(failFinal.unwrapFail()).toBe('nope')
  })

  it('flatMapAsync should flatten Promise<Result<...>>', async () => {
    const ar = AsyncResult.ok<number, string>(1).flatMapAsync(async (n) => {
      return n > 0 ? ok<number, string>(n + 1) : fail<number, string>('neg')
    })

    const final = await ar.toPromise()
    expect(final.isOk()).toBe(true)
    expect(final.unwrap()).toBe(2)
  })

  it('chain should accept a function returning AsyncResult and keep it point-free', async () => {
    const incAsync = (n: number): AsyncResult<number, string> => AsyncResult.ok<number, string>(n + 1)

    const ar = AsyncResult.ok<number, string>(3)
      .chain(incAsync)
      .chain(incAsync)

    const final = await ar.toPromise()
    expect(final.isOk()).toBe(true)
    expect(final.unwrap()).toBe(5)
  })

  it('chain should convert sync throws in the callback into Fail (no rejection)', async () => {
    const boom = (n: number): AsyncResult<number, string> => {
      void n
      throw 'oops'
    }
    const ar = AsyncResult.ok<number, string>(1).chain(boom)
    const final = await ar.toPromise()
    expect(final.isFail()).toBe(true)
    expect(final.unwrapFail()).toBe('oops')
  })

  it('all should collect Ok values and fail on the first failure', async () => {
    const a = AsyncResult.ok<number, string>(1)
    const b = AsyncResult.fromPromise<number, string>(Promise.resolve(2))
    const c = AsyncResult.ok<number, string>(3)

    const allOk = await AsyncResult.all([a, b, c]).toPromise()
    expect(allOk.isOk()).toBe(true)
    expect(allOk.unwrap()).toEqual([1, 2, 3])

    const bad = AsyncResult.fail<number, string>('oops')
    const allFail = await AsyncResult.all([a, bad, c]).toPromise()
    expect(allFail.isFail()).toBe(true)
    expect(allFail.unwrapFail()).toBe('oops')
  })

  it('all should short-circuit on first Fail (does not wait for later items)', async () => {
    let thirdCompleted = false
    const a = AsyncResult.ok<number, string>(1)
    const b = AsyncResult.fromPromise<number, string>(
      new Promise<number>((_, reject) => setTimeout(() => reject('boom'), 10))
    )
    const c = AsyncResult.fromPromise<number, string>(
      new Promise<number>((resolve) => setTimeout(() => {
        thirdCompleted = true
        resolve(3)
      }, 1000))
    )

    const startedAt = Date.now()
    const res = await AsyncResult.all([a, b, c]).toPromise()
    const elapsed = Date.now() - startedAt

    expect(res.isFail()).toBe(true)
    expect(res.unwrapFail()).toBe('boom')
    // Should finish well before the third completes (1000ms)
    expect(elapsed).toBeLessThan(500)
    // And third should not be marked completed yet at the moment of resolution
    expect(thirdCompleted).toBe(false)
  })

  it('fromResult and fromResultPromise should wrap existing Results', async () => {
    const syncOk = AsyncResult.fromResult(ok<number, string>(1))
    const okFinal = await syncOk.toPromise()
    expect(okFinal.isOk()).toBe(true)
    expect(okFinal.unwrap()).toBe(1)

    const syncFail = AsyncResult.fromResult(fail<number, string>('e'))
    const failFinal = await syncFail.toPromise()
    expect(failFinal.isFail()).toBe(true)
    expect(failFinal.unwrapFail()).toBe('e')

    const p = Promise.resolve(ok<number, string>(7))
    const fromPromiseResult = await AsyncResult.fromResultPromise(p).toPromise()
    expect(fromPromiseResult.isOk()).toBe(true)
    expect(fromPromiseResult.unwrap()).toBe(7)

    const viaFromResult = await AsyncResult.fromResult(Promise.resolve(ok<number, string>(42))).toPromise()
    expect(viaFromResult.isOk()).toBe(true)
    expect(viaFromResult.unwrap()).toBe(42)
  })

  it('mapFail should transform the error', async () => {
    const ar = AsyncResult.fail<number, Error>(new Error('x')).mapFail(e => e.message)
    const final = await ar.toPromise()
    expect(final.isFail()).toBe(true)
    expect(final.unwrapFail()).toBe('x')
  })

  it('flatMapAsync should catch thrown/rejected errors and convert to Fail', async () => {
    const ar = AsyncResult.ok<number, string>(1).flatMapAsync(async () => {
      throw 'oops'
    })
    const final = await ar.toPromise()
    expect(final.isFail()).toBe(true)
    expect(final.unwrapFail()).toBe('oops')
  })

  it('flatMapAsync and chain should short-circuit when initial AsyncResult is Fail', async () => {
    const fm = await AsyncResult.fail<number, string>('bad')
      .flatMapAsync(async n => ok<number, string>(n + 1))
      .toPromise()
    expect(fm.isFail()).toBe(true)
    expect(fm.unwrapFail()).toBe('bad')

    const chained = await AsyncResult.fail<number, string>('bad')
      .chain(n => AsyncResult.ok<number, string>(n + 1))
      .toPromise()
    expect(chained.isFail()).toBe(true)
    expect(chained.unwrapFail()).toBe('bad')
  })

  it('match and matchAsync should resolve with the proper branch', async () => {
    const m1 = await AsyncResult.ok<number, string>(2).match({ ok: n => n * 2, fail: (e) => { void e; return -1 } })
    expect(m1).toBe(4)

    const m2 = await AsyncResult.ok<number, string>(3).matchAsync({ ok: async n => n * 3, fail: async (e) => { void e; return -1 } })
    expect(m2).toBe(9)

    const m3 = await AsyncResult.fail<number, string>('x').matchAsync({ ok: async (n) => { void n; return 0 }, fail: async e => e.length })
    expect(m3).toBe(1)
  })
})
