import { IMaybe } from '../maybe.interface'
import { maybeToPromise } from './maybe-to-promise'
import { maybe } from '../public_api'

describe('maybeToPromise', () => {
  it('should flatmap', () => {
    const sut = new Promise<IMaybe<string>>(resolve => resolve(maybe('test')))

    sut
      .then(maybeToPromise())
      .then(result => expect(result).toEqual('test'))
      .catch(() => expect(false).toBe(true))
  })

  it('should catch w/ empty message', () => {
    const sut = new Promise<IMaybe<string>>(resolve => resolve(maybe()))

    sut
      .then(maybeToPromise())
      .then(() => expect(false).toBe(true))
      .catch(error => expect(error).toBeUndefined())
  })

  it('should catch w/ custom message', () => {
    const sut = new Promise<IMaybe<string>>(resolve => resolve(maybe()))

    sut
      .then(maybeToPromise('caught!'))
      .then(() => expect(false).toBe(true))
      .catch(error => expect(error).toEqual('caught!'))
  })

  it('should catch w/ custom object', () => {
    const sut = new Promise<IMaybe<string>>(resolve => resolve(maybe()))

    sut
      .then(maybeToPromise({ error: { msg: 'test' } }))
      .then(() => expect(false).toBe(true))
      .catch(error => expect(error).toEqual({ error: { msg: 'test' } }))
  })
})
