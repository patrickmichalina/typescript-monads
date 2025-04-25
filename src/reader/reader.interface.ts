/**
 * Represents a Reader monad for handling environment or configuration-based computations.
 * 
 * The Reader monad provides a way to read from a shared environment and pass it through
 * a series of computations. It's useful for dependency injection, configuration handling,
 * and composing operations that all need access to the same context.
 * 
 * Type parameters:
 * @typeParam E - The environment/configuration type
 * @typeParam A - The result type
 */
export interface IReader<E, A> {
  /**
   * Creates a new Reader with the given function.
   * 
   * @param fn - Function that takes a configuration and returns a value
   * @returns A new Reader containing the provided function
   */
  of(fn: (config: E) => A): IReader<E, A>

  /**
   * Executes the Reader's function with the provided configuration.
   * 
   * @param config - The configuration to use
   * @returns The result of applying the Reader's function to the configuration
   */
  run(config: E): A

  /**
   * Maps the output of this Reader using the provided function.
   * 
   * Creates a new Reader that first applies this Reader's function to the configuration,
   * then applies the provided mapping function to the result.
   * 
   * @typeParam B - The type of the mapped result
   * @param fn - Function to transform the output value
   * @returns A new Reader that produces the transformed output
   */
  map<B>(fn: (val: A) => B): IReader<E, B>

  /**
   * Chains this Reader with another Reader-producing function.
   * 
   * Creates a new Reader that first applies this Reader's function to the configuration,
   * then passes the result to the provided function to get a new Reader, which is then
   * run with the same configuration.
   * 
   * @typeParam B - The type of the final result
   * @param fn - Function that takes the output of this Reader and returns a new Reader
   * @returns A new Reader representing the composed operation
   */
  flatMap<B>(fn: (val: A) => IReader<E, B>): IReader<E, B>

  /**
   * Creates a new Reader that applies the given function to the environment before
   * passing it to this Reader.
   * 
   * This is used for modifying the environment/configuration before it reaches the
   * Reader's main function.
   * 
   * @typeParam F - The type of the new environment
   * @param fn - Function to transform the environment
   * @returns A new Reader that operates on the new environment type
   */
  local<F>(fn: (env: F) => E): IReader<F, A>

  /**
   * Applies a binary function to the results of two Readers.
   * 
   * This method allows you to combine the results of this Reader with another Reader,
   * using both results as inputs to the provided combining function.
   * 
   * @typeParam B - The type of the other Reader's result
   * @typeParam C - The type of the combined result
   * @param other - Another Reader to combine with this one
   * @param fn - Function that combines both Reader results
   * @returns A new Reader that produces the combined result
   */
  zipWith<B, C>(other: IReader<E, B>, fn: (a: A, b: B) => C): IReader<E, C>

  /**
   * Executes side-effect functions and returns the original Reader for chaining.
   * 
   * This method allows you to perform an action using the Reader's value without
   * affecting the Reader itself.
   * 
   * @param fn - A function to execute with the Reader's result value
   * @returns This Reader unchanged, for chaining
   */
  tap(fn: (val: A) => void): IReader<E, A>

  /**
   * Maps the output to a constant value.
   * 
   * Creates a new Reader that produces the specified value, ignoring the actual output
   * of the original Reader's computation.
   * 
   * @typeParam B - The type of the new constant value
   * @param val - The constant value to return
   * @returns A new Reader that always produces the specified value
   */
  mapTo<B>(val: B): IReader<E, B>

  /**
   * Combines this Reader with another, ignoring the result of this Reader.
   * 
   * This is useful when you want to perform a computation for its effects,
   * but use the result of another Reader.
   * 
   * @typeParam B - The type of the other Reader's result
   * @param other - The Reader whose result will be used
   * @returns A new Reader that produces the second Reader's result
   */
  andThen<B>(other: IReader<E, B>): IReader<E, B>

  /**
   * Combines this Reader with another, ignoring the result of the other Reader.
   * 
   * This is useful when you want to perform another computation for its effects,
   * but keep the result of this Reader.
   * 
   * @typeParam B - The type of the other Reader's result
   * @param other - The Reader to execute after this one
   * @returns A new Reader that produces this Reader's result
   */
  andFinally<B>(other: IReader<E, B>): IReader<E, A>

  /**
   * Applies a function from the environment to transform the Reader's output.
   * 
   * This method combines aspects of both `map` and `local` - it allows a transformation
   * based on both the environment and the current output value.
   * 
   * @typeParam B - The type of the transformed result
   * @param fn - Function that takes the environment and the current output to produce a new output
   * @returns A new Reader that applies the environment-aware transformation
   */
  withEnv<B>(fn: (env: E, val: A) => B): IReader<E, B>

  /**
   * Filters the output value using a predicate function.
   * 
   * If the predicate returns true for the output value, the original value is kept.
   * If the predicate returns false, the provided default value is used instead.
   * 
   * @param predicate - Function to test the output value
   * @param defaultValue - Value to use if the predicate returns false
   * @returns A new Reader with the filtered value
   */
  filter(predicate: (val: A) => boolean, defaultValue: A): IReader<E, A>

  /**
   * Composes multiple transformations of the same environment.
   * 
   * This creates a new Reader that runs all provided transformation functions
   * and returns an array of their results.
   * 
   * @param fns - Functions that transform the environment to various results
   * @returns A Reader that produces an array of all transformation results
   */
  fanout<B extends unknown[]>(...fns: Array<(val: A) => B[number]>): IReader<E, B>

  /**
   * Creates a Reader that runs asynchronously, returning a Promise.
   * 
   * This method transforms a Reader<E, A> into a function that takes an environment E
   * and returns a Promise<A>, allowing for integration with async/await code.
   * 
   * @returns A function that takes an environment and returns a Promise with the result
   */
  toPromise(): (env: E) => Promise<A>

  /**
   * Creates a Reader that caches its result for repeated calls with the same environment.
   * 
   * This optimization is useful when the Reader's computation is expensive and
   * the same environment is used multiple times.
   * 
   * @param cacheKeyFn - Optional function to derive a cache key from the environment
   * @returns A new Reader that caches results based on the environment
   */
  memoize(cacheKeyFn?: (env: E) => string | number): IReader<E, A>
}
