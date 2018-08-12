import { monad } from '../src'

describe('monad', () => {
  it('should have required functions', () => {
    const mon = monad('string value')
      .of('123')
      .flatMap(_str => monad('456'))

    expect(mon.flatMap).toBeInstanceOf(Function)
    expect(mon.of).toBeInstanceOf(Function)
  })

  it('should have required functions + ...args', () => {
    const mon = monad('string value', 1, 2, 3)
      .of('123', 1, 2, 3)
      .flatMap(_str => monad('456', 1, 2, 3))

    expect(mon.flatMap).toBeInstanceOf(Function)
    expect(mon.of).toBeInstanceOf(Function)
  })
})