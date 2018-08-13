import { maybeEnv } from '../../src/util'

describe(maybeEnv.name, () => {
  const key = 'TEST_JWT'
  beforeEach(() => {
    remove(key)
  })

  it('should get using default reader', () => {
    const hash = 'SOME_HASHED_SECRET'
    mutateEnvForTesting(key, hash)
    const maybe = maybeEnv(key).valueOr('Fallback')
    expect(maybe).toEqual(hash)
  })

  it('should get using custom reader', () => {
    const env = {
      someKey: 'someVal'
    }
    const maybe = maybeEnv('someKey', { readEnv: (key: string) => env[key] }).valueOr('Fallback')
    expect(maybe).toEqual('someVal')
  })

  it('should fallback using custom reader', () => {
    const env = {
      someKey: 'someVal'
    }
    const maybe = maybeEnv('someUndefinedKey', { readEnv: (key: string) => env[key] }).valueOr('Fallback')
    expect(maybe).toEqual('Fallback')
  })

  it('should fallback', () => {
    const maybe = maybeEnv(key).valueOr('Fallback')
    expect(maybe).toEqual('Fallback')
  })
})

// tslint:disable:no-object-mutation
function mutateEnvForTesting(key: string, value: string) {
  process.env[key] = value
}

function remove(key: string) {
  // tslint:disable-next-line:no-delete
  delete process.env[key]
}