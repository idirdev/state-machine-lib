import { StateMachine } from '../src/Machine';
import { Interpreter } from '../src/Interpreter';
import { assign, log, choose } from '../src/actions';
import { equals, not, and, greaterThan } from '../src/guards';
import { generateMermaid, generateAscii } from '../src/visualizer';
import { MachineConfig, MachineContext, Event } from '../src/types';

/**
 * Authentication flow state machine example.
 * States: idle -> authenticating -> authenticated / error -> idle
 * Tracks login attempts, user data, and error messages.
 */
const authConfig: MachineConfig = {
  id: 'auth',
  initial: 'idle',
  context: {
    user: null,
    error: null,
    attempts: 0,
    maxAttempts: 3,
    token: null,
    lastLoginAt: null,
  },
  states: {
    idle: {
      entry: log('Waiting for login...'),
      on: {
        LOGIN: {
          target: 'authenticating',
          guard: not(greaterThan('attempts', 2)),
          actions: [
            assign((ctx) => ({
              attempts: (ctx.attempts as number) + 1,
              error: null,
            })),
            log((ctx, event) =>
              `Attempt ${(ctx.attempts as number) + 1}: Logging in as ${event.payload?.username}...`
            ),
          ],
        },
        RESET: {
          target: 'idle',
          actions: assign({ attempts: 0, error: null }),
        },
      },
    },
    authenticating: {
      entry: log('Verifying credentials...'),
      on: {
        SUCCESS: {
          target: 'authenticated',
          actions: [
            assign((ctx, event) => ({
              user: event.payload?.user,
              token: event.payload?.token,
              lastLoginAt: Date.now(),
              error: null,
            })),
            log((ctx, event) =>
              `Welcome, ${(event.payload?.user as Record<string, string>)?.name}!`
            ),
          ],
        },
        FAILURE: {
          target: 'error',
          actions: [
            assign((ctx, event) => ({
              error: event.payload?.message || 'Authentication failed',
              user: null,
              token: null,
            })),
            log((ctx, event) => `Login failed: ${event.payload?.message}`),
          ],
        },
        TIMEOUT: {
          target: 'error',
          actions: assign({ error: 'Request timed out' }),
        },
      },
    },
    authenticated: {
      entry: log('User is authenticated.'),
      on: {
        LOGOUT: {
          target: 'idle',
          actions: [
            assign({ user: null, token: null, attempts: 0 }),
            log('User logged out.'),
          ],
        },
        REFRESH_TOKEN: {
          target: 'authenticated',
          actions: [
            assign((ctx, event) => ({
              token: event.payload?.newToken,
            })),
            log('Token refreshed.'),
          ],
        },
        SESSION_EXPIRED: {
          target: 'idle',
          actions: [
            assign({ user: null, token: null }),
            log('Session expired. Please log in again.'),
          ],
        },
      },
    },
    error: {
      entry: log((ctx) => `Error state: ${ctx.error}`),
      on: {
        RETRY: {
          target: 'idle',
          guard: (ctx: MachineContext) => (ctx.attempts as number) < (ctx.maxAttempts as number),
          actions: log('Retrying...'),
          description: 'Retry if under max attempts',
        },
        RESET: {
          target: 'idle',
          actions: [
            assign({ attempts: 0, error: null }),
            log('Reset: clearing all errors and attempts.'),
          ],
        },
      },
    },
  },
};

// --- Run the example ---

console.log('=== Auth Flow State Machine ===\n');

// Print diagrams
console.log('Mermaid Diagram:');
console.log(generateMermaid(authConfig));
console.log('');
console.log(generateAscii(authConfig));
console.log('');

// Create interpreter
const interpreter = new Interpreter(authConfig);

interpreter.subscribe((snapshot) => {
  console.log(
    `  [${snapshot.value}] attempts=${snapshot.context.attempts} user=${
      snapshot.context.user ? (snapshot.context.user as Record<string, string>).name : 'none'
    }`
  );
});

interpreter.start();

// Scenario 1: Successful login
console.log('\n--- Scenario 1: Successful login ---');
interpreter.send({ type: 'LOGIN', payload: { username: 'alice' } });
interpreter.send({
  type: 'SUCCESS',
  payload: {
    user: { name: 'Alice', role: 'admin' },
    token: 'jwt-abc-123',
  },
});
interpreter.send({ type: 'LOGOUT' });

// Scenario 2: Failed login then retry
console.log('\n--- Scenario 2: Failed login + retry ---');
interpreter.send({ type: 'LOGIN', payload: { username: 'bob' } });
interpreter.send({ type: 'FAILURE', payload: { message: 'Invalid password' } });
interpreter.send('RETRY');
interpreter.send({ type: 'LOGIN', payload: { username: 'bob' } });
interpreter.send({
  type: 'SUCCESS',
  payload: {
    user: { name: 'Bob', role: 'user' },
    token: 'jwt-xyz-789',
  },
});

// Scenario 3: Token refresh and session expiry
console.log('\n--- Scenario 3: Token refresh + session expiry ---');
interpreter.send({ type: 'REFRESH_TOKEN', payload: { newToken: 'jwt-refreshed' } });
interpreter.send('SESSION_EXPIRED');

console.log('\n--- Final state ---');
const snapshot = interpreter.getSnapshot();
console.log(`State: ${snapshot.value}`);
console.log(`Context:`, JSON.stringify(snapshot.context, null, 2));

interpreter.stop();
