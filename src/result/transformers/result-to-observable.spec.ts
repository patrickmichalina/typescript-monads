import { fail, ok } from '../result.factory'
import { resultToObservable } from './result-to-observable'

describe(resultToObservable.name, () => {
  it('should be ok', done => {
    const result = ok<string, Error>('hello')
    const sut = resultToObservable(result)

    sut
      .subscribe({
        next: v => {
          expect(v).toEqual('hello')
          done()
        },
        error: done
      })
  })

  it('should be ok', done => {
    const result = fail<string, Error>(new Error('I failed, sorry.'))
    const sut = resultToObservable(result)

    sut
      .subscribe({
        error: (v: Error) => {
          expect(v.message).toEqual('I failed, sorry.')
          done()
        },
        next: done
      })
  })
})
