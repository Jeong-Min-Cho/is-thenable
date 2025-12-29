/**
 * Represents any value that has a `then` method.
 * Per Promises/A+ specification: "thenable" is an object or function
 * that defines a then method.
 */
export interface Thenable<T = unknown> {
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2>;
}

/**
 * Checks if a value is thenable (has a `then` method).
 *
 * A thenable is any object or function that has a `then` method,
 * as defined by the Promises/A+ specification. This includes native
 * Promises, custom promise implementations, and any object with a
 * callable `then` property.
 *
 * This function never throws. If accessing the `then` property throws
 * (e.g., due to a getter that throws or a revoked Proxy), it returns `false`.
 *
 * @param value - The value to check
 * @returns `true` if the value is thenable, `false` otherwise
 *
 * @example
 * ```typescript
 * import { isThenable } from 'is-thenable';
 *
 * isThenable(Promise.resolve(42));           // true
 * isThenable({ then: () => {} });            // true
 * isThenable({ then: (cb) => cb(42) });      // true
 *
 * isThenable(null);                          // false
 * isThenable(undefined);                     // false
 * isThenable({ then: 'not a function' });    // false
 * isThenable(42);                            // false
 * ```
 */
export function isThenable<T = unknown>(value: unknown): value is Thenable<T> {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value !== 'object' && typeof value !== 'function') {
    return false;
  }

  try {
    return typeof (value as Record<string, unknown>)['then'] === 'function';
  } catch {
    // If accessing .then throws (e.g., revoked Proxy, throwing getter),
    // the value is not usably thenable
    return false;
  }
}

export default isThenable;
