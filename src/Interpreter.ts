import { StateMachine } from './Machine';
import {
  Event,
  Listener,
  StateSnapshot,
  InterpreterOptions,
  MachineConfig,
} from './types';

/**
 * Interpreter - Manages a running instance of a StateMachine.
 *
 * Provides event queuing, async action support, error handling,
 * event history tracking, and child machine forwarding.
 */
export class Interpreter {
  private machine: StateMachine;
  private running: boolean;
  private eventQueue: Event[];
  private processing: boolean;
  private eventHistory: Event[];
  private maxHistoryLength: number;
  private children: Map<string, Interpreter>;
  private errorListeners: Set<(error: Error, event: Event) => void>;
  private listeners: Set<Listener>;

  constructor(config: MachineConfig, options: InterpreterOptions = {}) {
    this.machine = new StateMachine(config);
    this.running = false;
    this.eventQueue = [];
    this.processing = false;
    this.eventHistory = [];
    this.maxHistoryLength = options.maxHistoryLength ?? 100;
    this.children = new Map();
    this.errorListeners = new Set();
    this.listeners = new Set();
  }

  /**
   * Start the interpreter and the underlying machine.
   */
  start(): this {
    if (this.running) {
      console.warn('[state-machine-lib] Interpreter is already running.');
      return this;
    }

    this.running = true;
    this.machine.start();
    this.notifyListeners();
    return this;
  }

  /**
   * Stop the interpreter. No more events will be processed.
   */
  stop(): this {
    this.running = false;
    this.eventQueue = [];

    // Stop all child interpreters
    for (const [, child] of this.children) {
      child.stop();
    }
    this.children.clear();

    return this;
  }

  /**
   * Send an event to the machine. Events are queued and processed sequentially.
   */
  send(eventOrType: Event | string): this {
    if (!this.running) {
      console.warn('[state-machine-lib] Cannot send events to a stopped interpreter.');
      return this;
    }

    const event: Event = typeof eventOrType === 'string'
      ? { type: eventOrType }
      : eventOrType;

    this.eventQueue.push(event);
    this.trackEvent(event);

    // Process queue if not already processing
    if (!this.processing) {
      this.processQueue();
    }

    return this;
  }

  /**
   * Send an event after a delay (in milliseconds).
   */
  sendDelayed(eventOrType: Event | string, delayMs: number): NodeJS.Timeout {
    return setTimeout(() => {
      this.send(eventOrType);
    }, delayMs);
  }

  /**
   * Process the event queue sequentially.
   */
  private processQueue(): void {
    this.processing = true;

    while (this.eventQueue.length > 0 && this.running) {
      const event = this.eventQueue.shift()!;

      try {
        const snapshot = this.machine.send(event);

        // Forward to child machines
        this.forwardToChildren(event);

        // Notify listeners
        this.notifyListeners();

        // Check if machine reached a final state
        if (snapshot.done) {
          this.stop();
          break;
        }
      } catch (error: any) {
        this.handleError(error, event);
      }
    }

    this.processing = false;
  }

  /**
   * Forward events to child interpreters.
   */
  private forwardToChildren(event: Event): void {
    for (const [, child] of this.children) {
      if (child.isRunning()) {
        child.send(event);
      }
    }
  }

  /**
   * Handle errors during event processing.
   */
  private handleError(error: Error, event: Event): void {
    if (this.errorListeners.size > 0) {
      for (const handler of this.errorListeners) {
        handler(error, event);
      }
    } else {
      console.error(
        `[state-machine-lib] Error processing event "${event.type}":`,
        error.message
      );
    }
  }

  /**
   * Track an event in the history buffer.
   */
  private trackEvent(event: Event): void {
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistoryLength) {
      this.eventHistory.shift();
    }
  }

  /**
   * Subscribe to state changes.
   */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Register an error handler.
   */
  onError(handler: (error: Error, event: Event) => void): () => void {
    this.errorListeners.add(handler);
    return () => {
      this.errorListeners.delete(handler);
    };
  }

  /**
   * Notify all subscribed listeners.
   */
  private notifyListeners(): void {
    const snapshot = this.machine.getSnapshot();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  /**
   * Spawn a child interpreter.
   */
  spawn(id: string, config: MachineConfig): Interpreter {
    const child = new Interpreter(config);
    this.children.set(id, child);
    child.start();
    return child;
  }

  /**
   * Get a child interpreter by ID.
   */
  getChild(id: string): Interpreter | undefined {
    return this.children.get(id);
  }

  /**
   * Check if the interpreter is currently running.
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Get the current state snapshot.
   */
  getSnapshot(): StateSnapshot {
    return this.machine.getSnapshot();
  }

  /**
   * Get the event history.
   */
  getEventHistory(): Event[] {
    return [...this.eventHistory];
  }

  /**
   * Get the underlying state machine.
   */
  getMachine(): StateMachine {
    return this.machine;
  }
}
