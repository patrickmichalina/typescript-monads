import { tryPromiseToResult } from './try-promise-to-result'

describe('tryPromiseToResult', () => {
  it('should convert a resolved promise to an Ok Result', async (): Promise<void> => {
    // Arrange
    const value = { success: true, data: 'test' }
    const promise = Promise.resolve(value)
    const errorMapper = (err: unknown): { code: string; message: string } => ({ code: 'ERROR', message: String(err) })

    // Act
    const result = await tryPromiseToResult(promise, errorMapper)

    // Assert
    expect(result.isOk()).toBe(true)
    expect(result.unwrap()).toEqual(value)
  })

  it('should convert a rejected promise to a Fail Result with mapped error', async (): Promise<void> => {
    // Arrange
    const error = new Error('Test error')
    const promise = Promise.reject(error)
    const errorMapper = (err: unknown): { code: string; message: string } => ({ 
      code: 'ERR_TEST', 
      message: err instanceof Error ? err.message : String(err) 
    })

    // Act
    const result = await tryPromiseToResult(promise, errorMapper)

    // Assert
    expect(result.isFail()).toBe(true)
    expect(result.unwrapFail()).toEqual({
      code: 'ERR_TEST',
      message: 'Test error'
    })
  })

  it('should handle non-Error rejections', async (): Promise<void> => {
    // Arrange
    const promise = Promise.reject('Simple string error')
    const errorMapper = (err: unknown): { code: string; message: string } => ({ 
      code: 'ERR_SIMPLE', 
      message: String(err) 
    })

    // Act
    const result = await tryPromiseToResult(promise, errorMapper)

    // Assert
    expect(result.isFail()).toBe(true)
    expect(result.unwrapFail()).toEqual({
      code: 'ERR_SIMPLE',
      message: 'Simple string error'
    })
  })

  it('should use a custom error mapper to transform errors', async (): Promise<void> => {
    // Arrange
    const error = new Error('Permission denied')
    const promise = Promise.reject(error)
    const errorMapper = (err: unknown): { type: string; reason: string; originalError?: Error } => {
      if (err instanceof Error && err.message.includes('Permission')) {
        return {
          type: 'AuthError',
          reason: 'Insufficient privileges',
          originalError: err
        }
      }
      return {
        type: 'UnknownError',
        reason: String(err)
      }
    }

    // Act
    const result = await tryPromiseToResult(promise, errorMapper)

    // Assert
    expect(result.isFail()).toBe(true)
    expect(result.unwrapFail()).toEqual({
      type: 'AuthError',
      reason: 'Insufficient privileges',
      originalError: error
    })
  })
})
