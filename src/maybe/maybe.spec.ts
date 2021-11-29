import { maybe } from './public_api'
import { Maybe } from './maybe'

describe('Maybe', () => {
  describe('when returning a value with possible throw', () => {
    it('should handle "none" case', () => {
      const sut = undefined as string | undefined

      expect(() => {
        maybe(sut).valueOrThrow('A STRING VALUE IS REQUIRED')
      }).toThrowError('A STRING VALUE IS REQUIRED')
    })

    it('should handle "some" case', () => {
      const sut = 'test' as string | undefined
      const maybeAString = maybe(sut).valueOrThrow('A STRING VALUE IS REQUIRED')

      expect(maybeAString).toEqual('test')
    })
  })

  describe('when returning a value with explicit throw error', () => {
    // tslint:disable-next-line: no-class
    class UserException extends Error {
      constructor(public message = 'A STRING VALUE IS REQUIRED') {
        super(message)
      }

      public readonly customProp = '123 - extended error object'
    }

    it('should handle "none" case', () => {
      const sut = undefined as string | undefined

      expect(() => {
        maybe(sut).valueOrThrowErr(new UserException())
      }).toThrowError('A STRING VALUE IS REQUIRED')

      expect(() => {
        maybe(sut).valueOrThrowErr()
      }).toThrowError('')

    })

    it('should handle "some" case', () => {
      const sut = 'test' as string | undefined
      const maybeAString = maybe(sut).valueOrThrowErr(new UserException('A STRING VALUE IS REQUIRED'))

      expect(maybeAString).toEqual('test')
    })
  })

  describe('when returning a value by default', () => {
    it('should handle "none" case', () => {
      const sut = undefined as string | undefined
      const maybeAString = maybe(sut).valueOr('default output')

      expect(maybeAString).toEqual('default output')
    })

    it('should handle "some" case', () => {
      const sut = 'actual input' as string | undefined
      const maybeAString = maybe(sut).valueOr('default output')

      expect(maybeAString).toEqual('actual input')
    })

    it('should handle "some" case when input is null', () => {
      const sut: string | null = null
      const maybeAString = maybe<string>(sut).valueOr('default output')

      expect(maybeAString).toEqual('default output')
    })

    it('should handle "some" case when input is ""', () => {
      const sut: string | undefined | null = ''
      const maybeAString = maybe(sut).valueOr('fallback')

      expect(maybeAString).toEqual('')
    })

    it('should handle "some" case when input is 0', () => {
      const sut = 0 as number | undefined | null
      const maybeAString = maybe(sut).valueOr(10)

      expect(maybeAString).toEqual(0)
    })
  })

  describe('when returning a value by computation', () => {
    it('should handle "none" case', () => {
      const sut = undefined as string | undefined
      const maybeAString = maybe(sut).valueOrCompute(() => 'default output')

      expect(maybeAString).toEqual('default output')
    })

    it('should handle "some" case', () => {
      const sut: string | undefined = 'actual input'
      const maybeAString = maybe(sut).valueOrCompute(() => 'default output')

      expect(maybeAString).toEqual('actual input')
    })

    it('should handle "some" case when input is null', () => {
      const sut = null as string | null
      const maybeAString = maybe(sut).valueOrCompute(() => 'fallback')

      expect(maybeAString).toEqual('fallback')
    })

    it('should handle "some" case when input is ""', () => {
      const sut = '' as string | undefined
      const maybeAString = maybe(sut).valueOrCompute(() => 'fallback')

      expect(maybeAString).toEqual('')
    })

    it('should handle "some" case when input is 0', () => {
      const sut = 0 as number | undefined
      const maybeAString = maybe(sut).valueOrCompute(() => 10)

      expect(maybeAString).toEqual(0)
    })
  })

  describe('when returning from a match operation', () => {
    it('should handle "none" case', () => {
      const sut = undefined as string | undefined
      const maybeAMappedString = maybe(sut)
        .match({
          none: () => 'fallback',
          some: _original => _original
        })

      expect(maybeAMappedString).toEqual('fallback')
    })

    it('should handle "some" case', () => {
      const sut = 'existing value' as string | undefined
      const maybeAMappedString = maybe(sut)
        .match({
          none: () => 'fallback',
          some: _original => _original
        })

      expect(maybeAMappedString).toEqual('existing value')
    })
  })

  describe('when performing side-effect operations', () => {
    it('should handle "none" case', () => {
      let sideEffectStore = ''
      const sut = undefined as string | undefined

      maybe(sut)
        .tap({
          none: () => {
            sideEffectStore = 'hit none'
          },
          some: () => undefined
        })

      expect(sideEffectStore).toEqual('hit none')
    })

    it('should handle "some" case', () => {
      let sideEffectStore = ''
      const sut = 'existing value' as string | undefined

      maybe(sut)
        .tap({
          none: () => undefined,
          some: original => {
            sideEffectStore = original
          }
        })

      expect(sideEffectStore).toEqual('existing value')
    })
  })

  describe('when mapping', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function getUserService<T>(testReturn: any): T {
      return testReturn
    }

    it('should handle valid input', () => {
      const sut = 'initial input' as string | undefined

      const maybeSomeString = maybe(sut)
        .map(() => getUserService<string>('initial input mapped'))
        .valueOr('fallback')

      const maybeNotSomeSomeString = maybe(sut)
        .map(() => getUserService<string>(undefined))
        .valueOr('fallback')

      const maybeNotSomeSome2 = maybe(sut)
        .map(() => getUserService<string>(0))
        .valueOr('fallback')

      const maybeNotSomeSome3 = maybe(sut)
        .map(() => 'sut')
        .valueOr('fallback')

      expect(maybeSomeString).toEqual('initial input mapped')
      expect(maybeNotSomeSomeString).toEqual('fallback')
      expect(maybeNotSomeSome2).toEqual(0)
      expect(maybeNotSomeSome3).toEqual('sut')
    })

    it('should handle undefined input', () => {
      const sut = undefined as string | undefined

      const maybeSomeString = maybe(sut)
        .map(() => getUserService<string>('initial input mapped'))
        .valueOr('fallback')

      const maybeNotSomeSomeString = maybe(sut)
        .map(() => getUserService<string>(undefined))
        .valueOr('fallback')

      const maybeNotSomeSome2 = maybe(sut)
        .map(() => getUserService<string>(0))
        .valueOr('fallback')
      const maybeNotSomeSome3 = maybe(sut)
        .map(() => getUserService<string>(''))
        .valueOr('fallback')

      expect(maybeSomeString).toEqual('fallback')
      expect(maybeNotSomeSomeString).toEqual('fallback')
      expect(maybeNotSomeSome2).toEqual('fallback')
      expect(maybeNotSomeSome3).toEqual('fallback')
    })

    it('should handle input of 0', () => {
      const sut = 0 as number | undefined

      const maybeSomeString = maybe(sut)
        .map(() => getUserService<string>('initial input mapped'))
        .valueOr('fallback')

      const maybeNotSomeSomeString = maybe(sut)
        .map(() => getUserService<string>(undefined))
        .valueOr('fallback')

      const maybeNotSomeSome2 = maybe(sut)
        .map(() => getUserService<string>(0))
        .valueOr('fallback')
      const maybeNotSomeSome3 = maybe(sut)
        .map(() => getUserService<string>(''))
        .valueOr('fallback')

      expect(maybeSomeString).toEqual('initial input mapped')
      expect(maybeNotSomeSomeString).toEqual('fallback')
      expect(maybeNotSomeSome2).toEqual(0)
      expect(maybeNotSomeSome3).toEqual('')
    })

    it('should handle input of ""', () => {
      const sut = '' as string | undefined

      const maybeSomeString = maybe(sut)
        .map(() => getUserService<string>('initial input mapped'))
        .valueOr('fallback')

      const maybeNotSomeSomeString = maybe(sut)
        .map(() => getUserService<string>(undefined))
        .valueOr('fallback')

      const maybeNotSomeSome2 = maybe(sut)
        .map(() => getUserService<string>(0))
        .valueOr('fallback')
      const maybeNotSomeSome3 = maybe(sut)
        .map(() => getUserService<string>(''))
        .valueOr('fallback')

      expect(maybeSomeString).toEqual('initial input mapped')
      expect(maybeNotSomeSomeString).toEqual('fallback')
      expect(maybeNotSomeSome2).toEqual(0)
      expect(maybeNotSomeSome3).toEqual('')
    })
  })

  describe('when flatMapping', () => {
    it('should handle "none" case', () => {
      const sut = undefined as string | undefined
      const nsut = undefined as number | undefined

      const maybeSomeNumber = maybe(sut)
        .flatMap(() => maybe(nsut))
        .valueOr(1)

      expect(maybeSomeNumber).toEqual(1)
    })

    it('should handle "some" case', () => {
      const sut = 'initial' as string | undefined
      const nsut = 20 as number | undefined

      const maybeSomeNumber = maybe(sut)
        .flatMap(() => maybe(nsut))
        .valueOr(0)

      expect(maybeSomeNumber).toEqual(20)
    })
  })

  describe('when getting monadic unit', () => {
    it('should get value', () => {
      const sut = undefined as string | undefined

      const maybeSomeNumber = maybe(sut)
        .of('ok')
        .valueOr('fail')

      expect(maybeSomeNumber).toEqual('ok')
    })
  })

  describe('when tapSome', () => {
    it('should work', () => {
      const sut = 'abc' as string | undefined

      expect.assertions(1)
      maybe(sut).tapSome(a => expect(a).toEqual('abc'))
      maybe(sut).tapNone(() => expect(1).toEqual(1))
    })
  })

  describe('when tapNone', () => {
    it('should work', () => {
      const sut = undefined as string | undefined

      expect.assertions(1)
      maybe(sut).tapNone(() => expect(1).toEqual(1))
      maybe(sut).tapSome(() => expect(1).toEqual(1))
    })
  })

  describe('when filtering', () => {
    it('pass value through if predicate is resolves true', () => {
      const thing: { readonly isGreen: boolean } | undefined = { isGreen: true }

      expect.assertions(1)
      maybe(thing)
        .filter(a => a.isGreen === true)
        .tap({
          some: _thing => expect(_thing).toEqual(thing),
          none: () => expect(1).toEqual(1)
        })
    })

    it('should not pass value through if predicate is resolves false', () => {
      const thing: { readonly isGreen: boolean } | undefined = { isGreen: false }

      expect.assertions(1)
      maybe(thing)
        .filter(a => a.isGreen === true)
        .tap({
          some: () => expect(true).toBe(false),
          none: () => expect(1).toEqual(1)
        })
    })

    it('should handle undefineds correctly', () => {
      const thing = undefined as { readonly isGreen: boolean } | undefined

      expect.assertions(1)
      maybe(thing)
        .filter(a => a.isGreen === true)
        .tap({
          some: () => expect(true).toBe(false),
          none: () => expect(1).toEqual(1)
        })
    })
  })

  describe('when returning a value or undefined', () => {
    it('should handle "none" case', () => {
      const sut = undefined as string | undefined
      const maybeAString = maybe(sut).valueOrUndefined()

      expect(maybeAString).toBeUndefined()
    })

    it('should handle "some" case', () => {
      const sut = 'actual input' as string | undefined
      const maybeAString = maybe(sut).valueOrUndefined()

      expect(maybeAString).toEqual('actual input')
    })
  })

  describe('when returning a value or null', () => {
    it('should handle "none" case', () => {
      const sut = undefined as string | undefined
      const maybeAString = maybe(sut).valueOrNull()

      expect(maybeAString).toBeNull()
    })

    it('should handle "some" case', () => {
      const sut = 'actual input' as string | undefined
      const maybeAString = maybe(sut).valueOrNull()

      expect(maybeAString).toEqual('actual input')
    })
  })

  describe('when returning an array', () => {
    it('should handle "none" case', () => {
      const sut = undefined as string | undefined
      const maybeThing = maybe(sut).toArray()

      expect(maybeThing).toHaveLength(0)
      expect(maybeThing).toEqual([])
    })

    it('should handle "some" case', () => {
      const sut = 'actual input' as string | undefined
      const maybeThing = maybe(sut).toArray()

      expect(maybeThing).toHaveLength(1)
      expect(maybeThing).toEqual(['actual input'])
    })

    it('should handle "some" case existing array', () => {
      const sut = ['actual input'] as ReadonlyArray<string> | undefined
      const maybeThing = maybe(sut).toArray()

      expect(maybeThing).toHaveLength(1)
      expect(maybeThing).toEqual(['actual input'])
    })
  })

  describe('flatMapAuto', () => {
    it('should flatMapAuto', () => {
      const sut = {
        thing: undefined
      } as { readonly thing: string | undefined } | undefined

      const maybeAString = maybe(sut)
        .flatMapAuto(a => a.thing)
        .valueOrUndefined()

      expect(maybeAString).toBeUndefined()
    })

    it('should flatMapAuto inner', () => {
      const sut = {
        thing: 'testval'
      } as { readonly thing: string | undefined } | undefined

      const maybeAString = maybe(sut)
        .flatMapAuto(a => a.thing)
        .map(a => a + 1)
        .valueOrUndefined()

      expect(maybeAString).toEqual('testval1')
    })

    it('should flatMapAuto with intial input as empty', () => {
      const sut = undefined as { readonly thing: string | undefined } | undefined

      const maybeAString = maybe(sut)
        .flatMapAuto(a => a.thing)
        .map(a => a + 1)
        .valueOrUndefined()

      expect(maybeAString).toBeUndefined()
    })

    it('should be nonnullable value outlet', () => {
      const imgWidth = maybe('url.com')
        .flatMapAuto(imgUrl => /width=[0-9]*/.exec(imgUrl))
        .flatMapAuto(a => a[0].split('=')[1])
        .map(a => +a)
        .valueOr(0)

      expect(imgWidth).toEqual(0)
    })

  })

  describe('isSome', () => {
    it('false path', () => {
      const sut = undefined as boolean | undefined
      const sut2 = null as boolean | null

      expect(maybe(sut).isSome()).toEqual(false)
      expect(maybe(sut2).isSome()).toEqual(false)
    })

    it('true path', () => {
      const sut = 'test' as string | undefined
      const sut2 = 2 as number | undefined
      const sut3 = false as boolean

      expect(maybe(sut).isSome()).toEqual(true)
      expect(maybe(sut2).isSome()).toEqual(true)
      expect(maybe(sut3).isSome()).toEqual(true)
      expect(maybe(sut).map(a => `${a}_1`).isSome()).toEqual(true)
    })
  })

  describe('isNone', () => {
    it('true path', () => {
      const sut = undefined as boolean | undefined
      const sut2 = null as boolean | null

      expect(maybe(sut).isNone()).toEqual(true)
      expect(maybe(sut2).isNone()).toEqual(true)
    })

    it('false path', () => {
      const sut = 'test' as string | undefined
      const sut2 = 2 as number | undefined
      const sut3 = true as boolean | undefined

      expect(maybe(sut).isNone()).toEqual(false)
      expect(maybe(sut2).isNone()).toEqual(false)
      expect(maybe(sut3).isNone()).toEqual(false)
    })
  })

  describe('apply', () => {
    it('should apply the IMaybe<function>', () => {
      const a = maybe((a: number) => a * 2)
      const b = maybe(5)

      expect(a.apply(b).valueOrThrow()).toBe(10)
    })

    it('should apply the non-function maybe', () => {
      const a = maybe(2)
      const b = maybe(5)

      expect(a.apply(b).valueOrThrow()).toBe(5)
    })
  })

  describe('static', () => {
    it('should return new maybe with some', () => {
      expect(Maybe.some(1).valueOrThrowErr()).toEqual(1)
    })
  })

  describe('mapTo', () => {
    it('should return new maybe with some', () => {
      expect(Maybe.some(1).mapTo('deltaforce').valueOrThrowErr()).toEqual('deltaforce')
      expect(Maybe.none().mapTo('deltaforce').valueOrNull()).toEqual(null)
    })
  })

  describe('toResult', () => {
    it('should return result object with success', () => {
      const hasSome = maybe('hi')
      const sut = hasSome.toResult(new Error('oops'))
      
      expect(sut.unwrap()).toEqual('hi')
    })

    it('should return result object with fail', () => {
      const hasSome = maybe()
      const sut = hasSome.toResult(new Error('oops'))

      expect(sut.unwrapFail()).toEqual(new Error('oops'))
    })
  })

  describe('when async mapping', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function getUserService<T>(testReturn: any): Promise<T> {
      return testReturn
    }

    it('should handle valid input', (done) => {
      const sut = 'initial input' as string | undefined

      const maybeSomeString = maybe(sut)
        .mapAsync(() => getUserService<string>('initial input mapped'))
        .then(result => result.valueOr('fallback'))
        .then(final => expect(final).toEqual('initial input mapped'))

      const maybeNotSomeSomeString = maybe(sut)
        .mapAsync(() => getUserService<string>(undefined))
        .then(result => result.valueOr('fallback'))
        .then(final => expect(final).toEqual('fallback'))

      const maybeNotSomeSome2 = maybe(sut)
        .mapAsync(() => getUserService<string>(0))
        .then(result => result.valueOr('fallback'))
        .then(final => expect(final).toEqual(0))

      const maybeNotSomeSome3 = maybe(sut)
        .mapAsync(() => Promise.resolve('sut'))
        .then(result => result.valueOr('fallback'))
        .then(final => expect(final).toEqual('sut'))
      
      Promise.all([maybeSomeString, maybeNotSomeSome2, maybeNotSomeSomeString, maybeNotSomeSome3])
        .then(() => done())  // eslint-disable-line promise/no-callback-in-promise
        .catch(e => expect(e).toBeUndefined())
    })

    it('should handle undefined input', (done) => {
      const sut = undefined as string | undefined

      const maybeSomeString = maybe(sut)
        .mapAsync(() => getUserService<string>('initial input mapped'))
        .then(result => result.valueOr('fallback'))
        .then(final => expect(final).toEqual('fallback'))

      const maybeNotSomeSomeString = maybe(sut)
        .mapAsync(() => getUserService<string>(undefined))
        .then(result => result.valueOr('fallback'))
        .then(final => expect(final).toEqual('fallback'))

      const maybeNotSomeSome2 = maybe(sut)
        .mapAsync(() => getUserService<string>(0))
        .then(result => result.valueOr('fallback'))
        .then(final => expect(final).toEqual('fallback'))

      const maybeNotSomeSome3 = maybe(sut)
        .mapAsync(() => getUserService<string>(''))
        .then(result => result.valueOr('fallback'))
        .then(final => expect(final).toEqual('fallback'))

      Promise.all([maybeSomeString, maybeNotSomeSome2, maybeNotSomeSomeString, maybeNotSomeSome3])
        .then(() => done())  // eslint-disable-line promise/no-callback-in-promise
        .catch(e => expect(e).toBeUndefined())
    })

    it('should handle input of 0', (done) => {
      const sut = 0 as number | undefined

      const maybeSomeString = maybe(sut)
        .mapAsync(() => getUserService<string>('initial input mapped'))
        .then(result => result.valueOr('fallback'))
        .then(final => expect(final).toEqual('initial input mapped'))

      const maybeNotSomeSomeString = maybe(sut)
        .mapAsync(() => getUserService<string>(undefined))
        .then(result => result.valueOr('fallback'))
        .then(final => expect(final).toEqual('fallback'))

      const maybeNotSomeSome2 = maybe(sut)
        .mapAsync(() => getUserService<string>(0))
        .then(result => result.valueOr('fallback'))
        .then(final => expect(final).toEqual(0))

      const maybeNotSomeSome3 = maybe(sut)
        .mapAsync(() => getUserService<string>(''))
        .then(result => result.valueOr('fallback'))
        .then(final => expect(final).toEqual(''))

      Promise.all([maybeSomeString, maybeNotSomeSome2, maybeNotSomeSomeString, maybeNotSomeSome3])
        .then(() => done())  // eslint-disable-line promise/no-callback-in-promise
        .catch(e => expect(e).toBeUndefined())
    })

    it('should handle input of ""', (done) => {
      const sut = '' as string | undefined

      const maybeSomeString = maybe(sut)
        .mapAsync(() => getUserService<string>('initial input mapped'))
        .then(result => result.valueOr('fallback'))
        .then(final => expect(final).toEqual('initial input mapped'))

      const maybeNotSomeSomeString = maybe(sut)
        .mapAsync(() => getUserService<string>(undefined))
        .then(result => result.valueOr('fallback'))
        .then(final => expect(final).toEqual('fallback'))

      const maybeNotSomeSome2 = maybe(sut)
        .mapAsync(() => getUserService<string>(0))
        .then(result => result.valueOr('fallback'))
        .then(final => expect(final).toEqual(0))
      const maybeNotSomeSome3 = maybe(sut)
        .mapAsync(() => getUserService<string>(''))
        .then(result => result.valueOr('fallback'))
        .then(final => expect(final).toEqual(''))

      Promise.all([maybeSomeString, maybeNotSomeSome2, maybeNotSomeSomeString, maybeNotSomeSome3])
        .then(() => done())  // eslint-disable-line promise/no-callback-in-promise
        .catch(e => expect(e).toBeUndefined())
    })
  })

  describe('when async flatMapping', () => {
    it('should handle "none" case', (done) => {
      const sut = undefined as string | undefined
      const nsut = undefined as number | undefined

      maybe(sut)
        .flatMapAsync(() => Promise.resolve(maybe(nsut)))
        .then(result => result.valueOr(1))
        .then(final => expect(final).toEqual(1))
        .then(() => done())  // eslint-disable-line promise/no-callback-in-promise
        .catch(e => expect(e).toBeUndefined())
    })

    it('should handle "some" case', (done) => {
      const sut = 'initial' as string | undefined
      const nsut = 20 as number | undefined

      maybe(sut)
        .flatMapAsync(() => Promise.resolve(maybe(nsut)))
        .then(result => result.valueOr(0))
        .then(final => expect(final).toEqual(20))
        .then(() => done())  // eslint-disable-line promise/no-callback-in-promise
        .catch(e => expect(e).toBeUndefined())
    })
  })
})
