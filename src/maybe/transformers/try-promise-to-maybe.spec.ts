import { tryPromiseToMaybe } from './try-promise-to-maybe'

describe('tryPromiseToMaybe', () => {
  it('should create a Some from a successful function', async (): Promise<void> => {
    const fn = async (): Promise<string> => 'test'
    const result = await tryPromiseToMaybe(fn)
    
    expect(result.isSome()).toBe(true)
    expect(result.valueOr('default' as never)).toBe('test')
  })

  it('should create a None from a function that throws', async (): Promise<void> => {
    const fn = async (): Promise<string> => {
      throw new Error('error')
    }
    const result = await tryPromiseToMaybe(fn)
    
    expect(result.isNone()).toBe(true)
    expect(result.valueOr('default' as never)).toBe('default')
  })

  it('should create a None from a function that resolves to null', async (): Promise<void> => {
    const fn = async (): Promise<null> => null
    const result = await tryPromiseToMaybe(fn)
    
    expect(result.isNone()).toBe(true)
  })

  it('should create a None from a function that resolves to undefined', async (): Promise<void> => {
    const fn = async (): Promise<undefined> => undefined
    const result = await tryPromiseToMaybe(fn)
    
    expect(result.isNone()).toBe(true)
  })

  it('should handle API-like scenarios', async (): Promise<void> => {
    interface User { name: string }
    
    // Mock API
    const successApi = {
      fetchUser: async (id: number): Promise<User> => {
        return { name: `User ${id}` }
      }
    }
    
    const failingApi = {
      fetchUser: async (id: number): Promise<User> => {
        throw new Error(`Network error for ID ${id}`)
      }
    }
    
    const successResult = await tryPromiseToMaybe(() => successApi.fetchUser(1))
    expect(successResult.isSome()).toBe(true)
    expect(successResult.valueOr({ name: 'default' } as never).name).toBe('User 1')
    
    const failureResult = await tryPromiseToMaybe(() => failingApi.fetchUser(1))
    expect(failureResult.isNone()).toBe(true)
  })
})
