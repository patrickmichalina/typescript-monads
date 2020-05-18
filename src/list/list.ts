// Repurposed from this great piece of code: https://gist.github.com/gvergnaud/6e9de8e06ef65e65f18dbd05523c7ca9
// Implements a number of functions from the .NET LINQ library: https://docs.microsoft.com/en-us/dotnet/api/system.linq.enumerable.reverse?view=netcore-3.1

/**
 * A lazily evaluated list with useful extension methods.
 */
export class List<T> {
  [k: string]: any;

  constructor(generator: () => Generator<T, T[]>, private readonly length = Infinity) {
    this[Symbol.iterator as any] = generator
  }

  private generator() {
    return this[Symbol.iterator as any]() as Generator<T, T[]>
  }

  private static flattenArgs<T>(args: T[] | Iterable<T>[]) {
    return (args as T[])
      .reduce((acc, curr) => {
        return Array.isArray(curr)
          ? [...acc, ...curr]
          : [...acc, curr]
      }, [] as T[])
  }

  public static of<T>(...args: T[]): List<T> {
    return new List<T>(function* () {
      return yield* args
    }, args.length)
  }

  public static from<T>(iterable: Iterable<T>): List<T> {
    return new List(function* () {
      yield* iterable as any
    } as any, (iterable as any).length)
  }

  public static range(start: number, end: number, step = 1): List<number> {
    return new List(function* () {
      // tslint:disable-next-line: no-let
      let i = start
      while (i <= end) {
        yield i
        i += step
      }
    } as any, Math.floor((end - start + 1) / step))
  }

  public static integers() {
    return this.range(0, Infinity)
  }

  public static empty<T>(): List<T> {
    return new List<T>(function* () { } as any, 0)
  }

  public map<B>(fn: (val: T) => B): List<B> {
    const generator = this.generator() as any
    return new List<B>(function* () {
      for (const value of generator) {
        yield fn(value) as B
      }
    } as any, this.length)
  }

  public scan<B>(fn: (acc: B, val: B) => B, seed: B): List<B> {
    const generator = this.generator() as any
    return new List(function* () {
      // tslint:disable-next-line: no-let
      let acc = seed
      for (const value of generator) {
        yield acc = fn(acc, value)
      }
    } as any, this.length)
  }

  public reduce<B>(fn: (previousValue: B, currentValue: T, currentIndex: number, array: T[]) => B, seed: B): B {
    return this.toArray().reduce<B>(fn, seed)
  }

  /**
   * Filters a sequence of values based on a predicate.
   * @param fn A function to test each element for a condition.
   */
  public filter(fn: (val: T) => boolean): List<T> {
    const generator = this.generator() as any
    return new List(function* () {
      for (const value of generator) {
        if (fn(value)) yield value
      }
    } as any, this.length)
  }

  /**
   * Filters a sequence of values based on a predicate. Alias to filter
   * @param fn A function to test each element for a condition.
   */
  public where(fn: (val: T) => boolean): List<T> {
    return this.filter(fn)
  }

  public concat(...args: T[]): List<T>
  public concat(...iterable: Iterable<T>[]): List<T>
  public concat(...args: T[] | Iterable<T>[]): List<T> {
    const generator = this.generator() as any
    const toAdd = List.flattenArgs(args)

    return new List(function* () {
      yield* generator
      yield* toAdd
    } as any, this.length + toAdd.length)
  }

  /**
   * Determines whether all elements of a sequence satisfy a condition.
   */
  public all(fn: (val: T) => boolean): boolean {
    const generator = this.generator() as any
    const newList = new List(function* () {
      for (const value of generator) {
        if (fn(value)) {
          yield value
        } else {
          return yield value
        }
      }
    } as any, this.length)

    return newList.toArray().length === this.length
  }

  /**
   * Determines whether a sequence contains any elements.
   * @param fn A function to test each element for a condition.
   */
  public any(fn: (val: T) => boolean): boolean {
    const generator = this.generator() as any
    const newList = new List(function* () {
      for (const value of generator) {
        if (fn(value)) {
          return yield value
        }
      }
    } as any, this.length)

    return newList.toArray().length >= 1
  }

  /**
   * Inverts the order of the elements in a sequence.
   */
  // reverse(): List<T> {
  //   throw new Error('Not Implemented')
  // }

  // sum<T extends number>(): number {
  //   return this.toArray()
  //     .reduce((acc, curr) => {
  //       return acc + curr
  //     }, 0)
  // }

  /** 
   * Gets the first item in the collection or returns the provided value when undefined
   */
  public headOr(valueWhenUndefined: T): T {
    return this.headOrUndefined() || valueWhenUndefined
  }

  /**
   * Gets the first item in the collection or returns undefined
   */
  public headOrUndefined(): T | undefined {
    return this.generator().next().value as T
  }

  /**
   * Gets the first item in the collection or returns a computed function
   */
  public headOrCompute(fn: () => NonNullable<T>): T {
    return this.headOrUndefined() || fn()
  }

  /**
   * Gets the first item in the collection or throws an error if undefined
   */
  public headOrThrow(msg?: string): T {
    return this.headOrUndefined() || (() => { throw new Error(msg) })()
  }

  /** Convert to standard array */
  public toArray(): T[] {
    return [...this as any] as T[]
  }

  /** Convert to standard array. Alias of toArray() */
  public toIterable(): Iterable<T> {
    return this.toArray()
  }
}
