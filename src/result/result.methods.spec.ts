import { ok, fail } from './public_api'
import { of, throwError, EMPTY } from 'rxjs'

describe('Result instance methods', () => {
  describe('recover', () => {
    it('should not transform an Ok Result', () => {
      // Arrange
      const okResult = ok<number, string>(5)
      
      // Act
      const result = okResult.recover(() => 10)
      
      // Assert
      expect(result.isOk()).toBe(true)
      expect(result.unwrap()).toBe(5)
    })
    
    it('should transform a Fail Result to an Ok Result', () => {
      // Arrange
      const failResult = fail<number, string>('Error')
      
      // Act
      const result = failResult.recover(() => 10)
      
      // Assert
      expect(result.isOk()).toBe(true)
      expect(result.unwrap()).toBe(10)
    })
  })
  
  describe('recoverWith', () => {
    it('should not transform an Ok Result', () => {
      // Arrange
      const okResult = ok<number, string>(5)
      
      // Act
      const result = okResult.recoverWith(() => ok(10))
      
      // Assert
      expect(result.isOk()).toBe(true)
      expect(result.unwrap()).toBe(5)
    })
    
    it('should transform a Fail Result using the provided function', () => {
      // Arrange
      const failResult = fail<number, string>('Error')
      
      // Act
      const result = failResult.recoverWith(() => ok(10))
      
      // Assert
      expect(result.isOk()).toBe(true)
      expect(result.unwrap()).toBe(10)
    })
    
    it('should allow returning a new Fail Result from the recovery function', () => {
      // Arrange
      const failResult = fail<number, string>('Original error')
      
      // Act
      const result = failResult.recoverWith(err => 
        fail<number, string>(`Transformed: ${err}`)
      )
      
      // Assert
      expect(result.isFail()).toBe(true)
      expect(result.unwrapFail()).toBe('Transformed: Original error')
    })
  })
  
  describe('orElse', () => {
    it('should return the original Result when it is Ok', () => {
      // Arrange
      const okResult = ok<number, string>(5)
      const fallback = ok<number, string>(10)
      
      // Act
      const result = okResult.orElse(fallback)
      
      // Assert
      expect(result.isOk()).toBe(true)
      expect(result.unwrap()).toBe(5)
    })
    
    it('should return the fallback Result when the original is Fail', () => {
      // Arrange
      const failResult = fail<number, string>('Error')
      const fallback = ok<number, string>(10)
      
      // Act
      const result = failResult.orElse(fallback)
      
      // Assert
      expect(result.isOk()).toBe(true)
      expect(result.unwrap()).toBe(10)
    })
    
    it('should work with fallback that is also a Fail Result', () => {
      // Arrange
      const failResult = fail<number, string>('Original error')
      const fallback = fail<number, string>('Fallback error')
      
      // Act
      const result = failResult.orElse(fallback)
      
      // Assert
      expect(result.isFail()).toBe(true)
      expect(result.unwrapFail()).toBe('Fallback error')
    })
  })
  
  describe('swap', () => {
    it('should transform an Ok Result to a Fail Result', () => {
      // Arrange
      const okResult = ok<number, string>(5)
      
      // Act
      const result = okResult.swap()
      
      // Assert
      expect(result.isFail()).toBe(true)
      expect(result.unwrapFail()).toBe(5)
    })
    
    it('should transform a Fail Result to an Ok Result', () => {
      // Arrange
      const failResult = fail<number, string>('Error')
      
      // Act
      const result = failResult.swap()
      
      // Assert
      expect(result.isOk()).toBe(true)
      expect(result.unwrap()).toBe('Error')
    })
  })
  
  describe('zipWith', () => {
    it('should combine two Ok Results using the provided function', () => {
      // Arrange
      const result1 = ok<number, string>(5)
      const result2 = ok<string, string>('test')
      
      // Act
      const combined = result1.zipWith(result2, (a, b) => `${a}-${b}`)
      
      // Assert
      expect(combined.isOk()).toBe(true)
      expect(combined.unwrap()).toBe('5-test')
    })
    
    it('should return the first Fail Result when the first Result is Fail', () => {
      // Arrange
      const result1 = fail<number, string>('Error 1')
      const result2 = ok<string, string>('test')
      
      // Act
      const combined = result1.zipWith(result2, (a, b) => `${a}-${b}`)
      
      // Assert
      expect(combined.isFail()).toBe(true)
      expect(combined.unwrapFail()).toBe('Error 1')
    })
    
    it('should return the second Fail Result when the second Result is Fail', () => {
      // Arrange
      const result1 = ok<number, string>(5)
      const result2 = fail<string, string>('Error 2')
      
      // Act
      const combined = result1.zipWith(result2, (a, b) => `${a}-${b}`)
      
      // Assert
      expect(combined.isFail()).toBe(true)
      expect(combined.unwrapFail()).toBe('Error 2')
    })
  })
  
  describe('flatMapPromise', () => {
    it('should map an Ok Result to a Promise and flatten', async () => {
      // Arrange
      const okResult = ok<number, string>(5)
      
      // Act
      const result = await okResult.flatMapPromise(n => Promise.resolve(n * 2))
      
      // Assert
      expect(result.isOk()).toBe(true)
      expect(result.unwrap()).toBe(10)
    })
    
    it('should convert a rejected Promise to a Fail Result', async () => {
      // Arrange
      const okResult = ok<number, string>(5)
      const error = new Error('Promise error')
      
      // Act
      const result = await okResult.flatMapPromise(() => Promise.reject(error))
      
      // Assert
      expect(result.isFail()).toBe(true)
      expect(result.unwrapFail()).toBe(error)
    })
    
    it('should short-circuit for Fail Results without calling the function', async () => {
      // Arrange
      const failResult = fail<number, string>('Original error')
      let functionCalled = false
      
      // Act
      const result = await failResult.flatMapPromise(() => {
        functionCalled = true
        return Promise.resolve(10)
      })
      
      // Assert
      expect(functionCalled).toBe(false)
      expect(result.isFail()).toBe(true)
      expect(result.unwrapFail()).toBe('Original error')
    })
  })
  
  describe('flatMapObservable', () => {
    it('should map an Ok Result to an Observable and flatten', async () => {
      // Arrange
      const okResult = ok<number, string>(5)
      
      // Act
      const result = await okResult.flatMapObservable(
        n => of(n * 2),
        'Default error'
      )
      
      // Assert
      expect(result.isOk()).toBe(true)
      expect(result.unwrap()).toBe(10)
    })
    
    it('should convert an Observable error to a Fail Result', async () => {
      // Arrange
      const okResult = ok<number, string>(5)
      const error = new Error('Observable error')
      
      // Act
      const result = await okResult.flatMapObservable(
        () => throwError(() => error),
        'Default error'
      )
      
      // Assert
      expect(result.isFail()).toBe(true)
      expect(result.unwrapFail()).toBe(error)
    })
    
    it('should convert an empty Observable to a Fail Result with default error', async () => {
      // Arrange
      const okResult = ok<number, string>(5)
      
      // Act
      const result = await okResult.flatMapObservable(
        () => EMPTY,
        'Default error'
      )
      
      // Assert
      expect(result.isFail()).toBe(true)
      expect(result.unwrapFail()).toBe('Default error')
    })
    
    it('should short-circuit for Fail Results without calling the function', async () => {
      // Arrange
      const failResult = fail<number, string>('Original error')
      let functionCalled = false
      
      // Act
      const result = await failResult.flatMapObservable(() => {
        functionCalled = true
        return of(10)
      }, 'Default error')
      
      // Assert
      expect(functionCalled).toBe(false)
      expect(result.isFail()).toBe(true)
      expect(result.unwrapFail()).toBe('Original error')
    })
  })
})
