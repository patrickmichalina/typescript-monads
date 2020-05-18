// Repurposed from this great piece of code: https://gist.github.com/gvergnaud/6e9de8e06ef65e65f18dbd05523c7ca9

/**
 * A lazily evaluated list
 */
export class List<T> {
  [k: string]: any;

  constructor(generator: () => Generator<T, T[]>, private readonly length = Infinity) {
    this[Symbol.iterator as any] = generator
  }

  private generator() {
    return this[Symbol.iterator as any]() as Generator<T, T[]>
  }

  static of<T>(...args: T[]): List<T> {
    return new List<T>(function* () {
      return yield* args
    }, args.length)
  }

  static from<T>(iterable: Iterable<T>): List<T> {
    return new List(function* () {
      yield* iterable as T[]
    } as any, (iterable as any).length)
  }

  static range(start: number, end: number, step = 1): List<number> {
    return new List(function* () {
      // tslint:disable-next-line: no-let
      let i = start
      while (i <= end) {
        yield i
        i += step
      }
    } as any, Math.floor((end - start + 1) / step))
  }

  static integers() {
    return this.range(0, Infinity)
  }

  static empty<T>(): List<T> {
    return new List<T>(function* () { } as any, 0)
  }

  //    reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T, initialValue: T): T;
  // reduce<T>(fn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T, seed: T) {
  //   return this.toArray().reduce(fn, seed)
  // }

  // scan (scanner, seed) {
  //   const generator = this[Symbol.iterator]
  //   return new List(function* () {
  //     let acc = seed
  //     for (const value of generator()) {
  //       yield acc = scanner(acc, value)
  //     }
  //   }, this.length)
  // }

  map<B>(fn: (val: T) => B): List<B> {
    const generator = this.generator() as any
    return new List<B>(function* () {
      for (const value of generator) {
        yield fn(value) as B
      }
    } as any, this.length)
  }

  // sum(): number {
  //   return this.toArray().reduce((acc, curr) => {
  //     return 1
  //   }, 0)
  // }

  /** 
   * Gets the first item in the collection or returns the provided value when undefined
   */
  headOr(valueWhenUndefined: T): T {
    return this.headOrUndefined() || valueWhenUndefined
  }

  /**
   * Gets the first item in the collection or returns undefined
   */
  headOrUndefined(): T | undefined {
    return this.generator().next().value as T
  }

  /**
   * Gets the first item in the collection or returns a computed function
   */
  headOrCompute(fn: () => NonNullable<T>): T {
    return this.headOrUndefined() || fn()
  }

  /**
   * Gets the first item in the collection or throws an error if undefined
   */
  headOrThrow(msg?: string): T {
    return this.headOrUndefined() || (() => { throw new Error(msg) })()
  }
  // ...params: [IFirst, MyEnum.FIRST] | [ISecond, MyEnum.SECOND]

  concat(...args: T[]): List<T>
  concat(iterable: Iterable<T>): List<T>
  concat(...args: T[] | [Iterable<T>]): List<T> {
    const generator = this.generator() as any
    const toAdd = Array.isArray(args[0])
      ? args[0]
      : args

    return new List(function* () {
      yield* generator
      yield* toAdd
    } as any, this.length + (args as any).length)
  }

  toArray(): T[] {
    return [...this as any] as T[]
  }
}
