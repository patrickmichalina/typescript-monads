import { maybe } from "../../src"

describe('Maybe', () => {
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
      const sut = null as string | undefined | null
      const maybeAString = maybe(sut).valueOr('default output')

      expect(maybeAString).toEqual('default output')
    })

    it('should handle "some" case when input is ""', () => {
      const sut = '' as string | undefined | null
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
      // tslint:disable-next-line:no-let
      let sideEffectStore = ''
      const sut = undefined as string | undefined

      maybe(sut)
        .tap({
          none: () => {
            sideEffectStore = 'hit none'
          },
          some: _original => undefined
        })

      expect(sideEffectStore).toEqual('hit none')
    })

    it('should handle "some" case', () => {
      // tslint:disable-next-line:no-let
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
    function getUserService<T>(testReturn: any): T {
      return testReturn
    }

    it('should handle valid input', () => {
      const sut = 'initial input' as string | undefined

      const maybeSomeString = maybe(sut)
        .map(_str => getUserService<string>('initial input mapped'))
        .valueOr('fallback')

      const maybeNotSomeSomeString = maybe(sut)
        .map(_str => getUserService<string>(undefined))
        .valueOr('fallback')

      const maybeNotSomeSome2 = maybe(sut)
        .map(_str => getUserService<string>(0))
        .valueOr('fallback')
      const maybeNotSomeSome3 = maybe(sut)
        .map(_str => getUserService<string>(''))
        .valueOr('fallback')

      expect(maybeSomeString).toEqual('initial input mapped')
      expect(maybeNotSomeSomeString).toEqual('fallback')
      expect(maybeNotSomeSome2).toEqual(0)
      expect(maybeNotSomeSome3).toEqual('')
    })

    it('should handle undefined input', () => {
      const sut = undefined as string | undefined

      const maybeSomeString = maybe(sut)
        .map(_str => getUserService<string>('initial input mapped'))
        .valueOr('fallback')

      const maybeNotSomeSomeString = maybe(sut)
        .map(_str => getUserService<string>(undefined))
        .valueOr('fallback')

      const maybeNotSomeSome2 = maybe(sut)
        .map(_str => getUserService<string>(0))
        .valueOr('fallback')
      const maybeNotSomeSome3 = maybe(sut)
        .map(_str => getUserService<string>(''))
        .valueOr('fallback')

      expect(maybeSomeString).toEqual('fallback')
      expect(maybeNotSomeSomeString).toEqual('fallback')
      expect(maybeNotSomeSome2).toEqual('fallback')
      expect(maybeNotSomeSome3).toEqual('fallback')
    })

    it('should handle input of 0', () => {
      const sut = 0 as number | undefined

      const maybeSomeString = maybe(sut)
        .map(_str => getUserService<string>('initial input mapped'))
        .valueOr('fallback')

      const maybeNotSomeSomeString = maybe(sut)
        .map(_str => getUserService<string>(undefined))
        .valueOr('fallback')

      const maybeNotSomeSome2 = maybe(sut)
        .map(_str => getUserService<string>(0))
        .valueOr('fallback')
      const maybeNotSomeSome3 = maybe(sut)
        .map(_str => getUserService<string>(''))
        .valueOr('fallback')

      expect(maybeSomeString).toEqual('initial input mapped')
      expect(maybeNotSomeSomeString).toEqual('fallback')
      expect(maybeNotSomeSome2).toEqual(0)
      expect(maybeNotSomeSome3).toEqual('')
    })

    it('should handle input of ""', () => {
      const sut = '' as string | undefined

      const maybeSomeString = maybe(sut)
        .map(_str => getUserService<string>('initial input mapped'))
        .valueOr('fallback')

      const maybeNotSomeSomeString = maybe(sut)
        .map(_str => getUserService<string>(undefined))
        .valueOr('fallback')

      const maybeNotSomeSome2 = maybe(sut)
        .map(_str => getUserService<string>(0))
        .valueOr('fallback')
      const maybeNotSomeSome3 = maybe(sut)
        .map(_str => getUserService<string>(''))
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
          some: _thing => expect(true).toBe(false),
          none: () => expect(1).toEqual(1)
        })
    })

    it('should handle undefineds correctly', () => {
      const thing = undefined as { readonly isGreen: boolean } | undefined

      expect.assertions(1)
      maybe(thing)
        .filter(a => a.isGreen === true)
        .tap({
          some: _thing => expect(true).toBe(false),
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

  describe('when returning an array', () => {
    it('should handle "none" case', () => {
      const sut = undefined as string | undefined
      const maybeThing = maybe(sut).toArray()

      expect(maybeThing).toHaveLength(1)
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
})
