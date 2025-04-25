import { IReader } from './reader.interface'

/**
 * Implementation of the Reader monad for handling environment or configuration-based computations.
 * 
 * @typeParam TConfig - The environment/configuration type
 * @typeParam TOut - The result type
 */
export class Reader<TConfig, TOut> implements IReader<TConfig, TOut> {
  constructor(private readonly fn: (config: TConfig) => TOut) { }

  /**
   * Creates a Reader that always returns a constant value, ignoring the environment.
   * 
   * This is the "pure" or "return" operation for the Reader monad.
   * 
   * @param value - The constant value to return
   * @returns A Reader that always produces the given value
   * 
   * @example
   * // Create a Reader that always returns 42
   * const constReader = Reader.of(42);
   * constReader.run(anyEnvironment) // Returns 42
   */
  public static of<TConfig, TOut>(value: TOut): IReader<TConfig, TOut> {
    return new Reader<TConfig, TOut>(() => value)
  }

  /**
   * Creates a Reader that returns the environment itself.
   * 
   * This is the "ask" operation in ReaderT parlance, which gives access to the
   * entire environment.
   * 
   * @returns A Reader that returns its environment
   * 
   * @example
   * // Create a Reader that provides access to its environment
   * const askReader = Reader.ask<Config>();
   * 
   * // Use it to extract a specific part of the environment
   * const getApiUrl = askReader.map(config => config.apiUrl);
   */
  public static ask<TConfig>(): IReader<TConfig, TConfig> {
    return new Reader<TConfig, TConfig>(config => config)
  }

  /**
   * Creates a new Reader that accesses a specific part of the environment.
   * 
   * @typeParam TConfig - The environment type
   * @typeParam TOut - The type of the property to access
   * @param accessor - Function that extracts a value from the environment
   * @returns A Reader that returns the specified part of the environment
   * 
   * @example
   * // Create a Reader that accesses the apiUrl from a config object
   * const getApiUrl = Reader.asks<AppConfig, string>(config => config.apiUrl);
   * 
   * // Run it with a configuration
   * const url = getApiUrl.run({ apiUrl: 'https://api.example.com', timeout: 5000 });
   * // url is 'https://api.example.com'
   */
  public static asks<TConfig, TOut>(accessor: (config: TConfig) => TOut): IReader<TConfig, TOut> {
    return new Reader<TConfig, TOut>(accessor)
  }

  /**
   * Combines multiple Readers into a single Reader that returns an array of results.
   * 
   * This is useful for running multiple independent operations that share the same
   * environment and collecting their results.
   * 
   * @param readers - Array of Readers to combine
   * @returns A Reader that produces an array of all results
   * 
   * @example
   * // Define individual Readers
   * const getName = Reader.asks<UserConfig, string>(c => c.name);
   * const getAge = Reader.asks<UserConfig, number>(c => c.age);
   * const getEmail = Reader.asks<UserConfig, string>(c => c.email);
   * 
   * // Combine them to get all user info at once
   * const getUserInfo = Reader.sequence([getName, getAge, getEmail]);
   * 
   * // Run with a configuration
   * const userInfo = getUserInfo.run({
   *   name: 'Alice',
   *   age: 30,
   *   email: 'alice@example.com'
   * });
   * // userInfo is ['Alice', 30, 'alice@example.com']
   */
  public static sequence<TConfig, TOut>(readers: Array<IReader<TConfig, TOut>>): IReader<TConfig, TOut[]> {
    return new Reader<TConfig, TOut[]>(config => readers.map(reader => reader.run(config)))
  }

  /**
   * Combines multiple Readers into a single Reader, aggregating their results with a reducer function.
   * 
   * This is useful for combining the results of multiple operations that share
   * the same environment into a single value.
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
   * interface Dependencies {
   *   userService: UserService;
   *   orderService: OrderService;
   * }
   * 
   * // Define Readers for different stats
   * const getActiveUsers = Reader.asks<Dependencies, number>(
   *   deps => deps.userService.countActiveUsers()
   * );
   * const getPendingOrders = Reader.asks<Dependencies, number>(
   *   deps => deps.orderService.countPendingOrders()
   * );
   * const getCompletedOrders = Reader.asks<Dependencies, number>(
   *   deps => deps.orderService.countCompletedOrders()
   * );
   * 
   * // Combine into a dashboard stats object
   * const getDashboardStats = Reader.traverse(
   *   [getActiveUsers, getPendingOrders, getCompletedOrders],
   *   (acc, count, index) => {
   *     if (index === 0) acc.activeUsers = count;
   *     else if (index === 1) acc.pendingOrders = count;
   *     else if (index === 2) acc.completedOrders = count;
   *     return acc;
   *   },
   *   { activeUsers: 0, pendingOrders: 0, completedOrders: 0 }
   * );
   */
  public static traverse<TConfig, TOut, TAcc>(
    readers: Array<IReader<TConfig, TOut>>,
    reducer: (acc: TAcc, value: TOut, index: number) => TAcc,
    initialValue: TAcc
  ): IReader<TConfig, TAcc> {
    return new Reader<TConfig, TAcc>(config => {
      return readers.reduce(
        (acc, reader, index) => reducer(acc, reader.run(config), index),
        initialValue
      )
    })
  }

  /**
   * Combines the results of multiple Readers with a mapping function.
   * 
   * This provides a more ergonomic way to combine several Readers' outputs
   * into a single value using a dedicated mapping function.
   * 
   * @typeParam Args - Tuple type of Reader results
   * @typeParam R - The type of the combined result
   * @param readers - Tuple of Readers
   * @param fn - Function to combine the results
   * @returns A Reader that produces the combined result
   * 
   * @example
   * // Define individual Readers
   * const getUser = Reader.asks<AppDeps, User>(deps => deps.userService.getCurrentUser());
   * const getPermissions = Reader.asks<AppDeps, string[]>(deps => deps.authService.getPermissions());
   * const getSettings = Reader.asks<AppDeps, UserSettings>(deps => deps.settingsService.getUserSettings());
   * 
   * // Combine them into a user profile object
   * const getUserProfile = Reader.combine(
   *   [getUser, getPermissions, getSettings],
   *   (user, permissions, settings) => ({
   *     id: user.id,
   *     name: user.name,
   *     permissions,
   *     theme: settings.theme,
   *     notifications: settings.notifications
   *   })
   * );
   */
  public static combine<TConfig, Args extends unknown[], R>(
    readers: { [K in keyof Args]: IReader<TConfig, Args[K]> },
    fn: (...args: Args) => R
  ): IReader<TConfig, R> {
    return new Reader<TConfig, R>(config => {
      const values = readers.map(reader => reader.run(config)) as Args
      return fn(...values)
    })
  }

  /**
   * Creates a new Reader with the given function.
   * 
   * @param fn - Function that takes a configuration and returns a value
   * @returns A new Reader containing the provided function
   */
  public of(fn: (config: TConfig) => TOut): IReader<TConfig, TOut> {
    return new Reader(fn)
  }

  /**
   * Maps the output of this Reader using the provided function.
   * 
   * Creates a new Reader that first applies this Reader's function to the configuration,
   * then applies the provided mapping function to the result.
   * 
   * @typeParam TNewOut - The type of the mapped result
   * @param fn - Function to transform the output value
   * @returns A new Reader that produces the transformed output
   * 
   * @example
   * // Create a Reader that gets a user object
   * const getUser = Reader.asks<AppDeps, User>(deps => deps.userService.getCurrentUser());
   * 
   * // Map it to extract just the user's name
   * const getUserName = getUser.map(user => user.name);
   * 
   * // When run, getUserName will return just the name string
   */
  public map<TNewOut>(fn: (val: TOut) => TNewOut): IReader<TConfig, TNewOut> {
    return new Reader<TConfig, TNewOut>(c => fn(this.run(c)))
  }

  /**
   * Maps the output to a constant value.
   * 
   * Creates a new Reader that produces the specified value, ignoring the actual output
   * of the original Reader's computation.
   * 
   * @typeParam TNewOut - The type of the new constant value
   * @param val - The constant value to return
   * @returns A new Reader that always produces the specified value
   * 
   * @example
   * // Create a Reader that performs a validation
   * const validateUser = Reader.asks<UserData, boolean>(data => {
   *   return data.username.length >= 3 && data.password.length >= 8;
   * });
   * 
   * // Map to specific success/error messages
   * const successMessage = validateUser
   *   .filter(isValid => isValid, false)
   *   .mapTo("Validation successful!");
   * 
   * const errorMessage = validateUser
   *   .filter(isValid => !isValid, true)
   *   .mapTo("Validation failed!");
   */
  public mapTo<TNewOut>(val: TNewOut): IReader<TConfig, TNewOut> {
    return this.map(() => val)
  }

  /**
   * Chains this Reader with another Reader-producing function.
   * 
   * Creates a new Reader that first applies this Reader's function to the configuration,
   * then passes the result to the provided function to get a new Reader, which is then
   * run with the same configuration.
   * 
   * @typeParam TNewOut - The type of the final result
   * @param fn - Function that takes the output of this Reader and returns a new Reader
   * @returns A new Reader representing the composed operation
   * 
   * @example
   * // Get a user from the configuration
   * const getUser = Reader.asks<AppConfig, User>(config => config.currentUser);
   * 
   * // Define a function that creates a Reader to get user permissions
   * const getPermissions = (user: User) => Reader.asks<AppConfig, string[]>(
   *   config => config.authService.getPermissionsForUser(user.id)
   * );
   * 
   * // Chain the Readers to get the user's permissions
   * const getUserPermissions = getUser.flatMap(getPermissions);
   * 
   * // When run, getUserPermissions will return the permissions array
   */
  public flatMap<TNewOut>(fn: (val: TOut) => IReader<TConfig, TNewOut>): IReader<TConfig, TNewOut> {
    return new Reader<TConfig, TNewOut>(c => fn(this.run(c)).run(c))
  }

  /**
   * Executes the Reader's function with the provided configuration.
   * 
   * @param config - The configuration to use
   * @returns The result of applying the Reader's function to the configuration
   * 
   * @example
   * // Create a Reader that greets a user
   * const greetUser = Reader.asks<{name: string}, string>(config => `Hello, ${config.name}!`);
   * 
   * // Run the Reader with a configuration
   * const greeting = greetUser.run({ name: 'Alice' });
   * // greeting is "Hello, Alice!"
   */
  public run(config: TConfig): TOut {
    return this.fn(config)
  }

  /**
   * Creates a new Reader that applies the given function to the environment before
   * passing it to this Reader.
   * 
   * This is used for modifying the environment/configuration before it reaches the
   * Reader's main function.
   * 
   * @typeParam TNewConfig - The type of the new environment
   * @param fn - Function to transform the environment
   * @returns A new Reader that operates on the new environment type
   * 
   * @example
   * // Create a Reader that requires specific config
   * const getDatabaseUrl = Reader.asks<DatabaseConfig, string>(
   *   config => `${config.protocol}://${config.host}:${config.port}/${config.database}`
   * );
   * 
   * // Make it work with a different config format
   * const getDbUrlFromAppConfig = getDatabaseUrl.local<AppConfig>(
   *   appConfig => appConfig.database
   * );
   * 
   * // Now it can be run with the app config
   * const url = getDbUrlFromAppConfig.run({
   *   database: {
   *     protocol: 'postgres',
   *     host: 'localhost',
   *     port: 5432,
   *     database: 'myapp'
   *   },
   *   // other app config...
   * });
   */
  public local<TNewConfig>(fn: (config: TNewConfig) => TConfig): IReader<TNewConfig, TOut> {
    return new Reader<TNewConfig, TOut>(c => this.run(fn(c)))
  }

  /**
   * Applies a binary function to the results of two Readers.
   * 
   * This method allows you to combine the results of this Reader with another Reader,
   * using both results as inputs to the provided combining function.
   * 
   * @typeParam TNewOut - The type of the other Reader's result
   * @typeParam TCombined - The type of the combined result
   * @param other - Another Reader to combine with this one
   * @param fn - Function that combines both Reader results
   * @returns A new Reader that produces the combined result
   * 
   * @example
   * // Get username from config
   * const getUsername = Reader.asks<UserConfig, string>(config => config.username);
   * 
   * // Get greeting template from config
   * const getGreeting = Reader.asks<UserConfig, string>(config => config.greetingTemplate);
   * 
   * // Combine them to create a personalized greeting
   * const personalizedGreeting = getGreeting.zipWith(
   *   getUsername,
   *   (template, username) => template.replace('{name}', username)
   * );
   * 
   * // When run with config, personalizedGreeting will return the formatted greeting
   */
  public zipWith<TNewOut, TCombined>(
    other: IReader<TConfig, TNewOut>,
    fn: (a: TOut, b: TNewOut) => TCombined
  ): IReader<TConfig, TCombined> {
    return new Reader<TConfig, TCombined>(c => fn(this.run(c), other.run(c)))
  }

  /**
   * Executes side-effect functions and returns the original Reader for chaining.
   * 
   * This method allows you to perform an action using the Reader's value without
   * affecting the Reader itself.
   * 
   * @param fn - A function to execute with the Reader's result value
   * @returns This Reader unchanged, for chaining
   * 
   * @example
   * // Create a Reader to fetch data
   * const fetchUserData = Reader.asks<AppDeps, UserData>(
   *   deps => deps.userService.getCurrentUser()
   * );
   * 
   * // Use tap for logging without affecting the chain
   * const loggedFetchUserData = fetchUserData.tap(
   *   userData => console.log('User data fetched:', userData)
   * );
   * 
   * // Continue with the chain using the original data
   * const userName = loggedFetchUserData.map(userData => userData.name);
   */
  public tap(fn: (val: TOut) => void): IReader<TConfig, TOut> {
    return new Reader<TConfig, TOut>(c => {
      const result = this.run(c)
      fn(result)
      return result
    })
  }

  /**
   * Combines this Reader with another, ignoring the result of this Reader.
   * 
   * This is useful when you want to perform a computation for its effects,
   * but use the result of another Reader.
   * 
   * @typeParam TNewOut - The type of the other Reader's result
   * @param other - The Reader whose result will be used
   * @returns A new Reader that produces the second Reader's result
   * 
   * @example
   * // Create a Reader that logs an action
   * const logAction = Reader.asks<AppDeps, void>(
   *   deps => deps.logger.log('Action performed')
   * );
   * 
   * // Create a Reader that gets a result
   * const getResult = Reader.asks<AppDeps, string>(
   *   deps => deps.service.getResult()
   * );
   * 
   * // Combine them to log and then return the result
   * const logAndGetResult = logAction.andThen(getResult);
   * 
   * // Result will be the string from getResult
   */
  public andThen<TNewOut>(other: IReader<TConfig, TNewOut>): IReader<TConfig, TNewOut> {
    return new Reader<TConfig, TNewOut>(c => {
      this.run(c) // Run for side effects but ignore result
      return other.run(c)
    })
  }

  /**
   * Combines this Reader with another, ignoring the result of the other Reader.
   * 
   * This is useful when you want to perform another computation for its effects,
   * but keep the result of this Reader.
   * 
   * @typeParam TNewOut - The type of the other Reader's result
   * @param other - The Reader to execute after this one
   * @returns A new Reader that produces this Reader's result
   * 
   * @example
   * // Create a Reader that gets a validation result
   * const validateInput = Reader.asks<FormData, ValidationResult>(
   *   data => validateForm(data)
   * );
   * 
   * // Create a Reader that logs the result
   * const logValidation = (result: ValidationResult) => Reader.asks<FormData, void>(
   *   data => console.log(`Validation of form ${data.id}:`, result)
   * );
   * 
   * // Combine them to validate, log, but return the original validation result
   * const validateAndLog = validateInput.flatMap(
   *   result => logValidation(result).mapTo(result)
   * );
   * 
   * // A more elegant solution using andFinally
   * const validateAndLog2 = validateInput.andFinally(
   *   validateInput.flatMap(logValidation)
   * );
   */
  public andFinally<TNewOut>(other: IReader<TConfig, TNewOut>): IReader<TConfig, TOut> {
    return new Reader<TConfig, TOut>(c => {
      const result = this.run(c)
      other.run(c) // Run for side effects but ignore result
      return result
    })
  }

  /**
   * Applies a function from the environment to transform the Reader's output.
   * 
   * This method combines aspects of both `map` and `local` - it allows a transformation
   * based on both the environment and the current output value.
   * 
   * @typeParam TNewOut - The type of the transformed result
   * @param fn - Function that takes the environment and the current output to produce a new output
   * @returns A new Reader that applies the environment-aware transformation
   * 
   * @example
   * // Create a Reader that gets the base translation
   * const getBaseTranslation = Reader.asks<MessageConfig, string>(
   *   config => config.translations[config.messageId]
   * );
   * 
   * // Use withEnv to apply variables from the environment
   * const getFormattedMessage = getBaseTranslation.withEnv(
   *   (config, message) => {
   *     // Replace variables in the message with values from config
   *     return Object.entries(config.variables).reduce(
   *       (msg, [key, value]) => msg.replace(`{${key}}`, value),
   *       message
   *     );
   *   }
   * );
   */
  public withEnv<TNewOut>(fn: (env: TConfig, val: TOut) => TNewOut): IReader<TConfig, TNewOut> {
    return new Reader<TConfig, TNewOut>(c => fn(c, this.run(c)))
  }

  /**
   * Filters the output value using a predicate function.
   * 
   * If the predicate returns true for the output value, the original value is kept.
   * If the predicate returns false, the provided default value is used instead.
   * 
   * @param predicate - Function to test the output value
   * @param defaultValue - Value to use if the predicate returns false
   * @returns A new Reader with the filtered value
   * 
   * @example
   * // Create a Reader that fetches a user's age
   * const getUserAge = Reader.asks<UserProfile, number>(profile => profile.age);
   * 
   * // Filter to ensure the age is valid
   * const getValidUserAge = getUserAge.filter(
   *   age => age >= 0 && age <= 120,  // Valid age range
   *   0  // Default value for invalid ages
   * );
   */
  public filter(predicate: (val: TOut) => boolean, defaultValue: TOut): IReader<TConfig, TOut> {
    return new Reader<TConfig, TOut>(c => {
      const result = this.run(c)
      return predicate(result) ? result : defaultValue
    })
  }

  /**
   * Composes multiple transformations of the same environment.
   * 
   * This creates a new Reader that runs all provided transformation functions
   * and returns an array of their results.
   * 
   * @param fns - Functions that transform the environment to various results
   * @returns A Reader that produces an array of all transformation results
   * 
   * @example
   * // Create a Reader that gets user data
   * const getUserData = Reader.asks<UserProfile, UserData>(profile => profile.userData);
   * 
   * // Use fanout to apply multiple transformations to the user data
   * const getUserStats = getUserData.fanout(
   *   data => data.loginCount,
   *   data => data.lastLoginDate,
   *   data => data.activeSubscriptions.length,
   *   data => data.preferences.theme
   * );
   * 
   * // Result will be an array [loginCount, lastLoginDate, subscriptionCount, theme]
   */
  public fanout<B extends unknown[]>(...fns: Array<(val: TOut) => B[number]>): IReader<TConfig, B> {
    return new Reader<TConfig, B>(c => {
      const value = this.run(c)
      return fns.map(fn => fn(value)) as unknown as B
    })
  }

  /**
   * Creates a Reader that runs asynchronously, returning a Promise.
   * 
   * This method transforms a Reader<E, A> into a function that takes an environment E
   * and returns a Promise<A>, allowing for integration with async/await code.
   * 
   * @returns A function that takes an environment and returns a Promise with the result
   * 
   * @example
   * // Create a Reader that performs a synchronous operation
   * const processData = Reader.asks<DataConfig, ProcessedData>(
   *   config => processDataSynchronously(config.data, config.options)
   * );
   * 
   * // Convert to a Promise-based function for use in async code
   * const processDataAsync = processData.toPromise();
   * 
   * // Use in an async function
   * async function handleDataProcessing(config: DataConfig) {
   *   try {
   *     const result = await processDataAsync(config);
   *     saveResults(result);
   *   } catch (error) {
   *     handleError(error);
   *   }
   * }
   */
  public toPromise(): (env: TConfig) => Promise<TOut> {
    return (env: TConfig) => Promise.resolve(this.run(env))
  }

  /**
   * Creates a Reader that caches its result for repeated calls with the same environment.
   * 
   * This optimization is useful when the Reader's computation is expensive and
   * the same environment is used multiple times.
   * 
   * @param cacheKeyFn - Optional function to derive a cache key from the environment
   * @returns A new Reader that caches results based on the environment
   * 
   * @example
   * // Create a Reader for an expensive computation
   * const computeAnalytics = Reader.asks<AnalyticsConfig, AnalyticsResult>(
   *   config => performExpensiveAnalytics(config.data, config.options)
   * );
   * 
   * // Create a memoized version that will cache results
   * const memoizedAnalytics = computeAnalytics.memoize(
   *   // Custom cache key based on relevant parts of the config
   *   config => `${config.dataVersion}-${config.options.precision}`
   * );
   * 
   * // Running multiple times with the same config will reuse the cached result
   * const result1 = memoizedAnalytics.run(config); // Computed
   * const result2 = memoizedAnalytics.run(config); // Retrieved from cache
   */
  public memoize(cacheKeyFn?: (env: TConfig) => string | number): IReader<TConfig, TOut> {
    const cache = new Map<string | number | TConfig, TOut>()
    return new Reader<TConfig, TOut>(c => {
      const key = cacheKeyFn ? cacheKeyFn(c) : c
      if (cache.has(key)) {
        return cache.get(key) as TOut
      }
      const result = this.run(c)
      cache.set(key, result)
      return result
    })
  }
}
