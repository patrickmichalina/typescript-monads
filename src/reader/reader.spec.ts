import { reader, readerOf, ask, asks, combine, sequence, traverse } from './reader.factory'
import { IReader } from './reader.interface'
import { Reader } from './reader'

describe('Reader Monad', () => {
  describe('basic operations', () => {
    it('should create a Reader with a function', () => {
      const greet = reader<string, string>(ctx => ctx + '_HelloA')
      expect(greet.run('Test')).toEqual('Test_HelloA')
    })

    it('should create a new Reader with of', () => {
      const greet = reader<string, string>(ctx => ctx + '_HelloA')
      const greet2 = greet.of(ctx => ctx + '_HelloB')

      expect(greet.run('Test')).toEqual('Test_HelloA')
      expect(greet2.run('Test')).toEqual('Test_HelloB')
    })

    it('should map the Reader output', () => {
      const greet = reader<string, string>(ctx => ctx + '_HelloA')
      const greet2 = greet.map(s => s + '_Mapped123')

      expect(greet.run('Test')).toEqual('Test_HelloA')
      expect(greet2.run('Test')).toEqual('Test_HelloA_Mapped123')
    })

    it('should map to a constant value', () => {
      const greet = reader<string, string>(ctx => ctx + '_HelloA')
      const greet2 = greet.mapTo('Constant value')

      expect(greet.run('Test')).toEqual('Test_HelloA')
      expect(greet2.run('Test')).toEqual('Constant value')
    })

    it('should flatMap to chain Readers', () => {
      const greet = (name: string): IReader<string, string> => reader<string, string>(ctx => ctx + ', ' + name)
      const end = (str: string): IReader<string, string> => reader<string, boolean>(a => a === 'Hello')
        .flatMap(isH => isH ? reader(() => str + '!!!') : reader(() => str + '.'))

      expect(greet('Tom').flatMap(end).run('Hello')).toEqual('Hello, Tom!!!')
      expect(greet('Jerry').flatMap(end).run('Hi')).toEqual('Hi, Jerry.')
    })
  })

  describe('factory functions', () => {
    it('should create a constant Reader with readerOf', () => {
      const constReader = readerOf<unknown, number>(42)
      expect(constReader.run('anything')).toBe(42)
      expect(constReader.run({})).toBe(42)
      expect(constReader.run(null)).toBe(42)
    })

    it('should create a Reader that returns the environment with ask', () => {
      const config = { api: 'https://example.com', timeout: 5000 }
      const askReader = ask<typeof config>()
      expect(askReader.run(config)).toBe(config)
    })

    it('should create a Reader that extracts a value from the environment with asks', () => {
      const config = { api: 'https://example.com', timeout: 5000 }
      const getApi = asks<typeof config, string>(c => c.api)
      const getTimeout = asks<typeof config, number>(c => c.timeout)
      
      expect(getApi.run(config)).toBe('https://example.com')
      expect(getTimeout.run(config)).toBe(5000)
    })
  })

  describe('static methods on Reader class', () => {
    it('should create a Reader that returns a constant value with of', () => {
      const r = Reader.of<string, number>(42)
      expect(r.run('anything')).toBe(42)
    })
    
    it('should create a Reader that returns the environment with ask', () => {
      const r = Reader.ask<string>()
      expect(r.run('environment')).toBe('environment')
    })
    
    it('should create a Reader that extracts a value with asks', () => {
      const r = Reader.asks<{value: number}, number>(config => config.value)
      expect(r.run({value: 42})).toBe(42)
    })
  })

  describe('new instance methods', () => {
    it('should modify the environment with local', () => {
      type AppConfig = {
        database: {
          host: string
          port: number
        }
      }
      
      // Reader that works with a DatabaseConfig
      const getConnectionString = reader<{host: string; port: number}, string>(
        db => `postgres://${db.host}:${db.port}/mydb`
      )
      
      // Make it work with an AppConfig by extracting the database property
      const getAppConnectionString = getConnectionString.local<AppConfig>(
        appConfig => appConfig.database
      )
      
      const appConfig = {
        database: {
          host: 'localhost',
          port: 5432
        }
      }
      
      expect(getAppConnectionString.run(appConfig)).toBe('postgres://localhost:5432/mydb')
    })

    it('should perform side effects with tap', () => {
      let sideEffect = ''
      
      const simpleReader = reader<string, string>(s => s.toUpperCase())
        .tap(result => { sideEffect = `Processed: ${result}` })
      
      expect(simpleReader.run('hello')).toBe('HELLO')
      expect(sideEffect).toBe('Processed: HELLO')
    })

    it('should chain Readers with andThen', () => {
      let sideEffect = ''
      
      const first = reader<string, string>(s => {
        sideEffect = `First processed: ${s}`
        return s.toUpperCase()
      })
      
      const second = reader<string, number>(s => s.length)
      
      const combined = first.andThen(second)
      
      expect(combined.run('hello')).toBe(5) // length of 'hello'
      expect(sideEffect).toBe('First processed: hello')
    })
    
    it('should chain Readers with andFinally', () => {
      let sideEffect = ''
      
      const first = reader<string, string>(s => s.toUpperCase())
      
      const second = reader<string, void>(s => {
        sideEffect = `Second processed: ${s}`
      })
      
      const combined = first.andFinally(second)
      
      expect(combined.run('hello')).toBe('HELLO')
      expect(sideEffect).toBe('Second processed: hello')
    })
    
    it('should transform using both environment and value with withEnv', () => {
      const reader1 = reader<string, number>(env => env.length)
      
      const reader2 = reader1.withEnv((env, length) => `${env} has ${length} characters`)
      
      expect(reader2.run('hello')).toBe('hello has 5 characters')
    })
    
    it('should filter output values based on a predicate', () => {
      const getAge = reader<{age: number}, number>(c => c.age)
      
      const getValidAge = getAge.filter(
        age => age >= 0 && age <= 120,
        0 // Default for invalid ages
      )
      
      expect(getValidAge.run({age: 30})).toBe(30)
      expect(getValidAge.run({age: -10})).toBe(0) 
      expect(getValidAge.run({age: 150})).toBe(0)
    })
    
    it('should cache results with memoize', () => {
      let computationCount = 0
      
      const expensiveComputation = reader<number, string>(n => {
        computationCount++
        return `Result for ${n}: ${n * n}`
      }).memoize()
      
      // First call - should compute
      expect(expensiveComputation.run(10)).toBe('Result for 10: 100')
      expect(computationCount).toBe(1)
      
      // Second call with same input - should use cache
      expect(expensiveComputation.run(10)).toBe('Result for 10: 100')
      expect(computationCount).toBe(1) // Still 1, used cache
      
      // Call with different input - should compute again
      expect(expensiveComputation.run(20)).toBe('Result for 20: 400')
      expect(computationCount).toBe(2)
    })
    
    it('should memoize with custom cache key function', () => {
      let computationCount = 0
      
      interface Config {
        id: string
        timestamp: number
      }
      
      const r = reader<Config, string>(config => {
        computationCount++
        return `Processed ${config.id}`
      }).memoize(config => config.id) // Only use id for cache key
      
      const config1 = { id: 'A', timestamp: 1 }
      const config2 = { id: 'A', timestamp: 2 } // Same id, different timestamp
      
      expect(r.run(config1)).toBe('Processed A')
      expect(computationCount).toBe(1)
      
      expect(r.run(config2)).toBe('Processed A')
      expect(computationCount).toBe(1) // Still 1, used cache because id is the same
    })
    
    it('should convert a Reader to a Promise-returning function', async () => {
      const r = reader<string, number>(s => s.length)
      const promiseFn = r.toPromise()
      
      const result = await promiseFn('hello')
      expect(result).toBe(5)
    })
    
    it('should apply multiple transformations with fanout', () => {
      const r = reader<string, string>(s => s)
      
      const transformed = r.fanout(
        s => s.length,
        s => s.toUpperCase(),
        s => s.charAt(0)
      )
      
      expect(transformed.run('hello')).toEqual([5, 'HELLO', 'h'])
    })
    
    it('should combine two readers with zipWith', () => {
      const lengthReader = reader<string, number>(s => s.length)
      const upperReader = reader<string, string>(s => s.toUpperCase())
      
      const combined = lengthReader.zipWith(
        upperReader,
        (len, upper) => `${upper} has length ${len}`
      )
      
      expect(combined.run('hello')).toBe('HELLO has length 5')
    })
  })
  
  describe('static Reader functions', () => {
    it('should create a sequence of Readers', () => {
      // Test with same type for simplicity
      const r1 = reader<string, string>(s => s.toUpperCase())
      const r2 = reader<string, string>(s => s.toLowerCase())
      
      // We need any here since Array<IReader<string, string>> doesn't match the overload
      const sequence = Reader.sequence<string, string>([r1, r2])
      
      expect(sequence.run('Hello')).toEqual(['HELLO', 'hello'])
    })
    
    it('should handle empty sequence', () => {
      const emptySequence = Reader.sequence([])
      expect(emptySequence.run('anything')).toEqual([])
    })
    
    it('should traverse and combine Readers', () => {
      const r1 = reader<string, string>(s => s.toUpperCase())
      const r2 = reader<string, string>(s => s.toLowerCase())
      
      const traversed = Reader.traverse<string, string, string[]>(
        [r1, r2],
        (acc: string[], val: string) => [...acc, val],
        [] as string[]
      )
      
      expect(traversed.run('Hello')).toEqual(['HELLO', 'hello'])
    })
    
    it('should combine multiple Readers using combine', () => {
      const r1 = reader<string, string>(s => s.toUpperCase())
      const r2 = reader<string, string>(s => s.toLowerCase())
      
      const combined = Reader.combine<string, [string, string], string>(
        [r1, r2], 
        (upper, lower) => `Upper: ${upper}, Lower: ${lower}`
      )
      
      expect(combined.run('Hello')).toBe('Upper: HELLO, Lower: hello')
    })
  })
  
  describe('factory functions coverage', () => {
    it('should use traverse factory function', () => {
      const r1 = reader<string, string>(s => s.toUpperCase())
      const r2 = reader<string, string>(s => s.toLowerCase())
      
      const result = traverse<string, string, string[]>(
        [r1, r2],
        (acc: string[], val: string, index: number) => {
          acc[index] = val
          return acc
        },
        ['', '']
      )
      
      expect(result.run('Hello')).toEqual(['HELLO', 'hello'])
    })
    
    it('should use combine factory function', () => {
      const r1 = reader<string, string>(s => s.toUpperCase())
      const r2 = reader<string, string>(s => s.toLowerCase())
      
      const result = combine<string, [string, string], string>(
        [r1, r2],
        (upper, lower) => `${upper} and ${lower}`
      )
      
      expect(result.run('Hello')).toBe('HELLO and hello')
    })
    
    it('should use sequence factory function', () => {
      const r1 = reader<string, string>(s => s.toUpperCase())
      const r2 = reader<string, string>(s => s.toLowerCase())
      
      const result = sequence<string, string>([r1, r2])
      
      expect(result.run('Hello')).toEqual(['HELLO', 'hello'])
    })
  })
})
