// Small leveled logger with a console-compatible signature.
//
// - LOG_LEVEL controls verbosity: debug | info | warn | error | silent
//   (defaults: debug in development, info in production, silent in tests)
// - Production writes one JSON object per line, ready for log collectors
// - Development writes readable "LEVEL message" lines

const util = require('util');

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };

const env = process.env.NODE_ENV || 'development';
const defaultLevel = env === 'test' ? 'silent' : env === 'production' ? 'info' : 'debug';
const configured = (process.env.LOG_LEVEL || defaultLevel).toLowerCase();
const threshold = LEVELS[configured] ?? LEVELS.info;
const json = env === 'production';

const serialize = (arg) => {
  if (arg instanceof Error) return { name: arg.name, message: arg.message, stack: arg.stack };
  return arg;
};

const write = (level, args) => {
  if (LEVELS[level] < threshold) return;
  const stream = LEVELS[level] >= LEVELS.warn ? process.stderr : process.stdout;

  if (json) {
    const [first, ...rest] = args;
    const entry = {
      time: new Date().toISOString(),
      level,
      msg: typeof first === 'string' ? first : util.inspect(serialize(first), { depth: 4 })
    };
    if (rest.length) entry.data = rest.map(serialize);
    stream.write(`${JSON.stringify(entry)}\n`);
  } else {
    stream.write(`${level.toUpperCase().padEnd(5)} ${util.format(...args)}\n`);
  }
};

module.exports = {
  debug: (...args) => write('debug', args),
  info: (...args) => write('info', args),
  warn: (...args) => write('warn', args),
  error: (...args) => write('error', args)
};
