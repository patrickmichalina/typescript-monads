import { IReader } from "../interfaces"

// tslint:disable:no-this
export function reader<E, A>(fn: (config: E) => A): IReader<E, A> {
  return {
    of: (fn: (config: E) => A) => reader<E, A>(fn),
    run: (config: E) => fn(config),
    map: function <B>(fn: (val: A) => B) {
      return reader(config => fn(this.run(config)))
    },
    flatMap: function <B>(fn: (val: A) => IReader<E, B>) {
      return reader(config => fn(this.run(config)).run(config))
    },
  }
}
