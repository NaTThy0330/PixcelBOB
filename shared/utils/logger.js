const util = require('util');

const LEVEL_PRIORITY = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const METHOD_LEVEL = {
  log: 'info',
  info: 'info',
  warn: 'warn',
  error: 'error',
  debug: 'debug',
};

const DEFAULT_OPTIONS = {
  serviceName: process.env.SERVICE_NAME || process.env.APP_NAME || 'pixcelbob-service',
  logLevel: (process.env.LOG_LEVEL || 'info').toLowerCase(),
  defaultFields: {},
};

const originalConsole = {
  log: console.log.bind(console),
  info: console.info ? console.info.bind(console) : console.log.bind(console),
  warn: console.warn ? console.warn.bind(console) : console.log.bind(console),
  error: console.error ? console.error.bind(console) : console.log.bind(console),
  debug: console.debug ? console.debug.bind(console) : console.log.bind(console),
};

const safeSerialize = (value) => {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.parse(
      JSON.stringify(value, (_key, val) =>
        typeof val === 'bigint' ? val.toString() : val
      )
    );
  } catch (_err) {
    return util.inspect(value, { depth: null, breakLength: Infinity });
  }
};

const buildEntry = (level, args, options) => {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service: options.serviceName,
    ...options.defaultFields,
  };

  if (!args.length) {
    entry.message = '';
    return entry;
  }

  const [first, ...rest] = args;

  if (typeof first === 'string') {
    entry.message = first;
    if (rest.length) {
      entry.context = rest.map(safeSerialize);
    }
  } else {
    entry.message = '[object]';
    entry.context = [safeSerialize(first), ...rest.map(safeSerialize)];
  }

  return entry;
};

const emitLog = (level, entry) => {
  const serialized = JSON.stringify(entry);

  switch (level) {
    case 'error':
      originalConsole.error(serialized);
      break;
    case 'warn':
      originalConsole.warn(serialized);
      break;
    default:
      originalConsole.log(serialized);
      break;
  }
};

const patchConsole = (customOptions = {}) => {
  const options = {
    ...DEFAULT_OPTIONS,
    ...customOptions,
  };

  const minLevelPriority =
    LEVEL_PRIORITY[options.logLevel] ?? LEVEL_PRIORITY.info;

  Object.entries(METHOD_LEVEL).forEach(([method, level]) => {
    console[method] = (...args) => {
      if (LEVEL_PRIORITY[level] > minLevelPriority) {
        return;
      }

      const entry = buildEntry(level, args, options);
      emitLog(level, entry);
    };
  });
};

const createLogger = (context = {}) => {
  const baseFields = {
    ...DEFAULT_OPTIONS.defaultFields,
    ...context,
  };

  const logWithLevel = (level, ...args) => {
    const entry = buildEntry(level, args, {
      ...DEFAULT_OPTIONS,
      defaultFields: baseFields,
    });
    emitLog(level, entry);
  };

  return {
    info: (...args) => logWithLevel('info', ...args),
    warn: (...args) => logWithLevel('warn', ...args),
    error: (...args) => logWithLevel('error', ...args),
    debug: (...args) => logWithLevel('debug', ...args),
  };
};

module.exports = {
  patchConsole,
  createLogger,
};
