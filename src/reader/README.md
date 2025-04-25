# Reader Monad

The Reader monad is a powerful functional programming pattern for handling dependencies and configuration. It provides a clean way to access shared environment or configuration data throughout a computation without explicitly passing it around.

## Core Concept

A Reader monad is essentially a function that:

1. Takes an environment/configuration as input
2. Performs a computation using that environment
3. Returns a result

The magic happens when you compose multiple Readers together - each Reader in the chain has access to the same environment, making dependency injection simple and pure.

## Key Benefits

- **Dependency Injection**: Pass dependencies around implicitly without global state
- **Testability**: Easily swap environments for testing
- **Composability**: Combine small, focused Readers into complex operations
- **Type Safety**: Environment requirements are encoded in the type system
- **Pure Functional**: No side effects or hidden dependencies
- **Lazy Evaluation**: Operations are only run when the final Reader is executed

## Basic Usage

```typescript
import { reader, asks } from 'typescript-monads'

// Create a Reader that extracts a value from the environment
const getApiUrl = asks<AppConfig, string>(config => config.apiUrl)

// Create a Reader that uses the environment to format a URL
const getFullUrl = reader<AppConfig, string>(config => 
  `${config.apiUrl}/users?token=${config.authToken}`
)

// Run the Reader with a configuration
const url = getFullUrl.run({
  apiUrl: 'https://api.example.com',
  authToken: '12345'
}) // "https://api.example.com/users?token=12345"
```

## Core Operations

### Creation

```typescript
// Create from a function that uses the environment
const greeting = reader<{name: string}, string>(env => `Hello, ${env.name}!`)

// Create a Reader that always returns a constant value (ignores environment)
const constant = readerOf<any, number>(42)

// Create a Reader that returns the entire environment
const getEnv = ask<AppConfig>()

// Create a Reader that extracts a specific value from the environment
const getTimeout = asks<AppConfig, number>(config => config.timeout)
```

### Transformation

```typescript
// Map the output value
const getApiUrl = asks<Config, string>(c => c.apiUrl)
const getApiUrlUpper = getApiUrl.map(url => url.toUpperCase())

// Chain Readers
const getUser = asks<Config, User>(c => c.currentUser)
const getPermissions = (user: User) => 
  asks<Config, string[]>(c => c.permissionsDb.getPermissionsFor(user.id))

// Combined operation: get user and their permissions
const getUserPermissions = getUser.flatMap(getPermissions)
```

### Environment Manipulation

```typescript
// Create a Reader that works with a specific config type
const getDatabaseUrl = reader<DbConfig, string>(db => 
  `postgres://${db.host}:${db.port}/${db.name}`
)

// Adapt it to work with a different environment type
const getDbFromAppConfig = getDatabaseUrl.local<AppConfig>(app => app.database)

// Now it works with AppConfig
const url = getDbFromAppConfig.run({
  database: { host: 'localhost', port: 5432, name: 'myapp' },
  // other app config...
})
```

### Combining Readers

```typescript
// Combine multiple Readers into an array of results
const getName = asks<User, string>(u => u.name)
const getAge = asks<User, number>(u => u.age)
const getEmail = asks<User, string>(u => u.email)

const getUserInfo = sequence([getName, getAge, getEmail])
// getUserInfo.run(user) returns [name, age, email]

// Combine multiple Readers with a mapping function
const getUserSummary = combine(
  [getName, getAge, getEmail],
  (name, age, email) => `${name} (${age}) - ${email}`
)
// getUserSummary.run(user) returns "Alice (30) - alice@example.com"

// Combine two Readers with a binary function
const greeting = asks<Config, string>(c => c.greeting)
const username = asks<Config, string>(c => c.username)

const personalizedGreeting = greeting.zipWith(
  username,
  (greet, name) => `${greet}, ${name}!`
)
// personalizedGreeting.run({greeting: "Hello", username: "Bob"}) returns "Hello, Bob!"
```

## Advanced Features

### Side Effects

```typescript
// Execute a side effect without changing the Reader value
const loggedApiUrl = getApiUrl.tap(url => console.log(`Using API URL: ${url}`))

// Chain Readers for sequencing operations
const logAndGetUser = loggerReader.andThen(getUserReader)
```

### Environment-Aware Transformations

```typescript
// Transform using both environment and current value
const getTemplate = asks<MessageConfig, string>(c => c.template)
const getMessage = getTemplate.withEnv(
  (config, template) => template.replace('{user}', config.currentUser)
)
```

### Filtering and Multiple Transformations

```typescript
// Filter values based on a predicate
const getAge = asks<Person, number>(p => p.age)
const getValidAge = getAge.filter(
  age => age >= 0 && age <= 120,
  0 // Default for invalid ages
)

// Apply multiple transformations to the same value
const getUserStats = getUser.fanout(
  user => user.loginCount,
  user => user.lastActive,
  user => user.preferences.theme
)
// Returns [loginCount, lastActive, theme]
```

### Async Integration and Performance

```typescript
// Convert a Reader to a Promise-returning function
const processConfig = asks<Config, Result>(c => computeResult(c))
const processAsync = processConfig.toPromise()

// Later in async code
const result = await processAsync(myConfig)

// Cache expensive Reader operations
const expensiveReader = reader<Config, Result>(c => expensiveComputation(c)).memoize()
```

## Real-World Examples

### Dependency Injection

```typescript
// Define dependencies interface
interface AppDependencies {
  logger: Logger
  database: Database
  apiClient: ApiClient
}

// Create Readers for each dependency
const getLogger = asks<AppDependencies, Logger>(deps => deps.logger)
const getDb = asks<AppDependencies, Database>(deps => deps.database)
const getApiClient = asks<AppDependencies, ApiClient>(deps => deps.apiClient)

// Create business logic using dependencies
const getUserById = (id: string) => combine(
  [getDb, getLogger],
  (db, logger) => {
    logger.info(`Fetching user ${id}`)
    return db.users.findById(id)
  }
)

// Configure the real dependencies
const dependencies: AppDependencies = {
  logger: new ConsoleLogger(),
  database: new PostgresDatabase(dbConfig),
  apiClient: new HttpApiClient(apiConfig)
}

// Run the Reader with the dependencies
const user = getUserById('123').run(dependencies)
```

### Configuration Management

```typescript
// Different sections of configuration
const getDbConfig = asks<AppConfig, DbConfig>(c => c.database)
const getApiConfig = asks<AppConfig, ApiConfig>(c => c.api)
const getEnvironment = asks<AppConfig, string>(c => c.environment)

// Create environment-specific database URL
const getDatabaseUrl = combine(
  [getDbConfig, getEnvironment],
  (db, env) => {
    const { host, port, name, user, password } = db
    const dbName = env === 'test' ? `${name}_test` : name
    return `postgres://${user}:${password}@${host}:${port}/${dbName}`
  }
)
```

## Benefits Over Direct Approaches

| Problem | Traditional Approach | Reader Monad Solution |
|---------|---------------------|------------------------|
| Dependency Injection | Constructor injection, service locators | Implicit dependencies via the environment |
| Configuration | Passing config objects, globals | Environment access in pure functions |
| Testing | Mocking, dependency overrides | Simply passing different environments |
| Composition | Complex chaining with explicit parameters | Clean composition with flatMap and combine |
| Reuse | Duplicating config parameters | Single environment shared by multiple Readers |