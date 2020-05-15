import { IMaybe } from './maybe.interface'
import { maybeToPromise } from './maybe.transformers'
import { maybe } from './public_api'

describe('maybeToPromise', () => {
  it('should flatmap', () => {
    const sut = new Promise<IMaybe<string>>((a, b) => a(maybe('test')))

    sut
      .then(maybeToPromise())
      .then(result => expect(result).toEqual('test'))
      .catch(_shouldNotBeHere => expect(false).toBe(true))
  })

  it('should catch w/ default message', () => {
    const sut = new Promise<IMaybe<string>>((a, b) => a(maybe()))

    sut
      .then(maybeToPromise())
      .then(_shouldNotBeHere => expect(false).toBe(true))
      .catch(error => expect(error).toEqual('not found'))
  })

  it('should catch w/ custom message', () => {
    const sut = new Promise<IMaybe<string>>((a, b) => a(maybe()))

    sut
      .then(maybeToPromise('err'))
      .then(_shouldNotBeHere => expect(false).toBe(true))
      .catch(error => expect(error).toEqual('err'))
  })
})