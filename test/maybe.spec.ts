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
  })

  describe('when returning from a map operation', () => {
    it('should handle "none" case', () => {
      const sut: string | undefined = undefined
      const maybeAMappedString = maybe(sut)
        .map({
          none: () => 'fallback',
          some: _original => _original
        })

      expect(maybeAMappedString).toEqual('fallback')
    })

    it('should handle "some" case', () => {
      const sut: string | undefined = 'existing value'
      const maybeAMappedString = maybe(sut)
        .map({
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
        .do({
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
        .do({
          none: () => undefined,
          some: original => {
            sideEffectStore = original
          }
        })

      expect(sideEffectStore).toEqual('existing value')
    })
  })

  describe('when binding', () => {
    it('should handle "none" case', () => {
      const sut: string | undefined = undefined
      const nsut: number | undefined = undefined
      
      const maybeSomeNumber = maybe(sut)
        .bind(() => maybe(nsut))
        .valueOr(1)

      expect(maybeSomeNumber).toEqual(1)
    })

    it('should handle "some" case', () => {
      const sut: string | undefined = 'initial'
      const nsut: number | undefined = 20
      
      const maybeSomeNumber = maybe(sut)
        .bind(() => maybe(nsut))
        .valueOr(0)

      expect(maybeSomeNumber).toEqual(20)
    })
  })
})

