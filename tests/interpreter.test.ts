import { describe, it, expect, vi } from 'vitest';
import { Interpreter } from '../src/Interpreter';

describe('Interpreter', () => {
  const config = {
    id: 'interp-test',
    initial: 'idle',
    states: {
      idle: { on: { START: 'running' } },
      running: { on: { PAUSE: 'paused', STOP: 'idle' } },
      paused: { on: { RESUME: 'running', STOP: 'idle' } },
    },
  };

  it('creates interpreter from machine config', () => {
    const interpreter = new Interpreter(config);
    interpreter.start();
    expect(interpreter.getSnapshot().value).toBe('idle');
  });

  it('notifies listeners on transition', () => {
    const listener = vi.fn();
    const interpreter = new Interpreter(config);
    interpreter.subscribe(listener);
    interpreter.start();
    interpreter.send('START');
    expect(listener).toHaveBeenCalled();
    const lastCall = listener.mock.calls[listener.mock.calls.length - 1][0];
    expect(lastCall.value).toBe('running');
  });

  it('supports multiple listeners', () => {
    const l1 = vi.fn();
    const l2 = vi.fn();
    const interpreter = new Interpreter(config);
    interpreter.subscribe(l1);
    interpreter.subscribe(l2);
    interpreter.start();
    interpreter.send('START');
    expect(l1).toHaveBeenCalled();
    expect(l2).toHaveBeenCalled();
  });

  it('allows unsubscribing listeners', () => {
    const listener = vi.fn();
    const interpreter = new Interpreter(config);
    const unsub = interpreter.subscribe(listener);
    interpreter.start();
    unsub();
    listener.mockClear();
    interpreter.send('START');
    expect(listener).not.toHaveBeenCalled();
  });

  it('queues events during transition', () => {
    const interpreter = new Interpreter(config);
    interpreter.start();
    interpreter.send('START');
    interpreter.send('PAUSE');
    expect(interpreter.getSnapshot().value).toBe('paused');
  });
});
