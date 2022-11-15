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

  it('should catch with error mapping function', done => {
    function someThrowable(): string {
      throw new Error('I failed!')
    }

    class CustomError extends Error {
      static fromUnknown(err: unknown): CustomError {
        if (err instanceof Error) {
          return new CustomError(err.message)
        }
        return new CustomError('new error')
      }
      constructor(message?: string) {
        super(message)
      }
    }

    const sut = catchResult(someThrowable, CustomError.fromUnknown)

    expect(sut.isFail()).toEqual(true)
    expect(sut.unwrapFail().message).toEqual('I failed!')

    done()
  })
})
