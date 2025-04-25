import { Reader } from './reader'
import { IReader } from './reader.interface'

/**
 * Creates a Reader monad with the given function.
 * 
 * @typeParam TConfig - The environment/configuration type
 * @typeParam TOut - The result type
 * @param fn - Function that takes a configuration and returns a value
 * @returns A Reader containing the provided function
 * 
 * @example
 * // Create a Reader that greets a user
 * const greet = reader<{name: string}, string>(config => `Hello, ${config.name}!`);
 * 
 * // Run it with a configuration
 * const greeting = greet.run({name: 'Alice'}); // Returns 'Hello, Alice!'
 */
export function reader<TConfig, TOut>(fn: (config: TConfig) => TOut): IReader<TConfig, TOut> {
  return new Reader<TConfig, TOut>(fn)
}

/**
 * Creates a Reader that always returns a constant value, ignoring the environment.
 * 
 * @typeParam TConfig - The environment/configuration type
 * @typeParam TOut - The result type
 * @param value - The constant value to return
 * @returns A Reader that always produces the given value
 * 
 * @example
 * // Create a Reader that always returns 42
 * const constReader = readerOf<any, number>(42);
 * constReader.run(anyEnvironment) // Returns 42
 */
export function readerOf<TConfig, TOut>(value: TOut): IReader<TConfig, TOut> {
  return Reader.of<TConfig, TOut>(value)
}

/**
 * Creates a Reader that returns the environment itself.
 * 
 * @typeParam TConfig - The environment/configuration type
 * @returns A Reader that returns its environment
 * 
 * @example
 * // Create a Reader that provides access to its environment
 * const askReader = ask<Config>();
 * 
 * // Use it to extract a specific part of the environment
 * const getApiUrl = askReader.map(config => config.apiUrl);
 */
export function ask<TConfig>(): IReader<TConfig, TConfig> {
  return Reader.ask<TConfig>()
}

/**
 * Creates a Reader that accesses a specific part of the environment.
 * 
 * @typeParam TConfig - The environment type
 * @typeParam TOut - The type of the property to access
 * @param accessor - Function that extracts a value from the environment
 * @returns A Reader that returns the specified part of the environment
 * 
 * @example
 * // Create a Reader that accesses the apiUrl from a config object
 * const getApiUrl = asks<AppConfig, string>(config => config.apiUrl);
 * 
 * // Run it with a configuration
 * const url = getApiUrl.run({ apiUrl: 'https://api.example.com', timeout: 5000 });
 * // url is 'https://api.example.com'
 */
export function asks<TConfig, TOut>(accessor: (config: TConfig) => TOut): IReader<TConfig, TOut> {
  return Reader.asks<TConfig, TOut>(accessor)
}

/**
 * Combines multiple Readers into a single Reader that returns an array of results.
 * 
 * @typeParam TConfig - The shared environment type
 * @typeParam TOut - The type of each Reader's output
 * @param readers - Array of Readers to combine
 * @returns A Reader that produces an array of all results
 * 
 * @example
 * // Define individual Readers
 * const getName = asks<UserConfig, string>(c => c.name);
 * const getAge = asks<UserConfig, number>(c => c.age);
 * const getEmail = asks<UserConfig, string>(c => c.email);
 * 
 * // Combine them to get all user info at once
 * const getUserInfo = sequence([getName, getAge, getEmail]);
 * 
 * // Run with a configuration
 * const userInfo = getUserInfo.run({
 *   name: 'Alice',
 *   age: 30,
 *   email: 'alice@example.com'
 * });
 * // userInfo is ['Alice', 30, 'alice@example.com']
 */
export function sequence<TConfig, TOut>(readers: Array<IReader<TConfig, TOut>>): IReader<TConfig, TOut[]> {
  return Reader.sequence<TConfig, TOut>(readers)
}

/**
 * Combines multiple Readers into a single Reader, aggregating their results with a reducer function.
 * 
 * @typeParam TConfig - The shared environment type
 * @typeParam TOut - The type of each Reader's output
 * @typeParam TAcc - The type of the accumulated result
 * @param readers - Array of Readers to combine
 * @param reducer - Function that combines the results
 * @param initialValue - Initial value for the accumulator
 * @returns A Reader that produces the aggregated result
 * 
 * @example
 * // Define Readers for different stats
 * const getActiveUsers = asks<Dependencies, number>(
 *   deps => deps.userService.countActiveUsers()
 * );
 * const getPendingOrders = asks<Dependencies, number>(
 *   deps => deps.orderService.countPendingOrders()
 * );
 * 
 * // Combine into a dashboard stats object
 * const getDashboardStats = traverse(
 *   [getActiveUsers, getPendingOrders],
 *   (acc, count, index) => {
 *     if (index === 0) acc.activeUsers = count;
 *     else if (index === 1) acc.pendingOrders = count;
 *     return acc;
 *   },
 *   { activeUsers: 0, pendingOrders: 0 }
 * );
 */
export function traverse<TConfig, TOut, TAcc>(
  readers: Array<IReader<TConfig, TOut>>,
  reducer: (acc: TAcc, value: TOut, index: number) => TAcc,
  initialValue: TAcc
): IReader<TConfig, TAcc> {
  return Reader.traverse<TConfig, TOut, TAcc>(readers, reducer, initialValue)
}

/**
 * Combines the results of multiple Readers with a mapping function.
 * 
 * @typeParam TConfig - The shared environment type
 * @typeParam Args - Tuple type of Reader results
 * @typeParam R - The type of the combined result
 * @param readers - Tuple of Readers
 * @param fn - Function to combine the results
 * @returns A Reader that produces the combined result
 * 
 * @example
 * // Define individual Readers
 * const getUser = asks<AppDeps, User>(deps => deps.userService.getCurrentUser());
 * const getPermissions = asks<AppDeps, string[]>(deps => deps.authService.getPermissions());
 * 
 * // Combine them into a user profile object
 * const getUserProfile = combine(
 *   [getUser, getPermissions],
 *   (user, permissions) => ({
 *     id: user.id,
 *     name: user.name,
 *     permissions
 *   })
 * );
 */
export function combine<TConfig, Args extends unknown[], R>(
  readers: { [K in keyof Args]: IReader<TConfig, Args[K]> },
  fn: (...args: Args) => R
): IReader<TConfig, R> {
  return Reader.combine<TConfig, Args, R>(readers, fn)
}
