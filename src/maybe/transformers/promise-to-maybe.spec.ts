import { promiseToMaybe } from './promise-to-maybe'
import { maybe } from '../maybe.factory'
import { Maybe } from '../maybe'

describe('promiseToMaybe', () => {
  it('should create a Some from a resolved promise', (done) => {
    promiseToMaybe(Promise.resolve('test'))
      .then(result => {
        expect(result.isSome()).toBe(true)
        expect(result.valueOr('default')).toBe('test')
        done()
      })
  })

  it('should create a None from a rejected promise', (done) => {
    promiseToMaybe(Promise.reject(new Error('error')))
      .then(result => {
        expect(result.isNone()).toBe(true)
        done()
      })
  })

  it('should create a None from a promise that resolves to null', (done) => {
    promiseToMaybe(Promise.resolve(null))
      .then(result => {
        expect(result.isNone()).toBe(true)
        done()
      })
  })

  it('should create a None from a promise that resolves to undefined', (done) => {
    promiseToMaybe(Promise.resolve(undefined))
      .then(result => {
        expect(result.isNone()).toBe(true)
        done()
      })
  })

  it('should work with Maybe.flatMapPromise', (done) => {
    interface User { name: string }
    
    const fetchUser = (id: number) => Promise.resolve(id === 1 ? { name: 'User' } : null)
    maybe(1).flatMapPromise(fetchUser)
      .then(result => {
        expect(result.isSome()).toBe(true)
        
        // Type assertion to help TypeScript
        const user = result.valueOr({ name: 'default' } as User)
        expect(user.name).toBe('User')
        done()
      })
  })

  it('should create None from Maybe.flatMapPromise when promise rejects', (done) => {
    const fetchUser = () => Promise.reject(new Error('error'))
    maybe(1).flatMapPromise(fetchUser)
      .then(result => {
        expect(result.isNone()).toBe(true)
        done()
      })
  })

  it('should create None from Maybe.flatMapPromise when initial Maybe is None', (done) => {
    const fetchUser = () => Promise.resolve({ name: 'User' })
    maybe<number>().flatMapPromise(fetchUser)
      .then(result => {
        expect(result.isNone()).toBe(true)
        done()
      })
  })

  it('should work with Maybe.fromPromise', (done) => {
    interface User { name: string }
    
    const fetchUser = () => Promise.resolve({ name: 'User' })
    Maybe.fromPromise(fetchUser())
      .then(result => {
        expect(result.isSome()).toBe(true)
        
        // Type assertion to help TypeScript
        const user = result.valueOr({ name: 'default' } as User)
        expect(user.name).toBe('User')
        done()
      })
  })
})