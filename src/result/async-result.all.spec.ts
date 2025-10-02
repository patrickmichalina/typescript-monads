import { AsyncResult } from './async-result'

describe('AsyncResult.all (short-circuit)', () => {
  it('should short-circuit and not wait for later items after a failure', async () => {
    const a = AsyncResult.ok<number, string>(1)
    const bad = AsyncResult.fail<number, string>('boom')

    const slow = AsyncResult.fromPromise<number, string>(
      new Promise<number>(resolve => setTimeout(() => resolve(99), 200))
    )

    const start = Date.now()
    const res = await AsyncResult.all([a, bad, slow]).toPromise()
    const elapsed = Date.now() - start

    expect(res.isFail()).toBe(true)
    expect(res.unwrapFail()).toBe('boom')
    // Should return well before the slow item resolves (200ms). Allow a generous margin.
    expect(elapsed).toBeLessThan(150)
  })
})
