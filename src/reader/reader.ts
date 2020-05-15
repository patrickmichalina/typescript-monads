import { IReader } from './reader.interface'

export class Reader<TConfig, TOut> implements IReader<TConfig, TOut> {
  constructor(private readonly fn: (config: TConfig) => TOut) { }

  public of(fn: (config: TConfig) => TOut): IReader<TConfig, TOut> {
    return new Reader(fn)
  }

  // flatMap<B>(fn: (val: A) => IReader<E, B>): IReader<E, B>
  public flatMap<TNewOut>(fn: (val: TOut) => IReader<TConfig, TNewOut>): IReader<TConfig, TNewOut> {
    throw new Error('Method not implemented.')
  }

  // map: function <B>(fn: (val: A) => B) {
  //   return reader(config => fn(this.run(config)))
  // },
  map<TNewOut>(f: (val: TOut) => TNewOut): IReader<TConfig, TNewOut> {
    // return this.fn(config => f(this.run(config)))
    throw new Error('Method not implemented.')
  }

  run(config: TConfig): TOut {
    return this.fn(config)
  }
}



// new Reader<string, number>(a => {
//   return +a
// }).map(b => {
//   return +b
// })
// .map(a => {
//   return a.toString()
// }).map(s => {

// })

// .run('123')
