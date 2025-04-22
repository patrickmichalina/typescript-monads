import { ok, fail, result } from './result.factory'
import { IMaybe, maybe, none, some } from '../maybe/public_api'

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

    it('should match', () => {
      const sut = ok(1)
        .match({
          fail: () => 2,
          ok: val => val
        })

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

    it('should return fail when predicate yields false', () => {
      const sut = result(() => 1 + 1 === 1, true, 'FAILURE!')
      expect(sut.isFail()).toEqual(true)
    })
  })

  describe('toFailIfExists', () => {
    it('should toFailWhenOk', () => {
      const sut = ok<number, Error>(1)
        .map(a => a + 2)
        .toFailWhenOk(a => new Error(`only have ${a}`))

      expect(sut.isFail()).toEqual(true)
      expect(sut.unwrapFail()).toBeInstanceOf(Error)
      expect(sut.unwrapFail().message).toEqual('only have 3')
    })

    it('should toFailWhenOkFrom from fail', () => {
      const sut = fail<number, Error>(new Error('started as error'))
        .map(a => a + 2)
        .toFailWhenOkFrom(new Error('ended as an error'))

      expect(sut.isFail()).toEqual(true)
      expect(sut.unwrapFail()).toBeInstanceOf(Error)
      expect(sut.unwrapFail().message).toEqual('ended as an error')
    })

    it('should toFailWhenOk from fail', () => {
      const sut = fail<number, Error>(new Error('started as error'))
        .map(a => a + 2)
        .toFailWhenOk(a => new Error(`ended as an error ${a}`))

      expect(sut.isFail()).toEqual(true)
      expect(sut.unwrapFail()).toBeInstanceOf(Error)
      expect(sut.unwrapFail().message).toEqual('started as error')
    })

    it('should toFailWhenOkFrom', () => {
      const sut = ok<number, Error>(1)
        .map(a => a + 2)
        .toFailWhenOkFrom(new Error('error msg'))

      expect(sut.isFail()).toEqual(true)
      expect(sut.unwrapFail()).toBeInstanceOf(Error)
      expect(sut.unwrapFail().message).toEqual('error msg')
    })
  })

  describe('tap', () => {
    it('should tap.ok', done => {
      const sut = ok(1)

      sut.tap({
        ok: num => {
          expect(num).toEqual(1)
          done()
        },
        fail: done
      })
    })

    it('should tap.ok', done => {
      const sut = fail<number, string>('failed')

      sut.tap({
        fail: str => {
          expect(str).toEqual('failed')
          done()
        },
        ok: done
      })
    })

    it('should tapOk', done => {
      const sut = ok<number, string>(1)

      sut.tapOk(num => {
        expect(num).toEqual(1)
        done()
      })

      sut.tapFail(() => {
        expect(true).toBeFalsy()
        done()
      })
    })

    it('should tapFail', done => {
      const sut = fail<number, string>('failed')

      sut.tapFail(err => {
        expect(err).toEqual('failed')
        done()
      })

      sut.tapOk(() => {
        expect(true).toBeFalsy()
        done()
      })
    })

    it('should tapThru', done => {
      const result = ok<number, string>(1)

      let sideEffect = 0

      const sut = result.tapOkThru(v => {
        sideEffect = v
      }).map(a => a + 2)

      expect(sut.unwrap()).toEqual(3)
      expect(sideEffect).toEqual(1)

      done()
    })

    it('should tapThru failed side', done => {
      const result = fail<number, string>('failed')

      let sideEffect = 0

      const sut = result.tapOkThru(v => {
        sideEffect = v
      }).map(a => a + 2)

      expect(sut.unwrapFail()).toEqual('failed')
      expect(sideEffect).toEqual(0)

      done()
    })

    it('should tapFailThru', done => {
      const result = fail<number, string>('failed')

      let sideEffect = ''

      const sut = result.tapFailThru(v => {
        sideEffect = v + ' inside'
      }).map(a => a + 2)

      expect(sut.unwrapFail()).toEqual('failed')
      expect(sideEffect).toEqual('failed inside')

      done()
    })

    it('should tapFailThru Ok side', done => {
      const result = ok<number, string>(1)

      let sideEffect = ''

      const sut = result.tapFailThru(v => {
        sideEffect = v + ' inside'
      }).map(a => a + 2)

      expect(sut.unwrap()).toEqual(3)
      expect(sideEffect).toEqual('')

      done()
    })

    it('should tapThru', done => {
      const result = ok<number, string>(1)

      let sideEffect = 0

      const sut = result.tapThru({
        ok: v => {
          sideEffect = v
        }
      }).map(a => a + 2)

      expect(sut.unwrap()).toEqual(3)
      expect(sideEffect).toEqual(1)

      done()
    })

    it('should tapThru', done => {
      const result = ok<number, string>(1)

      let sideEffect = 0

      const sut = result.tapThru({
        ok: v => {
          sideEffect = v
        },
        fail: f => {
          sideEffect = +f
        }
      }).map(a => a + 2)

      expect(sut.unwrap()).toEqual(3)
      expect(sideEffect).toEqual(1)

      done()
    })

    it('should tapThru', done => {
      const result = fail<number, string>('failed')

      let sideEffect = ''

      const sut = result.tapThru({
        ok: v => {
          sideEffect = v + ''
        },
        fail: f => {
          sideEffect = f + ' in here'
        }
      }).map(a => a + 2)

      expect(sut.unwrapFail()).toEqual('failed')
      expect(sideEffect).toEqual('failed in here')

      done()
    })
  })

  describe('flatMapMaybe', () => {
    it('should return Ok with value when Result is Ok and Maybe is Some', () => {
      const okResult = ok<number, string>(5)
      const res = okResult.flatMapMaybe((val) => maybe(val * 2), 'No value found')

      expect(res.isOk()).toEqual(true)
      expect(res.unwrap()).toEqual(10)
    })

    it('should return Fail with error when Result is Ok but Maybe is None', () => {
      const okResult = ok<number, string>(5)
      const res = okResult.flatMapMaybe(() => none<number>(), 'No value found')
      expect(res.isFail()).toEqual(true)
      expect(res.unwrapFail()).toEqual('No value found')
    })

    it('should return Fail with original error when Result is Fail', () => {
      const failResult = fail<number, string>('Original error')
      const res = failResult.flatMapMaybe((val: number) => maybe(val * 2), 'No value found')

      expect(res.isFail()).toEqual(true)
      expect(res.unwrapFail()).toEqual('Original error')
    })

    it('should ', () => {
      const okResult = ok<{ result: number; data: IMaybe<{ zeta: number }> }, Error>({ result: 1, data: some({ zeta: 2 }) })
      const res = okResult.flatMapMaybe((a) => a.data, new Error('No value found'))

      expect(res.isFail()).toEqual(false)
      expect(res.unwrap()).toEqual({ zeta: 2 })
    })

    it('should work with complex object properties', () => {
      type User = {
        id: number
        profile?: {
          name: string
        }
      }

      // User with profile
      const userWithProfile: User = { id: 1, profile: { name: 'John' } }
      const okResult = ok<User, string>(userWithProfile)

      const res1 = okResult.flatMapMaybe(
        (user: User) => maybe(user.profile),
        'Profile not found'
      )

      expect(res1.isOk()).toEqual(true)
      expect(res1.unwrap().name).toEqual('John')

      // User without profile
      const userWithoutProfile: User = { id: 2 }
      const okResult2 = ok<User, string>(userWithoutProfile)

      const res2 = okResult2.flatMapMaybe(
        (user: User) => maybe(user.profile),
        'Profile not found'
      )

      expect(res2.isFail()).toEqual(true)
      expect(res2.unwrapFail()).toEqual('Profile not found')
    })
  })
})
