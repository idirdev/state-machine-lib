/**
 * Wrap a value in an array if it isn't already one.
 */
export function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

/**
 * Flatten a nested array by one level.
 */
export function flatten<T>(arr: (T | T[])[]): T[] {
  return arr.reduce<T[]>((acc, item) => {
    return acc.concat(Array.isArray(item) ? item : [item]);
  }, []);
}

/**
 * Map over the values of an object, returning a new object with the same keys.
 */
export function mapValues<T, U>(
  obj: Record<string, T>,
  fn: (value: T, key: string) => U
): Record<string, U> {
  const result: Record<string, U> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = fn(value, key);
  }
  return result;
}

/**
 * Check if a value is a function.
 */
export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

/**
 * Generate a unique ID string.
 */
let idCounter = 0;
export function uniqueId(prefix: string = 'id'): string {
  idCounter += 1;
  return `${prefix}_${idCounter}_${Date.now().toString(36)}`;
}
