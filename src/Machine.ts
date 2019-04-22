import {
  State,
  Event,
  MachineConfig,
  MachineContext,
  StateNode,
  TransitionConfig,
  Listener,
  StateSnapshot,
  Action,
} from './types';
import { toArray, isFunction } from './utils';

/**
 * StateMachine - A finite state machine implementation.
 *
 * Manages states, transitions, guards, actions, and entry/exit hooks.
 * Supports subscribe/unsubscribe pattern for reactive state changes.
 */
export class StateMachine {
  private config: MachineConfig;
  private currentState: State;
  private context: MachineContext;
  private listeners: Set<Listener>;
  private stateHistory: State[];
  private lastEvent: Event;
  private started: boolean;

  constructor(config: MachineConfig) {
    this.config = config;
    this.currentState = config.initial;
    this.context = config.context ? { ...config.context } : {};
    this.listeners = new Set();
    this.stateHistory = [config.initial];
    this.lastEvent = { type: '__init__' };
    this.started = false;

    // Validate config
    this.validateConfig();
  }

  /**
   * Validate that the machine configuration is well-formed.
   */
  private validateConfig(): void {
    if (!this.config.states[this.config.initial]) {
      throw new Error(
        `Initial state "${this.config.initial}" is not defined in states.`
      );
    }

    // Validate all transition targets exist
    for (const [stateName, stateNode] of Object.entries(this.config.states)) {
      if (!stateNode.on) continue;

      for (const [eventName, transitionConfig] of Object.entries(stateNode.on)) {
        const target = typeof transitionConfig === 'string'
          ? transitionConfig
          : (transitionConfig as TransitionConfig).target;

        if (!this.config.states[target]) {
          throw new Error(
            `State "${stateName}" has transition on "${eventName}" to unknown state "${target}".`
          );
        }
      }
    }
  }

  /**
   * Start the machine - executes entry actions for the initial state.
   */
  start(): this {
    this.started = true;
    this.executeEntryActions(this.currentState, this.lastEvent);
    this.notifyListeners(false);
    return this;
  }

  /**
   * Send an event to the machine, potentially triggering a transition.
   */
  send(eventOrType: Event | string): StateSnapshot {
    const event: Event = typeof eventOrType === 'string'
      ? { type: eventOrType }
      : eventOrType;

    const stateNode = this.config.states[this.currentState];
    if (!stateNode || !stateNode.on) {
      return this.getSnapshot(event, false);
    }

    const transitionConfig = stateNode.on[event.type];
    if (!transitionConfig) {
      return this.getSnapshot(event, false);
    }

    // Resolve target and guard
    const { target, guard, actions } = this.resolveTransition(transitionConfig);

    // Evaluate guard
    if (guard && !guard(this.context, event)) {
      return this.getSnapshot(event, false);
    }

    // Check if state actually changes
    const changed = target !== this.currentState;
    const previousState = this.currentState;

    // Execute exit actions for current state
    if (changed) {
      this.executeExitActions(previousState, event);
    }

    // Execute transition actions
    if (actions) {
      for (const action of toArray(actions)) {
        const update = action(this.context, event);
        if (update) {
          this.context = { ...this.context, ...update };
        }
      }
    }

    // Update state
    this.currentState = target;
    this.lastEvent = event;
    this.stateHistory.push(target);

    // Execute entry actions for new state
    if (changed) {
      this.executeEntryActions(target, event);
    }

    // Notify listeners
    this.notifyListeners(changed);

    return this.getSnapshot(event, changed);
  }

  /**
   * Resolve a transition config into its components.
   */
  private resolveTransition(config: TransitionConfig | State): {
    target: State;
    guard?: (ctx: MachineContext, evt: Event) => boolean;
    actions?: Action | Action[];
  } {
    if (typeof config === 'string') {
      return { target: config };
    }
    return {
      target: config.target,
      guard: config.guard,
      actions: config.actions,
    };
  }

  /**
   * Execute entry actions for a state.
   */
  private executeEntryActions(state: State, event: Event): void {
    const stateNode = this.config.states[state];
    if (stateNode?.entry) {
      for (const action of toArray(stateNode.entry)) {
        const update = action(this.context, event);
        if (update) {
          this.context = { ...this.context, ...update };
        }
      }
    }
  }

  /**
   * Execute exit actions for a state.
   */
  private executeExitActions(state: State, event: Event): void {
    const stateNode = this.config.states[state];
    if (stateNode?.exit) {
      for (const action of toArray(stateNode.exit)) {
        const update = action(this.context, event);
        if (update) {
          this.context = { ...this.context, ...update };
        }
      }
    }
  }

  /**
   * Check if a given event can trigger a transition from the current state.
   */
  can(eventType: string): boolean {
    const stateNode = this.config.states[this.currentState];
    if (!stateNode?.on) return false;

    const transitionConfig = stateNode.on[eventType];
    if (!transitionConfig) return false;

    const { guard } = this.resolveTransition(transitionConfig);
    if (guard) {
      return guard(this.context, { type: eventType });
    }

    return true;
  }

  /**
   * Check if the machine is currently in the given state.
   */
  matches(state: State): boolean {
    return this.currentState === state;
  }

  /**
   * Get a snapshot of the current machine state.
   */
  getSnapshot(event?: Event, changed?: boolean): StateSnapshot {
    const stateNode = this.config.states[this.currentState];
    return {
      value: this.currentState,
      context: { ...this.context },
      event: event || this.lastEvent,
      changed: changed ?? false,
      done: stateNode?.type === 'final',
      history: [...this.stateHistory],
    };
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
   * Unsubscribe a listener.
   */
  unsubscribe(listener: Listener): void {
    this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of a state change.
   */
  private notifyListeners(changed: boolean): void {
    const snapshot = this.getSnapshot(this.lastEvent, changed);
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  /**
   * Get the current state value.
   */
  get state(): State {
    return this.currentState;
  }

  /**
   * Get the current context.
   */
  getContext(): MachineContext {
    return { ...this.context };
  }

  /**
   * Get the machine configuration.
   */
  getConfig(): MachineConfig {
    return this.config;
  }

  /**
   * Get the state history.
   */
  getHistory(): State[] {
    return [...this.stateHistory];
  }
}
