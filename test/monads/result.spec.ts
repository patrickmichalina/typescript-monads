import { ok } from '../../src/monads'

describe('result', () => {
  describe('ok', () => {
    it('should return true when "isOk" invoked on a success path', () => {
      expect(ok(1).isOk()).toEqual(true)
    })

    it('should return false when "isFail" invoked on a success path', () => {
      expect(ok(1).isFail()).toEqual(false)
    })

    it('should unwrap', () => {
      expect(ok(1).unwrap()).toEqual(1)
      expect(ok("Test").unwrap()).toEqual("Test")
    })

    it('should return proper value when "unwrapOr" is applied', () => {
      expect(ok(1).unwrapOr(25)).toEqual(1)
      expect(ok("Test").unwrapOr("Some Other")).toEqual("Test")
    })

    it('should throw an exception whe "unwrapOrFail" called on an ok value', () => {
      expect(() => {
        ok(1).unwrapFail()
      }).toThrowError()
    })

    it('should ...', () => {
      const _sut = ok('Test')
        .maybeOk()
        .valueOr('Some Other')
      
      expect(_sut).toEqual('Test')
    })

    it('should ...', () => {
      const _sut = ok('Test')
        .maybeFail()
        .valueOrUndefined()
      
      expect(_sut).toEqual(undefined)
    })
  })
})
