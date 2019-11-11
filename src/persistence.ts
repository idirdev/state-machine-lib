import { Machine } from './Machine';
import type { MachineConfig } from './types';

interface SerializedState {
  current: string;
  context: Record<string, unknown>;
  history: string[];
  version: number;
}

export function serialize(machine: Machine): string {
  return JSON.stringify({
    current: machine.current,
    context: machine.context ?? {},
    history: machine.history ?? [],
    version: 1,
  });
}

export function deserialize(config: MachineConfig, data: string): Machine {
  const parsed: SerializedState = JSON.parse(data);
  if (parsed.version !== 1) throw new Error('Unsupported version: ' + parsed.version);
  const machine = new Machine(config);
  machine.restore(parsed.current, parsed.context, parsed.history);
  return machine;
}

export function createStorage(key: string) {
  return {
    save(machine: Machine) {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, serialize(machine));
    },
    load(config: MachineConfig): Machine | null {
      if (typeof localStorage === 'undefined') return null;
      const data = localStorage.getItem(key);
      if (!data) return null;
      try { return deserialize(config, data); } catch { return null; }
    },
    clear() {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    },
  };
}
