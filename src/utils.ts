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

export function isInNodeEnv() {
  return (
    (typeof window === 'undefined' || typeof document === 'undefined') &&
    typeof process !== 'undefined'
  );
}

export function getDateString() {
  return new Date().toLocaleString();
}

// 对象序列化，解决undefined、函数、Map丢失问题
export function JSONStringify(option: any) {
  return JSON.stringify(option, (key, val) => {
    if (typeof val === 'function') {
      return `${val}`;
    }
    if (typeof val === 'undefined') {
      return 'undefined';
    }
    if (val != val) {
      return 'NaN';
    }
    if (val instanceof Map) {
      return {
        dataType: 'Map',
        val: Array.from(val.entries()),
      };
    }
    if (val instanceof Set) {
      return {
        dataType: 'Set',
        val: Array.from(val.entries()),
      };
    }

    return val;
  });
}
