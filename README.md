# is-thenable

[![npm version](https://img.shields.io/npm/v/is-thenable.svg)](https://www.npmjs.com/package/is-thenable)
[![npm downloads](https://img.shields.io/npm/dm/is-thenable.svg)](https://www.npmjs.com/package/is-thenable)
[![bundle size](https://img.shields.io/bundlephobia/minzip/is-thenable)](https://bundlephobia.com/package/is-thenable)
[![license](https://img.shields.io/npm/l/is-thenable.svg)](https://github.com/Jeong-Min-Cho/is-thenable/blob/main/LICENSE)

Check if a value is thenable (has a `then` method) - Promises/A+ compliant.

## Installation

```bash
npm install is-thenable
```

## Usage

### ESM

```typescript
import { isThenable } from 'is-thenable';

isThenable(Promise.resolve(42));        // true
isThenable({ then: () => {} });         // true
isThenable({ then: (cb) => cb(42) });   // true

isThenable(null);                       // false
isThenable(undefined);                  // false
isThenable({ then: 'not a function' }); // false
isThenable(42);                         // false
```

### CommonJS

```javascript
const { isThenable } = require('is-thenable');

isThenable(Promise.resolve(42)); // true
```

### Default Export

```typescript
import isThenable from 'is-thenable';

isThenable(Promise.resolve(42)); // true
```

## What is a Thenable?

Per the [Promises/A+ specification](https://promisesaplus.com/):

> "thenable" is an object or function that defines a `then` method.

This is different from checking for a native `Promise` instance. A thenable can be:

- Native `Promise` objects
- Custom promise implementations (Bluebird, Q, etc.)
- Any object with a callable `then` property

## API

### `isThenable<T>(value: unknown): value is Thenable<T>`

Returns `true` if the value is thenable (has a `then` method that is a function), `false` otherwise.

**Type Guard:** This function acts as a TypeScript type guard, narrowing the type to `Thenable<T>`.

```typescript
const value: unknown = fetchSomething();

if (isThenable<string>(value)) {
  // TypeScript knows value is Thenable<string>
  value.then((result) => console.log(result));
}
```

### `Thenable<T>` Interface

```typescript
interface Thenable<T = unknown> {
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2>;
}
```

## Safety

This function **never throws**. If accessing the `then` property throws (e.g., due to a getter that throws or a revoked Proxy), it returns `false`:

```typescript
// Throwing getter - returns false instead of throwing
const throwingGetter = Object.defineProperty({}, 'then', {
  get() { throw new Error('oops'); }
});
isThenable(throwingGetter); // false (safe!)

// Revoked Proxy - returns false instead of throwing
const { proxy, revoke } = Proxy.revocable({}, {});
revoke();
isThenable(proxy); // false (safe!)
```

This makes `isThenable` safe to use anywhere without try-catch, similar to `typeof` or `Array.isArray`.

## Why use this package?

| Feature | `is-thenable` | `is-promise` |
|---------|---------------|--------------|
| Semantic naming | Yes | Misleading (checks thenables, not Promises) |
| TypeScript-first | Yes | Added later |
| ESM + CJS | Yes | Yes |
| Type guard | Yes | Yes |
| Never throws | Yes | No (throws on edge cases) |
| Maintained | 2025 | Last updated 2020 |

## Use Cases

### Conditional Promise handling

```typescript
function maybeAwait<T>(value: T | Thenable<T>): Promise<T> {
  if (isThenable(value)) {
    return Promise.resolve(value);
  }
  return Promise.resolve(value);
}
```

### Fast path optimization

```typescript
function processValue(value: unknown) {
  if (isThenable(value)) {
    return value.then(doExpensiveWork);
  }
  // Synchronous fast path
  return doExpensiveWork(value);
}
```

### Duck typing validation

```typescript
function validatePromiseLike(value: unknown): asserts value is Thenable {
  if (!isThenable(value)) {
    throw new TypeError('Expected a thenable');
  }
}
```

## License

Apache-2.0
