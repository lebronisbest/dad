import fs from 'fs';
import path from 'path';

class OrchestratorLogger {
  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.logFile = path.join(this.logDir, `orchestrator_${new Date().toISOString().split('T')[0]}.log`);
    
    // 로그 디렉토리 생성
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  _formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data: data ? this._sanitizeData(data) : null
    };
    
    return JSON.stringify(logEntry);
  }

  _sanitizeData(data) {
    if (typeof data === 'string') {
      return data;
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
      
      // API 키나 민감한 정보 마스킹
      if (sanitized.apiKey) sanitized.apiKey = '***';
      if (sanitized.password) sanitized.password = '***';
      if (sanitized.token) sanitized.token = '***';
      
      return sanitized;
    }
    
    return data;
  }

  _writeToFile(logEntry) {
    try {
      fs.appendFileSync(this.logFile, logEntry + '\n');
    } catch (error) {
      console.error('로그 파일 쓰기 실패:', error.message);
    }
  }

  info(message, data = null) {
    const logEntry = this._formatMessage('INFO', message, data);
    console.log(`ℹ️  ${message}`);
    this._writeToFile(logEntry);
  }

  success(message, data = null) {
    const logEntry = this._formatMessage('SUCCESS', message, data);
    console.log(`✅ ${message}`);
    this._writeToFile(logEntry);
  }

  warning(message, data = null) {
    const logEntry = this._formatMessage('WARNING', message, data);
    console.log(`⚠️  ${message}`);
    this._writeToFile(logEntry);
  }

  error(message, error = null) {
    const logEntry = this._formatMessage('ERROR', message, {
      error: error ? error.message : null,
      stack: error ? error.stack : null
    });
    console.error(`❌ ${message}`, error ? error.message : '');
    this._writeToFile(logEntry);
  }

  debug(message, data = null) {
    if (process.env.DEBUG === 'true') {
      const logEntry = this._formatMessage('DEBUG', message, data);
      console.log(`🐛 ${message}`);
      this._writeToFile(logEntry);
    }
  }

  // 도구 호출 로깅
  logToolCall(toolName, arguments_, result, duration) {
    this.info(`도구 호출: ${toolName}`, {
      tool: toolName,
      arguments: arguments_,
      result: result ? '성공' : '실패',
      duration: `${duration}ms`
    });
  }

  // LLM 호출 로깅
  logLLMCall(model, messages, response, duration) {
    this.info(`LLM 호출: ${model}`, {
      model,
      messageCount: messages.length,
      hasToolCalls: response?.choices?.[0]?.message?.tool_calls?.length > 0,
      duration: `${duration}ms`
    });
  }
}

export const logger = new OrchestratorLogger();
