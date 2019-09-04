import { describe, it, expect, vi } from 'vitest';
import { Interpreter } from '../src/Interpreter';
import { Machine } from '../src/Machine';

describe('Interpreter', () => {
  const config = {
    initial: 'idle',
    states: {
      idle: { on: { START: 'running' } },
      running: { on: { PAUSE: 'paused', STOP: 'idle' } },
      paused: { on: { RESUME: 'running', STOP: 'idle' } },
    },
  };

  it('creates interpreter from machine config', () => {
    const interpreter = new Interpreter(config);
    expect(interpreter.state).toBe('idle');
  });

  it('notifies listeners on transition', () => {
    const listener = vi.fn();
    const interpreter = new Interpreter(config);
    interpreter.onTransition(listener);
    interpreter.send('START');
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'idle', to: 'running', event: 'START' })
    );
  });

  it('supports multiple listeners', () => {
    const l1 = vi.fn();
    const l2 = vi.fn();
    const interpreter = new Interpreter(config);
    interpreter.onTransition(l1);
    interpreter.onTransition(l2);
    interpreter.send('START');
    expect(l1).toHaveBeenCalled();
    expect(l2).toHaveBeenCalled();
  });

  it('allows unsubscribing listeners', () => {
    const listener = vi.fn();
    const interpreter = new Interpreter(config);
    const unsub = interpreter.onTransition(listener);
    unsub();
    interpreter.send('START');
    expect(listener).not.toHaveBeenCalled();
  });

  it('queues events during transition', () => {
    const interpreter = new Interpreter(config);
    interpreter.send('START');
    interpreter.send('PAUSE');
    expect(interpreter.state).toBe('paused');
  });
});
