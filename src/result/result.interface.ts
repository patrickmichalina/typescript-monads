import { IMaybe } from '../maybe/maybe.interface'

export type Predicate = () => boolean

export interface IResultMatchPattern<T, E, U> {
  readonly ok: (val: T) => U
  readonly fail: (val: E) => U
}

export interface IResult<T, E> {
  /**
   * Type guard that determines if this Result is an Ok variant.
   * 
   * This method acts as a TypeScript type guard, narrowing the type of the Result
   * when used in conditional blocks.
   * 
   * @returns true if this Result is an Ok variant, false otherwise
   * 
   * @example
   * const result = getUser(userId);
   * 
   * if (result.isOk()) {
   *   // TypeScript knows that result is an Ok variant here
   *   const user = result.unwrap(); // Safe to call
   *   console.log(user.name);
   * } else {
   *   // TypeScript knows that result is a Fail variant here
   *   const error = result.unwrapFail(); // Safe to call
   *   console.error(error.message);
   * }
   */
  isOk(): boolean
  /**
   * Type guard that determines if this Result is a Fail variant.
   * 
   * This method acts as a TypeScript type guard, narrowing the type of the Result
   * when used in conditional blocks.
   * 
   * @returns true if this Result is a Fail variant, false otherwise
   * 
   * @example
   * const result = authenticate(credentials);
   * 
   * if (result.isFail()) {
   *   // TypeScript knows that result is a Fail variant here
   *   const error = result.unwrapFail(); // Safe to call
   *   handleAuthError(error);
   * } else {
   *   // TypeScript knows that result is an Ok variant here
   *   startSession(result.unwrap()); // Safe to call
   * }
   */
  isFail(): boolean
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
  maybeOk(): IMaybe<NonNullable<T>>
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
  maybeFail(): IMaybe<E>
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
  unwrap(): T | never

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
  unwrapOr(opt: T): T

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
  unwrapFail(): E | never
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
  match<M>(fn: IResultMatchPattern<T, E, M>): M

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
  map<M>(fn: (val: T) => M): IResult<M, E>

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
  mapFail<M>(fn: (err: E) => M): IResult<T, M>

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
  flatMap<M>(fn: (val: T) => IResult<M, E>): IResult<M, E>
  
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
   * // Handling None case
   * const getUserWithoutProfile = (): Result<User, Error> => 
   *   ok({ id: 2 }); // No profile property
   * 
   * const getName2 = getUserWithoutProfile()
   *   .flatMapMaybe(
   *     user => maybe(user.profile),
   *     new Error("Profile not found")
   *   )
   *   .map(profile => profile.name);
   * 
   * // getName2 is Result<string, Error> containing Error("Profile not found")
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
   * // value is Result<number, string> containing "No data available"
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
  flatMapMaybe<M>(fn: (val: T) => IMaybe<M>, err: E): IResult<M, E>

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
  tap(val: Partial<IResultMatchPattern<T, E, void>>): void

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
  tapFail(f: (val: E) => void): void

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
  tapOk(f: (val: T) => void): void

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
  toFailWhenOk(fn: (val: T) => E): IResult<T, E>

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
  toFailWhenOkFrom(val: E): IResult<T, E>

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
  tapThru(val: Partial<IResultMatchPattern<T, E, void>>): IResult<T, E>

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
  tapOkThru(fn: (val: T) => void): IResult<T, E>

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
  tapFailThru(fn: (val: E) => void): IResult<T, E>
}

export interface IResultOk<T, E = never> extends IResult<T, E> {
  unwrap(): T
  unwrapOr(opt: T): T
  unwrapFail(): never
  match<M>(fn: IResultMatchPattern<T, never, M>): M
  map<M>(fn: (val: T) => M): IResultOk<M, never>
  mapFail<M>(fn: (err: E) => M): IResultOk<T, never>
  
  /**
   * Specialized version of flatMapMaybe for Ok Results.
   * 
   * This method always applies the provided function to the contained value and
   * returns either an Ok result with the unwrapped Some value or a Fail result with
   * the provided error if the Maybe is None.
   * 
   * @typeParam M - The type of the value contained in the returned Result if successful
   * @param fn - A function that takes the success value of this Result and returns a Maybe
   * @param err - The error value to use if the Maybe is None
   * @returns Either a Result<M, E> containing the unwrapped value or a failure containing the provided error
   * 
   * @example
   * // Using flatMapMaybe with a chain of optional properties
   * interface Config {
   *   settings?: {
   *     database?: {
   *       url?: string
   *     }
   *   }
   * }
   * 
   * // Traditional approach with null checks
   * function getDatabaseUrl(config: Config): Result<string, string> {
   *   if (!config.settings) return fail("No settings found");
   *   if (!config.settings.database) return fail("No database settings found");
   *   if (!config.settings.database.url) return fail("No database URL found");
   *   return ok(config.settings.database.url);
   * }
   * 
   * // Using flatMapMaybe
   * function getDatabaseUrlMonadic(config: Config): Result<string, string> {
   *   return ok(config)
   *     .flatMapMaybe(
   *       c => maybe(c.settings),
   *       "No settings found"
   *     )
   *     .flatMapMaybe(
   *       settings => maybe(settings.database),
   *       "No database settings found"
   *     )
   *     .flatMapMaybe(
   *       database => maybe(database.url),
   *       "No database URL found"
   *     );
   * }
   */
  flatMapMaybe<M>(fn: (val: T) => IMaybe<M>, err: E): IResult<M, E>
}

export interface IResultFail<T, E> extends IResult<T, E> {
  unwrap(): never
  unwrapOr(opt: T): T
  unwrapFail(): E
  match<M>(fn: IResultMatchPattern<never, E, M>): M
  map<M>(fn: (val: T) => M): IResultFail<never, E>
  mapFail<M>(fn: (err: E) => M): IResultFail<never, M>
  flatMap<M>(fn: (val: T) => IResult<M, E>): IResultFail<never, E>
  /**
   * Specialized version of flatMapMaybe for Fail Results.
   * 
   * This method short-circuits the operation and always returns a Fail result
   * containing the original error, without executing the provided function.
   * This maintains the monadic law that operations on Fail do not execute the transformation.
   * 
   * @typeParam M - The type parameter for the potential success value (never used in this case)
   * @returns A Fail Result containing the original error
   * 
   * @example
   * // Error short-circuiting in a chain of operations
   * const result = fail<User, string>("User not found")
   *   .flatMapMaybe(
   *     user => maybe(user.profile), // This function is never called
   *     "Profile not found"          // This error is never used
   *   )
   *   .flatMapMaybe(
   *     profile => maybe(profile.email), // This function is never called
   *     "Email not found"                // This error is never used
   *   );
   * 
   * // result is Result<string, string> containing "User not found" (the original error)
   * 
   * // Type safety with never
   * type ApiError = { code: number, message: string };
   * 
   * const apiResult = fail<never, ApiError>({ code: 404, message: "Not found" })
   *   .flatMapMaybe(
   *     // TypeScript ensures we can't access properties on 'never'
   *     // The parameter is essentially inaccessible
   *     _ => maybe(null as never),
   *     { code: 500, message: "Server error" }
   *   );
   * 
   * // apiResult is Result<never, ApiError> containing { code: 404, message: "Not found" }
   */
  flatMapMaybe(): IResultFail<never, E>
}
