import { maybeToPromise } from './maybe-to-promise'
import { maybe } from '../maybe.factory'

describe('maybeToPromise', () => {
  it('will resolve a Some value', async () => {
    const m = maybe('test')
    const converter = maybeToPromise()
    const val = await converter(m)
    expect(val).toBe('test')
  })

  it('will reject a None value', async () => {
    try {
      const m = maybe<string>()
      const converter = maybeToPromise()
      await converter(m)
      fail('should have thrown')
    } catch (e) {
      expect(e).toBe(undefined)
    }
  })

  it('will reject a None value with a value if provided', async () => {
    try {
      const m = maybe<string>()
      const converter = maybeToPromise('value')
      await converter(m)
      fail('should have thrown')
    } catch (e) {
      expect(e).toBe('value')
    }
  })

  it('will resolve a None value with a fallback value when handleNoneAsResolved is true', async () => {
    const m = maybe<string>()
    const converter = maybeToPromise(null, true, 'fallback')
    const val = await converter(m)
    expect(val).toBe('fallback')
  })

  it('will resolve a Some value normally when handleNoneAsResolved is true', async () => {
    const m = maybe('test')
    const converter = maybeToPromise(null, true, 'fallback')
    const val = await converter(m)
    expect(val).toBe('test')
  })
})