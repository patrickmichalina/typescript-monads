import { ok, fail, result } from './result.factory'

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
      const _sut = ok<string | undefined, string>('Test')
        .maybeOk()
        .map(b => b)
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
        .mapFail(() => '')
        .unwrap()
      expect(sut).toEqual(1)
    })

    it('should flatMap', () => {
      const sut = ok(1)
        .flatMap(a => ok(a.toString()))
        .unwrap()

      expect(sut).toEqual('1')
    })

    it('should flatMapAsync', (done) => {
      ok(1)
        .flatMapAsync(a => Promise.resolve(ok(a.toString())))
        .then(result => result.unwrap())
        .then(final => expect(final).toEqual('1'))
        .then(done)  // eslint-disable-line promise/no-callback-in-promise
        .catch(e => expect(e).toBeUndefined())
      
      fail<number, string>('hold on')
        .flatMapAsync(a => Promise.resolve(ok(a.toString())))
        .then(result => result.unwrapFail())
        .then(final => expect(final).toEqual('hold on'))
        .catch(e => expect(e).toBeUndefined())
    })

    it('should match', () => {
      const sut = ok(1)
        .match({
          fail: () => 2,
          ok: val => val
        })

      expect(sut).toEqual(1)
    })

    it('should unwrap and rewrap promise for async map functions ', (done) => {
      const okPromise = ok<number, string>(2)
        .mapAsync(n => Promise.resolve(n ** 2))
        .then(result => result.unwrap())
        .then(nSquared => expect(nSquared).toEqual(4))

      const failPromise = fail<number, string>('whoa there')
        .mapAsync((n: number) => Promise.resolve(n ** 2))
        .then(result => result.unwrapFail())
        .then(failure => expect(failure).toEqual('whoa there'))

      Promise.all([okPromise, failPromise])
        .then(() => done())  // eslint-disable-line promise/no-callback-in-promise
        .catch(e => expect(e).toBeUndefined())
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
      const sut = fail<string, string>('Test')
        .maybeOk()
        .valueOr('Some Other1')

      expect(sut).toEqual('Some Other1')
    })

    it('should return fail object when "maybeFail" is invoked', () => {
      const sut = fail<string, string>('Test')
        .maybeFail()
        .valueOr('Some Other2')

      expect(sut).toEqual('Test')
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
      const sut = fail<string, number>(1)
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

    it('should not flatMap', () => {
      const sut = fail<string, number>(1)
        .flatMap(a => ok(a.toString()))
        .unwrapFail()

      expect(sut).toEqual(1)
    })

    it('should match', () => {
      const sut = fail(1)
        .match({
          fail: () => 2,
          ok: val => val
        })

      expect(sut).toEqual(2)
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
