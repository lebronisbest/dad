import { Flags } from './flags';

// 로그 레벨
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace',
}

// 로그 컨텍스트
export interface LogContext {
  request_id?: string;
  user_id?: string;
  project_id?: string;
  report_version?: string;
  operation?: string;
  duration_ms?: number;
  error?: Error;
  metadata?: Record<string, any>;
}

// 로그 엔트리
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  data?: any;
}

// 로거 인터페이스
export interface Logger {
  error(message: string, context?: LogContext, data?: any): void;
  warn(message: string, context?: LogContext, data?: any): void;
  info(message: string, context?: LogContext, data?: any): void;
  debug(message: string, context?: LogContext, data?: any): void;
  trace(message: string, context?: LogContext, data?: any): void;
  
  // 구조화된 로깅
  log(level: LogLevel, message: string, context?: LogContext, data?: any): void;
  
  // 성능 측정
  time(label: string, context?: LogContext): () => void;
  
  // 요청 ID 설정
  setRequestId(requestId: string): void;
  
  // 컨텍스트 확장
  extendContext(additionalContext: Partial<LogContext>): void;
}

// 콘솔 로거 구현
class ConsoleLogger implements Logger {
  private requestId: string = '';
  private context: LogContext = {};
  
  constructor(private minLevel: LogLevel = LogLevel.INFO) {}
  
  private shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel);
    const minLevelIndex = levels.indexOf(this.minLevel);
    const currentLevelIndex = levels.indexOf(level);
    return currentLevelIndex <= minLevelIndex;
  }
  
  private formatMessage(level: LogLevel, message: string, context?: LogContext, data?: any): string {
    const timestamp = new Date().toISOString();
    const requestId = context?.request_id || this.requestId || 'unknown';
    const projectId = context?.project_id || this.context.project_id || 'unknown';
    const operation = context?.operation || this.context.operation || 'unknown';
    
    let formatted = `[${timestamp}] [${level.toUpperCase()}] [${requestId}] [${projectId}] [${operation}] ${message}`;
    
    if (context?.duration_ms !== undefined) {
      formatted += ` (${context.duration_ms}ms)`;
    }
    
    if (context?.error) {
      formatted += ` | Error: ${context.error.message}`;
    }
    
    return formatted;
  }
  
  private logToConsole(level: LogLevel, message: string, context?: LogContext, data?: any): void {
    if (!this.shouldLog(level)) return;
    
    const formattedMessage = this.formatMessage(level, message, context, data);
    
    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage);
        if (context?.error) {
          console.error('Stack trace:', context.error.stack);
        }
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.TRACE:
        console.trace(formattedMessage);
        break;
    }
    
    // 추가 데이터가 있는 경우 출력
    if (data) {
      console.log('Additional data:', JSON.stringify(data, null, 2));
    }
    
    // 메타데이터가 있는 경우 출력
    if (context?.metadata) {
      console.log('Metadata:', JSON.stringify(context.metadata, null, 2));
    }
  }
  
  error(message: string, context?: LogContext, data?: any): void {
    this.logToConsole(LogLevel.ERROR, message, context, data);
  }
  
  warn(message: string, context?: LogContext, data?: any): void {
    this.logToConsole(LogLevel.WARN, message, context, data);
  }
  
  info(message: string, context?: LogContext, data?: any): void {
    this.logToConsole(LogLevel.INFO, message, context, data);
  }
  
  debug(message: string, context?: LogContext, data?: any): void {
    this.logToConsole(LogLevel.DEBUG, message, context, data);
  }
  
  trace(message: string, context?: LogContext, data?: any): void {
    this.logToConsole(LogLevel.TRACE, message, context, data);
  }
  
  log(level: LogLevel, message: string, context?: LogContext, data?: any): void {
    this.logToConsole(level, message, context, data);
  }
  
  time(label: string, context?: LogContext): () => void {
    const startTime = Date.now();
    const requestId = context?.request_id || this.requestId;
    
    this.info(`Started: ${label}`, context);
    
    return () => {
      const duration = Date.now() - startTime;
      this.info(`Completed: ${label}`, { ...context, duration_ms: duration });
    };
  }
  
  setRequestId(requestId: string): void {
    this.requestId = requestId;
  }
  
  extendContext(additionalContext: Partial<LogContext>): void {
    this.context = { ...this.context, ...additionalContext };
  }
}

// 파일 로거 구현 (간단한 버전)
class FileLogger implements Logger {
  private requestId: string = '';
  private context: LogContext = {};
  private logBuffer: LogEntry[] = [];
  private flushInterval: NodeJS.Timeout;
  
  constructor(
    private filePath: string = './logs/app.log',
    private bufferSize: number = 100,
    private flushIntervalMs: number = 5000
  ) {
    this.flushInterval = setInterval(() => this.flush(), this.flushIntervalMs);
  }
  
  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);
    
    if (this.logBuffer.length >= this.bufferSize) {
      this.flush();
    }
  }
  
  private async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return;
    
    try {
      const fs = await import('fs/promises');
      const logContent = this.logBuffer
        .map(entry => JSON.stringify(entry))
        .join('\n') + '\n';
      
      await fs.appendFile(this.filePath, logContent, 'utf8');
      this.logBuffer = [];
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }
  
  error(message: string, context?: LogContext, data?: any): void {
    this.log(LogLevel.ERROR, message, context, data);
  }
  
  warn(message: string, context?: LogContext, data?: any): void {
    this.log(LogLevel.WARN, message, context, data);
  }
  
  info(message: string, context?: LogContext, data?: any): void {
    this.log(LogLevel.INFO, message, context, data);
  }
  
  debug(message: string, context?: LogContext, data?: any): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }
  
  trace(message: string, context?: LogContext, data?: any): void {
    this.log(LogLevel.TRACE, message, context, data);
  }
  
  log(level: LogLevel, message: string, context?: LogContext, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...context, request_id: context?.request_id || this.requestId },
      data,
    };
    
    this.addToBuffer(entry);
    
    // 콘솔에도 출력 (개발 환경)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${level.toUpperCase()}] ${message}`, context);
    }
  }
  
  time(label: string, context?: LogContext): () => void {
    const startTime = Date.now();
    const requestId = context?.request_id || this.requestId;
    
    this.info(`Started: ${label}`, context);
    
    return () => {
      const duration = Date.now() - startTime;
      this.info(`Completed: ${label}`, { ...context, duration_ms: duration });
    };
  }
  
  setRequestId(requestId: string): void {
    this.requestId = requestId;
  }
  
  extendContext(additionalContext: Partial<LogContext>): void {
    this.context = { ...this.context, ...additionalContext };
  }
  
  // 정리
  destroy(): void {
    clearInterval(this.flushInterval);
    this.flush();
  }
}

// 로거 팩토리
export function createLogger(type: 'console' | 'file' = 'console', options?: any): Logger {
  switch (type) {
    case 'file':
      return new FileLogger(options?.filePath, options?.bufferSize, options?.flushIntervalMs);
    case 'console':
    default:
      return new ConsoleLogger(options?.minLevel);
  }
}

// 전역 로거 인스턴스
export const logger = createLogger(
  process.env.LOG_TYPE === 'file' ? 'file' : 'console',
  {
    minLevel: (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO,
    filePath: process.env.LOG_FILE_PATH || './logs/app.log',
    bufferSize: parseInt(process.env.LOG_BUFFER_SIZE || '100'),
    flushIntervalMs: parseInt(process.env.LOG_FLUSH_INTERVAL_MS || '5000'),
  }
);

// 요청 ID 생성기
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 성능 측정 데코레이터
export function measurePerformance(operation: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const requestId = (this as any).requestId || 'unknown';
      const context: LogContext = { request_id: requestId, operation };
      
      const endTimer = logger.time(operation, context);
      
      try {
        const result = await originalMethod.apply(this, args);
        endTimer();
        return result;
      } catch (error) {
        logger.error(`Operation failed: ${operation}`, { ...context, error: error as Error });
        endTimer();
        throw error;
      }
    };
    
    return descriptor;
  };
}

// 에러 처리 미들웨어
export function errorHandler(error: Error, context?: LogContext): void {
  logger.error('Unhandled error occurred', { ...context, error });
  
  // 실패 시 아티팩트 업로드가 활성화된 경우
  if (Flags.FAILURE_ARTIFACT_UPLOAD && context?.request_id) {
    // TODO: 아티팩트 업로드 로직 구현
    logger.info('Failure artifact upload triggered', context);
  }
}

// 요청 컨텍스트 미들웨어
export function requestContextMiddleware(req: any, res: any, next: any): void {
  const requestId = req.headers['x-request-id'] || generateRequestId();
  
  // 요청 ID를 응답 헤더에 설정
  res.setHeader('X-Request-ID', requestId);
  
  // 로거에 요청 ID 설정
  logger.setRequestId(requestId);
  
  // 요청 컨텍스트 확장
  logger.extendContext({
    request_id: requestId,
    user_id: req.headers['x-user-id'],
    project_id: req.headers['x-project-id'],
    operation: `${req.method} ${req.path}`,
  });
  
  next();
}

// 성능 모니터링 미들웨어
export function performanceMonitoringMiddleware(req: any, res: any, next: any): void {
  if (!Flags.PERFORMANCE_MONITORING) {
    return next();
  }
  
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] || 'unknown';
  
  // 응답 완료 후 성능 측정
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const context: LogContext = {
      request_id: requestId,
      operation: `${req.method} ${req.path}`,
      duration_ms: duration,
      metadata: {
        status_code: res.statusCode,
        content_length: res.get('content-length'),
        user_agent: req.get('user-agent'),
      },
    };
    
    if (duration > 1000) {
      logger.warn('Slow request detected', context);
    } else {
      logger.info('Request completed', context);
    }
  });
  
  next();
}
