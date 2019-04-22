/**
 * A state identifier - either a string name or an enum value.
 */
export type State = string;

/**
 * An event that triggers transitions.
 */
export interface Event {
  type: string;
  payload?: Record<string, unknown>;
}

/**
 * A transition between two states.
 */
export interface Transition {
  from: State;
  to: State;
  event: string;
  guard?: Guard;
  actions?: Action[];
}

/**
 * A guard function that determines whether a transition is allowed.
 * Receives the current context and the event being processed.
 */
export type Guard = (context: MachineContext, event: Event) => boolean;

/**
 * An action function executed during a transition or on state entry/exit.
 * Can return a partial context update or void.
 */
export type Action = (context: MachineContext, event: Event) => Partial<MachineContext> | void;

/**
 * Full configuration for a state machine.
 */
export interface MachineConfig {
  id: string;
  initial: State;
  context?: MachineContext;
  states: Record<State, StateNode>;
}

/**
 * The context (extended state) of a machine - arbitrary data.
 */
export type MachineContext = Record<string, unknown>;

/**
 * Configuration for a single state in the machine.
 */
export interface StateNode {
  on?: Record<string, TransitionConfig | State>;
  entry?: Action | Action[];
  exit?: Action | Action[];
  meta?: Record<string, unknown>;
  type?: 'atomic' | 'final';
}

/**
 * Detailed transition configuration.
 */
export interface TransitionConfig {
  target: State;
  guard?: Guard;
  actions?: Action | Action[];
  description?: string;
}

/**
 * A listener function called when the machine's state changes.
 */
export type Listener = (state: StateSnapshot) => void;

/**
 * A snapshot of the machine's current state.
 */
export interface StateSnapshot {
  value: State;
  context: MachineContext;
  event: Event;
  changed: boolean;
  done: boolean;
  history: State[];
}

/**
 * Options for the interpreter.
 */
export interface InterpreterOptions {
  maxHistoryLength?: number;
  devTools?: boolean;
}
