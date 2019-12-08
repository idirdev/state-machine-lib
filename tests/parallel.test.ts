import { describe, it, expect } from 'vitest';
import { ParallelMachine } from '../src/parallel';

describe('ParallelMachine', () => {
  const config = {
    display: {
      id: 'display',
      initial: 'visible',
      states: {
        visible: { on: { HIDE: 'hidden' } },
        hidden: { on: { SHOW: 'visible' } },
      },
    },
    input: {
      id: 'input',
      initial: 'enabled',
      states: {
        enabled: { on: { DISABLE: 'disabled' } },
        disabled: { on: { ENABLE: 'enabled' } },
      },
    },
  };

  it('tracks multiple regions independently', () => {
    const machine = new ParallelMachine(config);
    expect(machine.state).toEqual({ display: 'visible', input: 'enabled' });
  });

  it('sends events to specific region', () => {
    const machine = new ParallelMachine(config);
    machine.send('HIDE', 'display');
    expect(machine.state.display).toBe('hidden');
    expect(machine.state.input).toBe('enabled');
  });

  it('broadcasts events to all regions', () => {
    const machine = new ParallelMachine(config);
    machine.send('HIDE');
    machine.send('DISABLE');
    expect(machine.state).toEqual({ display: 'hidden', input: 'disabled' });
  });

  it('lists region names', () => {
    const machine = new ParallelMachine(config);
    expect(machine.regionNames).toEqual(['display', 'input']);
  });

  it('resets all regions', () => {
    const machine = new ParallelMachine(config);
    machine.send('HIDE');
    machine.send('DISABLE');
    machine.reset();
    expect(machine.state).toEqual({ display: 'visible', input: 'enabled' });
  });
});
