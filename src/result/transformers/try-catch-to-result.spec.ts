import { catchResult } from './try-catch-to-result'

describe(catchResult.name, () => {
  it('should try', done => {
    function someThrowable(): string {
      return 'I worked!'
    }

    const sut = catchResult(someThrowable)

    expect(sut.isOk()).toEqual(true)
    expect(sut.unwrap()).toEqual('I worked!')

    done()
  })

  it('should catch', done => {
    function someThrowable(): string {
      throw new Error('I failed!')
    }

    const sut = catchResult(someThrowable)

    expect(sut.isFail()).toEqual(true)

    done()
  })
})
