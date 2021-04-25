/* eslint-disable @typescript-eslint/no-explicit-any */
// Repurposed from this great piece of code: https://gist.github.com/gvergnaud/6e9de8e06ef65e65f18dbd05523c7ca9
// Implements a number of functions from the .NET LINQ library: https://docs.microsoft.com/en-us/dotnet/api/system.linq.enumerable.reverse?view=netcore-3.1

/**
 * A lazily evaluated list with useful extension methods.
 */
export class List<T> {
  [k: string]: any;

  constructor(generator: () => Generator<T, T[], T>, private readonly length: number) {
    this[Symbol.iterator as any] = generator
  }

  private generator(): Generator<T, T[], T> {
    return this[Symbol.iterator as any]() as Generator<T, T[], T>
  }

  private static flattenArgs<T>(args: T[] | Iterable<T>[]): T[] {
    return (args as T[])
      .reduce((acc, curr) => {
        return Array.isArray(curr)
          ? [...acc, ...curr]
          : [...acc, curr]
      }, [] as T[])
  }

  public static of<T>(...args: T[]): List<T> {
    return new List<T>(<() => Generator<T, T[], T>>function* () {
      return yield* args
    }, args.length)
  }

  public static from<T>(iterable?: Iterable<T>): List<T> {
    return iterable
      ? new List(function* () {
        yield* iterable as any
      } as any, (iterable as any).length)
      : List.empty()
  }

  public static range(start: number, end: number, step = 1): List<number> {
    return new List(function* () {
      let i = start
      while (i <= end) {
        yield i
        i += step
      }
    } as any, Math.floor((end - start + 1) / step))
  }

  public static integers(): List<number> {
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

  /**
   * Delete the first N elements from a list.
   * @param count 
   */
  public drop(count: number): List<T> {
    const generator = this.generator() as any
    return new List<T>(function* () {
      let next = generator.next()
      let n = 1

      while (!next.done) {
        if (n > count) yield next.value
        n++
        next = generator.next()
      }
    } as any, this.length - count)
  }

  /**
   * Deletes the first element from a list.
   * @param count 
   */
  tail(): List<T> {
    return this.drop(1)
  }

  public scan<B>(fn: (acc: B, val: B) => B, seed: B): List<B> {
    const generator = this.generator() as any
    return new List(function* () {
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
   * Make a new list containing just the first N elements from an existing list.
   * @param count The number of elements to return.
   */
  public take(count: number): List<T> {
    const generator = this.generator() as any
    return new List(function* () {

      let next = generator.next()
      let n = 0

      while (!next.done && count > n) {
        yield next.value
        n++
        next = generator.next()
      }
    } as any, this.length > count ? count : this.length)
  }

  /**
   * Determines whether all elements of a sequence satisfy a condition.
   */
  public all(fn: (val: T) => boolean): boolean {
    const generator = this.generator()
    const newList = new List<T>(<() => Generator<T, T, T>>function* () {
      for (const value of generator as IterableIterator<T>) {
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
   * Determines whether a sequence contains any elements matching the predicate.
   * @param fn A function to test each element for a condition.
   */
  public any(fn: (val: T) => boolean): boolean {
    const generator = this.generator()
    const newList = new List<T>(<() => Generator<T, T, T>>function* () {
      for (const value of generator as IterableIterator<T>) {
        if (fn(value)) {
          return yield value
        }
      }
    } as any, this.length)

    return newList.toArray().length >= 1
  }

  /**
   * Determines whether a sequence contains any elements matching the predicate.
   * @param fn A function to test each element for a condition.
   * Aliased to any()
   */
  public some(fn: (val: T) => boolean): boolean {
    return this.any(fn)
  }

  /**
   * Filters the elements of the list based on a specified type.
   * @param type The type to filter the elements of the sequence on.
   */
  // eslint-disable-next-line @typescript-eslint/ban-types
  public ofType(type: Function): List<T> {
    return this.filter(a => a instanceof type)
  }

  /**
   * Converts the list into an object with numbered indices mathing the array position of the item.
   */
  public toDictionary(): { [key: number]: T }

  /**
   * Converts the list into an object deriving key from the specified property.
   */
  public toDictionary(key: keyof T): { [key: string]: T }
  public toDictionary(key?: keyof T): { [key: number]: T } | { [key: string]: T } {
    return this.reduce((acc, curr, idx) => {
      return key
        ? curr[key]
          ? { ...acc, [curr[key] as any]: curr }
          : acc
        : { ...acc, [idx]: curr }
    }, {})
  }

  // /**
  //  * Sorts the elements of a sequence in ascending order.
  //  */
  // public orderBy<K extends keyof T>(prop?: T extends object ? K : never): List<T> {
  //   throw Error('Not Implemented')
  // }

  // public orderByDescending(): List<T> {
  //   throw Error('Not Implemented')
  // }

  /**
   * Inverts the order of the elements in a sequence.
   */
  // reverse(): List<T> {
  //   throw new Error('Not Implemented')
  // }

  sum(): number {
    return this
      .toArray()
      .reduce((acc, curr) => {
        return typeof curr === 'number'
          ? acc + curr
          : 0
      }, 0)
  }

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
    return this.headOrUndefined() || ((): never => { throw new Error(msg) })()
  }

  /** Convert to standard array */
  public toArray(): T[] {
    return [...this as any] as T[]
  }

  /** Convert to standard array. Aliased to toArray() */
  public toIterable(): Iterable<T> {
    return this.toArray()
  }
}
