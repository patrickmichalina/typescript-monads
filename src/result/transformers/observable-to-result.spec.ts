import { observableToResult } from './observable-to-result'
import { Subject, of, throwError, EMPTY } from 'rxjs'

describe('observableToResult', () => {
  it('should convert an observable that emits a value to an Ok Result', async () => {
    // Arrange
    const value = { id: 1, name: 'Test' }
    const observable = of(value)
    const defaultError = new Error('No value emitted')

    // Act
    const result = await observableToResult(observable, defaultError)

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
    const result = await observableToResult(observable, defaultError)

    // Assert
    expect(result.isFail()).toBe(true)
    expect(result.unwrapFail()).toBe(error)
  })

  it('should convert an empty observable to a Fail Result with default error', async () => {
    // Arrange
    const observable = EMPTY
    const defaultError = new Error('No value emitted')

    // Act
    const result = await observableToResult(observable, defaultError)

    // Assert
    expect(result.isFail()).toBe(true)
    expect(result.unwrapFail()).toBe(defaultError)
  })

  it('should take only the first emitted value from the observable', async () => {
    // Arrange
    const subject = new Subject<number>()
    const defaultError = new Error('No value emitted')
    
    // Start the async operation
    const resultPromise = observableToResult(subject, defaultError)
    
    // Emit multiple values
    subject.next(1)
    subject.next(2)
    subject.next(3)
    subject.complete()
    
    // Act
    const result = await resultPromise

    // Assert
    expect(result.isOk()).toBe(true)
    expect(result.unwrap()).toBe(1)  // Only the first value should be captured
  })
})
