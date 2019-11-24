import { Interpreter } from '../src/Interpreter';

const interpreter = new Interpreter({
  initial: 'cart',
  states: {
    cart: { on: { CHECKOUT: 'address', CLEAR: 'empty' } },
    empty: { on: { ADD_ITEM: 'cart' } },
    address: { on: { SUBMIT_ADDRESS: 'payment', BACK: 'cart' } },
    payment: { on: { SUBMIT_PAYMENT: 'processing', BACK: 'address' } },
    processing: { on: { SUCCESS: 'confirmation', FAILURE: 'error' } },
    confirmation: { type: 'final' },
    error: { on: { RETRY: 'processing', BACK: 'payment' } },
  },
});

interpreter.onTransition(({ from, to, event }) => {
  console.log('[checkout]', from, '->', to, '(' + event + ')');
});

interpreter.send('CHECKOUT');
interpreter.send('SUBMIT_ADDRESS');
interpreter.send('SUBMIT_PAYMENT');
interpreter.send('SUCCESS');
console.log('Final:', interpreter.state);
