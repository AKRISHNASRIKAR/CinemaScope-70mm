// Structured JSON logger for Supabase Edge Functions.
// All output goes to stdout/stderr and is captured by Supabase Dashboard logs.
// Each entry includes the function name, timestamp, level, and any extra fields.
// The request_id field (propagated from X-Request-ID) enables end-to-end tracing.

type Level = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: Level;
  fn: string;
  ts: string;
  msg: string;
  [key: string]: unknown;
}

export interface Logger {
  debug(msg: string, extra?: Record<string, unknown>): void;
  info(msg: string, extra?: Record<string, unknown>): void;
  warn(msg: string, extra?: Record<string, unknown>): void;
  error(msg: string, extra?: Record<string, unknown>): void;
}

export function createLogger(fnName: string): Logger {
  const write = (level: Level, msg: string, extra?: Record<string, unknown>): void => {
    const entry: LogEntry = {
      level,
      fn: fnName,
      ts: new Date().toISOString(),
      msg,
      ...extra,
    };
    const line = JSON.stringify(entry);
    if (level === 'error' || level === 'warn') {
      console.error(line);
    } else {
      console.log(line);
    }
  };

  return {
    debug: (msg, extra) => write('debug', msg, extra),
    info: (msg, extra) => write('info', msg, extra),
    warn: (msg, extra) => write('warn', msg, extra),
    error: (msg, extra) => write('error', msg, extra),
  };
}
