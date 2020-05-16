import { IReader } from './reader.interface'

export class Reader<TConfig, TOut> implements IReader<TConfig, TOut> {
  constructor(private readonly fn: (config: TConfig) => TOut) { }

  public of(fn: (config: TConfig) => TOut): IReader<TConfig, TOut> {
    return new Reader(fn)
  }

  public flatMap<TNewOut>(fn: (val: TOut) => IReader<TConfig, TNewOut>): IReader<TConfig, TNewOut> {
    return new Reader<TConfig, TNewOut>(c => fn(this.run(c)).run(c))
  }

  public map<TNewOut>(fn: (val: TOut) => TNewOut): IReader<TConfig, TNewOut> {
    return new Reader<TConfig, TNewOut>(c => fn(this.run(c)))
  }

  public run(config: TConfig): TOut {
    return this.fn(config)
  }
}
