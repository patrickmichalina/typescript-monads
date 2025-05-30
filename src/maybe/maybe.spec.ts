import { maybe, none } from './public_api'
import { Maybe } from './maybe'
import { EMPTY, of, throwError } from 'rxjs'

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

  describe('chain', () => {
    it('should', () => {
      interface TestFace { thing: number; name: string }
      const obj: TestFace = { thing: 1, name: 'string' }
      const chained = maybe(obj)
        .project(a => a.name)
        .map(a => `${a} hello`)

      expect(chained.isSome()).toEqual(true)
      expect(chained.valueOrUndefined()).toEqual('string hello')
    })

    it('should', () => {
      const obj = { thing: 1, name: 'string', obj: { initial: 'PJM' } }
      const chained = maybe(obj)
        .project(a => a.obj)
        .project(a => a.initial)
        .map(a => `Hello, ${a}`)

      expect(chained.isSome()).toEqual(true)
      expect(chained.valueOrUndefined()).toEqual('Hello, PJM')
    })

    it('should', () => {
      interface TestFace { thing: number; name: string }
      const obj: TestFace = { thing: 1, name: undefined as unknown as string }
      const chained = maybe(obj)
        .project(a => a.name)
        .project(a => a)
        .map(a => `${a} hello`)

      expect(chained.isNone()).toEqual(true)
      expect(chained.valueOrUndefined()).toBeUndefined()
    })

    it('should', () => {
      const obj = undefined as unknown as { name: string }
      const chained = maybe(obj)
        .project(a => a.name)
        .map(a => `${a} hello`)

      expect(chained.isNone()).toEqual(true)
      expect(chained.valueOrUndefined()).toBeUndefined()
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
    it('should return none in nullish cases', () => {
      const thisNone = maybe<number>()
      const fnNone = maybe<(n: number) => number>()
      const thisSome = maybe(5)
      const fnSome = maybe((a: number) => a * 2)

      expect(thisNone.apply(fnNone).isNone()).toBe(true)
      expect(thisNone.apply(fnSome).isNone()).toBe(true)
      expect(thisSome.apply(fnNone).isNone()).toBe(true)
    })

    it('should apply the IMaybe<function>', () => {
      const a = maybe(5) 
      const b = maybe((a: number) => a * 2)

      expect(a.apply(b).valueOrThrow()).toBe(10)
    })

    it('should apply none objects gracefully', () => {
      const a = maybe(2)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const b = maybe<(a: number) => number>(() => undefined as any)

      expect(a.apply(b).isNone()).toBe(true)
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

  describe('tapThruSome', () => {
    it('should tapThruSome', () => {
      // eslint-disable-next-line prefer-const
      let variable: undefined | number = undefined
      const hasSome = maybe(1)
      const sut = hasSome.tapThruSome((v) => {
        variable = v + 9
      })
      expect(sut.isSome()).toBeTruthy()
      expect(sut.valueOrThrowErr()).toEqual(1)
      expect(variable).toEqual(10)
      expect(sut).toBeInstanceOf(Maybe)
    })
  })

  describe('tapThruNone', () => {
    it('should tapThruNone', () => {
      // eslint-disable-next-line prefer-const
      let variable: undefined | string = undefined
      const hasSome = none<string>()
      const sut = hasSome.tapThruNone(() => {
        variable = 'whatever'
      })
      expect(sut.isNone()).toBeTruthy()
      expect(sut.valueOrUndefined()).toBeUndefined()
      expect(variable).toEqual('whatever')
      expect(sut).toBeInstanceOf(Maybe)
    })
  })

  describe('tapThru', () => {
    it('should tap on some ', () => {
      // eslint-disable-next-line prefer-const
      let variable: undefined | string = undefined
      const hasSome = maybe<string>('hi there')
      const sut = hasSome.tapThru({
        none: () => {},
        some: (v) => { variable = v + ' joe'}
      })
      expect(sut.isSome()).toBeTruthy()
      expect(sut.valueOrThrowErr()).toBeTruthy()
      expect(variable).toEqual('hi there joe')
      expect(sut).toBeInstanceOf(Maybe)
    })

    it('should tap on none ', () => {
      // eslint-disable-next-line prefer-const
      let variable: undefined | string = undefined
      const hasSome = none<string>()
      const sut = hasSome.tapThru({
        none: () => { variable = 'sorry joe' },
        some: (v) => { variable = v + ' joe' }
      })
      expect(sut.isNone()).toBeTruthy()
      expect(sut.valueOrUndefined()).toBeUndefined()
      expect(variable).toEqual('sorry joe')
      expect(sut).toBeInstanceOf(Maybe)
    })
  })

  describe('flatMapPromise', () => {
    it('should handle a Some value with a resolved promise', (done) => {
      const hasSome = maybe(42)
      hasSome.flatMapPromise(value => Promise.resolve(`Value: ${value}`))
        .then(result => {
          expect(result.isSome()).toBe(true)
          expect(result.valueOr('default')).toBe('Value: 42')
          done()
        })
    })

    it('should handle a Some value with a rejected promise', (done) => {
      const hasSome = maybe(42)
      hasSome.flatMapPromise(() => Promise.reject(new Error('test error')))
        .then(result => {
          expect(result.isNone()).toBe(true)
          done()
        })
    })

    it('should handle a None value', (done) => {
      const hasNone = maybe<number>()
      hasNone.flatMapPromise(value => Promise.resolve(`Value: ${value}`))
        .then(result => {
          expect(result.isNone()).toBe(true)
          done()
        })
    })
  })

  describe('flatMapObservable', () => {
    it('should handle a Some value with emitting observable', (done) => {
      const hasSome = maybe(42)
      hasSome.flatMapObservable(value => of(`Value: ${value}`))
        .then(result => {
          expect(result.isSome()).toBe(true)
          expect(result.valueOr('default')).toBe('Value: 42')
          done()
        })
    })

    it('should handle a Some value with empty observable', (done) => {
      const hasSome = maybe(42)
      hasSome.flatMapObservable(() => EMPTY)
        .then(result => {
          expect(result.isNone()).toBe(true)
          done()
        })
    })

    it('should handle a Some value with erroring observable', (done) => {
      const hasSome = maybe(42)
      hasSome.flatMapObservable(() => throwError(() => new Error('test error')))
        .then(result => {
          expect(result.isNone()).toBe(true)
          done()
        })
    })

    it('should handle a None value', (done) => {
      const hasNone = maybe<number>()
      hasNone.flatMapObservable(value => of(`Value: ${value}`))
        .then(result => {
          expect(result.isNone()).toBe(true)
          done()
        })
    })
  })
  
  describe('static methods', () => {
    it('should create a Maybe from Promise with static fromPromise', (done) => {
      Maybe.fromPromise(Promise.resolve(42))
        .then(result => {
          expect(result.isSome()).toBe(true)
          expect(result.valueOr(0)).toBe(42)
          done()
        })
    })
    
    it('should create a Maybe from Promise that rejects with static fromPromise', (done) => {
      Maybe.fromPromise(Promise.reject(new Error('error')))
        .then(result => {
          expect(result.isNone()).toBe(true)
          done()
        })
    })
    
    it('should create a Maybe from Observable with static fromObservable', (done) => {
      Maybe.fromObservable(of(42))
        .then(result => {
          expect(result.isSome()).toBe(true)
          expect(result.valueOr(0)).toBe(42)
          done()
        })
    })
    
    it('should create a Maybe from empty Observable with static fromObservable', (done) => {
      Maybe.fromObservable(EMPTY)
        .then(result => {
          expect(result.isNone()).toBe(true)
          done()
        })
    })
    
    it('should create a Maybe from erroring Observable with static fromObservable', (done) => {
      Maybe.fromObservable(throwError(() => new Error('test error')))
        .then(result => {
          expect(result.isNone()).toBe(true)
          done()
        })
    })
    
    it('should convert an array of Maybes to a Maybe of array with sequence', () => {
      const maybes = [maybe(1), maybe(2), maybe(3)]
      const result = Maybe.sequence(maybes)
      
      expect(result.isSome()).toBe(true)
      expect(result.valueOr([])).toEqual([1, 2, 3])
    })
    
    it('should return None from sequence if any Maybe is None', () => {
      const maybes = [maybe(1), maybe<number>(), maybe(3)]
      const result = Maybe.sequence(maybes)
      
      expect(result.isNone()).toBe(true)
    })
    
    it('should handle empty arrays with sequence', () => {
      const maybes: Maybe<number>[] = []
      const result = Maybe.sequence(maybes)
      
      expect(result.isSome()).toBe(true)
      expect(result.valueOr([])).toEqual([])
    })
  })
  
  describe('zipWith', () => {
    it('should combine two Some values', () => {
      const first = maybe('Hello')
      const second = maybe('World')
      
      const result = first.zipWith(second, (a, b) => `${a}, ${b}!`)
      
      expect(result.isSome()).toBe(true)
      expect(result.valueOr('default')).toBe('Hello, World!')
    })
    
    it('should return None if first value is None', () => {
      const first = maybe<string>()
      const second = maybe('World')
      
      const result = first.zipWith(second, (a, b) => `${a}, ${b}!`)
      
      expect(result.isNone()).toBe(true)
    })
    
    it('should return None if second value is None', () => {
      const first = maybe('Hello')
      const second = maybe<string>()
      
      const result = first.zipWith(second, (a, b) => `${a}, ${b}!`)
      
      expect(result.isNone()).toBe(true)
    })
    
    it('should return None if both values are None', () => {
      const first = maybe<string>()
      const second = maybe<string>()
      
      const result = first.zipWith(second, (a, b) => `${a}, ${b}!`)
      
      expect(result.isNone()).toBe(true)
    })
  })
  
  describe('flatMapMany', () => {
    it('should execute multiple promises in parallel when Some', async () => {
      const source = maybe(42)
      const result = await source.flatMapMany(val => [
        Promise.resolve(val * 2),
        Promise.resolve(val * 3),
        Promise.resolve(val * 4)
      ])
      
      expect(result.isSome()).toBe(true)
      expect(result.valueOr([])).toEqual([84, 126, 168])
    })
    
    it('should return None when initial Maybe is None', async () => {
      const source = maybe<number>()
      const result = await source.flatMapMany(val => [
        Promise.resolve(val * 2),
        Promise.resolve(val * 3)
      ])
      
      expect(result.isNone()).toBe(true)
    })
    
    it('should return None when any promise rejects', async () => {
      const source = maybe(42)
      const result = await source.flatMapMany(val => [
        Promise.resolve(val * 2),
        Promise.reject(new Error('test error')),
        Promise.resolve(val * 4)
      ])
      
      expect(result.isNone()).toBe(true)
    })
    
    it('should handle empty promise arrays', async () => {
      const source = maybe(42)
      const result = await source.flatMapMany(() => [])
      
      expect(result.isSome()).toBe(true)
      expect(result.valueOr([])).toEqual([])
    })
  })
})
