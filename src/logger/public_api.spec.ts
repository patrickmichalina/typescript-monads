import { Logger } from './public_api'

describe('logger api', () => {
  it('should export', () => {
    expect(new Logger([], 'valie')).toBeInstanceOf(Logger)
  })
})
