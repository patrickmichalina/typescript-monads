import { ok, fail, Result } from './public_api'
import { of, throwError, EMPTY } from 'rxjs'

describe('Result static methods', () => {
  describe('fromPromise', () => {
    it('should convert a resolved promise to an Ok Result', async () => {
      // Arrange
      const value = { success: true, data: 'test' }
      const promise = Promise.resolve(value)

      // Act
      const result = await Result.fromPromise(promise)

      // Assert
      expect(result.isOk()).toBe(true)
      expect(result.unwrap()).toEqual(value)
    })

    it('should convert a rejected promise to a Fail Result', async () => {
      // Arrange
      const error = new Error('Test error')
      const promise = Promise.reject(error)

      // Act
      const result = await Result.fromPromise(promise)

      // Assert
      expect(result.isFail()).toBe(true)
      expect(result.unwrapFail()).toBe(error)
    })
  })

  describe('fromObservable', () => {
    it('should convert an observable that emits a value to an Ok Result', async () => {
      // Arrange
      const value = { id: 1, name: 'Test' }
      const observable = of(value)
      const defaultError = new Error('No value emitted')

      // Act
      const result = await Result.fromObservable(observable, defaultError)

      // Assert
      expect(result.isOk()).toBe(true)
      expect(result.unwrap()).toEqual(value)
    })

    it('should convert an observable that errors to a Fail Result', async () => {
      // Arrange
      const error = new Error('Observable error')
      const observable = throwError(() => error)
      const defaultError = new Error('Default error')

      // Act
      const result = await Result.fromObservable(observable, defaultError)

      // Assert
      expect(result.isFail()).toBe(true)
      expect(result.unwrapFail()).toBe(error)
    })

    it('should convert an empty observable to a Fail Result with default error', async () => {
      // Arrange
      const observable = EMPTY
      const defaultError = new Error('No value emitted')

      // Act
      const result = await Result.fromObservable(observable, defaultError)

      // Assert
      expect(result.isFail()).toBe(true)
      expect(result.unwrapFail()).toBe(defaultError)
    })
  })

  describe('sequence', () => {
    it('should return Ok with empty array when given an empty array', () => {
      // Act
      const result = Result.sequence([])

      // Assert
      expect(result.isOk()).toBe(true)
      expect(result.unwrap()).toEqual([])
    })

    it('should return Ok with array of values when all Results are Ok', () => {
      // Arrange
      const results = [ok(1), ok(2), ok(3)]

      // Act
      const result = Result.sequence(results)

      // Assert
      expect(result.isOk()).toBe(true)
      expect(result.unwrap()).toEqual([1, 2, 3])
    })

    it('should return Fail with first error when any Result is Fail', () => {
      // Arrange
      const error = new Error('Test error')
      const results = [ok(1), fail(error), ok(3)]

      // Act
      const result = Result.sequence(results)

      // Assert
      expect(result.isFail()).toBe(true)
      expect(result.unwrapFail()).toBe(error)
    })
  })

  describe('all', () => {
    it('should return Ok with empty array when given an empty array', () => {
      // Act
      const result = Result.all([])

      // Assert
      expect(result.isOk()).toBe(true)
      expect(result.unwrap()).toEqual([])
    })

    it('should return Ok with array of values when all Results are Ok', () => {
      // Arrange
      const results = [ok(1), ok(2), ok(3)]

      // Act
      const result = Result.all(results)

      // Assert
      expect(result.isOk()).toBe(true)
      expect(result.unwrap()).toEqual([1, 2, 3])
    })

    it('should return Fail with first error when any Result is Fail', () => {
      // Arrange
      const error = new Error('Test error')
      const results = [ok(1), fail(error), ok(3)]

      // Act
      const result = Result.all(results)

      // Assert
      expect(result.isFail()).toBe(true)
      expect(result.unwrapFail()).toBe(error)
    })
  })
})
