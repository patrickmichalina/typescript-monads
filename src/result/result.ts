import type { IMaybe } from '../maybe/maybe.interface'
import type { IResultMatchPattern, IResult } from './result.interface'
import { maybe, none } from '../maybe/maybe.factory'

export abstract class Result<TOk, TFail> implements IResult<TOk, TFail> {
  public static ok<TOk, TFail>(value: TOk): IResult<TOk, TFail> {
    return new OkResult<TOk, TFail>(value)
  }

  public static fail<TOk, TFail>(value: TFail): IResult<TOk, TFail> {
    return new FailResult<TOk, TFail>(value)
  }

  /**
   * Creates a Result from a Promise.
   * 
   * Creates a Promise that will resolve to a Result that is:
   * - Ok containing the resolved value if the promise resolves successfully
   * - Fail containing the rejection reason if the promise rejects
   * 
   * This static method makes it easy to convert Promise-based APIs to Result-based
   * error handling, giving you more explicit control flow and type safety.
   * 
   * @param promise The promise to convert to a Result
   * @returns A Promise that resolves to a Result containing either the value or error
   * 
   * @example
   * // Convert a promise to a Result
   * const resultPromise = Result.fromPromise(fetchData());
   * 
   * resultPromise.then(result => {
   *   result.match({
   *     ok: data => renderData(data),
   *     fail: error => showError(error)
   *   });
   * });
   * 
   * // With Promise chaining
   * Result.fromPromise(fetchData())
   *   .then(result => {
   *     if (result.isOk()) {
   *       const data = result.unwrap();
   *       return renderData(data);
   *     } else {
   *       const error = result.unwrapFail();
   *       return showError(error);
   *     }
   *   });
   */
  public static fromPromise<TOk, TFail = unknown>(promise: Promise<TOk>): Promise<IResult<TOk, TFail>> {
    return promise
      .then((value: TOk) => new OkResult<TOk, TFail>(value))
      .catch((error: TFail) => new FailResult<TOk, TFail>(error))
  }

  /**
   * Creates a Result from an Observable.
   * 
   * Creates a Promise that will resolve to a Result that is:
   * - Ok containing the first emitted value if the observable emits a value
   * - Fail containing the provided error if the observable completes without emitting
   * - Fail containing the error if the observable errors
   * 
   * This static method bridges the reactive Observable world with the Result monad,
   * providing a way to handle emissions, completion, and errors in a functional style.
   * 
   * Note that this transformation changes the timing model from continuous/reactive
   * to a one-time asynchronous result. Only the first emission is captured, and the
   * observable is no longer reactive after transformation.
   * 
   * @param observable The observable to convert to a Result
   * @param defaultError The error to use if the observable completes without emitting
   * @returns A Promise that resolves to a Result containing either the value or error
   * 
   * @requires rxjs@^7.0
   * @example
   * // Convert an observable to a Result
   * Result.fromObservable(
   *   userService.getUser(userId),
   *   new Error('User not found')
   * ).then(result => {
   *   result.match({
   *     ok: user => renderUser(user),
   *     fail: error => showUserNotFound(error)
   *   });
   * });
   */
  public static fromObservable<TOk, TFail>(
    observable: import('rxjs').Observable<TOk>, 
    defaultError: TFail
  ): Promise<IResult<TOk, TFail>> {
    return import('rxjs').then(({ firstValueFrom, take, map, catchError }) => {
      return firstValueFrom(
        observable.pipe(
          take(1),
          map((value: TOk) => new OkResult<TOk, TFail>(value)),
          catchError((error: unknown) => {
            // Return the error from the observable directly rather than using EMPTY
            return [new FailResult<TOk, TFail>(error as TFail)]
          })
        )
      ).then(
        (result: IResult<TOk, TFail>) => result,
        () => new FailResult<TOk, TFail>(defaultError) // Handle the case where firstValueFrom rejects
      )
    })
  }

  /**
   * Transforms an array of Result values into a Result containing an array of values.
   * 
   * If all Results in the input array are Ok, returns an Ok Result containing an array of all values.
   * If any Result in the input array is Fail, returns a Fail Result containing the first error encountered.
   * 
   * This is similar to how Promise.all works but for Results, allowing you to combine
   * multiple Results and propagate errors if any occur.
   * 
   * @param results An array of Result values
   * @returns A Result containing either an array of all Ok values or the first Fail error
   * 
   * @example
   * // All Results are Ok
   * const result1 = Result.sequence([
   *   ok(1), 
   *   ok(2), 
   *   ok(3)
   * ]);
   * // result1 is Ok([1, 2, 3])
   * 
   * // One Result is Fail
   * const result2 = Result.sequence([
   *   ok(1), 
   *   fail(new Error('Failed')), 
   *   ok(3)
   * ]);
   * // result2 is Fail(Error('Failed'))
   */
  public static sequence<T, E>(results: ReadonlyArray<IResult<T, E>>): IResult<ReadonlyArray<T>, E> {
    if (results.length === 0) {
      return new OkResult<ReadonlyArray<T>, E>([])
    }

    const values: T[] = []
    for (const r of results) {
      if (r.isFail()) {
        return new FailResult<ReadonlyArray<T>, E>(r.unwrapFail())
      }
      values.push(r.unwrap())
    }
    return new OkResult<ReadonlyArray<T>, E>(values)
  }

  /**
   * Alias for sequence, transforms an array of Result values into a Result containing an array of values.
   * 
   * If all Results in the input array are Ok, returns an Ok Result containing an array of all values.
   * If any Result in the input array is Fail, returns a Fail Result containing the first error encountered.
   * 
   * Named to align with Promise.all for familiarity.
   * 
   * @param results An array of Result values
   * @returns A Result containing either an array of all Ok values or the first Fail error
   * 
   * @example
   * // All Results are Ok
   * const result1 = Result.all([
   *   ok(1), 
   *   ok(2), 
   *   ok(3)
   * ]);
   * // result1 is Ok([1, 2, 3])
   * 
   * // One Result is Fail
   * const result2 = Result.all([
   *   ok(1), 
   *   fail(new Error('Failed')), 
   *   ok(3)
   * ]);
   * // result2 is Fail(Error('Failed'))
   */
  public static all<T, E>(results: ReadonlyArray<IResult<T, E>>): IResult<ReadonlyArray<T>, E> {
    return Result.sequence(results)
  }

  /**
   * Type guard that determines if this Result is an Ok variant.
   * 
   * This method acts as a TypeScript type guard, narrowing the type of the Result
   * to OkResult when it returns true, which helps with type safety in conditional blocks.
   * 
   * @returns true if this Result is an Ok variant, false otherwise
   * 
   * @example
   * const result = getUser(userId);
   * 
   * if (result.isOk()) {
   *   // TypeScript knows that result is OkResult<User, Error> here
   *   const user = result.unwrap(); // Safe to call
   *   console.log(user.name);
   * } else {
   *   // TypeScript knows that result is FailResult<User, Error> here
   *   const error = result.unwrapFail(); // Safe to call
   *   console.error(error.message);
   * }
   */
  abstract isOk(): this is OkResult<TOk, TFail>

  /**
   * Type guard that determines if this Result is a Fail variant.
   * 
   * This method acts as a TypeScript type guard, narrowing the type of the Result
   * to FailResult when it returns true, which helps with type safety in conditional blocks.
   * 
   * @returns true if this Result is a Fail variant, false otherwise
   * 
   * @example
   * const result = authenticate(credentials);
   * 
   * if (result.isFail()) {
   *   // TypeScript knows that result is FailResult<Session, AuthError> here
   *   const error = result.unwrapFail(); // Safe to call
   *   handleAuthError(error);
   * } else {
   *   // TypeScript knows that result is OkResult<Session, AuthError> here
   *   startSession(result.unwrap()); // Safe to call
   * }
   */
  abstract isFail(): this is FailResult<TOk, TFail>

  /**
   * Extracts the Ok value from this Result.
   * 
   * This method should only be called when you're certain that the Result is an Ok variant.
   * If the Result is a Fail variant, this method will throw an exception.
   * 
   * @returns The contained Ok value
   * @throws Error if the Result is a Fail variant
   * 
   * @example
   * // Safe usage with type guard
   * const result = parseJson<Config>(jsonString);
   * 
   * if (result.isOk()) {
   *   const config = result.unwrap();
   *   initializeApp(config);
   * }
   * 
   * // Alternative safe usage with pattern matching
   * result.match({
   *   ok: config => initializeApp(config),
   *   fail: error => showError(error)
   * });
   * 
   * // Unsafe usage (might throw)
   * const config = result.unwrap(); // Throws if result is Fail
   */
  abstract unwrap(): TOk | never

  /**
   * Extracts the Ok value from this Result or returns a default value.
   * 
   * This method provides a safe way to unwrap a Result without risking exceptions.
   * If the Result is an Ok variant, the contained value is returned.
   * If the Result is a Fail variant, the provided default value is returned.
   * 
   * @param opt The default value to return if this Result is a Fail variant
   * @returns The contained Ok value or the provided default
   * 
   * @example
   * // Using unwrapOr for default values
   * const userResult = getUserById(userId);
   * 
   * // If user not found, use a guest user
   * const user = userResult.unwrapOr({
   *   id: 0,
   *   name: "Guest",
   *   role: "visitor"
   * });
   * 
   * // Using unwrapOr in a chain
   * const userName = getUserById(userId)
   *   .map(user => user.name)
   *   .unwrapOr("Unknown User");
   */
  abstract unwrapOr(opt: TOk): TOk

  /**
   * Extracts the Fail value from this Result.
   * 
   * This method should only be called when you're certain that the Result is a Fail variant.
   * If the Result is an Ok variant, this method will throw an exception.
   * 
   * @returns The contained Fail value
   * @throws ReferenceError if the Result is an Ok variant
   * 
   * @example
   * // Safe usage with type guard
   * const result = validateInput(formData);
   * 
   * if (result.isFail()) {
   *   const validationErrors = result.unwrapFail();
   *   displayErrors(validationErrors);
   * }
   * 
   * // Alternative safe usage with pattern matching
   * result.match({
   *   ok: data => submitForm(data),
   *   fail: errors => displayErrors(errors)
   * });
   */
  abstract unwrapFail(): TFail | never

  /**
   * Converts this Result's Ok value to a Maybe.
   * 
   * This method transforms a Result into a Maybe, focusing on the success path:
   * - If this Result is an Ok variant, returns a Some Maybe containing the value
   * - If this Result is a Fail variant, returns a None Maybe
   * 
   * This is useful when you want to continue with Maybe operations and no longer
   * need to track the specific error type.
   * 
   * @returns A Maybe containing the Ok value if present, or None
   * 
   * @example
   * // Converting from Result to Maybe
   * const userResult: Result<User, ApiError> = fetchUser(userId);
   * 
   * // Focus only on the success case by converting to Maybe
   * const userMaybe: Maybe<User> = userResult.maybeOk();
   * 
   * // Continue with Maybe operations
   * const userName = userMaybe
   *   .map(user => user.name)
   *   .valueOr("Unknown User");
   */
  abstract maybeOk(): IMaybe<NonNullable<TOk>>

  /**
   * Converts this Result's Fail value to a Maybe.
   * 
   * This method transforms a Result into a Maybe, focusing on the failure path:
   * - If this Result is a Fail variant, returns a Some Maybe containing the error
   * - If this Result is an Ok variant, returns a None Maybe
   * 
   * This is useful when you want to specifically work with errors when they occur,
   * but don't care about the success value.
   * 
   * @returns A Maybe containing the Fail value if present, or None
   * 
   * @example
   * // Collecting errors across multiple operations
   * const results: Array<Result<any, Error>> = runValidations();
   * 
   * const errors = results
   *   .map(result => result.maybeFail())
   *   .filter(maybeErr => maybeErr.isSome())
   *   .map(maybeErr => maybeErr.valueOrThrow());
   * 
   * if (errors.length > 0) {
   *   displayErrors(errors);
   * }
   */
  abstract maybeFail(): IMaybe<TFail>

  /**
   * Applies a pattern matching object to this Result.
   * 
   * This method provides a functional way to handle both Ok and Fail variants
   * in a single expression, enforcing exhaustive handling of all cases.
   * 
   * @typeParam M - The return type of the pattern matching functions
   * @param fn - An object containing functions to handle each variant:
   *   - `ok`: Function that processes the Ok value
   *   - `fail`: Function that processes the Fail value
   * @returns The result of applying the matching function to the contained value
   * 
   * @example
   * // Basic pattern matching with different return types
   * const result = fetchData();
   * 
   * const message = result.match({
   *   ok: data => `Successfully loaded ${data.items.length} items`,
   *   fail: error => `Error: ${error.message}`
   * });
   * 
   * // Pattern matching for control flow
   * result.match({
   *   ok: data => {
   *     renderData(data);
   *     updateLastFetchTime();
   *   },
   *   fail: error => {
   *     logError(error);
   *     showRetryButton();
   *   }
   * });
   * 
   * // Pattern matching with transformations
   * const apiResponse = makeApiCall()
   *   .match({
   *     ok: successResponse => ({ 
   *       status: 'success', 
   *       data: successResponse 
   *     }),
   *     fail: errorResponse => ({
   *       status: 'error',
   *       message: errorResponse.message,
   *       code: errorResponse.code
   *     })
   *   });
   */
  abstract match<M>(fn: IResultMatchPattern<TOk, TFail, M>): M

  /**
   * Maps the Ok value of this Result using the provided function.
   * 
   * If this Result is an Ok variant, this method transforms the contained value using
   * the provided function and returns a new Ok Result with the transformed value.
   * If this Result is a Fail variant, it returns a new Fail Result with the same error.
   * 
   * This operation is similar to Array.map but for a Result's Ok value.
   * 
   * @typeParam M - The type of the mapped value
   * @param fn - A function that transforms the Ok value
   * @returns A new Result with the transformed value if Ok, or the original error if Fail
   * 
   * @example
   * // Transforming user data
   * const userResult = fetchUser(userId);
   * 
   * const userProfileResult = userResult.map(user => ({
   *   name: user.name,
   *   email: user.email,
   *   avatar: user.avatarUrl || 'default-avatar.png'
   * }));
   * 
   * // Chaining multiple transformations
   * const userNameResult = fetchUser(userId)
   *   .map(user => user.profile)
   *   .map(profile => profile.name)
   *   .map(name => name.toUpperCase());
   * 
   * // Error case is automatically propagated
   * const result = validate("invalid-input") // Returns Fail
   *   .map(value => process(value))          // Map is not applied
   *   .map(result => format(result));        // Map is not applied
   * 
   * // result is still the original Fail value
   */
  abstract map<M>(fn: (val: TOk) => M): IResult<M, TFail>

  /**
   * Maps the Fail value of this Result using the provided function.
   * 
   * If this Result is a Fail variant, this method transforms the error using
   * the provided function and returns a new Fail Result with the transformed error.
   * If this Result is an Ok variant, it returns a new Ok Result with the same value.
   * 
   * This is useful for transforming errors while preserving their failure state.
   * 
   * @typeParam M - The type of the mapped error
   * @param fn - A function that transforms the Fail value
   * @returns A new Result with the transformed error if Fail, or the original value if Ok
   * 
   * @example
   * // Enriching error information
   * const result = fetchData()
   *   .mapFail(error => ({
   *     ...error,
   *     timestamp: new Date(),
   *     context: 'fetchData'
   *   }));
   * 
   * // Converting between error types
   * const standardizedResult = externalApiCall()
   *   .mapFail(apiError => new AppError({
   *     code: mapErrorCode(apiError.code),
   *     message: apiError.message,
   *     source: 'ExternalAPI'
   *   }));
   * 
   * // Localizing error messages
   * const localizedResult = validateInput(form)
   *   .mapFail(errors => errors.map(err => ({
   *     ...err,
   *     message: translateErrorMessage(err.message, currentLocale)
   *   })));
   */
  abstract mapFail<M>(fn: (err: TFail) => M): IResult<TOk, M>

  /**
   * Chains a function that returns another Result.
   * 
   * If this Result is an Ok variant, this method applies the function to the contained value,
   * which returns a new Result. This allows for sequencing operations that might fail.
   * If this Result is a Fail variant, it returns a new Fail Result with the same error without
   * calling the function.
   * 
   * This operation is similar to flatMap/bind in other functional programming contexts.
   * 
   * @typeParam M - The type of the value in the returned Result
   * @param fn - A function that takes the Ok value and returns a new Result
   * @returns The Result returned by fn if this Result is Ok, or a Fail Result with the original error
   * 
   * @example
   * // Sequential operations that might fail
   * const result = parseConfigFile(filePath)
   *   .flatMap(config => validateConfig(config))
   *   .flatMap(validConfig => initializeSystem(validConfig));
   * 
   * // Database transaction example
   * const transactionResult = connectToDatabase()
   *   .flatMap(connection => beginTransaction(connection))
   *   .flatMap(transaction => executeQueries(transaction))
   *   .flatMap(transaction => commitTransaction(transaction));
   * 
   * // Early return on failure
   * const userResult = authenticateUser(credentials) // Might return Fail
   *   .flatMap(user => authorizeUser(user, resource)) // Only called if authentication succeeds
   *   .flatMap(user => loadUserProfile(user));        // Only called if authorization succeeds
   */
  abstract flatMap<M>(fn: (val: TOk) => IResult<M, TFail>): IResult<M, TFail>
  /**
   * Maps the success value of this Result to a Maybe, and then flattens the resulting structure.
   * 
   * This method is particularly useful when working with optional properties or values that might be undefined/null.
   * It allows for seamless chaining of Result and Maybe monads without explicit unwrapping and re-wrapping.
   * 
   * @typeParam M - The type of the value contained in the returned Result if successful
   * @param fn - A function that takes the success value of this Result and returns a Maybe
   * @param err - The error value to use if the Maybe is None
   * @returns 
   *   - If this Result is a Fail: A Fail Result containing the original error
   *   - If this Result is an Ok and fn returns Some: An Ok Result containing the unwrapped value
   *   - If this Result is an Ok but fn returns None: A Fail Result containing the provided err
   * 
   * @example
   * // Type definitions
   * interface User {
   *   id: number;
   *   profile?: {
   *     name: string;
   *     email: string;
   *   };
   * }
   * 
   * // Success path with Some
   * const getUser = (): Result<User, Error> => 
   *   ok({ id: 1, profile: { name: "Alice", email: "alice@example.com" } });
   * 
   * // Chain to access a potentially undefined property safely
   * const getName = getUser()
   *   .flatMapMaybe(
   *     user => maybe(user.profile),
   *     new Error("Profile not found")
   *   )
   *   .map(profile => profile.name);
   * 
   * // getName is Result<string, Error> containing "Alice"
   * 
   * // Using with nullish values
   * type Response = { data?: { value: number } | null };
   * 
   * const response: Response = { data: null };
   * const value = ok<Response, string>(response)
   *   .flatMapMaybe(
   *     res => maybe(res.data),
   *     "No data available"
   *   )
   *   .flatMapMaybe(
   *     data => maybe(data.value),
   *     "Value not present"
   *   );
   * 
   * // Working with arrays and optional chaining
   * interface Post { comments?: Array<{ id: number, text: string }> }
   * 
   * const getFirstComment = (post: Post): Result<string, string> =>
   *   ok(post)
   *     .flatMapMaybe(
   *       p => maybe(p.comments),
   *       "No comments found"
   *     )
   *     .flatMapMaybe(
   *       comments => maybe(comments[0]),
   *       "Comment list is empty"
   *     )
   *     .map(comment => comment.text);
   */
  abstract flatMapMaybe<M>(fn: (val: TOk) => IMaybe<M>, err: TFail): IResult<M, TFail>
  /**
   * Converts an Ok Result into a Fail Result using a transformation function.
   * 
   * This method inverts the Result's state by:
   * - If this Result is an Ok variant, it applies the function to the contained value
   *   to generate an error and returns a Fail Result with that error
   * - If this Result is a Fail variant, it returns the original Fail Result unchanged
   * 
   * This is useful for scenarios where success conditions need to be converted to failures
   * based on the content of the success value.
   * 
   * @param fn - A function that transforms the Ok value into a Fail value
   * @returns A Fail Result with the generated error, or the original Fail Result
   * 
   * @example
   * // Implementing validation logic
   * const userResult = getUserById(userId);
   * 
   * const validatedUser = userResult.toFailWhenOk(user => {
   *   if (!user.isActive) return new Error("User account is inactive");
   *   if (user.accessLevel < requiredLevel) return new Error("Insufficient access level");
   *   return null; // This case won't happen due to TypeScript's return type checking
   * });
   * 
   * // Implementing business rule validation
   * const orderResult = createOrder(orderData);
   * 
   * const validatedOrder = orderResult.toFailWhenOk(order => {
   *   if (order.items.length === 0) return new ValidationError("Order must contain at least one item");
   *   if (order.total < minimumOrderAmount) return new ValidationError(`Order total must be at least ${minimumOrderAmount}`);
   *   return new ValidationError(""); // TypeScript requires a return, but this won't be reached in valid code
   * });
   */
  abstract toFailWhenOk(fn: (val: TOk) => TFail): IResult<TOk, TFail>

  /**
   * Converts an Ok Result into a Fail Result using a provided error value.
   * 
   * This method inverts the Result's state by:
   * - If this Result is an Ok variant, it returns a Fail Result with the provided error
   * - If this Result is a Fail variant, it returns a Fail Result with the provided error,
   *   replacing the original error
   * 
   * This is useful for scenarios where you want to override or standardize error values.
   * 
   * @param val - The error value to use in the returned Fail Result
   * @returns A Fail Result containing the provided error
   * 
   * @example
   * // Standardizing error messages
   * const result = parseInput(rawInput)
   *   .toFailWhenOkFrom(new Error("Input validation failed"));
   * 
   * // Conditional error replacement
   * let result = processData(data);
   * 
   * if (shouldUseStandardError) {
   *   result = result.toFailWhenOkFrom(standardError);
   * }
   * 
   * // Overriding authentication errors with a generic message
   * const authResult = authenticate(credentials)
   *   .toFailWhenOkFrom(new Error("Authentication failed"));
   */
  abstract toFailWhenOkFrom(val: TFail): IResult<TOk, TFail>

  /**
   * Executes side-effect functions based on the Result variant without changing the Result.
   * 
   * This method allows you to perform actions that don't affect the Result's value:
   * - If this Result is an Ok variant, it calls the provided `ok` function with the contained value
   * - If this Result is a Fail variant, it calls the provided `fail` function with the error
   * 
   * Both functions are optional; if not provided, nothing happens for that variant.
   * 
   * @param val - An object containing optional functions for Ok and Fail variants
   * 
   * @example
   * // Logging based on Result variant
   * fetchData().tap({
   *   ok: data => console.log("Data fetched successfully:", data),
   *   fail: error => console.error("Failed to fetch data:", error)
   * });
   * 
   * // Metrics and analytics
   * processPayment(paymentInfo).tap({
   *   ok: result => {
   *     analytics.trackEvent("payment_success", { 
   *       amount: result.amount,
   *       method: result.method
   *     });
   *   },
   *   fail: error => {
   *     analytics.trackEvent("payment_failure", { 
   *       error: error.code,
   *       message: error.message
   *     });
   *   }
   * });
   * 
   * // Partial application (only handling one variant)
   * validateInput(formData).tap({
   *   fail: errors => highlightFormErrors(errors)
   * });
   */
  abstract tap(val: Partial<IResultMatchPattern<TOk, TFail, void>>): void

  /**
   * Executes a side-effect function when this Result is an Ok variant.
   * 
   * This method is a specialized version of `tap` that only handles the Ok case:
   * - If this Result is an Ok variant, it calls the provided function with the contained value
   * - If this Result is a Fail variant, it does nothing
   * 
   * @param f - A function to execute with the Ok value
   * 
   * @example
   * // Logging successful operations
   * saveUser(userData).tapOk(user => {
   *   console.log(`User ${user.id} saved successfully`);
   *   updateLastSavedTimestamp();
   * });
   * 
   * // UI updates on success
   * fetchData().tapOk(data => {
   *   updateUI(data);
   *   hideLoadingIndicator();
   * });
   * 
   * // Analytics for successful operations
   * checkout(cart).tapOk(order => {
   *   analytics.trackPurchase({
   *     orderId: order.id,
   *     amount: order.total,
   *     items: order.items.length
   *   });
   * });
   */
  abstract tapOk(f: (val: TOk) => void): void

  /**
   * Executes a side-effect function when this Result is a Fail variant.
   * 
   * This method is a specialized version of `tap` that only handles the Fail case:
   * - If this Result is a Fail variant, it calls the provided function with the error
   * - If this Result is an Ok variant, it does nothing
   * 
   * @param f - A function to execute with the Fail value
   * 
   * @example
   * // Error logging
   * processRequest(req).tapFail(error => {
   *   logger.error("Request processing failed", {
   *     error: error.message,
   *     stack: error.stack,
   *     requestId: req.id
   *   });
   * });
   * 
   * // UI error handling
   * submitForm(formData).tapFail(errors => {
   *   displayErrors(errors);
   *   highlightInvalidFields(errors);
   *   scrollToFirstError();
   * });
   * 
   * // Monitoring and alerting
   * criticalOperation().tapFail(error => {
   *   if (error.severity === 'high') {
   *     alertOps(error);
   *     incrementFailureCounter();
   *   }
   * });
   */
  abstract tapFail(f: (val: TFail) => void): void

  /**
   * Executes side-effect functions and returns the original Result for chaining.
   * 
   * This method is similar to `tap`, but returns the Result itself to allow for
   * further method chaining:
   * - If this Result is an Ok variant, it calls the provided `ok` function with the contained value
   * - If this Result is a Fail variant, it calls the provided `fail` function with the error
   * 
   * Both functions are optional; if not provided, nothing happens for that variant.
   * 
   * @param val - An object containing optional functions for Ok and Fail variants
   * @returns This Result, unchanged
   * 
   * @example
   * // Chaining operations with logging
   * return fetchUser(userId)
   *   .tapThru({
   *     ok: user => console.log(`User ${user.id} fetched`),
   *     fail: err => console.error(`Failed to fetch user: ${err.message}`)
   *   })
   *   .map(user => transformUser(user))
   *   .tapThru({
   *     ok: profile => console.log(`User profile created`)
   *   });
   * 
   * // Progressive UI updates in a chain
   * processForm(data)
   *   .tapThru({
   *     ok: () => updateProgressBar(0.33)
   *   })
   *   .flatMap(validated => saveToDatabase(validated))
   *   .tapThru({
   *     ok: () => updateProgressBar(0.66),
   *     fail: err => showErrorNotification(err)
   *   })
   *   .flatMap(saved => notifyUser(saved))
   *   .tapThru({
   *     ok: () => updateProgressBar(1.0),
   *     fail: err => showErrorNotification(err)
   *   });
   */
  abstract tapThru(val: Partial<IResultMatchPattern<TOk, TFail, void>>): IResult<TOk, TFail>

  /**
   * Executes a side-effect function when this Result is an Ok variant and returns the original
   * Result for chaining.
   * 
   * This method is a specialized version of `tapThru` that only handles the Ok case:
   * - If this Result is an Ok variant, it calls the provided function with the contained value
   * - If this Result is a Fail variant, it does nothing
   * 
   * In both cases, it returns the original Result unchanged.
   * 
   * @param fn - A function to execute with the Ok value
   * @returns This Result, unchanged
   * 
   * @example
   * // Chaining with logging for successful operations
   * return getUserById(userId)
   *   .tapOkThru(user => console.log(`Found user: ${user.name}`))
   *   .map(user => user.profile)
   *   .tapOkThru(profile => console.log(`Profile accessed`))
   *   .flatMap(profile => getProfileSettings(profile.id));
   * 
   * // Progressive UI updates on success
   * submitOrder(order)
   *   .tapOkThru(() => {
   *     showMessage("Order submitted");
   *     updateProgressStep(1);
   *   })
   *   .flatMap(order => processPayment(order))
   *   .tapOkThru(() => {
   *     showMessage("Payment processed");
   *     updateProgressStep(2);
   *   })
   *   .flatMap(order => finalizeOrder(order));
   */
  abstract tapOkThru(fn: (val: TOk) => void): IResult<TOk, TFail>

  /**
   * Executes a side-effect function when this Result is a Fail variant and returns the original
   * Result for chaining.
   * 
   * This method is a specialized version of `tapThru` that only handles the Fail case:
   * - If this Result is a Fail variant, it calls the provided function with the error
   * - If this Result is an Ok variant, it does nothing
   * 
   * In both cases, it returns the original Result unchanged.
   * 
   * @param fn - A function to execute with the Fail value
   * @returns This Result, unchanged
   * 
   * @example
   * // Chaining with error logging
   * return validateInput(input)
   *   .tapFailThru(errors => logValidationErrors(errors))
   *   .flatMap(input => processInput(input))
   *   .tapFailThru(error => logProcessingError(error))
   *   .flatMap(result => saveResult(result));
   * 
   * // Progressive error handling
   * authenticateUser(credentials)
   *   .tapFailThru(error => {
   *     logAuthFailure(error);
   *     updateLoginAttempts();
   *   })
   *   .flatMap(user => authorizeUser(user, resource))
   *   .tapFailThru(error => {
   *     logAuthorizationFailure(error);
   *     recordAccessAttempt(resource);
   *   });
   * 
   * // Analytics tracking in a chain
   * checkout(cart)
   *   .tapFailThru(error => {
   *     analytics.trackEvent("checkout_failure", {
   *       error: error.code,
   *       step: "initial_validation"
   *     });
   *   })
   *   .flatMap(validCart => processPayment(validCart))
   *   .tapFailThru(error => {
   *     analytics.trackEvent("checkout_failure", {
   *       error: error.code,
   *       step: "payment_processing"
   *     });
   *   });
   */
  abstract tapFailThru(fn: (val: TFail) => void): IResult<TOk, TFail>

  /**
   * Transforms a Fail Result into an Ok Result using a recovery function.
   * 
   * This method provides error handling by:
   * - If this Result is a Fail variant, it applies the function to the error to generate a recovery value
   *   and returns a new Ok Result with that value
   * - If this Result is an Ok variant, it returns the original Result unchanged
   * 
   * This is similar to a catch block in try/catch, but in a functional style.
   * 
   * @param fn - A function that transforms the Fail value into a recovery value
   * @returns An Ok Result with either the original value or the recovered value
   * 
   * @example
   * // Providing default values
   * const userResult = getUserById(userId)
   *   .recover(error => ({
   *     id: 0,
   *     name: "Guest User",
   *     isGuest: true
   *   }));
   * 
   * // userResult is guaranteed to be Ok
   * const user = userResult.unwrap(); // Safe, will never throw
   * 
   * // Error logging with recovery
   * fetchData()
   *   .tapFail(error => logError(error))
   *   .recover(error => {
   *     const fallbackData = getLocalData();
   *     trackRecovery("data_fetch", error);
   *     return fallbackData;
   *   })
   *   .map(data => processData(data)); // This will always run with either fetched or fallback data
   */
  abstract recover(fn: (err: TFail) => TOk): IResult<TOk, TFail>

  /**
   * Transforms a Fail Result by applying a function that returns another Result.
   * 
   * This method provides advanced error recovery by:
   * - If this Result is a Fail variant, it applies the function to the error, which returns a new Result
   * - If this Result is an Ok variant, it returns the original Result unchanged
   * 
   * This is useful for fallback operations that might themselves fail.
   * 
   * @param fn - A function that takes the Fail value and returns a new Result
   * @returns The original Result if Ok, or the Result returned by the function if Fail
   * 
   * @example
   * // Trying a fallback operation that might also fail
   * fetchFromPrimaryAPI()
   *   .recoverWith(error => {
   *     logFailure(error, "primary_api");
   *     // Try the backup API, which might also fail
   *     return fetchFromBackupAPI();
   *   })
   *   .match({
   *     ok: data => renderData(data),
   *     fail: error => showFatalError("All data sources failed")
   *   });
   * 
   * // Authentication with multiple strategies
   * authenticateWithPassword(credentials)
   *   .recoverWith(error => {
   *     if (error.code === "CREDENTIALS_EXPIRED") {
   *       return authenticateWithToken(refreshToken);
   *     }
   *     return fail(error); // Pass through other errors
   *   })
   *   .recoverWith(error => {
   *     if (error.code === "TOKEN_EXPIRED") {
   *       return authenticateWithOAuth();
   *     }
   *     return fail(error); // Pass through other errors
   *   });
   */
  abstract recoverWith(fn: (err: TFail) => IResult<TOk, TFail>): IResult<TOk, TFail>

  /**
   * Returns this Result if it's Ok, otherwise returns the provided fallback Result.
   * 
   * This method allows for specifying an alternative Result:
   * - If this Result is an Ok variant, it is returned unchanged
   * - If this Result is a Fail variant, the fallback Result is returned
   * 
   * @param fallback - The Result to return if this Result is Fail
   * @returns This Result if Ok, or the fallback Result if Fail
   * 
   * @example
   * // Try multiple data sources in order
   * const userData = getUserFromCache(userId)
   *   .orElse(getUserFromDatabase(userId))
   *   .orElse(getUserFromBackupService(userId));
   * 
   * // Providing a default value as a Result
   * const config = loadConfig()
   *   .orElse(ok(DEFAULT_CONFIG));
   * 
   * // config is guaranteed to be Ok
   * const configValue = config.unwrap(); // Safe, will never throw
   */
  abstract orElse(fallback: IResult<TOk, TFail>): IResult<TOk, TFail>

  /**
   * Swaps the Ok and Fail values, creating a new Result with inversed variants.
   * 
   * This method transforms:
   * - An Ok Result into a Fail Result with the same value (now as an error)
   * - A Fail Result into an Ok Result with the same error (now as a value)
   * 
   * This can be useful for inverting logic or for protocols where the error case
   * is actually the expected or desired outcome.
   * 
   * @returns A new Result with the Ok and Fail variants swapped
   * 
   * @example
   * // Inverting validation logic
   * const isInvalid = validateInput(input)  // Returns Ok if valid, Fail if invalid
   *   .swap()                              // Returns Fail if valid, Ok if invalid
   *   .isOk();                             // true if the input was invalid
   * 
   * // Working with negative conditions
   * const userNotFound = findUser(userId)
   *   .swap()
   *   .isOk();  // true if the user was not found
   * 
   * // Converting between error domains
   * checkPermission(user, resource)  // Returns Ok(true) if permitted, Fail(error) if not
   *   .swap()                        // Returns Fail(true) if permitted, Ok(error) if not
   *   .map(error => ({               // Only runs for permission errors
   *     type: 'ACCESS_DENIED',
   *     message: `Access denied: ${error.message}`,
   *     resource
   *   }))
   *   .swap();                       // Back to Ok for permitted, Fail for denied
   */
  abstract swap(): IResult<TFail, TOk>

  /**
   * Combines this Result with another Result using a combining function.
   * 
   * This method allows for working with two independent Results together:
   * - If both Results are Ok, applies the function to both values and returns an Ok Result
   * - If either Result is Fail, returns the first Fail Result encountered
   * 
   * This is useful for combining data that comes from different sources where both
   * are needed to proceed.
   * 
   * @param other - Another Result to combine with this one
   * @param fn - A function that combines the two Ok values
   * @returns A new Result containing either the combined values or the first error
   * 
   * @example
   * // Combining user data and preferences that are loaded separately
   * const userData = fetchUserData(userId);
   * const userPrefs = fetchUserPreferences(userId);
   * 
   * const userProfile = userData.zipWith(
   *   userPrefs,
   *   (data, prefs) => ({
   *     ...data,
   *     preferences: prefs,
   *     theme: prefs.theme || 'default'
   *   })
   * );
   * 
   * // Working with multiple API responses
   * const orders = fetchOrders(userId);
   * const payments = fetchPayments(userId);
   * 
   * const combinedData = orders.zipWith(
   *   payments,
   *   (orderList, paymentList) => {
   *     return orderList.map(order => ({
   *       ...order,
   *       payments: paymentList.filter(p => p.orderId === order.id)
   *     }));
   *   }
   * );
   */
  abstract zipWith<U, R>(other: IResult<U, TFail>, fn: (a: TOk, b: U) => R): IResult<R, TFail>

  /**
   * Maps the Ok value of this Result to a Promise, and then flattens the resulting structure.
   * 
   * This method allows for seamless integration with asynchronous code:
   * - If this Result is an Ok variant, it applies the function to the contained value, 
   *   resolves the Promise, and wraps the resolved value in a new Ok Result
   * - If the Promise rejects, it returns a Fail Result with the rejection reason
   * - If this Result is a Fail variant, it returns a Promise that resolves to the 
   *   original Fail Result without calling the function
   * 
   * @param fn - A function that takes the Ok value and returns a Promise
   * @returns A Promise that resolves to a new Result
   * 
   * @example
   * // Chaining synchronous and asynchronous operations
   * validateUser(userData)
   *   .flatMapPromise(user => saveUserToDatabase(user))
   *   .then(result => result.match({
   *     ok: savedUser => sendWelcomeEmail(savedUser),
   *     fail: error => logError("Failed to save user", error)
   *   }));
   * 
   * // Multi-step asynchronous workflow
   * function processOrder(orderData) {
   *   // Start with sync validation returning a Result
   *   return validateOrder(orderData)
   *     .flatMapPromise(order => {
   *       // Async payment processing
   *       return processPayment(order.paymentDetails).then(paymentResult => {
   *         if (!paymentResult.success) {
   *           throw new Error(`Payment failed: ${paymentResult.message}`);
   *         }
   *         
   *         // Async inventory check and allocation
   *         return allocateInventory(order.items).then(() => {
   *           // Return the processed order
   *           return {
   *             ...order,
   *             status: 'PAID',
   *             paymentId: paymentResult.id
   *           };
   *         });
   *       });
   *     })
   *     .flatMapPromise(paidOrder => {
   *       // Final database save
   *       return saveOrderToDatabase(paidOrder).then(orderId => {
   *         return { ...paidOrder, id: orderId };
   *       });
   *     });
   * }
   */
  abstract flatMapPromise<M>(fn: (val: TOk) => Promise<M>): Promise<IResult<M, TFail>>

  /**
   * Maps the Ok value of this Result to an Observable, and then flattens the resulting structure.
   * 
   * This method allows for seamless integration with reactive code:
   * - If this Result is an Ok variant, it applies the function to the contained value,
   *   subscribes to the Observable, and wraps the first emitted value in a new Ok Result
   * - If the Observable errors, it returns a Fail Result with the error
   * - If the Observable completes without emitting, it returns a Fail Result with the provided default error
   * - If this Result is a Fail variant, it returns a Promise that resolves to the 
   *   original Fail Result without calling the function
   * 
   * @param fn - A function that takes the Ok value and returns an Observable
   * @param defaultError - The error to use if the Observable completes without emitting
   * @returns A Promise that resolves to a new Result
   * 
   * @requires rxjs@^7.0
   * @example
   * // Chaining Result with reactive code
   * validateUser(userData)
   *   .flatMapObservable(
   *     user => userService.save(user),
   *     new Error("Failed to save user")
   *   )
   *   .then(result => result.match({
   *     ok: savedUser => notifyUserCreated(savedUser),
   *     fail: error => logError("User creation failed", error)
   *   }));
   * 
   * // Processing real-time data
   * getSensorData()
   *   .flatMapObservable(
   *     config => sensorApi.connectAndGetReading(config),
   *     new Error("No sensor reading received")
   *   )
   *   .then(result => result.match({
   *     ok: reading => updateDashboard(reading),
   *     fail: error => showSensorError(error)
   *   }));
   */
  abstract flatMapObservable<M>(
    fn: (val: TOk) => import('rxjs').Observable<M>,
    defaultError: TFail
  ): Promise<IResult<M, TFail>>
}

export class OkResult<TOk, TFail> extends Result<TOk, TFail> {
  constructor(private readonly successValue: TOk) {
    super()
  }

  /**
   * Returns true as this is an Ok Result variant.
   * 
   * This implementation satisfies the abstract method from the Result class
   * and serves as a TypeScript type guard, allowing TypeScript to narrow the 
   * type to OkResult when `isOk()` returns true.
   * 
   * @returns true (always, for OkResult instances)
   */
  isOk(): this is OkResult<TOk, TFail> {
    return true
  }

  /**
   * Returns false as this is not a Fail Result variant.
   * 
   * This implementation satisfies the abstract method from the Result class
   * and serves as a TypeScript type guard that will never narrow the type
   * to FailResult for an OkResult instance.
   * 
   * @returns false (always, for OkResult instances)
   */
  isFail(): this is FailResult<TOk, TFail> {
    return false
  }

  /**
   * Extracts the contained Ok value.
   * 
   * Since this is an OkResult, this method safely returns the contained value
   * without any risk of exceptions.
   * 
   * @returns The contained Ok value
   */
  unwrap(): TOk {
    return this.successValue
  }

  /**
   * Extracts the contained Ok value or returns a default.
   * 
   * Since this is an OkResult, this method simply returns the contained
   * value and ignores the default value parameter.
   * 
   * @param opt The default value (not used in OkResult implementation)
   * @returns The contained Ok value
   */
  unwrapOr(): TOk {
    return this.unwrap()
  }

  /**
   * Attempts to extract the contained Fail value, but throws since this is an OkResult.
   * 
   * This method is unsafe to call on an OkResult and will always throw an exception.
   * 
   * @throws ReferenceError Always throws with message 'Cannot unwrap a success as a failure'
   * @returns Never returns a value, always throws
   */
  unwrapFail(): never {
    throw new ReferenceError('Cannot unwrap a success as a failure')
  }

  /**
   * Converts this Ok Result to a Some Maybe containing the success value.
   * 
   * This method transforms the Ok Result into a Maybe, focusing on the success path.
   * It always returns a Some Maybe for OkResult instances.
   * 
   * @returns A Some Maybe containing the non-nullable success value
   */
  maybeOk(): IMaybe<NonNullable<TOk>> {
    return maybe(this.successValue as NonNullable<TOk>)
  }

  /**
   * Converts this Ok Result to a None Maybe.
   * 
   * This method transforms the Ok Result into a Maybe, focusing on the failure path.
   * Since this is an OkResult with no error value, it always returns a None Maybe.
   * 
   * @returns A None Maybe (always, for OkResult instances)
   */
  maybeFail(): IMaybe<TFail> {
    return none()
  }

  /**
   * Applies the success branch of a pattern matching object to this Ok Result.
   * 
   * This method provides a functional way to handle the Ok variant specifically.
   * For OkResult instances, only the 'ok' function of the pattern is called.
   * 
   * @typeParam M - The return type of the pattern matching functions
   * @param fn - An object containing functions to handle each Result variant
   * @returns The result of applying the 'ok' function to the contained value
   */
  match<M>(fn: IResultMatchPattern<TOk, TFail, M>): M {
    return fn.ok(this.successValue)
  }

  /**
   * Maps the Ok value using the provided function.
   * 
   * For OkResult instances, this transforms the contained value using the provided
   * function and returns a new OkResult with the transformed value.
   * 
   * @typeParam M - The type of the mapped value
   * @param fn - A function that transforms the Ok value
   * @returns A new OkResult with the transformed value
   */
  map<M>(fn: (val: TOk) => M): IResult<M, TFail> {
    return Result.ok<M, TFail>(fn(this.successValue))
  }

  /**
   * Maps the Fail value using the provided function, which is a no-op for OkResult.
   * 
   * For OkResult instances, this method ignores the mapping function since there is
   * no error value to transform. It returns a new OkResult with the same success value
   * but with the new error type parameter.
   * 
   * @typeParam M - The type of the mapped error (only changes the type parameter)
   * @param fn - A function that would transform the Fail value (not used in OkResult)
   * @returns A new OkResult with the same success value and updated error type
   */
  mapFail<M>(): IResult<TOk, M> {
    return Result.ok(this.successValue)
  }

  /**
   * Chains a function that returns another Result, applying it to the contained value.
   * 
   * This is the monadic bind operation for Result. For OkResult instances, it applies
   * the function to the contained value and returns the resulting Result directly.
   * 
   * @typeParam M - The type of the value in the returned Result
   * @param fn - A function that takes the Ok value and returns a new Result
   * @returns The Result returned by applying the function to the contained value
   */
  flatMap<M>(fn: (val: TOk) => IResult<M, TFail>): IResult<M, TFail> {
    return fn(this.successValue)
  }

  /**
   * Maps the success value to a Maybe, and flattens the resulting structure.
   * 
   * Since this is an Ok Result, the function is applied to the contained value.
   * The result depends on whether the Maybe is Some or None:
   * - If Some: Returns an Ok Result with the unwrapped value
   * - If None: Returns a Fail Result with the provided error
   * 
   * This implementation follows the monadic bind operation pattern where we:
   * 1. Apply the function to get a Maybe
   * 2. Match on the Maybe to convert it back to a Result
   * 
   * @param fn Function mapping the contained value to a Maybe
   * @param err Error value to use if the Maybe is None
   * @returns Either an Ok Result with the unwrapped value or a Fail Result with the provided error
   */
  flatMapMaybe<M>(fn: (val: TOk) => IMaybe<M>, err: TFail): IResult<M, TFail> {
    return fn(this.successValue).match({
      some: (val) => Result.ok<M, TFail>(val),
      none: () => Result.fail<M, TFail>(err)
    })
  }

  /**
   * Converts this Ok Result into a Fail Result using a transformation function.
   * 
   * For OkResult instances, this method applies the function to the contained value
   * to generate an error and returns a new Fail Result with that error.
   * 
   * @param fn - A function that transforms the Ok value into a Fail value
   * @returns A Fail Result with the error generated from the contained value
   */
  toFailWhenOk(fn: (val: TOk) => TFail): IResult<TOk, TFail> {
    return Result.fail(fn(this.successValue))
  }

  /**
   * Converts this Ok Result into a Fail Result using a provided error value.
   * 
   * For OkResult instances, this method ignores the contained value and returns
   * a new Fail Result with the provided error value.
   * 
   * @param val - The error value to use in the returned Fail Result
   * @returns A Fail Result containing the provided error
   */
  toFailWhenOkFrom(val: TFail): IResult<TOk, TFail> {
    return Result.fail(val)
  }

  /**
   * Executes a side-effect function for this Ok Result.
   * 
   * For OkResult instances, this method calls the 'ok' function if provided.
   * The 'fail' function is never called, even if provided.
   * 
   * @param val - An object containing optional functions for Ok and Fail variants
   */
  tap(val: Partial<IResultMatchPattern<TOk, TFail, void>>): void {
    typeof val.ok === 'function' && val.ok(this.successValue)
  }

  /**
   * Executes a side-effect function with the contained Ok value.
   * 
   * For OkResult instances, this method always calls the provided function
   * with the contained value.
   * 
   * @param fn - A function to execute with the Ok value
   */
  tapOk(fn: (val: TOk) => void): void {
    fn(this.successValue)
  }

  /**
   * No-op method for consistency with the Result interface.
   * 
   * For OkResult instances, this method does nothing since there is no error
   * value to operate on.
   */
  tapFail(): void { }
  
  /**
   * No-op method that returns this Result for chaining.
   * 
   * For OkResult instances, this method simply returns the current Result
   * without calling any function since there is no error value to operate on.
   * 
   * @returns This Result unchanged
   */
  tapFailThru(): IResult<TOk, TFail> {
    return this
  }

  /**
   * Executes a side-effect function with the Ok value and returns this Result for chaining.
   * 
   * For OkResult instances, this method calls the provided function with the
   * contained value and then returns the original Result unchanged.
   * 
   * @param fn - A function to execute with the Ok value
   * @returns This Result unchanged
   */
  tapOkThru(fn: (val: TOk) => void): IResult<TOk, TFail> {
    this.tapOk(fn)
    return this
  }

  /**
   * Executes a side-effect function and returns this Result for chaining.
   * 
   * For OkResult instances, this method calls the 'ok' function if provided
   * and then returns the original Result unchanged.
   * 
   * @param val - An object containing optional functions for Ok and Fail variants
   * @returns This Result unchanged
   */
  tapThru(val: Partial<IResultMatchPattern<TOk, TFail, void>>): IResult<TOk, TFail> {
    this.tap(val)
    return this
  }

  /**
   * No-op for OkResult, returns this Result unchanged.
   * 
   * Since this is already an OkResult, there's no need to recover from an error.
   * This method simply returns the current Result.
   * 
   * @returns This Result unchanged
   */
  recover(): IResult<TOk, TFail> {
    return this
  }

  /**
   * No-op for OkResult, returns this Result unchanged.
   * 
   * Since this is already an OkResult, there's no need to recover with another Result.
   * This method simply returns the current Result.
   * 
   * @returns This Result unchanged
   */
  recoverWith(): IResult<TOk, TFail> {
    return this
  }

  /**
   * Returns this Result since it's already an Ok variant.
   * 
   * For OkResult instances, this method ignores the fallback Result and
   * returns the current Result unchanged.
   * 
   * @returns This Result unchanged
   */
  orElse(): IResult<TOk, TFail> {
    return this
  }

  /**
   * Swaps the Ok and Fail values, creating a new Fail Result.
   * 
   * For OkResult instances, this method transforms the contained success value
   * into an error and returns a new Fail Result with that error.
   * 
   * @returns A new Fail Result with the success value as an error
   */
  swap(): IResult<TFail, TOk> {
    return Result.fail<TFail, TOk>(this.successValue)
  }

  /**
   * Combines this Result with another Result using a combining function.
   * 
   * For OkResult instances, this method applies the function to both values
   * if the other Result is also Ok, or returns the other Result if it's a Fail.
   * 
   * @param other - Another Result to combine with this one
   * @param fn - A function that combines the two Ok values
   * @returns A new Result containing either the combined values or the error from the other Result
   */
  zipWith<U, R>(other: IResult<U, TFail>, fn: (a: TOk, b: U) => R): IResult<R, TFail> {
    return other.flatMap(otherValue => Result.ok<R, TFail>(fn(this.successValue, otherValue)))
  }

  /**
   * Maps the Ok value of this Result to a Promise, and then flattens the resulting structure.
   * 
   * For OkResult instances, this method applies the function to the contained value,
   * awaits the Promise, and wraps the resolved value in a new Ok Result.
   * If the Promise rejects, it returns a Fail Result with the rejection reason.
   * 
   * @param fn - A function that takes the Ok value and returns a Promise
   * @returns A Promise that resolves to a new Result
   */
  flatMapPromise<M>(fn: (val: TOk) => Promise<M>): Promise<IResult<M, TFail>> {
    return fn(this.successValue)
      .then((value: M) => Result.ok<M, TFail>(value))
      .catch((error: TFail) => Result.fail<M, TFail>(error))
  }

  /**
   * Maps the Ok value of this Result to an Observable, and then flattens the resulting structure.
   * 
   * For OkResult instances, this method applies the function to the contained value,
   * subscribes to the Observable, and wraps the first emitted value in a new Ok Result.
   * If the Observable errors, it returns a Fail Result with the error.
   * If the Observable completes without emitting, it returns a Fail Result with the provided default error.
   * 
   * @param fn - A function that takes the Ok value and returns an Observable
   * @param defaultError - The error to use if the Observable completes without emitting
   * @returns A Promise that resolves to a new Result
   * 
   * @requires rxjs@^7.0
   */
  flatMapObservable<M>(
    fn: (val: TOk) => import('rxjs').Observable<M>,
    defaultError: TFail
  ): Promise<IResult<M, TFail>> {
    return import('rxjs').then(({ firstValueFrom, take, map, catchError }) => {
      return firstValueFrom(
        fn(this.successValue).pipe(
          take(1),
          map((value: M) => Result.ok<M, TFail>(value)),
          catchError((error: unknown) => {
            // Return the error from the observable directly rather than using EMPTY
            return [Result.fail<M, TFail>(error as TFail)]
          })
        )
      ).then(
        (result: IResult<M, TFail>) => result,
        () => Result.fail<M, TFail>(defaultError) // Handle the case where firstValueFrom rejects
      )
    })
  }
}

export class FailResult<TOk, TFail> extends Result<TOk, TFail> implements IResult<TOk, TFail>  {
  constructor(private readonly failureValue: TFail) {
    super()
  }

  /**
   * Returns false as this is not an Ok Result variant.
   * 
   * This implementation satisfies the abstract method from the Result class
   * and serves as a TypeScript type guard that will never narrow the type
   * to OkResult for a FailResult instance.
   * 
   * @returns false (always, for FailResult instances)
   */
  isOk(): this is OkResult<TOk, TFail> {
    return false
  }

  /**
   * Returns true as this is a Fail Result variant.
   * 
   * This implementation satisfies the abstract method from the Result class
   * and serves as a TypeScript type guard, allowing TypeScript to narrow the
   * type to FailResult when `isFail()` returns true.
   * 
   * @returns true (always, for FailResult instances)
   */
  isFail(): this is FailResult<TOk, TFail> {
    return true
  }

  /**
   * Attempts to extract the contained Ok value, but throws since this is a FailResult.
   * 
   * This method is unsafe to call on a FailResult and will always throw an exception.
   * 
   * @throws Error Always throws with message 'Cannot unwrap a failure'
   * @returns Never returns a value, always throws
   */
  unwrap(): TOk {
    throw new Error('Cannot unwrap a failure')
  }

  /**
   * Extracts the contained Ok value or returns a default.
   * 
   * Since this is a FailResult, this method always returns the provided default
   * value because there is no success value to extract.
   * 
   * @param opt The default value to return
   * @returns The provided default value
   */
  unwrapOr(opt: TOk): TOk {
    return opt
  }

  /**
   * Extracts the contained Fail value.
   * 
   * Since this is a FailResult, this method safely returns the contained error
   * without any risk of exceptions.
   * 
   * @returns The contained Fail value
   */
  unwrapFail(): TFail {
    return this.failureValue
  }

  /**
   * Converts this Fail Result to a None Maybe.
   * 
   * This method transforms the Fail Result into a Maybe, focusing on the success path.
   * Since this is a FailResult with no success value, it always returns a None Maybe.
   * 
   * @returns A None Maybe (always, for FailResult instances)
   */
  maybeOk(): IMaybe<NonNullable<TOk>> {
    return none()
  }

  /**
   * Converts this Fail Result to a Some Maybe containing the error value.
   * 
   * This method transforms the Fail Result into a Maybe, focusing on the failure path.
   * It always returns a Some Maybe for FailResult instances.
   * 
   * @returns A Some Maybe containing the error value
   */
  maybeFail(): IMaybe<TFail> {
    return maybe(this.failureValue)
  }

  /**
   * Applies the failure branch of a pattern matching object to this Fail Result.
   * 
   * This method provides a functional way to handle the Fail variant specifically.
   * For FailResult instances, only the 'fail' function of the pattern is called.
   * 
   * @typeParam M - The return type of the pattern matching functions
   * @param fn - An object containing functions to handle each Result variant
   * @returns The result of applying the 'fail' function to the contained error
   */
  match<M>(fn: IResultMatchPattern<TOk, TFail, M>): M {
    return fn.fail(this.failureValue)
  }

  /**
   * Maps the Fail value using the provided function.
   * 
   * For FailResult instances, this transforms the contained error using the provided
   * function and returns a new FailResult with the transformed error.
   * 
   * @typeParam M - The type of the mapped error
   * @param fn - A function that transforms the Fail value
   * @returns A new FailResult with the transformed error
   */
  mapFail<M>(fn: (err: TFail) => M): IResult<TOk, M> {
    return Result.fail(fn(this.failureValue))
  }

  /**
   * Maps the Ok value using the provided function, which is a no-op for FailResult.
   * 
   * For FailResult instances, this method ignores the mapping function since there is
   * no success value to transform. It returns a new FailResult with the same error value
   * but with the new success type parameter.
   * 
   * @typeParam M - The type of the mapped value (only changes the type parameter)
   * @returns A new FailResult with the same error and updated success type
   */
  map<M>(): IResult<M, TFail> {
    return Result.fail(this.failureValue)
  }

  /**
   * Chains a function that returns another Result, which is a no-op for FailResult.
   * 
   * For FailResult instances, this method ignores the mapping function since there
   * is no success value to transform. It returns a new FailResult with the same error
   * but with the new success type parameter.
   * 
   * This follows the monadic law that operations on failures should not execute the transformation.
   * 
   * @typeParam M - The type of the value in the returned Result (only changes the type parameter)
   * @returns A FailResult with the same error and updated success type
   */
  flatMap<M>(): IResult<M, TFail> {
    return Result.fail(this.failureValue)
  }
  
  /**
   * Short-circuits the flatMapMaybe operation for Fail Results.
   * 
   * Since this is a Fail Result, the function is not applied and the original error is preserved.
   * This follows the monadic law that operations on failures should not execute the transformation.
   * 
   * @returns A Fail Result containing the original error
   */
  flatMapMaybe<M>(): IResult<M, TFail> {
    return Result.fail<M, TFail>(this.failureValue)
  }

  /**
   * No-op method for consistency with the Result interface.
   * 
   * For FailResult instances, this method simply returns the current Result
   * unchanged since it's already a Fail variant.
   * 
   * @returns This Result unchanged
   */
  toFailWhenOk(): IResult<TOk, TFail> {
    return this
  }

  /**
   * Converts this Fail Result into a new Fail Result with the provided error value.
   * 
   * For FailResult instances, this method returns a new Fail Result with the provided
   * error value, replacing the original error.
   * 
   * @param val - The new error value to use
   * @returns A Fail Result containing the provided error
   */
  toFailWhenOkFrom(val: TFail): IResult<TOk, TFail> {
    return Result.fail(val)
  }

  /**
   * Executes a side-effect function for this Fail Result.
   * 
   * For FailResult instances, this method calls the 'fail' function if provided.
   * The 'ok' function is never called, even if provided.
   * 
   * @param val - An object containing optional functions for Ok and Fail variants
   */
  tap(val: Partial<IResultMatchPattern<TOk, TFail, void>>): void {
    typeof val.fail === 'function' && val.fail(this.failureValue)
  }

  /**
   * No-op method for consistency with the Result interface.
   * 
   * For FailResult instances, this method does nothing since there is no success
   * value to operate on.
   */
  tapOk(): void { }

  /**
   * Executes a side-effect function with the contained Fail value.
   * 
   * For FailResult instances, this method always calls the provided function
   * with the contained error value.
   * 
   * @param fn - A function to execute with the Fail value
   */
  tapFail(fn: (val: TFail) => void): void {
    fn(this.failureValue)
  }

  /**
   * Executes a side-effect function with the Fail value and returns this Result for chaining.
   * 
   * For FailResult instances, this method calls the provided function with the
   * contained error value and then returns the original Result unchanged.
   * 
   * @param fn - A function to execute with the Fail value
   * @returns This Result unchanged
   */
  tapFailThru(fn: (val: TFail) => void): IResult<TOk, TFail> {
    this.tapFail(fn)
    return this
  }

  /**
   * No-op method that returns this Result for chaining.
   * 
   * For FailResult instances, this method simply returns the current Result
   * without calling any function since there is no success value to operate on.
   * 
   * @returns This Result unchanged
   */
  tapOkThru(): IResult<TOk, TFail> {
    return this
  }

  /**
   * Executes a side-effect function and returns this Result for chaining.
   * 
   * For FailResult instances, this method calls the 'fail' function if provided
   * and then returns the original Result unchanged.
   * 
   * @param val - An object containing optional functions for Ok and Fail variants
   * @returns This Result unchanged
   */
  tapThru(val: Partial<IResultMatchPattern<TOk, TFail, void>>): IResult<TOk, TFail> {
    this.tap(val)
    return this
  }

  /**
   * Transforms this Fail Result into an Ok Result using a recovery function.
   * 
   * For FailResult instances, this method applies the function to the contained error
   * to generate a recovery value and returns a new Ok Result with that value.
   * 
   * @param fn - A function that transforms the Fail value into a recovery value
   * @returns A new Ok Result with the recovered value
   */
  recover(fn: (err: TFail) => TOk): IResult<TOk, TFail> {
    return Result.ok<TOk, TFail>(fn(this.failureValue))
  }

  /**
   * Transforms this Fail Result by applying a function that returns another Result.
   * 
   * For FailResult instances, this method applies the function to the contained error,
   * which returns a new Result.
   * 
   * @param fn - A function that takes the Fail value and returns a new Result
   * @returns The Result returned by the function
   */
  recoverWith(fn: (err: TFail) => IResult<TOk, TFail>): IResult<TOk, TFail> {
    return fn(this.failureValue)
  }

  /**
   * Returns the provided fallback Result since this is a Fail variant.
   * 
   * For FailResult instances, this method returns the provided fallback Result
   * instead of the current Result.
   * 
   * @param fallback - The Result to return instead of this one
   * @returns The provided fallback Result
   */
  orElse(fallback: IResult<TOk, TFail>): IResult<TOk, TFail> {
    return fallback
  }

  /**
   * Swaps the Ok and Fail values, creating a new Ok Result.
   * 
   * For FailResult instances, this method transforms the contained error
   * into a value and returns a new Ok Result with that value.
   * 
   * @returns A new Ok Result with the error as a value
   */
  swap(): IResult<TFail, TOk> {
    return Result.ok<TFail, TOk>(this.failureValue)
  }

  /**
   * No-op for FailResult, returns this Result unchanged.
   * 
   * For FailResult instances, this method short-circuits and returns the
   * current Result without calling the function, since there's no Ok value
   * to combine with the other Result.
   * 
   * @returns This Result unchanged
   */
  zipWith<R>(): IResult<R, TFail> {
    return Result.fail<R, TFail>(this.failureValue)
  }

  /**
   * No-op for FailResult, returns a Promise that resolves to this Result.
   * 
   * For FailResult instances, this method short-circuits and returns a Promise
   * that resolves to the current Result without calling the function, since
   * there's no Ok value to transform.
   * 
   * @returns A Promise that resolves to this Result
   */
  flatMapPromise<M>(): Promise<IResult<M, TFail>> {
    return Promise.resolve(Result.fail<M, TFail>(this.failureValue))
  }

  /**
   * No-op for FailResult, returns a Promise that resolves to this Result.
   * 
   * For FailResult instances, this method short-circuits and returns a Promise
   * that resolves to the current Result without calling the function, since
   * there's no Ok value to transform.
   * 
   * @returns A Promise that resolves to this Result
   */
  flatMapObservable<M>(): Promise<IResult<M, TFail>> {
    return Promise.resolve(Result.fail<M, TFail>(this.failureValue))
  }
}
