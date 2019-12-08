import { StateMachine } from './Machine';
import type { MachineConfig } from './types';

export class ParallelMachine {
  private regions: Map<string, StateMachine> = new Map();
  private configs: Record<string, MachineConfig>;

  constructor(config: Record<string, MachineConfig>) {
    this.configs = config;
    for (const [name, regionConfig] of Object.entries(config)) {
      this.regions.set(name, new StateMachine(regionConfig));
    }
  }

  get state(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [name, machine] of this.regions) {
      result[name] = machine.state;
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

  getRegion(name: string): StateMachine | undefined {
    return this.regions.get(name);
  }

  get regionNames(): string[] {
    return Array.from(this.regions.keys());
  }

  get done(): boolean {
    for (const machine of this.regions.values()) {
      if (!machine.getSnapshot().done) return false;
    }
    return true;
  }

  reset() {
    for (const [name, config] of Object.entries(this.configs)) {
      this.regions.set(name, new StateMachine(config));
    }
  }
}
