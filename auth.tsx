type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
}

const MAX_LOGS = 200;
const logBuffer: LogEntry[] = [];

function formatLog(level: LogLevel, message: string, data?: unknown): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    data,
  };
}

function pushLog(entry: LogEntry) {
  logBuffer.push(entry);
  if (logBuffer.length > MAX_LOGS) {
    logBuffer.shift();
  }

  const prefix = `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`;
  switch (entry.level) {
    case 'error':
      console.error(prefix, entry.data ?? '');
      break;
    case 'warn':
      console.warn(prefix, entry.data ?? '');
      break;
    case 'debug':
      console.debug(prefix, entry.data ?? '');
      break;
    default:
      console.log(prefix, entry.data ?? '');
  }
}

export const logger = {
  info: (message: string, data?: unknown) => pushLog(formatLog('info', message, data)),
  warn: (message: string, data?: unknown) => pushLog(formatLog('warn', message, data)),
  error: (message: string, data?: unknown) => pushLog(formatLog('error', message, data)),
  debug: (message: string, data?: unknown) => pushLog(formatLog('debug', message, data)),
  getLogs: (): LogEntry[] => [...logBuffer],
  clear: () => { logBuffer.length = 0; },
};
