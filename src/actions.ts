import { Action, MachineContext, Event } from './types';

/**
 * Action: assign new values to the context.
 * Accepts either a partial context object or a function that returns one.
 */
export function assign(
  assignment: Partial<MachineContext> | ((context: MachineContext, event: Event) => Partial<MachineContext>)
): Action {
  return (context: MachineContext, event: Event) => {
    if (typeof assignment === 'function') {
      return assignment(context, event);
    }
    return assignment;
  };
}

/**
 * Action: log a message to the console.
 * Accepts a static string or a function that returns the message.
 */
export function log(
  message: string | ((context: MachineContext, event: Event) => string)
): Action {
  return (context: MachineContext, event: Event) => {
    const msg = typeof message === 'function' ? message(context, event) : message;
    console.log(`[state-machine] ${msg}`);
  };
}

/**
 * Action: send a delayed event to the machine itself.
 * Returns a context update with a pending event marker.
 */
export function send(eventType: string, delayMs?: number): Action {
  return (context: MachineContext) => {
    const pendingEvents = (context.__pendingEvents as Array<{ type: string; delay: number }>) || [];
    return {
      __pendingEvents: [...pendingEvents, { type: eventType, delay: delayMs || 0 }],
    };
  };
}

/**
 * Action: raise an event to be processed immediately after the current transition.
 * Similar to send but with zero delay and higher priority.
 */
export function raise(eventType: string): Action {
  return (context: MachineContext) => {
    const raisedEvents = (context.__raisedEvents as string[]) || [];
    return {
      __raisedEvents: [...raisedEvents, eventType],
    };
  };
}

/**
 * Action: pure conditional action.
 * Takes a function that returns zero or more actions based on context/event.
 */
export function pure(
  getActions: (context: MachineContext, event: Event) => Action[]
): Action {
  return (context: MachineContext, event: Event) => {
    const actions = getActions(context, event);
    let mergedUpdate: Partial<MachineContext> = {};

    for (const action of actions) {
      const update = action(context, event);
      if (update) {
        mergedUpdate = { ...mergedUpdate, ...update };
        // Update context for subsequent actions in the chain
        Object.assign(context, update);
      }
    }

    return Object.keys(mergedUpdate).length > 0 ? mergedUpdate : undefined;
  };
}

/**
 * Action: choose the first matching action based on guards.
 * Each candidate has a guard and a set of actions to execute.
 */
export function choose(
  candidates: Array<{
    guard?: (context: MachineContext, event: Event) => boolean;
    actions: Action[];
  }>
): Action {
  return (context: MachineContext, event: Event) => {
    for (const candidate of candidates) {
      const guardPasses = candidate.guard
        ? candidate.guard(context, event)
        : true;

      if (guardPasses) {
        let mergedUpdate: Partial<MachineContext> = {};

        for (const action of candidate.actions) {
          const update = action(context, event);
          if (update) {
            mergedUpdate = { ...mergedUpdate, ...update };
          }
        }

        return Object.keys(mergedUpdate).length > 0 ? mergedUpdate : undefined;
      }
    }

    return undefined;
  };
}
