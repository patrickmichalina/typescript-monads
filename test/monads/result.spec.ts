import { ok, fail, result } from '../../src/monads'

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
      expect(ok('Test').unwrap()).toEqual('Test')
    })

    it('should return proper value when "unwrapOr" is applied', () => {
      expect(ok(1).unwrapOr(25)).toEqual(1)
      expect(ok('Test').unwrapOr('Some Other')).toEqual('Test')
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

    it('should map function', () => {
      const sut = ok(1)
        .map(b => b.toString())
        .unwrap()
      expect(sut).toEqual('1')
    })

    it('should not mapFail', () => {
      const sut = ok(1)
        .mapFail(b => '')
        .unwrap()
      expect(sut).toEqual(1)
    })
  })

  describe('fail', () => {
    it('should return false when "isOk" invoked', () => {
      expect(fail(1).isOk()).toEqual(false)
    })

    it('should return true when "isFail" invoked', () => {
      expect(fail(1).isFail()).toEqual(true)
    })

    it('should return empty maybe when "maybeOk" is invoked', () => {
      const _sut = fail('Test')
        .maybeOk()
        .valueOr('Some Other1')

      expect(_sut).toEqual('Some Other1')
    })

    it('should return fail object when "maybeFail" is invoked', () => {
      const _sut = fail('Test')
        .maybeFail()
        .valueOr('Some Other2')

      expect(_sut).toEqual('Test')
    })

    it('should throw an exception on "unwrap"', () => {
      expect(() => { fail(1).unwrap() }).toThrowError()
    })

    it('should return fail object on "unwrapFail"', () => {
      expect(fail('123').unwrapFail()).toEqual('123')
    })

    it('should return input object on "unwrapOr"', () => {
      expect(fail('123').unwrapOr('456')).toEqual('456')
    })

    it('should not map', () => {
      const sut = fail(1)
        .map(b => b.toString())
        .unwrapFail()
      expect(sut).toEqual(1)
    })

    it('should mapFail', () => {
      const sut = fail(1)
        .mapFail(b => b.toString())
        .unwrapFail()
      expect(sut).toEqual('1')
    })
  })

  describe('result', () => {
    it('should return failure when predicate yields false', () => {
      const sut = result(() => 1 + 1 === 3, true, 'FAILURE!')
      expect(sut.isFail()).toEqual(true)
    })

    it('should return ok when predicate yields true', () => {
      const sut = result(() => 1 + 1 === 2, true, 'FAILURE!')
      expect(sut.isOk()).toEqual(true)
    })
  })
})
