import { maybe, Maybe, either, Either, ok, fail, Result, reader, Reader, listOf, List } from './index'

describe('package api', () => {
  it('should export maybe', () => {
    expect(maybe(1)).toBeInstanceOf(Maybe)
  })

  it('should export either', () => {
    expect(either(1)).toBeInstanceOf(Either)
  })

  it('should export result', () => {
    expect(ok(1)).toBeInstanceOf(Result)
    expect(fail(1)).toBeInstanceOf(Result)
  })

  it('should export reader', () => {
    expect(reader(() => 1)).toBeInstanceOf(Reader)
  })

  it('should export reader', () => {
    expect(listOf(1, 2)).toBeInstanceOf(List)
  })
})
