import { describe, it, expect } from 'vitest';
import { StateMachine } from '../src/Machine';

describe('StateMachine', () => {
  const trafficLight = {
    id: 'traffic',
    initial: 'green',
    states: {
      green: { on: { TIMER: 'yellow' } },
      yellow: { on: { TIMER: 'red' } },
      red: { on: { TIMER: 'green' } },
    },
  };

  it('starts in initial state', () => {
    const machine = new StateMachine(trafficLight);
    expect(machine.state).toBe('green');
  });

  it('transitions on events', () => {
    const machine = new StateMachine(trafficLight);
    machine.send('TIMER');
    expect(machine.state).toBe('yellow');
    machine.send('TIMER');
    expect(machine.state).toBe('red');
  });

  it('ignores unknown events', () => {
    const machine = new StateMachine(trafficLight);
    machine.send('UNKNOWN');
    expect(machine.state).toBe('green');
  });

  it('supports final states', () => {
    const config = {
      id: 'final-test',
      initial: 'active',
      states: {
        active: { on: { FINISH: 'done' } },
        done: { type: 'final' as const },
      },
    };
    const machine = new StateMachine(config);
    machine.send('FINISH');
    expect(machine.state).toBe('done');
    expect(machine.getSnapshot().done).toBe(true);
  });

  it('tracks state history', () => {
    const machine = new StateMachine(trafficLight);
    machine.send('TIMER');
    machine.send('TIMER');
    expect(machine.getHistory()).toEqual(['green', 'yellow', 'red']);
  });

  it('exposes context', () => {
    const config = {
      id: 'ctx-test',
      initial: 'idle',
      context: { count: 0 },
      states: {
        idle: { on: { GO: 'active' } },
        active: {},
      },
    };
    const machine = new StateMachine(config);
    expect(machine.getContext()).toEqual({ count: 0 });
  });
});
