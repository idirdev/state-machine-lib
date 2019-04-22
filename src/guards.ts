import { Guard, MachineContext, Event } from './types';

/**
 * Guard: checks if a context property equals a given value.
 */
export function equals(property: string, value: unknown): Guard {
  return (context: MachineContext) => context[property] === value;
}

/**
 * Guard: negates another guard.
 */
export function not(guardFn: Guard): Guard {
  return (context: MachineContext, event: Event) => !guardFn(context, event);
}

/**
 * Guard: all guards must pass (logical AND).
 */
export function and(...guards: Guard[]): Guard {
  return (context: MachineContext, event: Event) =>
    guards.every((g) => g(context, event));
}

/**
 * Guard: at least one guard must pass (logical OR).
 */
export function or(...guards: Guard[]): Guard {
  return (context: MachineContext, event: Event) =>
    guards.some((g) => g(context, event));
}

/**
 * Guard: checks if a context property is greater than a value.
 */
export function greaterThan(property: string, value: number): Guard {
  return (context: MachineContext) => (context[property] as number) > value;
}

/**
 * Guard: checks if a context property is less than a value.
 */
export function lessThan(property: string, value: number): Guard {
  return (context: MachineContext) => (context[property] as number) < value;
}

/**
 * Guard: checks if a context array/string property contains a value.
 */
export function contains(property: string, value: unknown): Guard {
  return (context: MachineContext) => {
    const prop = context[property];
    if (Array.isArray(prop)) return prop.includes(value);
    if (typeof prop === 'string') return prop.includes(value as string);
    return false;
  };
}

/**
 * Guard: checks if a context string property matches a regex pattern.
 */
export function matches(property: string, pattern: RegExp): Guard {
  return (context: MachineContext) => {
    const prop = context[property];
    if (typeof prop !== 'string') return false;
    return pattern.test(prop);
  };
}

/**
 * Guard factory: create a custom guard from a predicate function.
 */
export function guard(predicate: (context: MachineContext, event: Event) => boolean): Guard {
  return predicate;
}
