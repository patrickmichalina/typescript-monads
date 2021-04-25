import { State } from './state'

describe(State.name, () => {

  it('should construct', () => {
    const sut = new State<string, string>(state => [state, state + '_test'])
      .run('starting state')

    expect(sut.state).toEqual('starting state')
    expect(sut.value).toEqual('starting state_test')
  })

  it('should of', () => {
    const sut = new State<string, string>(state => [state, state + '_test'])
      .of(state => [state, 'other'])
      .run('starting state')

    expect(sut.state).toEqual('starting state')
    expect(sut.value).toEqual('other')
  })

  it('should map', () => {
    const sut = new State<string, string>(state => [state, state + '_phase1_'])
      .map<number>(pair => [pair.state + '_ran_x1_3', 3])
      .run('start_str')

    expect(sut.state).toEqual('start_str_ran_x1_3')
    expect(sut.value).toEqual(3)
  })

  it('should flat map', () => {
    const sut = new State<string, string>(state => [state, 'v1'])
      .flatMap(pair => new State<string, string>(state => [pair.state + state, pair.value]))
      .run('start')

    expect(sut.state).toEqual('startstart')
    expect(sut.value).toEqual('v1')
  })

})
