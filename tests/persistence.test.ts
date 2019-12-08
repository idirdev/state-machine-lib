import { describe, it, expect } from 'vitest';
import { serialize, deserialize } from '../src/persistence';
import { StateMachine } from '../src/Machine';

describe('persistence', () => {
  const config = {
    id: 'persist-test',
    initial: 'idle',
    states: {
      idle: { on: { START: 'running' } },
      running: { on: { STOP: 'idle' } },
    },
  };

  it('serializes state', () => {
    const m = new StateMachine(config);
    m.send('START');
    const parsed = JSON.parse(serialize(m));
    expect(parsed.current).toBe('running');
    expect(parsed.version).toBe(1);
  });

  it('deserializes state', () => {
    const data = JSON.stringify({ current: 'running', context: {}, history: ['idle', 'running'], version: 1 });
    const restored = deserialize(config, data);
    expect(restored).toBeInstanceOf(StateMachine);
  });

  it('rejects bad version', () => {
    const bad = JSON.stringify({ current: 'idle', context: {}, history: [], version: 99 });
    expect(() => deserialize(config, bad)).toThrow('Unsupported version');
  });
});
