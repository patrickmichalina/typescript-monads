import { promiseToResult } from './promise-to-result'

describe('promiseToResult', () => {
  it('should convert a resolved promise to an Ok Result', async () => {
    // Arrange
    const value = { success: true, data: 'test' }
    const promise = Promise.resolve(value)

    // Act
    const result = await promiseToResult(promise)

    // Assert
    expect(result.isOk()).toBe(true)
    expect(result.unwrap()).toEqual(value)
  })

  it('should convert a rejected promise to a Fail Result', async () => {
    // Arrange
    const error = new Error('Test error')
    const promise = Promise.reject(error)

    // Act
    const result = await promiseToResult(promise)

    // Assert
    expect(result.isFail()).toBe(true)
    expect(result.unwrapFail()).toBe(error)
  })

  it('should handle promises that resolve with null', async () => {
    // Arrange
    const promise = Promise.resolve(null)

    // Act
    const result = await promiseToResult(promise)

    // Assert
    expect(result.isOk()).toBe(true)
    expect(result.unwrap()).toBe(null)
  })

  it('should handle promises that resolve with undefined', async () => {
    // Arrange
    const promise = Promise.resolve(undefined)

    // Act
    const result = await promiseToResult(promise)

    // Assert
    expect(result.isOk()).toBe(true)
    expect(result.unwrap()).toBe(undefined)
  })
})
