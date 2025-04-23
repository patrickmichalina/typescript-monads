import { IMonad } from '../monad/monad.interface'
import { IResult } from '../result/result.interface'

/**
 * Defines a pattern matching contract for unwrapping Maybe objects.
 * 
 * This interface provides separate handlers for the Some and None states,
 * enabling exhaustive case analysis when working with Maybe values.
 * 
 * @typeParam TIn - The type of value contained in the Maybe
 * @typeParam TOut - The type of value returned by the pattern matching functions
 */
export interface IMaybePattern<TIn, TOut> {
  /**
   * Function to handle when a value exists (Some case).
   * 
   * @param val - The non-null, non-undefined value contained in the Maybe
   * @returns A value of type TOut
   */
  some(val: NonNullable<TIn>): TOut

  /**
   * Function to handle when a value is null or undefined (None case).
   * 
   * @returns A value of type TOut
   */
  none(): TOut
}

/**
 * A monad that represents optional values, handling the possibility of undefined or null values.
 * 
 * The Maybe monad provides a safe way to work with values that might not exist without
 * explicitly checking for null/undefined at every step. It encapsulates common patterns
 * for handling optional values and enables fluent, chainable operations.
 * 
 * There are two states of Maybe:
 * - Some: Contains a non-null, non-undefined value
 * - None: Represents the absence of a value (null or undefined)
 * 
 * @typeParam T - The type of the value that may be present
 */
export interface IMaybe<T> extends IMonad<T> {

  /**
   * Creates a new Maybe instance containing the provided value.
   * 
   * @param x - The value to wrap in a Maybe
   * @returns A new Maybe containing the value
   * 
   * @example
   * const maybeNumber = maybe.of(42);
   * // Creates a Some Maybe containing 42
   */
  of(x: T): IMaybe<T>

  /**
   * Unwraps a Maybe, returning the contained value if present, or a default value if empty.
   * 
   * @param val - The default value to return if this Maybe is None
   * @returns The contained value if this Maybe is Some, otherwise the provided default value
   * 
   * @example
   * const value = maybe(user.email).valueOr('no-email@example.com');
   * // Returns the user's email if it exists, otherwise returns the default string
   */
  valueOr(val: NonNullable<T>): T

  /**
   * Unwraps a Maybe, returning the contained value if present, or undefined if empty.
   * 
   * @returns The contained value if this Maybe is Some, otherwise undefined
   * 
   * @example
   * const email = maybe(user.email).valueOrUndefined();
   * // Returns the email if it exists, otherwise undefined
   * 
   * // Useful for optional chaining compatibility
   * const optionalValue = maybe(obj.deep.nested.property).valueOrUndefined();
   */
  valueOrUndefined(): T | undefined

  /**
   * Unwraps a Maybe, returning the contained value if present, or null if empty.
   * 
   * @returns The contained value if this Maybe is Some, otherwise null
   * 
   * @example
   * const email = maybe(user.email).valueOrNull();
   * // Returns the email if it exists, otherwise null
   */
  valueOrNull(): T | null

  /**
   * Converts a Maybe to a readonly array containing either the value or nothing.
   * 
   * @returns An array with the contained value if this Maybe is Some, otherwise an empty array
   * 
   * @example
   * const emails = maybe(user.email).toArray();
   * // Returns [email] if email exists, otherwise []
   * 
   * // Useful for functional operations on arrays
   * const allEmails = users
   *   .map(user => maybe(user.email).toArray())
   *   .flat();
   * // Creates an array of only the non-null/undefined emails
   */
  toArray(): ReadonlyArray<T>

  /**
   * Unwraps a Maybe with a lazily computed default value.
   * 
   * Similar to valueOr, but the default value is computed only when needed,
   * which can be more efficient when the default is expensive to compute.
   * 
   * @param f - A function that returns the default value if this Maybe is None
   * @returns The contained value if this Maybe is Some, otherwise the result of calling f
   * 
   * @example
   * const cachedData = maybe(cache.get(key))
   *   .valueOrCompute(() => {
   *     const data = expensiveOperation();
   *     cache.set(key, data);
   *     return data;
   *   });
   * // Only performs the expensive operation if the cache is empty
   */
  valueOrCompute(f: () => NonNullable<T>): T

  /**
   * Unwraps a Maybe, returning the contained value if present, or throwing an error with the specified message.
   * 
   * @param msg - Optional custom error message to use when throwing an error
   * @returns The contained value if this Maybe is Some
   * @throws Error with the provided message (or a default message) if this Maybe is None
   * 
   * @example
   * const email = maybe(user.email).valueOrThrow('Email is required');
   * // Returns the email if it exists, otherwise throws an Error with the message "Email is required"
   */
  valueOrThrow(msg?: string): T

  /**
   * Unwraps a Maybe, returning the contained value if present, or throwing the specified error.
   * 
   * @param err - Optional custom error instance to throw
   * @returns The contained value if this Maybe is Some
   * @throws The provided Error (or a default Error) if this Maybe is None
   * 
   * @example
   * const email = maybe(user.email).valueOrThrowErr(new ValidationError('Email is required'));
   * // Returns the email if it exists, otherwise throws the ValidationError
   */
  valueOrThrowErr(err?: Error): T

  /**
   * Executes side-effect functions based on the state of the Maybe without changing the Maybe.
   * 
   * This is useful for logging, debugging, or performing other side effects
   * without affecting the Maybe chain.
   * 
   * @param val - An object with some/none functions to execute based on the Maybe state
   * 
   * @example
   * maybe(user.email)
   *   .tap({
   *     some: email => console.log(`Found email: ${email}`),
   *     none: () => console.log('No email found')
   *   });
   * // Logs appropriate message but doesn't change the Maybe value
   */
  tap(val: Partial<IMaybePattern<T, void>>): void

  /**
   * Executes a side-effect function when the Maybe is None.
   * 
   * @param f - Function to execute if this Maybe is None
   * 
   * @example
   * maybe(user.email)
   *   .tapNone(() => analytics.track('Missing Email'));
   * // Tracks analytics event only if email is missing
   */
  tapNone(f: () => void): void

  /**
   * Executes a side-effect function when the Maybe is Some.
   * 
   * @param f - Function to execute with the value if this Maybe is Some
   * 
   * @example
   * maybe(user.email)
   *   .tapSome(email => console.log(`Working with email: ${email}`));
   * // Logs message only if email exists
   */
  tapSome(f: (val: T) => void): void

  /**
   * Executes side-effect functions based on the state of the Maybe and returns the original Maybe.
   * 
   * Similar to tap, but returns the Maybe to enable further chaining.
   * 
   * @param val - An object with some/none functions to execute based on the Maybe state
   * @returns This Maybe unchanged, allowing for continued chaining
   * 
   * @example
   * const processedEmail = maybe(user.email)
   *   .tapThru({
   *     some: email => console.log(`Found email: ${email}`),
   *     none: () => console.log('No email found')
   *   })
   *   .map(email => email.toLowerCase());
   * // Logs appropriate message and continues the chain
   */
  tapThru(val: Partial<IMaybePattern<T, void>>): IMaybe<T>

  /**
   * Executes a side-effect function when the Maybe is None and returns the original Maybe.
   * 
   * @param f - Function to execute if this Maybe is None
   * @returns This Maybe unchanged, allowing for continued chaining
   * 
   * @example
   * const processedEmail = maybe(user.email)
   *   .tapThruNone(() => analytics.track('Missing Email'))
   *   .valueOr('default@example.com');
   * // Tracks analytics event if email is missing and continues the chain
   */
  tapThruNone(f: () => void): IMaybe<T>

  /**
   * Executes a side-effect function when the Maybe is Some and returns the original Maybe.
   * 
   * @param f - Function to execute with the value if this Maybe is Some
   * @returns This Maybe unchanged, allowing for continued chaining
   * 
   * @example
   * const processedEmail = maybe(user.email)
   *   .tapThruSome(email => analytics.track('Email Found', { email }))
   *   .map(email => email.toLowerCase());
   * // Tracks analytics event if email exists and continues the chain
   */
  tapThruSome(f: (val: T) => void): IMaybe<T>

  /**
   * Performs pattern matching on the Maybe, applying different functions based on its state.
   * 
   * This is the primary way to exhaustively handle both Some and None cases with different logic.
   * 
   * @typeParam R - The return type of the pattern matching functions
   * @param pattern - An object with functions for handling Some and None cases
   * @returns The result of applying the appropriate function from the pattern
   * 
   * @example
   * const greeting = maybe(user.name).match({
   *   some: name => `Hello, ${name}!`,
   *   none: () => 'Hello, guest!'
   * });
   * // Returns personalized greeting if name exists, otherwise generic greeting
   */
  match<R>(pattern: IMaybePattern<T, R>): R

  /**
   * Transforms the value inside a Some Maybe using the provided function.
   * 
   * If the Maybe is None, it remains None. This follows the standard functor pattern.
   * 
   * @typeParam R - The type of the transformed value
   * @param f - A function to transform the contained value
   * @returns A new Maybe containing the transformed value if this Maybe is Some, otherwise None
   * 
   * @example
   * const upperEmail = maybe(user.email)
   *   .map(email => email.toUpperCase());
   * // Contains uppercase email if email exists, otherwise None
   */
  map<R>(f: (t: T) => NonNullable<R>): IMaybe<R>

  /**
   * Replaces the value inside a Some Maybe with a new value.
   * 
   * If the Maybe is None, it remains None. This is a shorthand for map that ignores the current value.
   * 
   * @typeParam R - The type of the new value
   * @param v - The new value to use if this Maybe is Some
   * @returns A new Maybe containing the new value if this Maybe is Some, otherwise None
   * 
   * @example
   * const defaultEmail = maybe(user.hasEmail)
   *   .mapTo('default@example.com');
   * // Contains 'default@example.com' if hasEmail is true, otherwise None
   */
  mapTo<R>(v: NonNullable<R>): IMaybe<R>

  /**
   * Checks if this Maybe contains a value (is in the Some state).
   * 
   * This is a type guard that helps TypeScript narrow the type when used in conditionals.
   * 
   * @returns true if this Maybe is Some, false if it is None
   * 
   * @example
   * const maybeEmail = maybe(user.email);
   * if (maybeEmail.isSome()) {
   *   // TypeScript knows maybeEmail has a value here
   *   sendEmail(maybeEmail.valueOrThrow());
   * }
   */
  isSome(): boolean

  /**
   * Checks if this Maybe is empty (is in the None state).
   * 
   * This is a type guard that helps TypeScript narrow the type when used in conditionals.
   * 
   * @returns true if this Maybe is None, false if it is Some
   * 
   * @example
   * const maybeEmail = maybe(user.email);
   * if (maybeEmail.isNone()) {
   *   // TypeScript knows maybeEmail is None here
   *   promptForEmail();
   * }
   */
  isNone(): boolean

  /**
   * Chains Maybe operations by applying a function that returns a new Maybe.
   * 
   * This is the core monadic binding operation (>>=) that allows composing operations
   * that might fail. If this Maybe is None, the function is not called.
   * 
   * @typeParam R - The type of value in the new Maybe
   * @param f - A function that takes the value from this Maybe and returns a new Maybe
   * @returns The result of applying f to the value if this Maybe is Some, otherwise None
   * 
   * @example
   * const userCity = maybe(user.profile)
   *   .flatMap(profile => maybe(profile.address))
   *   .flatMap(address => maybe(address.city));
   * // Safely navigates nested optional properties
   */
  flatMap<R>(f: (t: T) => IMaybe<R>): IMaybe<R>

  /**
   * Chains Maybe operations with automatic wrapping of the result in a Maybe.
   * 
   * Similar to flatMap, but the function returns a raw value that will be
   * automatically wrapped in a Maybe. Null/undefined results become None.
   * 
   * @typeParam R - The type of value returned by the function
   * @param fn - A function that takes the value from this Maybe and returns a value (or null/undefined)
   * @returns A Maybe containing the result of applying fn if non-null/undefined, otherwise None
   * 
   * @example
   * const userName = maybe(user)
   *   .flatMapAuto(u => u.profile?.name);
   * // Returns Some(name) if user and profile exist and name is non-null, otherwise None
   */
  flatMapAuto<R>(fn: (v: NonNullable<T>) => R): IMaybe<NonNullable<R>>

  /**
   * Projects a property or derived value from the contained value.
   * 
   * This is a convenient way to access nested properties without explicit
   * mapping. Null/undefined results become None.
   * 
   * @typeParam R - The type of the projected value
   * @param fn - A function that extracts a property or computes a value from the contained value
   * @returns A Maybe containing the projected value if non-null/undefined, otherwise None
   * 
   * @example
   * interface User {
   *   name: string;
   *   email: string;
   * }
   * 
   * const userName = maybe(user)
   *   .project(u => u.name);
   * // Extracts the name property from user if it exists
   */
  project<R extends T[keyof T]>(fn: (d: NonNullable<T>) => R): IMaybe<NonNullable<R>>

  /**
   * Filters a Maybe based on a predicate function.
   * 
   * If the predicate returns true, the Maybe remains unchanged.
   * If the predicate returns false, the Maybe becomes None.
   * 
   * @param fn - A predicate function that tests the contained value
   * @returns This Maybe if it is None or if the predicate returns true, otherwise None
   * 
   * @example
   * const validEmail = maybe(user.email)
   *   .filter(email => email.includes('@'));
   * // Contains the email only if it includes @, otherwise None
   */
  filter(fn: (t: T) => boolean): IMaybe<T>

  /**
   * Applies a wrapped function to the value in this Maybe.
   * 
   * This implements the applicative functor pattern, allowing functions
   * wrapped in a Maybe to be applied to values wrapped in a Maybe.
   * 
   * @typeParam R - The return type of the wrapped function
   * @param fab - A Maybe containing a function to apply to the value in this Maybe
   * @returns A Maybe containing the result of applying the function to the value if both are Some, otherwise None
   * 
   * @example
   * const validateEmail = (email: string) => email.includes('@') ? email : null;
   * const maybeValidate = maybe(validateEmail);
   * const maybeEmail = maybe(user.email);
   * 
   * const validatedEmail = maybeEmail.apply(maybeValidate.map(f => (email: string) => f(email)));
   * // Contains the email if both the validation function and email exist and validation passes
   */
  apply<R>(fab: IMaybe<(t: T) => R>): IMaybe<R>

  /**
   * Converts a Maybe to a Result monad.
   * 
   * This is useful when you need to transition from an optional value (Maybe)
   * to an explicit success/failure model (Result) with a specific error.
   * 
   * @typeParam E - The error type for the Result
   * @param error - The error value to use if this Maybe is None
   * @returns An Ok Result containing the value if this Maybe is Some, otherwise a Fail Result with the error
   * 
   * @example
   * const user = maybe(findUser(id))
   *   .toResult(new Error('User not found'))
   *   .map(user => processUser(user));
   * // Converts a Maybe<User> to a Result<User, Error>
   */
  toResult<E>(error: E): IResult<T, E>

  /**
   * Chains Maybe operations with a function that returns a Promise.
   * 
   * This allows for seamless integration with asynchronous operations.
   * The Promise result is automatically wrapped in a Maybe, with null/undefined
   * or rejected promises resulting in None.
   * 
   * Note on resolution preservation: This method preserves both the Maybe context and 
   * the asynchronous nature of Promises:
   * - None values short-circuit (the Promise-returning function is never called)
   * - Some values are passed to the function, and its Promise result is processed
   * - Promise rejections become None values in the resulting Maybe
   * - Promise resolutions become Some values if non-nullish, None otherwise
   * 
   * This approach preserves the monadic semantics while adding asynchronicity.
   * 
   * @typeParam R - The type of the value in the resulting Promise
   * @param fn - A function that takes the value from this Maybe and returns a Promise
   * @returns A Promise that resolves to a Maybe containing the resolved value
   * 
   * @example
   * maybe(userId)
   *   .flatMapPromise(id => api.fetchUserProfile(id))
   *   .then(profileMaybe => profileMaybe.match({
   *     some: profile => displayProfile(profile),
   *     none: () => showProfileNotFound()
   *   }));
   * 
   * // Chain multiple promises
   * maybe(user)
   *   .flatMapPromise(user => fetchPermissions(user.id))
   *   .then(permissionsMaybe => permissionsMaybe.flatMap(permissions => 
   *     maybe(user).map(user => ({ ...user, permissions }))
   *   ))
   *   .then(userWithPermissions => renderUserDashboard(userWithPermissions));
   */
  flatMapPromise<R>(fn: (val: NonNullable<T>) => Promise<R>): Promise<IMaybe<NonNullable<R>>>

  /**
   * Chains Maybe operations with a function that returns an Observable.
   * 
   * This allows for seamless integration with reactive streams.
   * The Observable result is automatically wrapped in a Maybe, with null/undefined
   * or empty/error emissions resulting in None.
   * 
   * Note on resolution transformation: This method transforms between context types while
   * preserving semantic meaning:
   * - None values short-circuit (the Observable-returning function is never called)
   * - Some values are passed to the function to generate an Observable
   * - Only the first emission from the Observable is captured (timing loss)
   * - Observable emissions become Some values in the resulting Maybe
   * - Observable completion without emissions or errors becomes None
   * - Observable errors become None values
   * 
   * There is timing model transformation: from continuous reactive to one-time asynchronous.
   * 
   * @typeParam R - The type of the value emitted by the resulting Observable
   * @param fn - A function that takes the value from this Maybe and returns an Observable
   * @returns A Promise that resolves to a Maybe containing the first emitted value
   * 
   * @requires rxjs@^7.0
   * @example
   * maybe(userId)
   *   .flatMapObservable(id => userService.getUserSettings(id))
   *   .then(settingsMaybe => settingsMaybe.match({
   *     some: settings => applyUserSettings(settings),
   *     none: () => applyDefaultSettings()
   *   }));
   */
  flatMapObservable<R>(fn: (val: NonNullable<T>) => import('rxjs').Observable<R>): Promise<IMaybe<NonNullable<R>>>
}
