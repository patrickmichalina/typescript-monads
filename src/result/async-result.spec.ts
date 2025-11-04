import { ok, fail } from './result.factory'
import { AsyncResult } from './async-result'
import { of, filter } from 'rxjs'

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

  it('fromResult should convert a rejecting Promise<IResult> into Fail (non-throwing invariant)', async () => {
    const rejecting = Promise.reject('reject-me') as Promise<ReturnType<typeof ok<number, string>>> // type doesn't matter here
    const res = await AsyncResult.fromResult<number, string>(rejecting).toPromise()
    expect(res.isFail()).toBe(true)
    expect(res.unwrapFail()).toBe('reject-me')
  })

  it('fromResultPromise should convert a rejecting Promise<IResult> into Fail (non-throwing invariant)', async () => {
    const rejecting = Promise.reject('nope') as unknown as Promise<ReturnType<typeof ok<number, string>>>
    const res = await AsyncResult.fromResultPromise<number, string>(rejecting).toPromise()
    expect(res.isFail()).toBe(true)
    expect(res.unwrapFail()).toBe('nope')
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

  // New method tests
  describe('recover', () => {
    it('should not transform an Ok AsyncResult', async () => {
      const ar = AsyncResult.ok<number, string>(5).recover(() => 10)
      const result = await ar.toPromise()
      expect(result.isOk()).toBe(true)
      expect(result.unwrap()).toBe(5)
    })

    it('should transform a Fail AsyncResult to Ok', async () => {
      const ar = AsyncResult.fail<number, string>('error').recover(() => 10)
      const result = await ar.toPromise()
      expect(result.isOk()).toBe(true)
      expect(result.unwrap()).toBe(10)
    })
  })

  describe('recoverWith', () => {
    it('should not transform an Ok AsyncResult', async () => {
      const ar = AsyncResult.ok<number, string>(5).recoverWith(() => ok(10))
      const result = await ar.toPromise()
      expect(result.isOk()).toBe(true)
      expect(result.unwrap()).toBe(5)
    })

    it('should transform a Fail AsyncResult using the provided Result', async () => {
      const ar = AsyncResult.fail<number, string>('error').recoverWith(() => ok(10))
      const result = await ar.toPromise()
      expect(result.isOk()).toBe(true)
      expect(result.unwrap()).toBe(10)
    })

    it('should allow returning a Fail Result from recovery', async () => {
      const ar = AsyncResult.fail<number, string>('original').recoverWith(err => fail(`recovered: ${err}`))
      const result = await ar.toPromise()
      expect(result.isFail()).toBe(true)
      expect(result.unwrapFail()).toBe('recovered: original')
    })
  })

  describe('orElse', () => {
    it('should return the original AsyncResult when Ok', async () => {
      const ar = AsyncResult.ok<number, string>(5).orElse(AsyncResult.ok(10))
      const result = await ar.toPromise()
      expect(result.isOk()).toBe(true)
      expect(result.unwrap()).toBe(5)
    })

    it('should return the fallback AsyncResult when Fail', async () => {
      const ar = AsyncResult.fail<number, string>('error').orElse(AsyncResult.ok(10))
      const result = await ar.toPromise()
      expect(result.isOk()).toBe(true)
      expect(result.unwrap()).toBe(10)
    })

    it('should chain multiple orElse calls', async () => {
      const ar = AsyncResult.fail<number, string>('e1')
        .orElse(AsyncResult.fail('e2'))
        .orElse(AsyncResult.ok(42))
      const result = await ar.toPromise()
      expect(result.isOk()).toBe(true)
      expect(result.unwrap()).toBe(42)
    })
  })

  describe('tap', () => {
    it('should execute ok side effect without changing the result', async () => {
      let sideEffect = 0
      const ar = AsyncResult.ok<number, string>(5).tap({ ok: n => { sideEffect = n * 2 } })
      const result = await ar.toPromise()
      expect(sideEffect).toBe(10)
      expect(result.isOk()).toBe(true)
      expect(result.unwrap()).toBe(5)
    })

    it('should execute fail side effect without changing the result', async () => {
      let sideEffect = ''
      const ar = AsyncResult.fail<number, string>('error').tap({ fail: e => { sideEffect = e.toUpperCase() } })
      const result = await ar.toPromise()
      expect(sideEffect).toBe('ERROR')
      expect(result.isFail()).toBe(true)
      expect(result.unwrapFail()).toBe('error')
    })
  })

  describe('tapOk', () => {
    it('should execute side effect for Ok AsyncResult', async () => {
      let sideEffect = 0
      const ar = AsyncResult.ok<number, string>(5).tapOk(n => { sideEffect = n * 2 })
      const result = await ar.toPromise()
      expect(sideEffect).toBe(10)
      expect(result.unwrap()).toBe(5)
    })

    it('should not execute side effect for Fail AsyncResult', async () => {
      let sideEffect = 0
      const ar = AsyncResult.fail<number, string>('error').tapOk(n => { sideEffect = n * 2 })
      await ar.toPromise()
      expect(sideEffect).toBe(0)
    })
  })

  describe('tapFail', () => {
    it('should execute side effect for Fail AsyncResult', async () => {
      let sideEffect = ''
      const ar = AsyncResult.fail<number, string>('error').tapFail(e => { sideEffect = e })
      const result = await ar.toPromise()
      expect(sideEffect).toBe('error')
      expect(result.unwrapFail()).toBe('error')
    })

    it('should not execute side effect for Ok AsyncResult', async () => {
      let sideEffect = ''
      const ar = AsyncResult.ok<number, string>(5).tapFail(e => { sideEffect = e })
      await ar.toPromise()
      expect(sideEffect).toBe('')
    })
  })

  describe('isOk', () => {
    it('should return true for Ok AsyncResult', async () => {
      const result = await AsyncResult.ok(42).isOk()
      expect(result).toBe(true)
    })

    it('should return false for Fail AsyncResult', async () => {
      const result = await AsyncResult.fail('error').isOk()
      expect(result).toBe(false)
    })
  })

  describe('isFail', () => {
    it('should return false for Ok AsyncResult', async () => {
      const result = await AsyncResult.ok(42).isFail()
      expect(result).toBe(false)
    })

    it('should return true for Fail AsyncResult', async () => {
      const result = await AsyncResult.fail('error').isFail()
      expect(result).toBe(true)
    })
  })

  describe('unwrapOr', () => {
    it('should return the Ok value', async () => {
      const result = await AsyncResult.ok(42).unwrapOr(0)
      expect(result).toBe(42)
    })

    it('should return the default value for Fail', async () => {
      const result = await AsyncResult.fail<number, string>('error').unwrapOr(0)
      expect(result).toBe(0)
    })
  })

  describe('unwrap', () => {
    it('should return the Ok value', async () => {
      const result = await AsyncResult.ok(42).unwrap()
      expect(result).toBe(42)
    })

    it('should throw for Fail AsyncResult', async () => {
      await expect(AsyncResult.fail('error').unwrap()).rejects.toThrow()
    })
  })

  describe('unwrapFail', () => {
    it('should return the Fail value', async () => {
      const result = await AsyncResult.fail('error').unwrapFail()
      expect(result).toBe('error')
    })

    it('should throw for Ok AsyncResult', async () => {
      await expect(AsyncResult.ok(42).unwrapFail()).rejects.toThrow()
    })
  })

  describe('swap', () => {
    it('should swap Ok to Fail', async () => {
      const result = await AsyncResult.ok<number, string>(42).swap().toPromise()
      expect(result.isFail()).toBe(true)
      expect(result.unwrapFail()).toBe(42)
    })

    it('should swap Fail to Ok', async () => {
      const result = await AsyncResult.fail<number, string>('error').swap().toPromise()
      expect(result.isOk()).toBe(true)
      expect(result.unwrap()).toBe('error')
    })
  })

  describe('sequence', () => {
    it('should be an alias for all', async () => {
      const items = [AsyncResult.ok(1), AsyncResult.ok(2), AsyncResult.ok(3)]
      const result = await AsyncResult.sequence(items).toPromise()
      expect(result.isOk()).toBe(true)
      expect(result.unwrap()).toEqual([1, 2, 3])
    })
  })

  describe('fromObservable', () => {
    it('should convert an observable that emits to Ok', async () => {
      const obs = of(42)
      const result = await AsyncResult.fromObservable(obs, 'no value').toPromise()
      expect(result.isOk()).toBe(true)
      expect(result.unwrap()).toBe(42)
    })

    it('should convert an empty observable to Fail', async () => {
      const obs = of<number>().pipe(filter(() => false))
      const result = await AsyncResult.fromObservable(obs, 'no value').toPromise()
      expect(result.isFail()).toBe(true)
      expect(result.unwrapFail()).toBe('no value')
    })
  })

  describe('flatMapObservable', () => {
    it('should flatMap an Ok value to an observable', async () => {
      const ar = AsyncResult.ok(5).flatMapObservable(n => of(n * 2), 'error')
      const result = await ar.toPromise()
      expect(result.isOk()).toBe(true)
      expect(result.unwrap()).toBe(10)
    })

    it('should short-circuit for Fail AsyncResult', async () => {
      let called = false
      const ar = AsyncResult.fail<number, string>('error').flatMapObservable(() => {
        called = true
        return of(10)
      }, 'default')
      const result = await ar.toPromise()
      expect(called).toBe(false)
      expect(result.isFail()).toBe(true)
      expect(result.unwrapFail()).toBe('error')
    })
  })
})
