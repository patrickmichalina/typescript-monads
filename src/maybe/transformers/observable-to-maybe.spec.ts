import { observableToMaybe } from './observable-to-maybe'
import { maybe } from '../maybe.factory'
import { of, EMPTY, throwError } from 'rxjs'
import { Maybe } from '../maybe'

describe('observableToMaybe', () => {
  it('should create a Some from an observable that emits a value', (done) => {
    observableToMaybe(of('test'))
      .then(result => {
        expect(result.isSome()).toBe(true)
        expect(result.valueOr('default')).toBe('test')
        done()
      })
  })

  it('should create a None from an observable that completes without emitting', (done) => {
    observableToMaybe(EMPTY)
      .then(result => {
        expect(result.isNone()).toBe(true)
        done()
      })
  })

  it('should create a None from an observable that errors', (done) => {
    const errorObservable = throwError(() => new Error('error'))
    observableToMaybe(errorObservable)
      .then(result => {
        expect(result.isNone()).toBe(true)
        done()
      })
  })

  it('should create a None from an observable that emits null', (done) => {
    observableToMaybe(of(null))
      .then(result => {
        expect(result.isNone()).toBe(true)
        done()
      })
  })

  it('should create a None from an observable that emits undefined', (done) => {
    observableToMaybe(of(undefined))
      .then(result => {
        expect(result.isNone()).toBe(true)
        done()
      })
  })

  it('should work with Maybe.flatMapObservable', (done) => {
    interface User { name: string }
    
    const getUser = (id: number) => of(id === 1 ? { name: 'User' } : null)
    maybe(1).flatMapObservable(getUser)
      .then(result => {
        expect(result.isSome()).toBe(true)
        
        // Type assertion to help TypeScript
        const user = result.valueOr({ name: 'default' } as User)
        expect(user.name).toBe('User')
        done()
      })
  })

  it('should create None from Maybe.flatMapObservable when observable errors', (done) => {
    const getUser = () => throwError(() => new Error('error'))
    maybe(1).flatMapObservable(getUser)
      .then(result => {
        expect(result.isNone()).toBe(true)
        done()
      })
  })

  it('should create None from Maybe.flatMapObservable when initial Maybe is None', (done) => {
    const getUser = () => of({ name: 'User' })
    maybe<number>().flatMapObservable(getUser)
      .then(result => {
        expect(result.isNone()).toBe(true)
        done()
      })
  })

  it('should work with Maybe.fromObservable', (done) => {
    interface User { name: string }
    
    const getUser = () => of({ name: 'User' })
    Maybe.fromObservable(getUser())
      .then(result => {
        expect(result.isSome()).toBe(true)
        
        // Type assertion to help TypeScript
        const user = result.valueOr({ name: 'default' } as User)
        expect(user.name).toBe('User')
        done()
      })
  })
})