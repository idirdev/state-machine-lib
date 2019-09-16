import { describe, it, expect } from 'vitest';
import { evaluateGuard, and, or, not } from '../src/guards';

describe('guards', () => {
  it('evaluates simple guard', () => {
    const guard = (ctx: any) => ctx.count > 0;
    expect(evaluateGuard(guard, { count: 5 })).toBe(true);
    expect(evaluateGuard(guard, { count: 0 })).toBe(false);
  });

  it('combines guards with and', () => {
    const isPositive = (ctx: any) => ctx.value > 0;
    const isEven = (ctx: any) => ctx.value % 2 === 0;
    const combined = and(isPositive, isEven);
    expect(combined({ value: 4 })).toBe(true);
    expect(combined({ value: 3 })).toBe(false);
    expect(combined({ value: -2 })).toBe(false);
  });

  it('combines guards with or', () => {
    const isAdmin = (ctx: any) => ctx.role === 'admin';
    const isOwner = (ctx: any) => ctx.isOwner;
    const combined = or(isAdmin, isOwner);
    expect(combined({ role: 'admin', isOwner: false })).toBe(true);
    expect(combined({ role: 'user', isOwner: true })).toBe(true);
    expect(combined({ role: 'user', isOwner: false })).toBe(false);
  });

  it('negates guard with not', () => {
    const isLocked = (ctx: any) => ctx.locked;
    const isUnlocked = not(isLocked);
    expect(isUnlocked({ locked: false })).toBe(true);
    expect(isUnlocked({ locked: true })).toBe(false);
  });
});
