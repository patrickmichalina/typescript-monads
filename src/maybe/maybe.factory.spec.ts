import { maybe, none, some } from './maybe.factory'

describe('should construct maybes', () => {
  it('should handle "maybe" case', () => {
    const sut = 'asdasd' as string | undefined
    expect(maybe(sut).isSome()).toEqual(true)
  })

  it('should handle "none" case', () => {
    expect(none().isNone()).toEqual(true)
  })

  it('should handle "some" case', () => {
    expect(some('test').isSome()).toEqual(true)
  })
})
