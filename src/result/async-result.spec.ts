import { ok, fail } from './result.factory'
import { AsyncResult } from './async-result'
import { of, filter } from 'rxjs'

describe(AsyncResult.name, () => {
  it('should allow point-free chaining with map/mapAsync/flatMap/flatMapAsync', (done) => {
    const res = AsyncResult.ok<number, string>(2)
      .map(n => n + 1) // 3
      .mapAsync(n => Promise.resolve(n * 2)) // 6
      .flatMap(x => ok<string, string>(String(x))) // Ok('6')
      .flatMapAsync(s => Promise.resolve(ok<string, string>(s + '!'))) // Ok('6!')

    res.toPromise().then(final => {
      expect(final.isOk()).toBe(true)
      expect(final.unwrap()).toBe('6!')
      done()
    })
  })

  it('should propagate failures across boundaries', (done) => {
    const res = AsyncResult.ok<number, string>(1)
      .mapAsync(() => Promise.reject('bad'))
      .map(n => n + 1)
      .flatMap(() => ok<number, string>(999))

    res.toPromise().then(final => {
      expect(final.isFail()).toBe(true)
      expect(final.unwrapFail()).toBe('bad')
      done()
    })
  })

  it('fromPromise should wrap resolve/reject into Result and support chaining', (done) => {
    const okAr = AsyncResult.fromPromise<number, string>(Promise.resolve(5)).map(n => n * 2)
    okAr.toPromise().then(okFinal => {
      expect(okFinal.isOk()).toBe(true)
      expect(okFinal.unwrap()).toBe(10)

      const failAr = AsyncResult.fromPromise<number, string>(Promise.reject('nope')).map(n => n * 2)
      return failAr.toPromise()
    }).then(failFinal => {
      expect(failFinal.isFail()).toBe(true)
      expect(failFinal.unwrapFail()).toBe('nope')
      done()
    })
  })

  it('flatMapAsync should flatten Promise<Result<...>>', (done) => {
    const ar = AsyncResult.ok<number, string>(1).flatMapAsync((n) => {
      return Promise.resolve(n > 0 ? ok<number, string>(n + 1) : fail<number, string>('neg'))
    })

    ar.toPromise().then(final => {
      expect(final.isOk()).toBe(true)
      expect(final.unwrap()).toBe(2)
      done()
    })
  })

  it('chain should accept a function returning AsyncResult and keep it point-free', (done) => {
    const incAsync = (n: number): AsyncResult<number, string> => AsyncResult.ok<number, string>(n + 1)

    const ar = AsyncResult.ok<number, string>(3)
      .chain(incAsync)
      .chain(incAsync)

    ar.toPromise().then(final => {
      expect(final.isOk()).toBe(true)
      expect(final.unwrap()).toBe(5)
      done()
    })
  })

  it('chain should convert sync throws in the callback into Fail (no rejection)', (done) => {
    const boom = (n: number): AsyncResult<number, string> => {
      void n
      throw 'oops'
    }
    const ar = AsyncResult.ok<number, string>(1).chain(boom)
    ar.toPromise().then(final => {
      expect(final.isFail()).toBe(true)
      expect(final.unwrapFail()).toBe('oops')
      done()
    })
  })

  it('all should collect Ok values and fail on the first failure', (done) => {
    const a = AsyncResult.ok<number, string>(1)
    const b = AsyncResult.fromPromise<number, string>(Promise.resolve(2))
    const c = AsyncResult.ok<number, string>(3)

    AsyncResult.all([a, b, c]).toPromise().then(allOk => {
      expect(allOk.isOk()).toBe(true)
      expect(allOk.unwrap()).toEqual([1, 2, 3])

      const bad = AsyncResult.fail<number, string>('oops')
      return AsyncResult.all([a, bad, c]).toPromise()
    }).then(allFail => {
      expect(allFail.isFail()).toBe(true)
      expect(allFail.unwrapFail()).toBe('oops')
      done()
    })
  })

  it('all should short-circuit on first Fail (does not wait for later items)', (done) => {
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
    AsyncResult.all([a, b, c]).toPromise().then(res => {
      const elapsed = Date.now() - startedAt

      expect(res.isFail()).toBe(true)
      expect(res.unwrapFail()).toBe('boom')
      // Should finish well before the third completes (1000ms)
      expect(elapsed).toBeLessThan(500)
      // And third should not be marked completed yet at the moment of resolution
      expect(thirdCompleted).toBe(false)
      done()
    })
  })

  it('fromResult and fromResultPromise should wrap existing Results', (done) => {
    const syncOk = AsyncResult.fromResult(ok<number, string>(1))
    syncOk.toPromise().then(okFinal => {
      expect(okFinal.isOk()).toBe(true)
      expect(okFinal.unwrap()).toBe(1)

      const syncFail = AsyncResult.fromResult(fail<number, string>('e'))
      return syncFail.toPromise()
    }).then(failFinal => {
      expect(failFinal.isFail()).toBe(true)
      expect(failFinal.unwrapFail()).toBe('e')

      const p = Promise.resolve(ok<number, string>(7))
      return AsyncResult.fromResultPromise(p).toPromise()
    }).then(fromPromiseResult => {
      expect(fromPromiseResult.isOk()).toBe(true)
      expect(fromPromiseResult.unwrap()).toBe(7)

      return AsyncResult.fromResult(Promise.resolve(ok<number, string>(42))).toPromise()
    }).then(viaFromResult => {
      expect(viaFromResult.isOk()).toBe(true)
      expect(viaFromResult.unwrap()).toBe(42)
      done()
    })
  })

  it('fromResult should convert a rejecting Promise<IResult> into Fail (non-throwing invariant)', (done) => {
    const rejecting = Promise.reject('reject-me') as Promise<ReturnType<typeof ok<number, string>>>
    AsyncResult.fromResult<number, string>(rejecting).toPromise().then(res => {
      expect(res.isFail()).toBe(true)
      expect(res.unwrapFail()).toBe('reject-me')
      done()
    })
  })

  it('fromResultPromise should convert a rejecting Promise<IResult> into Fail (non-throwing invariant)', (done) => {
    const rejecting = Promise.reject('nope') as unknown as Promise<ReturnType<typeof ok<number, string>>>
    AsyncResult.fromResultPromise<number, string>(rejecting).toPromise().then(res => {
      expect(res.isFail()).toBe(true)
      expect(res.unwrapFail()).toBe('nope')
      done()
    })
  })

  it('mapFail should transform the error', (done) => {
    const ar = AsyncResult.fail<number, Error>(new Error('x')).mapFail(e => e.message)
    ar.toPromise().then(final => {
      expect(final.isFail()).toBe(true)
      expect(final.unwrapFail()).toBe('x')
      done()
    })
  })

  it('flatMapAsync should catch thrown/rejected errors and convert to Fail', (done) => {
    const ar = AsyncResult.ok<number, string>(1).flatMapAsync(() => Promise.reject('oops'))
    ar.toPromise().then(final => {
      expect(final.isFail()).toBe(true)
      expect(final.unwrapFail()).toBe('oops')
      done()
    })
  })

  it('flatMapAsync and chain should short-circuit when initial AsyncResult is Fail', (done) => {
    AsyncResult.fail<number, string>('bad')
      .flatMapAsync(n => Promise.resolve(ok<number, string>(n + 1)))
      .toPromise()
      .then(fm => {
        expect(fm.isFail()).toBe(true)
        expect(fm.unwrapFail()).toBe('bad')

        return AsyncResult.fail<number, string>('bad')
          .chain(n => AsyncResult.ok<number, string>(n + 1))
          .toPromise()
      })
      .then(chained => {
        expect(chained.isFail()).toBe(true)
        expect(chained.unwrapFail()).toBe('bad')
        done()
      })
  })

  it('match and matchAsync should resolve with the proper branch', (done) => {
    AsyncResult.ok<number, string>(2).match({ ok: n => n * 2, fail: (e) => { void e; return -1 } }).then(m1 => {
      expect(m1).toBe(4)

      return AsyncResult.ok<number, string>(3).matchAsync({ ok: n => Promise.resolve(n * 3), fail: (e) => { void e; return Promise.resolve(-1) } })
    }).then(m2 => {
      expect(m2).toBe(9)

      return AsyncResult.fail<number, string>('x').matchAsync({ ok: (n) => { void n; return Promise.resolve(0) }, fail: e => Promise.resolve(e.length) })
    }).then(m3 => {
      expect(m3).toBe(1)
      done()
    })
  })

  // New method tests
  describe('recover', () => {
    it('should not transform an Ok AsyncResult', (done) => {
      const ar = AsyncResult.ok<number, string>(5).recover(() => 10)
      ar.toPromise().then(result => {
        expect(result.isOk()).toBe(true)
        expect(result.unwrap()).toBe(5)
        done()
      })
    })

    it('should transform a Fail AsyncResult to Ok', (done) => {
      const ar = AsyncResult.fail<number, string>('error').recover(() => 10)
      ar.toPromise().then(result => {
        expect(result.isOk()).toBe(true)
        expect(result.unwrap()).toBe(10)
        done()
      })
    })
  })

  describe('recoverWith', () => {
    it('should not transform an Ok AsyncResult', (done) => {
      const ar = AsyncResult.ok<number, string>(5).recoverWith(() => ok(10))
      ar.toPromise().then(result => {
        expect(result.isOk()).toBe(true)
        expect(result.unwrap()).toBe(5)
        done()
      })
    })

    it('should transform a Fail AsyncResult using the provided Result', (done) => {
      const ar = AsyncResult.fail<number, string>('error').recoverWith(() => ok(10))
      ar.toPromise().then(result => {
        expect(result.isOk()).toBe(true)
        expect(result.unwrap()).toBe(10)
        done()
      })
    })

    it('should allow returning a Fail Result from recovery', (done) => {
      const ar = AsyncResult.fail<number, string>('original').recoverWith(err => fail(`recovered: ${err}`))
      ar.toPromise().then(result => {
        expect(result.isFail()).toBe(true)
        expect(result.unwrapFail()).toBe('recovered: original')
        done()
      })
    })
  })

  describe('orElse', () => {
    it('should return the original AsyncResult when Ok', (done) => {
      const ar = AsyncResult.ok<number, string>(5).orElse(AsyncResult.ok(10))
      ar.toPromise().then(result => {
        expect(result.isOk()).toBe(true)
        expect(result.unwrap()).toBe(5)
        done()
      })
    })

    it('should return the fallback AsyncResult when Fail', (done) => {
      const ar = AsyncResult.fail<number, string>('error').orElse(AsyncResult.ok(10))
      ar.toPromise().then(result => {
        expect(result.isOk()).toBe(true)
        expect(result.unwrap()).toBe(10)
        done()
      })
    })

    it('should chain multiple orElse calls', (done) => {
      const ar = AsyncResult.fail<number, string>('e1')
        .orElse(AsyncResult.fail('e2'))
        .orElse(AsyncResult.ok(42))
      ar.toPromise().then(result => {
        expect(result.isOk()).toBe(true)
        expect(result.unwrap()).toBe(42)
        done()
      })
    })
  })

  describe('tap', () => {
    it('should execute ok side effect without changing the result', (done) => {
      let sideEffect = 0
      const ar = AsyncResult.ok<number, string>(5).tap({ ok: n => { sideEffect = n * 2 } })
      ar.toPromise().then(result => {
        expect(sideEffect).toBe(10)
        expect(result.isOk()).toBe(true)
        expect(result.unwrap()).toBe(5)
        done()
      })
    })

    it('should execute fail side effect without changing the result', (done) => {
      let sideEffect = ''
      const ar = AsyncResult.fail<number, string>('error').tap({ fail: e => { sideEffect = e.toUpperCase() } })
      ar.toPromise().then(result => {
        expect(sideEffect).toBe('ERROR')
        expect(result.isFail()).toBe(true)
        expect(result.unwrapFail()).toBe('error')
        done()
      })
    })
  })

  describe('tapOk', () => {
    it('should execute side effect for Ok AsyncResult', (done) => {
      let sideEffect = 0
      const ar = AsyncResult.ok<number, string>(5).tapOk(n => { sideEffect = n * 2 })
      ar.toPromise().then(result => {
        expect(sideEffect).toBe(10)
        expect(result.unwrap()).toBe(5)
        done()
      })
    })

    it('should not execute side effect for Fail AsyncResult', (done) => {
      let sideEffect = 0
      const ar = AsyncResult.fail<number, string>('error').tapOk(n => { sideEffect = n * 2 })
      ar.toPromise().then(() => {
        expect(sideEffect).toBe(0)
        done()
      })
    })
  })

  describe('tapFail', () => {
    it('should execute side effect for Fail AsyncResult', (done) => {
      let sideEffect = ''
      const ar = AsyncResult.fail<number, string>('error').tapFail(e => { sideEffect = e })
      ar.toPromise().then(result => {
        expect(sideEffect).toBe('error')
        expect(result.unwrapFail()).toBe('error')
        done()
      })
    })

    it('should not execute side effect for Ok AsyncResult', (done) => {
      let sideEffect = ''
      const ar = AsyncResult.ok<number, string>(5).tapFail(e => { sideEffect = e })
      ar.toPromise().then(() => {
        expect(sideEffect).toBe('')
        done()
      })
    })
  })

  describe('isOk', () => {
    it('should return true for Ok AsyncResult', (done) => {
      AsyncResult.ok(42).isOk().then(result => {
        expect(result).toBe(true)
        done()
      })
    })

    it('should return false for Fail AsyncResult', (done) => {
      AsyncResult.fail('error').isOk().then(result => {
        expect(result).toBe(false)
        done()
      })
    })
  })

  describe('isFail', () => {
    it('should return false for Ok AsyncResult', (done) => {
      AsyncResult.ok(42).isFail().then(result => {
        expect(result).toBe(false)
        done()
      })
    })

    it('should return true for Fail AsyncResult', (done) => {
      AsyncResult.fail('error').isFail().then(result => {
        expect(result).toBe(true)
        done()
      })
    })
  })

  describe('unwrapOr', () => {
    it('should return the Ok value', (done) => {
      AsyncResult.ok(42).unwrapOr(0).then(result => {
        expect(result).toBe(42)
        done()
      })
    })

    it('should return the default value for Fail', (done) => {
      AsyncResult.fail<number, string>('error').unwrapOr(0).then(result => {
        expect(result).toBe(0)
        done()
      })
    })
  })

  describe('unwrap', () => {
    it('should return the Ok value', (done) => {
      AsyncResult.ok(42).unwrap().then(result => {
        expect(result).toBe(42)
        done()
      })
    })

    it('should throw for Fail AsyncResult', (done) => {
      AsyncResult.fail('error').unwrap().catch(() => {
        done()
      })
    })
  })

  describe('unwrapFail', () => {
    it('should return the Fail value', (done) => {
      AsyncResult.fail('error').unwrapFail().then(result => {
        expect(result).toBe('error')
        done()
      })
    })

    it('should throw for Ok AsyncResult', (done) => {
      AsyncResult.ok(42).unwrapFail().catch(() => {
        done()
      })
    })
  })

  describe('swap', () => {
    it('should swap Ok to Fail', (done) => {
      AsyncResult.ok<number, string>(42).swap().toPromise().then(result => {
        expect(result.isFail()).toBe(true)
        expect(result.unwrapFail()).toBe(42)
        done()
      })
    })

    it('should swap Fail to Ok', (done) => {
      AsyncResult.fail<number, string>('error').swap().toPromise().then(result => {
        expect(result.isOk()).toBe(true)
        expect(result.unwrap()).toBe('error')
        done()
      })
    })
  })

  describe('sequence', () => {
    it('should be an alias for all', (done) => {
      const items = [AsyncResult.ok(1), AsyncResult.ok(2), AsyncResult.ok(3)]
      AsyncResult.sequence(items).toPromise().then(result => {
        expect(result.isOk()).toBe(true)
        expect(result.unwrap()).toEqual([1, 2, 3])
        done()
      })
    })
  })

  describe('fromObservable', () => {
    it('should convert an observable that emits to Ok', (done) => {
      const obs = of(42)
      AsyncResult.fromObservable(obs, 'no value').toPromise().then(result => {
        expect(result.isOk()).toBe(true)
        expect(result.unwrap()).toBe(42)
        done()
      })
    })

    it('should convert an empty observable to Fail', (done) => {
      const obs = of<number>().pipe(filter(() => false))
      AsyncResult.fromObservable(obs, 'no value').toPromise().then(result => {
        expect(result.isFail()).toBe(true)
        expect(result.unwrapFail()).toBe('no value')
        done()
      })
    })
  })

  describe('flatMapObservable', () => {
    it('should flatMap an Ok value to an observable', (done) => {
      const ar = AsyncResult.ok(5).flatMapObservable(n => of(n * 2), 'error')
      ar.toPromise().then(result => {
        expect(result.isOk()).toBe(true)
        expect(result.unwrap()).toBe(10)
        done()
      })
    })

    it('should short-circuit for Fail AsyncResult', (done) => {
      let called = false
      const ar = AsyncResult.fail<number, string>('error').flatMapObservable(() => {
        called = true
        return of(10)
      }, 'default')
      ar.toPromise().then(result => {
        expect(called).toBe(false)
        expect(result.isFail()).toBe(true)
        expect(result.unwrapFail()).toBe('error')
        done()
      })
    })
  })
})
