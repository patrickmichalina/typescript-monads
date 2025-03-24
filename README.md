<h1 align="center" style="border-bottom: none;">📚 typescript-monads</h1>
<h3 align="center">Better TypeScript Control Flow</h3>
<p align="center">
  <a href="https://circleci.com/gh/patrickmichalina/typescript-monads">
    <img alt="circeci" src="https://circleci.com/gh/patrickmichalina/typescript-monads.svg?style=shield">
  </a>
</p>
<p align="center">
  <a href="https://github.com/semantic-release/semantic-release">
    <img alt="semantic-release" src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg">
  </a>
  <a href="https://www.npmjs.com/package/typescript-monads">
    <img alt="npm latest version" src="https://img.shields.io/npm/v/typescript-monads/latest.svg">
  </a>
</p>

**typescript-monads** helps you write safer code by using abstractions over messy control flow and state.

# Installation
You can use this library in the browser, node, or a bundler

## Node or as a module
```bash
npm install typescript-monads
```

## Browser
```html
<head>
 <script src="https://unpkg.com/typescript-monads"></script>
 <!-- or use a specific version to avoid a http redirect --> 
 <script src="https://unpkg.com/typescript-monads@5.3.0/index.min.js"></script>
</head>
```

```js
var someRemoteValue;
typescriptMonads.maybe(someRemoteValue).tapSome(console.log)
```

# Example Usage

* [Maybe](#maybe)
* [List](#list)
* [Either](#either)
* [Reader](#reader)
* [Result](#result)
* [State](#state)
* [Logger](#logger)

# Maybe

The `Maybe` monad represents values that may or may not exist. It's a safe way to handle potentially null or undefined values without resorting to null checks throughout your code.

```typescript
import { maybe, none } from 'typescript-monads'

// Creating Maybe instances
const someValue = maybe(42)        // Maybe with a value
const noValue = maybe(null)        // Maybe with no value (None)
const alsoNoValue = none<number>() // Explicitly create a None

// Safe value access
someValue.valueOr(0)           // 42
noValue.valueOr(0)             // 0
someValue.valueOrCompute(() => expensiveCalculation()) // 42 (computation skipped)
noValue.valueOrCompute(() => expensiveCalculation())   // result of computation

// Conditional execution with pattern matching
someValue.match({
  some: val => console.log(`Got a value: ${val}`),
  none: () => console.log('No value present')
}) // logs: "Got a value: 42"

// Side effects with tap
someValue.tap({
  some: val => console.log(`Got ${val}`),
  none: () => console.log('Nothing to see')
})

// Conditional side effects
someValue.tapSome(val => console.log(`Got ${val}`))
noValue.tapNone(() => console.log('Nothing here'))

// Chaining operations (only executed for Some values)
maybe(5)
  .map(n => n * 2)           // maybe(10)
  .filter(n => n > 5)        // maybe(10)
  .flatMap(n => maybe(n + 1)) // maybe(11)

// Transforming to other types
maybe(5).toResult('No value found') // Ok(5)
maybe(null).toResult('No value found') // Fail('No value found')

// Working with RxJS (with rxjs optional dependency)
import { maybeToObservable } from 'typescript-monads'
maybeToObservable(maybe(5)) // Observable that emits 5 and completes
maybeToObservable(none())   // Observable that completes without emitting
```

## List

The `List` monad is a lazily evaluated collection with chainable operations. It provides many of the common list processing operations found in functional programming languages.

```typescript
import { List } from 'typescript-monads'

// Creating Lists
const fromValues = List.of(1, 2, 3, 4, 5)
const fromIterable = List.from([1, 2, 3, 4, 5])
const numbersFromRange = List.range(1, 10)    // 1 to 10
const infiniteNumbers = List.integers()        // All integers (use with take!)
const empty = List.empty<number>()

// Basic operations
fromValues.toArray() // [1, 2, 3, 4, 5]
fromValues.headOrUndefined() // 1
fromValues.headOr(0) // 1
empty.headOr(0) // 0

// Transformations
fromValues
  .map(n => n * 2)                 // [2, 4, 6, 8, 10]
  .filter(n => n > 5)              // [6, 8, 10]
  .take(2)                         // [6, 8]
  .drop(1)                         // [8]

// LINQ-style operations
fromValues.sum()                    // 15
fromValues.all(n => n > 0)          // true
fromValues.any(n => n % 2 === 0)    // true
fromValues.where(n => n % 2 === 0)  // [2, 4]

// Conversion
fromValues.toDictionary()           // { 0: 1, 1: 2, 2: 3, 3: 4, 4: 5 }
const users = List.of(
  { id: 'a', name: 'Alice' },
  { id: 'b', name: 'Bob' }
)
users.toDictionary('id') // { 'a': { id: 'a', name: 'Alice' }, 'b': { id: 'b', name: 'Bob' } }
```

## Either

The `Either` monad represents values that can be one of two possible types. It's often used to represent a value that can be either a success (Right) or a failure (Left).

```typescript
import { either } from 'typescript-monads'

// Creating Either instances
const rightValue = either<string, number>(undefined, 42) // Right value
const leftValue = either<string, number>('error', undefined) // Left value

// Checking which side is present
rightValue.isRight() // true
rightValue.isLeft()  // false
leftValue.isRight()  // false 
leftValue.isLeft()   // true

// Pattern matching
rightValue.match({
  right: val => `Success: ${val}`,
  left: err => `Error: ${err}`
}) // "Success: 42"

// Side effects with tap
rightValue.tap({
  right: val => console.log(`Got right: ${val}`),
  left: err => console.log(`Got left: ${err}`)
})

// Transformation (only applies to Right values)
rightValue.map(n => n * 2) // Either with Right(84)
leftValue.map(n => n * 2)  // Either with Left('error') unchanged

// Chaining (flatMap only applies to Right values)
rightValue.flatMap(n => either(undefined, n + 10)) // Either with Right(52)
leftValue.flatMap(n => either(undefined, n + 10))  // Either with Left('error') unchanged
```

## Reader

The `Reader` monad represents a computation that depends on some external configuration or environment. It's useful for dependency injection.

```typescript
import { reader } from 'typescript-monads'

// Define a configuration type
interface Config {
  apiUrl: string
  apiKey: string
}

// Create readers that depend on this configuration
const getApiUrl = reader<Config, string>(config => config.apiUrl)
const getApiKey = reader<Config, string>(config => config.apiKey)

// Compose readers to build more complex operations
const getAuthHeader = getApiKey.map(key => `Bearer ${key}`)

// Create a reader for making an API request
const fetchData = reader<Config, Promise<Response>>(config => {
  return fetch(`${config.apiUrl}/data`, {
    headers: {
      'Authorization': `Bearer ${config.apiKey}`
    }
  })
})

// Execute the reader with a specific configuration
const config: Config = {
  apiUrl: 'https://api.example.com',
  apiKey: 'secret-key-123'
}

const apiUrl = getApiUrl.run(config)  // 'https://api.example.com'
const authHeader = getAuthHeader.run(config) // 'Bearer secret-key-123'
fetchData.run(config).then(response => {
  // Handle API response
})
```

## Result

The `Result` monad represents operations that can either succeed with a value or fail with an error. It's similar to Either but with more specific semantics for success/failure.

```typescript
import { ok, fail, catchResult } from 'typescript-monads'

// Creating Result instances
const success = ok<number, string>(42)        // Success with value 42
const failure = fail<number, string>('error') // Failure with error 'error'

// Safely catching exceptions
const result = catchResult<number, Error>(
  () => {
    // Code that might throw
    if (Math.random() > 0.5) {
      throw new Error('Failed')
    }
    return 42
  }
)

// Checking result type
success.isOk()   // true
success.isFail() // false
failure.isOk()   // false
failure.isFail() // true

// Extracting values safely
success.unwrapOr(0)   // 42
failure.unwrapOr(0)   // 0
success.unwrap()      // 42
// failure.unwrap()   // Throws error

// Convert to Maybe
success.maybeOk()    // Maybe with Some(42)
failure.maybeOk()    // Maybe with None
success.maybeFail()  // Maybe with None
failure.maybeFail()  // Maybe with Some('error')

// Pattern matching
success.match({
  ok: val => `Success: ${val}`,
  fail: err => `Error: ${err}`
}) // "Success: 42"

// Transformations
success.map(n => n * 2)          // Ok(84)
failure.map(n => n * 2)          // Fail('error') unchanged
failure.mapFail(e => `${e}!`)    // Fail('error!') 

// Chaining
success.flatMap(n => ok(n + 10)) // Ok(52)
failure.flatMap(n => ok(n + 10)) // Fail('error') unchanged

// Side effects
success.tap({
  ok: val => console.log(`Success: ${val}`),
  fail: err => console.log(`Error: ${err}`)
})
success.tapOk(val => console.log(`Success: ${val}`))
failure.tapFail(err => console.log(`Error: ${err}`))

// Chaining with side effects
success
  .tapOkThru(val => console.log(`Success: ${val}`))
  .map(n => n * 2)

// Converting to promises
import { resultToPromise } from 'typescript-monads'
resultToPromise(success) // Promise that resolves to 42
resultToPromise(failure) // Promise that rejects with 'error'
```

## State

The `State` monad represents computations that can read and transform state. It's useful for threading state through a series of operations.

```typescript
import { state } from 'typescript-monads'

// Define a state type
interface AppState {
  count: number
  name: string
}

// Initial state
const initialState: AppState = {
  count: 0,
  name: ''
}

// Create operations that work with the state
const incrementCount = state<AppState, number>(s => 
  [{ ...s, count: s.count + 1 }, s.count + 1]
)

const setName = (name: string) => state<AppState, void>(s => 
  [{ ...s, name }, undefined]
)

const getCount = state<AppState, number>(s => [s, s.count])

// Compose operations
const operation = incrementCount
  .flatMap(() => setName('Alice'))
  .flatMap(() => getCount)

// Run the state operation
const result = operation.run(initialState)
console.log(result.state)  // { count: 1, name: 'Alice' }
console.log(result.value)  // 1
```

## Logger

The `Logger` monad lets you collect logs during a computation. It's useful for debugging or creating audit trails.

```typescript
import { logger, tell } from 'typescript-monads'

// Create a logger with initial logs and value
const initialLogger = logger<string, number>(['Starting process'], 0)

// Add logs and transform value
const result = initialLogger
  .flatMap(val => {
    return logger(['Incrementing value'], val + 1)
  })
  .flatMap(val => {
    return logger(['Doubling value'], val * 2)
  })

// Extract all logs and final value
result.runUsing(({ logs, value }) => {
  console.log('Logs:', logs)    // ['Starting process', 'Incrementing value', 'Doubling value']
  console.log('Final value:', value) // 2
})

// Start with a single log entry
const startLogger = tell<string>('Beginning')

// Add a value to the logger
const withValue = logger.startWith<string, number>('Starting with value:', 42)

// Extract results using pattern matching
const output = result.runUsing(({ logs, value }) => {
  return { 
    history: logs.join('\n'),
    result: value 
  }
})
```

# Integration with Other Libraries

## RxJS Integration

This library offers RxJS integration with the `Maybe` and `Result` monads:

```typescript
import { maybeToObservable } from 'typescript-monads'
import { resultToObservable } from 'typescript-monads'
import { of } from 'rxjs'
import { flatMap } from 'rxjs/operators'

// Convert Maybe to Observable
of(maybe(5)).pipe(
  flatMap(maybeToObservable)
).subscribe(val => console.log(val)) // logs 5 and completes

// Convert Result to Observable  
of(ok(42)).pipe(
  flatMap(resultToObservable)
).subscribe(
  val => console.log(`Success: ${val}`),
  err => console.error(`Error: ${err}`)
)
```

## Promise Integration

You can convert `Result` monads to promises:

```typescript
import { resultToPromise } from 'typescript-monads'

// Convert Result to Promise
resultToPromise(ok(42))
  .then(val => console.log(`Success: ${val}`))
  .catch(err => console.error(`Error: ${err}`))

// Catch exceptions and convert to Result
async function fetchData() {
  try {
    const response = await fetch('https://api.example.com/data')
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`)
    }
    return ok(await response.json())
  } catch (error) {
    return fail(error)
  }
}
```

# Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

# License

MIT