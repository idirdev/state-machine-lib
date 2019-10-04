import { Machine } from './Machine';
import type { StateConfig, MachineConfig } from './types';

interface ParallelState {
  regions: Map<string, Machine>;
}

export class ParallelMachine {
  private regions: Map<string, Machine> = new Map();

  constructor(config: Record<string, MachineConfig>) {
    for (const [name, regionConfig] of Object.entries(config)) {
      this.regions.set(name, new Machine(regionConfig));
    }
  }

  get state(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [name, machine] of this.regions) {
      result[name] = machine.current;
    }
    return result;
  }

  send(event: string, region?: string) {
    if (region) {
      const machine = this.regions.get(region);
      if (machine) machine.send(event);
    } else {
      for (const machine of this.regions.values()) {
        machine.send(event);
      }
    }
  }

  getRegion(name: string): Machine | undefined {
    return this.regions.get(name);
  }

  get regionNames(): string[] {
    return Array.from(this.regions.keys());
  }

  get done(): boolean {
    for (const machine of this.regions.values()) {
      if (!machine.done) return false;
    }
    return true;
  }

  reset() {
    for (const machine of this.regions.values()) {
      machine.reset();
    }
  }
}
