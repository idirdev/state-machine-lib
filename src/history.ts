export type HistoryType = 'shallow' | 'deep';

interface HistoryEntry {
  state: string;
  context?: Record<string, unknown>;
  timestamp: number;
}

export class StateHistory {
  private entries: HistoryEntry[] = [];
  private maxSize: number;
  private type: HistoryType;

  constructor(opts: { maxSize?: number; type?: HistoryType } = {}) {
    this.maxSize = opts.maxSize ?? 100;
    this.type = opts.type ?? 'shallow';
  }

  push(state: string, context?: Record<string, unknown>) {
    const entry: HistoryEntry = {
      state,
      context: this.type === 'deep' ? structuredClone(context) : undefined,
      timestamp: Date.now(),
    };
    this.entries.push(entry);
    if (this.entries.length > this.maxSize) this.entries.shift();
  }

  get last(): HistoryEntry | undefined {
    return this.entries[this.entries.length - 1];
  }

  get previous(): HistoryEntry | undefined {
    return this.entries[this.entries.length - 2];
  }

  get all(): ReadonlyArray<HistoryEntry> {
    return this.entries;
  }

  get length(): number {
    return this.entries.length;
  }

  clear() { this.entries = []; }

  toJSON(): HistoryEntry[] { return [...this.entries]; }

  static fromJSON(data: HistoryEntry[], opts?: { maxSize?: number; type?: HistoryType }): StateHistory {
    const history = new StateHistory(opts);
    history.entries = data;
    return history;
  }
}
