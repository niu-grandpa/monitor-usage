export function isPrimitiveType(value: any) {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'symbol' ||
    typeof value === 'bigint' ||
    typeof value === 'undefined' ||
    value === null
  );
}

export function typeOf(value: any): string {
  return Object.prototype.toString
    .call(value)
    .match(/\[(.*?)\]/)[1]
    .slice(7);
}

export function deepClone(target: object) {
  const map = new WeakMap();

  function isObject(target: object) {
    return (
      (typeof target === 'object' && target) || typeof target === 'function'
    );
  }

  function clone(data) {
    if (!isObject(data)) {
      return data;
    }
    if ([Date, RegExp].includes(data.constructor)) {
      return new data.constructor(data);
    }
    if (typeof data === 'function') {
      return new Function('return ' + data.toString())();
    }
    const exist = map.get(data);
    if (exist) {
      return exist;
    }
    if (data instanceof Map) {
      const result = new Map();
      map.set(data, result);
      data.forEach((val, key) => {
        if (isObject(val)) {
          result.set(key, clone(val));
        } else {
          result.set(key, val);
        }
      });
      return result;
    }
    if (data instanceof Set) {
      const result = new Set();
      map.set(data, result);
      data.forEach(val => {
        if (isObject(val)) {
          result.add(clone(val));
        } else {
          result.add(val);
        }
      });
      return result;
    }
    const keys = Reflect.ownKeys(data);
    const allDesc = Object.getOwnPropertyDescriptors(data);
    const result = Object.create(Object.getPrototypeOf(data), allDesc);
    map.set(data, result);
    keys.forEach(key => {
      const val = data[key];
      if (isObject(val)) {
        result[key] = clone(val);
      } else {
        result[key] = val;
      }
    });
    return result;
  }

  return clone(target);
}

export function isInNodeEnv() {
  return (
    (typeof window === 'undefined' || typeof document === 'undefined') &&
    typeof process !== 'undefined'
  );
}

export function getDateString() {
  return new Date().toLocaleString();
}
