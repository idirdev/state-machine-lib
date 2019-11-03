import { describe, it, expect } from 'vitest';
import { StateHistory } from '../src/history';

describe('StateHistory', () => {
  it('tracks transitions', () => {
    const h = new StateHistory();
    h.push('idle'); h.push('loading'); h.push('success');
    expect(h.length).toBe(3);
    expect(h.last?.state).toBe('success');
  });
  it('returns previous', () => {
    const h = new StateHistory();
    h.push('idle'); h.push('loading');
    expect(h.previous?.state).toBe('idle');
  });
  it('respects max size', () => {
    const h = new StateHistory({ maxSize: 3 });
    h.push('a'); h.push('b'); h.push('c'); h.push('d');
    expect(h.length).toBe(3);
    expect(h.all[0].state).toBe('b');
  });
  it('deep history preserves context', () => {
    const h = new StateHistory({ type: 'deep' });
    const ctx = { count: 1 };
    h.push('state', ctx);
    ctx.count = 999;
    expect(h.last?.context?.count).toBe(1);
  });
  it('serializes to JSON', () => {
    const h = new StateHistory();
    h.push('idle'); h.push('active');
    expect(h.toJSON()).toHaveLength(2);
  });
});
