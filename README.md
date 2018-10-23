<h1 align="center" style="border-bottom: none;">📚 typescript-monads</h1>
<h3 align="center">Better TypeScript Control Flow</h3>
<p align="center">
  <a href="https://circleci.com/gh/patrickmichalina/typescript-monads">
    <img alt="codecov" src="https://circleci.com/gh/patrickmichalina/typescript-monads.svg?style=shield">
  </a>
  <a href="https://codecov.io/gh/patrickmichalina/typescript-monads">
    <img alt="codecov" src="https://codecov.io/gh/patrickmichalina/typescript-monads/branch/master/graph/badge.svg">
  </a>
  <a href="https://greenkeeper.io">
    <img alt="greenkeeper" src="https://badges.greenkeeper.io/semantic-release/semantic-release.svg">
  </a>
  <a href="https://david-dm.org/patrickmichalina/typescript-monads">
    <img alt="greenkeeper" src="https://david-dm.org/patrickmichalina/typescript-monads/status.svg">
  </a>
  <a href="https://david-dm.org/patrickmichalina/typescript-monads?type=dev">
    <img alt="greenkeeper" src="https://david-dm.org/patrickmichalina/typescript-monads/dev-status.svg">
  </a>
  <a href="https://codeclimate.com/github/patrickmichalina/typescript-monads/maintainability">
    <img alt="codeclimate" src="https://api.codeclimate.com/v1/badges/f40c9fff2927e49c3ea2/maintainability">
  </a>
  <a href="https://github.com/semantic-release/semantic-release">
    <img alt="semantic-release" src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg">
  </a>
</p>
<p align="center">
  <a href="https://www.npmjs.com/package/typescript-monads">
    <img alt="npm latest version" src="https://img.shields.io/npm/v/typescript-monads/latest.svg">
  </a>
</p>

**typescript-monads** helps you write safer code by using abstractions over dubious program state and control flow.

# Getting Started

## Node or as a module
```bash
npm install typescript-monads
```

## Browser
```html
<head>
 <script src="https://unpkg.com/typescript-monads"></script>
 <!-- or use a specific version to avoid a redirect --> 
 <script src="https://unpkg.com/typescript-monads@3.5.3/index.js"></script>
</head>
```

```js
var someRemoteValue;
typescriptMonads.maybe(someRemoteValue).tapSome(console.log)
```

# Usage

* [Maybe](#maybe)
* [Either](#either)
* [Reader](#reader)
* [Result](#result)

# Maybe
```ts
import { maybe } from 'typescript-monads'

// safely map values
let maybeVisitedBeforeXTimes: number | undefined = 50

const priceWithDiscountForLoyalty = maybe(maybeVisitedBeforeXTimes)
  .match({
    some: visits => 15.00 - visits * 0.1,
    none: () => 15.00
  })

// handle multiple maybe conditionas together
const canRideCoaster = getAge() // Maybe<number>
  .bind(age => getTicket(age)) // Maybe<Ticket>
  .match({
    some: ticket => ticket.canRide('coaster1'),
    none: () => false
  })

// operations with side-effects
maybe(process.env.DB_URL)
  .do({
    some: dbUrl => {
      // value exists, can connect
    },
    none: () => console.info('no url provided, could not connect to the database')
  })
```


# Either
TODO

# Reader
TODO

# Result
TODO
