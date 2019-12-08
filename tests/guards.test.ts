import { describe, it, expect } from 'vitest';
import { and, or, not } from '../src/guards';

describe('guards', () => {
  const dummyEvent = { type: 'TEST' };

  it('combines guards with and', () => {
    const isPositive = (ctx: any) => ctx.value > 0;
    const isEven = (ctx: any) => ctx.value % 2 === 0;
    const combined = and(isPositive, isEven);
    expect(combined({ value: 4 }, dummyEvent)).toBe(true);
    expect(combined({ value: 3 }, dummyEvent)).toBe(false);
    expect(combined({ value: -2 }, dummyEvent)).toBe(false);
  });

  it('combines guards with or', () => {
    const isAdmin = (ctx: any) => ctx.role === 'admin';
    const isOwner = (ctx: any) => ctx.isOwner;
    const combined = or(isAdmin, isOwner);
    expect(combined({ role: 'admin', isOwner: false }, dummyEvent)).toBe(true);
    expect(combined({ role: 'user', isOwner: true }, dummyEvent)).toBe(true);
    expect(combined({ role: 'user', isOwner: false }, dummyEvent)).toBe(false);
  });

  it('negates guard with not', () => {
    const isLocked = (ctx: any) => ctx.locked;
    const isUnlocked = not(isLocked);
    expect(isUnlocked({ locked: false }, dummyEvent)).toBe(true);
    expect(isUnlocked({ locked: true }, dummyEvent)).toBe(false);
  });
});
