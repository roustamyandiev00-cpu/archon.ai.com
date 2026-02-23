/**
 * Eenvoudige logger voor ArchonPro met context-ondersteuning
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  [key: string]: unknown
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const currentLogLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info'

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLogLevel]
}

function formatTimestamp(): string {
  return new Date().toISOString()
}

function createEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error
): LogEntry {
  const entry: LogEntry = {
    timestamp: formatTimestamp(),
    level,
    message,
  }

  if (context && Object.keys(context).length > 0) {
    entry.context = context
  }

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }

  return entry
}

function output(entry: LogEntry): void {
  const outputMethod = entry.level === 'error' ? 'error' : entry.level === 'warn' ? 'warn' : 'log'
  
  if (process.env.NODE_ENV === 'production') {
    // In productie: gestructureerde JSON output
    console[outputMethod](JSON.stringify(entry))
  } else {
    // In development: leesbaar formaat
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : ''
    const errorStr = entry.error ? `\n  Error: ${entry.error.message}` : ''
    console[outputMethod](`[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${contextStr}${errorStr}`)
  }
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (!shouldLog('debug')) return
    output(createEntry('debug', message, context))
  },

  info(message: string, context?: LogContext): void {
    if (!shouldLog('info')) return
    output(createEntry('info', message, context))
  },

  warn(message: string, context?: LogContext): void {
    if (!shouldLog('warn')) return
    output(createEntry('warn', message, context))
  },

  error(message: string, context?: LogContext, error?: Error): void {
    if (!shouldLog('error')) return
    output(createEntry('error', message, context, error))
  },

  /**
   * Log een API fout met gestructureerde context
   */
  apiError(
    route: string,
    method: string,
    error: unknown,
    additionalContext?: LogContext
  ): void {
    const err = error instanceof Error ? error : new Error(String(error))
    this.error(`API fout in ${method} ${route}`, {
      route,
      method,
      ...additionalContext,
    }, err)
  },

  /**
   * Log een database fout met gestructureerde context
   */
  dbError(
    operation: string,
    table: string,
    error: unknown,
    additionalContext?: LogContext
  ): void {
    const err = error instanceof Error ? error : new Error(String(error))
    this.error(`Database fout bij ${operation} op ${table}`, {
      operation,
      table,
      ...additionalContext,
    }, err)
  },
}

export default logger
