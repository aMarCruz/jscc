/*
  Set environment variables for nyc or mocha in a cross-compatible fashion.

  It solves issues with ts-node, since we can pass parameters to through
  '--register', we can not specify the tsconfig.json location.

  Register this before ts-node in your /.yncrc, or in mocha.opts, if you
  are not using nyc.

  Based on https://github.com/mochajs/mocha/issues/185
*/
process.env.TS_NODE_PROJECT = 'test/tsconfig.json'
process.env.NODE_ENV = 'test'
