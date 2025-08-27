import pino from 'pino';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 환경변수 기반 로그 레벨 설정
const logLevel = process.env.LOG_LEVEL || 'info';
const isDevelopment = process.env.NODE_ENV === 'development';

// 로그 디렉토리 설정
const logDir = path.join(__dirname, '../logs');

// ✅ 사용자 진단 로그 설정 (프로젝트 TT 가이드라인: PII 제거된 진단 로그)
const USER_DIAGNOSTICS_CONFIG = {
  enabled: process.env.USER_DIAGNOSTICS_ENABLED === 'true',
  maxLogEntries: 100,
  piiRemoval: true,
  logLevel: process.env.USER_LOG_LEVEL || 'info',
};

// ✅ PII 제거 함수들
const piiRemovers = {
  // 이메일 주소 제거
  email: (text) => text.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]'),
  
  // 전화번호 제거
  phone: (text) => text.replace(/\b(\d{2,4}[-\s]?\d{3,4}[-\s]?\d{4})\b/g, '[PHONE]'),
  
  // 주민등록번호 제거
  ssn: (text) => text.replace(/\b\d{6}[-\s]?\d{7}\b/g, '[SSN]'),
  
  // 신용카드 번호 제거
  creditCard: (text) => text.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[CARD]'),
  
  // IP 주소 제거
  ipAddress: (text) => text.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP]'),
  
  // 파일 경로에서 사용자명 제거
  filePath: (text) => text.replace(/\/home\/[^\/]+\//g, '/home/[USER]/'),
  
  // API 키 제거
  apiKey: (text) => text.replace(/\b(sk-|pk-)[a-zA-Z0-9]{32,}\b/g, '[API_KEY]'),
};

// ✅ PII 제거 함수
function removePII(text) {
  if (!text || typeof text !== 'string') return text;
  
  let sanitized = text;
  
  // 모든 PII 제거 함수 적용
  Object.values(piiRemovers).forEach(remover => {
    sanitized = remover(sanitized);
  });
  
  return sanitized;
}

// ✅ 사용자 진단 로그 저장소
const userDiagnosticsLog = {
  entries: [],
  maxEntries: USER_DIAGNOSTICS_CONFIG.maxLogEntries,
  
  add(level, message, data = {}) {
    if (!USER_DIAGNOSTICS_CONFIG.enabled) return;
    
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message: removePII(message),
      data: this.sanitizeData(data),
      requestId: data.requestId || 'unknown',
    };
    
    this.entries.push(entry);
    
    // 최대 개수 유지
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }
  },
  
  // 데이터에서 PII 제거
  sanitizeData(data) {
    if (!data || typeof data !== 'object') return data;
    
    const sanitized = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        sanitized[key] = removePII(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  },
  
  // 사용자 진단 로그 조회
  getUserLogs(level = 'all', limit = 50) {
    if (!USER_DIAGNOSTICS_CONFIG.enabled) {
      return { enabled: false, message: '사용자 진단 로그가 비활성화되어 있습니다' };
    }
    
    let filteredEntries = this.entries;
    
    // 레벨별 필터링
    if (level !== 'all') {
      filteredEntries = this.entries.filter(entry => entry.level === level);
    }
    
    // 제한된 개수 반환
    const limitedEntries = filteredEntries.slice(-limit);
    
    return {
      enabled: true,
      total: this.entries.length,
      filtered: filteredEntries.length,
      returned: limitedEntries.length,
      level,
      entries: limitedEntries,
      timestamp: new Date().toISOString(),
    };
  },
  
  // 사용자 진단 로그 초기화
  clear() {
    this.entries = [];
  },
  
  // 사용자 진단 로그 상태
  getStatus() {
    return {
      enabled: USER_DIAGNOSTICS_CONFIG.enabled,
      maxEntries: this.maxEntries,
      currentEntries: this.entries.length,
      config: {
        logLevel: USER_DIAGNOSTICS_CONFIG.logLevel,
        piiRemoval: USER_DIAGNOSTICS_CONFIG.piiRemoval,
      }
    };
  }
};

// ✅ Pino 로거 설정
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: isDevelopment ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
      messageFormat: '{msg} {req.method} {req.url} {responseTime}ms'
    }
  } : undefined,
  base: {
    env: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
    log: (object) => {
      // PII/원본 DTO 마스킹
      if (object.data && typeof object.data === 'object') {
        const masked = { ...object.data };
        // 민감한 정보 마스킹
        if (masked.org?.registration_number) {
          masked.org.registration_number = '***-***-******';
        }
        if (masked.org?.license_number) {
          masked.org.license_number = '***-***-******';
        }
        if (masked.org?.phone) {
          masked.org.phone = masked.org.phone.replace(/(\d{3})-(\d{3,4})-(\d{4})/, '***-***-$3');
        }
        if (masked.org?.email) {
          const [local, domain] = masked.org.email.split('@');
          masked.org.email = `${local.substring(0, 2)}***@${domain}`;
        }
        object.data = masked;
      }
      return object;
    }
  },
  // ✅ 사용자 진단 로그 통합
  mixin() {
    return {
      userDiagnostics: userDiagnosticsLog.getStatus(),
    };
  }
}, pino.destination({
  dest: path.join(logDir, `${new Date().toISOString().split('T')[0]}.log`),
  sync: false
}));

// 상세 로깅 플래그 (DEBUG_TEMPLATING=1에서만 활성화)
const isDetailedLogging = process.env.DEBUG_TEMPLATING === '1';

/**
 * 템플릿 관련 상세 로깅 (DEBUG_TEMPLATING=1에서만)
 * @param {string} message - 로그 메시지
 * @param {Object} data - 로그 데이터
 */
export function logTemplateDetail(message, data = {}) {
  if (isDetailedLogging) {
    logger.debug({ template: true, ...data }, message);
  }
}

// ✅ 로깅 함수들
export function logRenderStage(stage, data = {}) {
  const message = `🎯 렌더링 단계: ${stage}`;
  logger.info(message, data);
}

export function logPerformance(operation, startTime, data = {}) {
  const processingTime = Date.now() - startTime;
  const message = `⚡ 성능 측정: ${operation} (${processingTime}ms)`;
  logger.info(message, { ...data, processingTime });
}

export function logError(error, data = {}) {
  const message = `❌ 오류 발생: ${error.message || error}`;
  logger.error(message, { error: error.stack, ...data });
}

/**
 * API 요청/응답 로깅
 * @param {string} method - HTTP 메서드
 * @param {string} url - 요청 URL
 * @param {Object} params - 요청 파라미터
 * @param {number} duration - 처리 시간 (ms)
 */
export function logRequest(method, url, params = {}, duration = null) {
  logger.info({ 
    method, 
    url, 
    params: isDetailedLogging ? params : '***', // 상세 로깅에서만 파라미터 노출
    duration_ms: duration 
  }, 'API 요청');
}

/**
 * API 응답 로깅
 * @param {string} method - HTTP 메서드
 * @param {string} url - 요청 URL
 * @param {number} statusCode - 응답 상태 코드
 * @param {number} duration - 처리 시간 (ms)
 */
export function logResponse(method, url, statusCode, duration = null) {
  logger.info({ 
    method, 
    url, 
    statusCode, 
    duration_ms: duration 
  }, 'API 응답');
}

/**
 * 보안 관련 로깅 (민감한 정보 마스킹)
 * @param {string} action - 보안 액션
 * @param {Object} data - 보안 데이터 (자동 마스킹)
 */
export function logSecurity(action, data = {}) {
  logger.warn({ 
    security: true, 
    action,
    data: '***' // 보안 로그는 항상 데이터 마스킹
  }, `보안 이벤트: ${action}`);
}

// 기본 로거 메서드들 export
export const { 
  trace, 
  debug, 
  info, 
  warn, 
  error, 
  fatal 
} = logger;

// ✅ 사용자 진단 로그 관련 함수들
export function getUserDiagnostics(level = 'all', limit = 50) {
  return userDiagnosticsLog.getUserLogs(level, limit);
}

export function clearUserDiagnostics() {
  userDiagnosticsLog.clear();
  return { success: true, message: '사용자 진단 로그가 초기화되었습니다' };
}

export function getUserDiagnosticsStatus() {
  return userDiagnosticsLog.getStatus();
}

// ✅ 사용자 진단 로그 토글
export function toggleUserDiagnostics(enabled) {
  USER_DIAGNOSTICS_CONFIG.enabled = enabled;
  return {
    success: true,
    enabled: USER_DIAGNOSTICS_CONFIG.enabled,
    message: `사용자 진단 로그가 ${enabled ? '활성화' : '비활성화'}되었습니다`
  };
}

// ✅ 사용자 진단 로그 레벨 설정
export function setUserDiagnosticsLevel(level) {
  const validLevels = ['error', 'warn', 'info', 'debug'];
  if (!validLevels.includes(level)) {
    return {
      success: false,
      error: `유효하지 않은 로그 레벨입니다. 사용 가능한 레벨: ${validLevels.join(', ')}`
    };
  }
  
  USER_DIAGNOSTICS_CONFIG.logLevel = level;
  return {
    success: true,
    level: USER_DIAGNOSTICS_CONFIG.logLevel,
    message: `사용자 진단 로그 레벨이 ${level}로 설정되었습니다`
  };
}

// ✅ 사용자 진단 로그 API 엔드포인트용 데이터
export function getUserDiagnosticsForAPI() {
  return {
    status: userDiagnosticsLog.getStatus(),
    recentLogs: userDiagnosticsLog.getUserLogs('all', 20),
    config: {
      enabled: USER_DIAGNOSTICS_CONFIG.enabled,
      logLevel: USER_DIAGNOSTICS_CONFIG.logLevel,
      piiRemoval: USER_DIAGNOSTICS_CONFIG.piiRemoval,
      maxEntries: USER_DIAGNOSTICS_CONFIG.maxLogEntries,
    }
  };
}

// 기본 logger 인스턴스 export
export default logger;
