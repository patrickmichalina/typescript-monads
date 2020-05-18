// Repurposed from this great piece of code: https://gist.github.com/gvergnaud/6e9de8e06ef65e65f18dbd05523c7ca9

/**
 * A lazily evaluated list
 */
export class List<T> {
  [k: string]: any;

  constructor(generator: () => Generator<T, T[]>, private readonly length = Infinity) {
    this[Symbol.iterator as any] = generator
    this.length
  }

  static of<T>(...args: T[]): List<T> {
    return new List<T>(function* () {
      return yield* args
    }, args.length)
  }

  static from<T>(iterable: Iterable<T>): List<T> {
    return new List(function* () {
      return yield* iterable as T[]
    }, (iterable as any).length)
  }

  static range<T>(start: number, end: number, step = 1): List<T> {
    return new List(function* () {
      // tslint:disable-next-line: no-let
      let i = start
      while (i <= end) {
        yield i
        i += step
      }
    } as any, Math.floor((end - start + 1) / step))
  }

  static get integers() {
    return this.range(0, Infinity)
  }

  static empty<T>(): List<T> {
    return new List<T>(function* () { } as any, 0)
  }

  head(): T | undefined {
    return this[Symbol.iterator as any]().next().value as T
  }

  headOr(valueWhenUndefined: T): T {
    return this.head() || valueWhenUndefined
  }

  // unit<R>(value: R): List<R> {
  //   return new List<R>(value)
  // }

  // join(value: T | T[], ...args: T[]): List<T> {
  //   return new List<T>(this.value.concat(value, args))
  // }

  // map<R>(fn: (value: T) => R): List<R> {
  //   const newList = this.value
  //     .map(fn)
  //     .reduce((acc, a) => acc.concat(a), [] as R[])

  //   return new List<R>(newList)
  // }

  toArray(): T[] {
    return [...this as any] as T[]
  }
}
