import { IMaybe } from '../maybe/maybe.interface'

export type Predicate = () => boolean

export interface IResultMatchPattern<T, E, U> {
  readonly ok: (val: T) => U
  readonly fail: (val: E) => U
}

export interface IResult<T, E> {
  isOk(): boolean
  isFail(): boolean
  maybeOk(): IMaybe<NonNullable<T>>
  maybeFail(): IMaybe<E>
  unwrap(): T | never
  unwrapOr(opt: T): T
  unwrapFail(): E | never
  match<M>(fn: IResultMatchPattern<T, E, M>): M
  map<M>(fn: (val: T) => M): IResult<M, E>
  mapFail<M>(fn: (err: E) => M): IResult<T, M>
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
   * Execute functions with side-effects.
   */
  tap(val: Partial<IResultMatchPattern<T, E, void>>): void

  /**
   * Execute a function with side-effects when maybe is a Fail.
   */
  tapFail(f: (val: E) => void): void

  /**
   * Execute a function with side-effects when maybe is an Ok.
   */
  tapOk(f: (val: T) => void): void

  /**
   * Convert Ok result into Fail using projected value from Ok
   */
  toFailWhenOk(fn: (val: T) => E): IResult<T, E>

  /**
   * Convert Ok result into Fail using a provided value
   */
  toFailWhenOkFrom(val: E): IResult<T, E>

  /**
   * Execute a function with side-effects.
   * Returns this to continue operations
   */
  tapThru(val: Partial<IResultMatchPattern<T, E, void>>): IResult<T, E>

  /**
   * Execute a function with side-effects when maybe is a OK.
   * Returns this to continue operations
   */
  tapOkThru(fn: (val: T) => void): IResult<T, E>

  /**
   * Execute a function with side-effects when maybe is a Fail.
   * Returns this to continue operations
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
