import { describe, it, expect } from 'vitest';
import { serialize, deserialize } from '../src/persistence';
import { Machine } from '../src/Machine';

describe('persistence', () => {
  const config = {
    initial: 'idle',
    states: { idle: { on: { START: 'running' } }, running: { on: { STOP: 'idle' } } },
  };
  it('serializes state', () => {
    const m = new Machine(config);
    m.send('START');
    const parsed = JSON.parse(serialize(m));
    expect(parsed.current).toBe('running');
  });
  it('deserializes state', () => {
    const m = new Machine(config);
    m.send('START');
    const restored = deserialize(config, serialize(m));
    expect(restored.current).toBe('running');
  });
  it('rejects bad version', () => {
    const bad = JSON.stringify({ current: 'idle', context: {}, history: [], version: 99 });
    expect(() => deserialize(config, bad)).toThrow('Unsupported version');
  });
});
