import { describe, it, expect } from 'vitest';
import { isThenable, type Thenable } from '../src/index';

describe('isThenable', () => {
  describe('should return true for thenable values', () => {
    it('native Promise.resolve()', () => {
      expect(isThenable(Promise.resolve(42))).toBe(true);
    });

    it('native Promise.reject()', () => {
      const p = Promise.reject(new Error('test'));
      p.catch(() => {}); // Prevent unhandled rejection
      expect(isThenable(p)).toBe(true);
    });

    it('new Promise()', () => {
      expect(isThenable(new Promise(() => {}))).toBe(true);
    });

    it('object with then method', () => {
      expect(isThenable({ then: () => {} })).toBe(true);
    });

    it('object with then method that accepts callbacks', () => {
      expect(isThenable({ then: (resolve: (value: number) => void) => resolve(42) })).toBe(true);
    });

    it('object with then and catch methods', () => {
      expect(isThenable({ then: () => {}, catch: () => {} })).toBe(true);
    });

    it('function with then property', () => {
      const fn: (() => void) & { then?: () => void } = () => {};
      fn.then = () => {};
      expect(isThenable(fn)).toBe(true);
    });

    it('class instance with then method', () => {
      class CustomThenable {
        then(onFulfilled?: (value: number) => void) {
          onFulfilled?.(42);
        }
      }
      expect(isThenable(new CustomThenable())).toBe(true);
    });

    it('async function result', async () => {
      const asyncFn = async () => 42;
      expect(isThenable(asyncFn())).toBe(true);
    });
  });

  describe('should return false for non-thenable values', () => {
    it('null', () => {
      expect(isThenable(null)).toBe(false);
    });

    it('undefined', () => {
      expect(isThenable(undefined)).toBe(false);
    });

    it('number', () => {
      expect(isThenable(42)).toBe(false);
    });

    it('string', () => {
      expect(isThenable('hello')).toBe(false);
    });

    it('boolean', () => {
      expect(isThenable(true)).toBe(false);
      expect(isThenable(false)).toBe(false);
    });

    it('symbol', () => {
      expect(isThenable(Symbol('test'))).toBe(false);
    });

    it('bigint', () => {
      expect(isThenable(BigInt(42))).toBe(false);
    });

    it('empty object', () => {
      expect(isThenable({})).toBe(false);
    });

    it('array', () => {
      expect(isThenable([])).toBe(false);
      expect(isThenable([1, 2, 3])).toBe(false);
    });

    it('object with then as non-function', () => {
      expect(isThenable({ then: 'not a function' })).toBe(false);
      expect(isThenable({ then: 42 })).toBe(false);
      expect(isThenable({ then: true })).toBe(false);
      expect(isThenable({ then: null })).toBe(false);
      expect(isThenable({ then: undefined })).toBe(false);
      expect(isThenable({ then: {} })).toBe(false);
    });

    it('regular function without then', () => {
      expect(isThenable(() => {})).toBe(false);
    });

    it('Date object', () => {
      expect(isThenable(new Date())).toBe(false);
    });

    it('RegExp object', () => {
      expect(isThenable(/test/)).toBe(false);
    });

    it('Map object', () => {
      expect(isThenable(new Map())).toBe(false);
    });

    it('Set object', () => {
      expect(isThenable(new Set())).toBe(false);
    });

    it('Error object', () => {
      expect(isThenable(new Error('test'))).toBe(false);
    });
  });

  describe('type guard functionality', () => {
    it('should narrow type correctly', () => {
      const value: unknown = Promise.resolve(42);

      if (isThenable<number>(value)) {
        // TypeScript should recognize value as Thenable<number>
        const thenable: Thenable<number> = value;
        expect(typeof thenable.then).toBe('function');
      }
    });

    it('should work with union types', () => {
      const maybeThenable: string | Promise<number> = Promise.resolve(42);

      if (isThenable(maybeThenable)) {
        expect(typeof maybeThenable.then).toBe('function');
      }
    });
  });

  describe('edge cases', () => {
    it('object with getter that returns function for then', () => {
      const obj = {
        get then() {
          return () => {};
        },
      };
      expect(isThenable(obj)).toBe(true);
    });

    it('proxy object with then method', () => {
      const proxy = new Proxy(
        {},
        {
          get(target, prop) {
            if (prop === 'then') {
              return () => {};
            }
            return undefined;
          },
        }
      );
      expect(isThenable(proxy)).toBe(true);
    });

    it('object with inherited then method', () => {
      const proto = { then: () => {} };
      const obj = Object.create(proto);
      expect(isThenable(obj)).toBe(true);
    });

    it('frozen object with then method', () => {
      const frozen = Object.freeze({ then: () => {} });
      expect(isThenable(frozen)).toBe(true);
    });

    it('sealed object with then method', () => {
      const sealed = Object.seal({ then: () => {} });
      expect(isThenable(sealed)).toBe(true);
    });
  });

  describe('special numeric values', () => {
    it('NaN', () => {
      expect(isThenable(NaN)).toBe(false);
    });

    it('Infinity', () => {
      expect(isThenable(Infinity)).toBe(false);
    });

    it('negative Infinity', () => {
      expect(isThenable(-Infinity)).toBe(false);
    });

    it('negative zero', () => {
      expect(isThenable(-0)).toBe(false);
    });

    it('Number.MAX_VALUE', () => {
      expect(isThenable(Number.MAX_VALUE)).toBe(false);
    });

    it('Number.MIN_VALUE', () => {
      expect(isThenable(Number.MIN_VALUE)).toBe(false);
    });

    it('Number.MAX_SAFE_INTEGER', () => {
      expect(isThenable(Number.MAX_SAFE_INTEGER)).toBe(false);
    });
  });

  describe('throwing then getter (Promises/A+ edge case)', () => {
    it('should return false when then getter throws', () => {
      const obj = Object.defineProperty({}, 'then', {
        get() {
          throw new Error('getter throws');
        },
        configurable: true,
      });
      // If accessing .then throws, we can't use it as a thenable
      expect(isThenable(obj)).toBe(false);
    });

    it('should return false when then getter throws TypeError', () => {
      const obj = Object.defineProperty({}, 'then', {
        get() {
          throw new TypeError('type error in getter');
        },
        configurable: true,
      });
      expect(isThenable(obj)).toBe(false);
    });
  });

  describe('revoked proxy (edge case)', () => {
    it('should return false for revoked proxy', () => {
      const { proxy, revoke } = Proxy.revocable({}, {});
      revoke();
      // Accessing any property on a revoked proxy throws TypeError
      // isThenable catches this and returns false
      expect(isThenable(proxy)).toBe(false);
    });

    it('should return false for revoked proxy that had then trap', () => {
      const { proxy, revoke } = Proxy.revocable(
        {},
        {
          get(target, prop) {
            if (prop === 'then') return () => {};
            return undefined;
          },
        }
      );
      revoke();
      expect(isThenable(proxy)).toBe(false);
    });
  });

  describe('objects with unusual prototypes', () => {
    it('object with null prototype', () => {
      const nullProto = Object.create(null);
      expect(isThenable(nullProto)).toBe(false);
    });

    it('object with null prototype and then method', () => {
      const nullProto = Object.create(null);
      nullProto.then = () => {};
      expect(isThenable(nullProto)).toBe(true);
    });

    it('Object.prototype itself', () => {
      expect(isThenable(Object.prototype)).toBe(false);
    });

    it('Array.prototype', () => {
      expect(isThenable(Array.prototype)).toBe(false);
    });

    it('Function.prototype', () => {
      expect(isThenable(Function.prototype)).toBe(false);
    });
  });

  describe('generator and iterator objects', () => {
    it('generator function', () => {
      function* gen() {
        yield 1;
      }
      expect(isThenable(gen)).toBe(false);
    });

    it('generator object', () => {
      function* gen() {
        yield 1;
      }
      expect(isThenable(gen())).toBe(false);
    });

    it('async generator function', () => {
      async function* asyncGen() {
        yield 1;
      }
      expect(isThenable(asyncGen)).toBe(false);
    });

    it('async generator object', () => {
      async function* asyncGen() {
        yield 1;
      }
      expect(isThenable(asyncGen())).toBe(false);
    });

    it('iterator object', () => {
      const arr = [1, 2, 3];
      const iterator = arr[Symbol.iterator]();
      expect(isThenable(iterator)).toBe(false);
    });
  });

  describe('built-in async objects', () => {
    it('async function (not called)', () => {
      const asyncFn = async () => 42;
      expect(isThenable(asyncFn)).toBe(false);
    });

    it('Promise.all result', () => {
      const result = Promise.all([Promise.resolve(1)]);
      expect(isThenable(result)).toBe(true);
    });

    it('Promise.race result', () => {
      const result = Promise.race([Promise.resolve(1)]);
      expect(isThenable(result)).toBe(true);
    });

    it('Promise.allSettled result', () => {
      const result = Promise.allSettled([Promise.resolve(1)]);
      expect(isThenable(result)).toBe(true);
    });

    it('Promise.any result', () => {
      const result = Promise.any([Promise.resolve(1)]);
      expect(isThenable(result)).toBe(true);
    });
  });

  describe('boxed primitives', () => {
    it('new String()', () => {
      expect(isThenable(new String('hello'))).toBe(false);
    });

    it('new Number()', () => {
      expect(isThenable(new Number(42))).toBe(false);
    });

    it('new Boolean()', () => {
      expect(isThenable(new Boolean(true))).toBe(false);
    });

    it('Object(Symbol())', () => {
      expect(isThenable(Object(Symbol('test')))).toBe(false);
    });

    it('Object(BigInt(42))', () => {
      expect(isThenable(Object(BigInt(42)))).toBe(false);
    });
  });

  describe('web API objects (if available)', () => {
    it('ArrayBuffer', () => {
      expect(isThenable(new ArrayBuffer(8))).toBe(false);
    });

    it('Uint8Array', () => {
      expect(isThenable(new Uint8Array(8))).toBe(false);
    });

    it('DataView', () => {
      expect(isThenable(new DataView(new ArrayBuffer(8)))).toBe(false);
    });

    it('WeakMap', () => {
      expect(isThenable(new WeakMap())).toBe(false);
    });

    it('WeakSet', () => {
      expect(isThenable(new WeakSet())).toBe(false);
    });

    it('WeakRef', () => {
      expect(isThenable(new WeakRef({}))).toBe(false);
    });
  });

  describe('then property edge cases', () => {
    it('then property set to arrow function', () => {
      expect(isThenable({ then: () => {} })).toBe(true);
    });

    it('then property set to bound function', () => {
      const fn = function (this: unknown) {
        return this;
      };
      expect(isThenable({ then: fn.bind({}) })).toBe(true);
    });

    it('then property set to async function', () => {
      expect(isThenable({ then: async () => {} })).toBe(true);
    });

    it('then property set to generator function', () => {
      expect(isThenable({ then: function* () {} })).toBe(true);
    });

    it('then property set to class constructor', () => {
      class ThenClass {}
      expect(isThenable({ then: ThenClass })).toBe(true);
    });

    it('then property set to Proxy of function', () => {
      const proxyFn = new Proxy(() => {}, {});
      expect(isThenable({ then: proxyFn })).toBe(true);
    });

    it('non-enumerable then property', () => {
      const obj = {};
      Object.defineProperty(obj, 'then', {
        value: () => {},
        enumerable: false,
      });
      expect(isThenable(obj)).toBe(true);
    });

    it('non-configurable then property', () => {
      const obj = {};
      Object.defineProperty(obj, 'then', {
        value: () => {},
        configurable: false,
      });
      expect(isThenable(obj)).toBe(true);
    });

    it('non-writable then property', () => {
      const obj = {};
      Object.defineProperty(obj, 'then', {
        value: () => {},
        writable: false,
      });
      expect(isThenable(obj)).toBe(true);
    });
  });

  describe('getter that returns different values', () => {
    it('getter that changes value on each access', () => {
      let callCount = 0;
      const obj = {
        get then() {
          callCount++;
          return callCount === 1 ? () => {} : 'not a function';
        },
      };
      // First access returns function, should be thenable
      expect(isThenable(obj)).toBe(true);
    });

    it('getter that returns function only sometimes', () => {
      let returnFunction = true;
      const obj = {
        get then() {
          const result = returnFunction ? () => {} : null;
          returnFunction = !returnFunction;
          return result;
        },
      };
      expect(isThenable(obj)).toBe(true);
    });
  });

  describe('cross-realm considerations', () => {
    it('should work with objects that have modified Function.prototype', () => {
      // Simulate checking if then is a function without relying on instanceof
      const obj = { then: () => {} };
      expect(typeof obj.then === 'function').toBe(true);
      expect(isThenable(obj)).toBe(true);
    });
  });

  describe('Promise subclasses', () => {
    it('class extending Promise', () => {
      class MyPromise extends Promise<number> {
        constructor() {
          super((resolve) => resolve(42));
        }
      }
      expect(isThenable(new MyPromise())).toBe(true);
    });

    it('class extending Promise with custom then', () => {
      class MyPromise extends Promise<number> {
        constructor() {
          super((resolve) => resolve(42));
        }
        then<T1 = number, T2 = never>(
          onfulfilled?: ((value: number) => T1 | PromiseLike<T1>) | null,
          onrejected?: ((reason: unknown) => T2 | PromiseLike<T2>) | null
        ): Promise<T1 | T2> {
          return super.then(onfulfilled, onrejected);
        }
      }
      expect(isThenable(new MyPromise())).toBe(true);
    });
  });
});
