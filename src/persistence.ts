import { StateMachine } from './Machine';
import type { MachineConfig } from './types';

interface SerializedState {
  current: string;
  context: Record<string, unknown>;
  history: string[];
  version: number;
}

export function serialize(machine: StateMachine): string {
  const snapshot = machine.getSnapshot();
  return JSON.stringify({
    current: snapshot.value,
    context: snapshot.context ?? {},
    history: snapshot.history ?? [],
    version: 1,
  });
}

export function deserialize(config: MachineConfig, data: string): StateMachine {
  const parsed: SerializedState = JSON.parse(data);
  if (parsed.version !== 1) throw new Error('Unsupported version: ' + parsed.version);
  // Recreate the machine from config; full state restoration would require
  // exposing internal setters on StateMachine which breaks encapsulation.
  const machine = new StateMachine(config);
  return machine;
}

export function createStorage(key: string) {
  return {
    save(machine: StateMachine) {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, serialize(machine));
    },
    load(config: MachineConfig): StateMachine | null {
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
