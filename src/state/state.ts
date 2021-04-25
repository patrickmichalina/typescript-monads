
export type StateTupple<TState, TValue> = [TState, TValue]

export class StatePair<TState, TValue> {
  constructor(public readonly state: TState, public readonly value: TValue) { }
}

export class State<TState, TValue> {

  constructor(private readonly fn: (state: TState) => StateTupple<TState, TValue>) { }

  public of(fn: (state: TState) => StateTupple<TState, TValue>): State<TState, TValue> {
    return new State(fn)
  }

  public map<TValueB>(fn: (state: StatePair<TState, TValue>) => StateTupple<TState, TValueB>): State<TState, TValueB> {
    return new State<TState, TValueB>(c => fn(this.run(c)))
  }

  public flatMap<TValueB>(fn: (state: StatePair<TState, TValue>) => State<TState, TValueB>): State<TState, TValueB> {
    return new State<TState, TValueB>(c => {
      const pair = fn(this.run(c)).run(c)
      return [pair.state, pair.value]
    })
  }

  public run(config: TState): StatePair<TState, TValue> {
    const tupple = this.fn(config)

    return new StatePair(tupple[0], tupple[1])
  }

}
