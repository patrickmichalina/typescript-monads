export interface IReader<E, A> {
  of(fn: (config: E) => A): IReader<E, A>
  run(config: E): A
  map<B>(fn: (val: A) => B): IReader<E, B>
  flatMap<B>(fn: (val: A) => IReader<E, B>): IReader<E, B>
}
