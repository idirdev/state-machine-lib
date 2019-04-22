import { StateMachine } from '../src/Machine';
import { Interpreter } from '../src/Interpreter';
import { assign, log } from '../src/actions';
import { greaterThan } from '../src/guards';
import { generateMermaid, generateAscii } from '../src/visualizer';
import { MachineConfig } from '../src/types';

/**
 * Traffic light state machine example.
 * States: green -> yellow -> red -> green (cycle)
 * Tracks the number of completed cycles in context.
 */
const trafficLightConfig: MachineConfig = {
  id: 'trafficLight',
  initial: 'green',
  context: {
    cycles: 0,
    lastChange: Date.now(),
  },
  states: {
    green: {
      entry: log('Light is GREEN - go!'),
      on: {
        TIMER: {
          target: 'yellow',
          actions: [
            assign((ctx) => ({ lastChange: Date.now() })),
            log('Changing to yellow...'),
          ],
        },
        EMERGENCY: {
          target: 'red',
          actions: log('EMERGENCY: Switching to red immediately!'),
        },
      },
    },
    yellow: {
      entry: log('Light is YELLOW - slow down!'),
      on: {
        TIMER: {
          target: 'red',
          actions: assign((ctx) => ({ lastChange: Date.now() })),
        },
      },
    },
    red: {
      entry: log('Light is RED - stop!'),
      on: {
        TIMER: {
          target: 'green',
          actions: [
            assign((ctx) => ({
              cycles: (ctx.cycles as number) + 1,
              lastChange: Date.now(),
            })),
            log((ctx) => `Cycle ${(ctx.cycles as number) + 1} complete`),
          ],
        },
      },
    },
  },
};

// --- Run the example ---

console.log('=== Traffic Light State Machine ===\n');

// Print the Mermaid diagram
console.log('Mermaid Diagram:');
console.log(generateMermaid(trafficLightConfig));
console.log('');

// Print the ASCII diagram
console.log(generateAscii(trafficLightConfig));
console.log('');

// Create and run the interpreter
const interpreter = new Interpreter(trafficLightConfig);

interpreter.subscribe((snapshot) => {
  console.log(`  State: ${snapshot.value} | Cycles: ${snapshot.context.cycles}`);
});

interpreter.onError((err, event) => {
  console.error(`Error on event ${event.type}: ${err.message}`);
});

interpreter.start();

// Simulate traffic light cycle
console.log('\n--- Simulating traffic light ---');
interpreter.send('TIMER');  // green -> yellow
interpreter.send('TIMER');  // yellow -> red
interpreter.send('TIMER');  // red -> green (cycle 1)
interpreter.send('TIMER');  // green -> yellow
interpreter.send('TIMER');  // yellow -> red
interpreter.send('TIMER');  // red -> green (cycle 2)

// Test emergency
console.log('\n--- Emergency! ---');
interpreter.send('EMERGENCY');  // green -> red

console.log('\n--- Final state ---');
const snapshot = interpreter.getSnapshot();
console.log(`State: ${snapshot.value}`);
console.log(`Context:`, snapshot.context);
console.log(`History:`, snapshot.history);
console.log(`Event history:`, interpreter.getEventHistory().map((e) => e.type));

interpreter.stop();
