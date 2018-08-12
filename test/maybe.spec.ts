import { maybe } from "../src/maybe"

describe('Maybe', () => {
  describe('when returning a value by default', () => {
    it('should handle "none" case', () => {
      const sut: string | undefined = undefined
      const maybeAString = maybe(sut).valueOr('default output')

      expect(maybeAString).toEqual('default output')
    })

    it('should handle "some" case', () => {
      const sut: string | undefined = 'actual input'
      const maybeAString = maybe(sut).valueOr('default output')

      expect(maybeAString).toEqual('actual input')
    })

    it('should handle "some" case when input is null', () => {
      const sut: string | undefined | null = null
      const maybeAString = maybe(sut).valueOr('default output')

      expect(maybeAString).toEqual('default output')
    })

    it('should handle "some" case when input is ""', () => {
      const sut: string | undefined | null = ''
      const maybeAString = maybe(sut).valueOr('fallback')

      expect(maybeAString).toEqual('')
    })

    it('should handle "some" case when input is 0', () => {
      const sut: number | undefined | null = 0
      const maybeAString = maybe(sut).valueOr(10)

      expect(maybeAString).toEqual(0)
    })
  })

  describe('when returning a value by computation', () => {
    it('should handle "none" case', () => {
      const sut: string | undefined = undefined
      const maybeAString = maybe(sut).valueOrCompute(() => 'default output')

      expect(maybeAString).toEqual('default output')
    })

    it('should handle "some" case', () => {
      const sut: string | undefined = 'actual input'
      const maybeAString = maybe(sut).valueOrCompute(() => 'default output')

      expect(maybeAString).toEqual('actual input')
    })

    it('should handle "some" case when input is null', () => {
      const sut: string | undefined = null
      const maybeAString = maybe(sut).valueOrCompute(() => 'fallback')

      expect(maybeAString).toEqual('fallback')
    })

    it('should handle "some" case when input is ""', () => {
      const sut: string | undefined = ''
      const maybeAString = maybe(sut).valueOrCompute(() => 'fallback')

      expect(maybeAString).toEqual('')
    })

    it('should handle "some" case when input is 0', () => {
      const sut: number | undefined = 0
      const maybeAString = maybe(sut).valueOrCompute(() => 10)

      expect(maybeAString).toEqual(0)
    })
  })

  describe('when returning from a match operation', () => {
    it('should handle "none" case', () => {
      const sut: string | undefined = undefined
      const maybeAMappedString = maybe(sut)
        .match({
          none: () => 'fallback',
          some: _original => _original
        })

      expect(maybeAMappedString).toEqual('fallback')
    })

    it('should handle "some" case', () => {
      const sut: string | undefined = 'existing value'
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
      let sideEffectStore: string
      const sut: string | undefined = undefined

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
      let sideEffectStore: string
      const sut: string | undefined = 'existing value'

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
      const sut: string | undefined = 'initial input'

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
      const sut: string | undefined = undefined

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
      const sut: number | undefined = 0

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
      const sut: string | undefined = ''

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
      const sut: string | undefined = undefined
      const nsut: number | undefined = undefined

      const maybeSomeNumber = maybe(sut)
        .flatMap(() => maybe(nsut))
        .valueOr(1)

      expect(maybeSomeNumber).toEqual(1)
    })

    it('should handle "some" case', () => {
      const sut: string | undefined = 'initial'
      const nsut: number | undefined = 20

      const maybeSomeNumber = maybe(sut)
        .flatMap(() => maybe(nsut))
        .valueOr(0)

      expect(maybeSomeNumber).toEqual(20)
    })
  })

  describe('when getting monadic unit', () => {
    it('should get value', () => {
      const sut: string | undefined = undefined

      const maybeSomeNumber = maybe(sut)
        .of('ok')
        .valueOr('fail')

      expect(maybeSomeNumber).toEqual('ok')
    })
  })
})

