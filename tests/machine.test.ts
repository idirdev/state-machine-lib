import { describe, it, expect } from 'vitest';
import { Machine } from '../src/Machine';

describe('Machine', () => {
  const trafficLight = {
    initial: 'green',
    states: {
      green: { on: { TIMER: 'yellow' } },
      yellow: { on: { TIMER: 'red' } },
      red: { on: { TIMER: 'green' } },
    },
  };

  it('starts in initial state', () => {
    const machine = new Machine(trafficLight);
    expect(machine.current).toBe('green');
  });

  it('transitions on events', () => {
    const machine = new Machine(trafficLight);
    machine.send('TIMER');
    expect(machine.current).toBe('yellow');
    machine.send('TIMER');
    expect(machine.current).toBe('red');
  });

  it('ignores unknown events', () => {
    const machine = new Machine(trafficLight);
    machine.send('UNKNOWN');
    expect(machine.current).toBe('green');
  });

  it('supports final states', () => {
    const config = {
      initial: 'active',
      states: {
        active: { on: { FINISH: 'done' } },
        done: { type: 'final' },
      },
    };
    const machine = new Machine(config);
    machine.send('FINISH');
    expect(machine.current).toBe('done');
    expect(machine.done).toBe(true);
  });

  it('tracks state history', () => {
    const machine = new Machine(trafficLight);
    machine.send('TIMER');
    machine.send('TIMER');
    expect(machine.history).toEqual(['green', 'yellow', 'red']);
  });

  it('resets to initial state', () => {
    const machine = new Machine(trafficLight);
    machine.send('TIMER');
    machine.reset();
    expect(machine.current).toBe('green');
  });
});
