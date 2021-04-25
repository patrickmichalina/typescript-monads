import { Logger } from './logger'

describe(Logger.name, () => {

  it('should construct', () => {
    const sut = new Logger([], '')

    expect(sut).toBeInstanceOf(Logger)
  })

  it('should flatMap', () => {
    const sut = new Logger(['starting with 100'], 100)
      .flatMap(b => new Logger(['adding 3'], b + 3))

    expect(sut).toBeInstanceOf(Logger)
  })

  it('should tell', () => {
    Logger
      .tell('starting Logger')
      .flatMap(b => new Logger([`adding 3 to ${b}`], b + 3))
      .flatMap(b => new Logger([`adding 3 to ${b}`], b + 3))
      .runUsing(a => {
        expect(a.logs).toEqual([
          'starting Logger',
          'adding 3 to 0',
          'adding 3 to 3'
        ])
        expect(a.value).toEqual(6)
      })
  })

  it('should tell', () => {
    Logger
      .tell('starting Logger')
      .of('ofed')
      .runUsing(a => {
        expect(a.logs).toEqual([])
        expect(a.value).toEqual('ofed')
      })
  })

  it('should construt static', () => {
    const sut = Logger.logger(['starting with 100'], 100)
      .flatMap(b => new Logger(['adding 3'], b + 3))

    expect(sut).toBeInstanceOf(Logger)
  })

  it('should todo...', () => {
    Logger
      .startWith('Starting calculation with value: 100', 100)
      .flatMap(b => new Logger([`adding 3 to ${b}`], b + 3))
      .runUsing(a => {
        expect(a.logs).toEqual([
          'Starting calculation with value: 100',
          'adding 3 to 100'
        ])
        expect(a.value).toEqual(103)
      })
  })

  it('should todo...', () => {
    Logger
      .startWith('Starting calculation with value: 100', 100)
      .flatMapPair(b => [`adding 3 to ${b}`, b + 3])
      .runUsing(a => {
        expect(a.logs).toEqual([
          'Starting calculation with value: 100',
          'adding 3 to 100'
        ])
        expect(a.value).toEqual(103)
      })
  })

})
