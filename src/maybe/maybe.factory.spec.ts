import { maybe, none, some, maybeProps } from './maybe.factory'

describe('should construct maybes', () => {
  it('should handle "maybe" case', () => {
    const sut = 'asdasd' as string | undefined
    expect(maybe(sut).isSome()).toEqual(true)
  })

  it('should handle "none" case', () => {
    expect(none().isNone()).toEqual(true)
  })

  it('should handle "some" case', () => {
    expect(some('test').isSome()).toEqual(true)
  })
})

describe('maybeProps', () => {
  it('should return Some for valid property paths', () => {
    const user = {
      profile: {
        contact: {
          email: 'test@example.com'
        }
      }
    }
    
    const getEmail = maybeProps<typeof user>('profile.contact.email')
    const result = getEmail(user)
    
    expect(result.isSome()).toEqual(true)
    expect(result.valueOr('default')).toEqual('test@example.com')
  })
  
  it('should return None for invalid property paths', () => {
    const user = {
      profile: {
        contact: {
          // No email property
        }
      }
    }
    
    const getEmail = maybeProps<typeof user>('profile.contact.email')
    const result = getEmail(user)
    
    expect(result.isNone()).toEqual(true)
  })
  
  it('should return None for null intermediate values', () => {
    const user = {
      profile: null
    }
    
    const getEmail = maybeProps<typeof user>('profile.contact.email')
    const result = getEmail(user)
    
    expect(result.isNone()).toEqual(true)
  })
  
  it('should handle arrays in paths', () => {
    const data = {
      users: [
        { name: 'User 1' },
        { name: 'User 2' }
      ]
    }
    
    const getFirstUserName = maybeProps<typeof data>('users.0.name')
    const result = getFirstUserName(data)
    
    expect(result.isSome()).toEqual(true)
    expect(result.valueOr('default')).toEqual('User 1')
  })
  
  it('should return None for out-of-bounds array indices', () => {
    const data = {
      users: [
        { name: 'User 1' }
      ]
    }
    
    const getNonExistentUser = maybeProps<typeof data>('users.5.name')
    const result = getNonExistentUser(data)
    
    expect(result.isNone()).toEqual(true)
  })
  
  it('should work with single-segment paths', () => {
    const data = {
      name: 'Test'
    }
    
    const getName = maybeProps<typeof data>('name')
    const result = getName(data)
    
    expect(result.isSome()).toEqual(true)
    expect(result.valueOr('default')).toEqual('Test')
  })
})
