/**
 * 통합 에러 핸들러
 * Project TT 가이드라인: 모든 에러 응답을 일관된 형식으로 처리
 */

import logger from '../../../core/logger.js';

/**
 * 에러 타입 분류 (Project TT 가이드라인 준수)
 */
const classifyError = (err) => {
  // 1. Zod 검증 오류는 항상 400 (Project TT 가이드라인)
  if (err.name === 'ZodError' || err.issues) {
    return { status: 400, isClientError: true };
  }
  
  // 2. err.httpStatus 우선 (가장 명확한 지시)
  if (err.httpStatus) {
    const status = Number(err.httpStatus);
    return { status, isClientError: status < 500 };
  }
  
  // 3. err.code가 4xx/5xx 형식인 경우
  if (err.code && /^[45]\d{2}$/.test(String(err.code))) {
    const status = Number(err.code);
    return { status, isClientError: status < 500 };
  }
  
  // 4. 커스텀 에러 클래스의 code 속성
  if (err.code) {
    // 숫자 코드인 경우
    if (!isNaN(Number(err.code))) {
      const status = Number(err.code);
      if (status >= 100 && status < 600) {
        return { status, isClientError: status < 500 };
      }
    }
    
    // 문자열 코드에서 상태 추출
    const statusFromCode = extractStatusFromCode(err.code);
    if (statusFromCode) {
      return { status: statusFromCode, isClientError: statusFromCode < 500 };
    }
  }
  
  // 5. 기본값: 500 Internal Server Error
  return { status: 500, isClientError: false };
};

/**
 * 코드에서 상태 추출 (예: VALIDATION_ERROR -> 422)
 */
const extractStatusFromCode = (code) => {
  const codeMap = {
    'VALIDATION_ERROR': 422,
    'BAD_REQUEST': 400,
    'UNAUTHORIZED': 401,
    'FORBIDDEN': 403,
    'NOT_FOUND': 404,
    'CONFLICT': 409,
    'RATE_LIMIT_EXCEEDED': 429,
    'INTERNAL_ERROR': 500,
    'BAD_GATEWAY': 502,
    'SERVICE_UNAVAILABLE': 503,
    'GATEWAY_TIMEOUT': 504
  };
  
  return codeMap[code] || null;
};

/**
 * 에러 코드 생성
 */
const generateErrorCode = (err, status) => {
  if (err.code) return err.code;
  
  // 상태 코드별 기본 에러 코드
  const defaultCodes = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'VALIDATION_ERROR',
    429: 'RATE_LIMIT_EXCEEDED',
    500: 'INTERNAL_ERROR',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE',
    504: 'GATEWAY_TIMEOUT'
  };
  
  return defaultCodes[status] || `HTTP_${status}`;
};

/**
 * 에러 메시지 생성
 */
const generateErrorMessage = (err, status, isClientError) => {
  if (err.message) return err.message;
  
  // 상태 코드별 기본 메시지
  const defaultMessages = {
    400: '잘못된 요청입니다',
    401: '인증이 필요합니다',
    403: '접근이 거부되었습니다',
    404: '요청한 리소스를 찾을 수 없습니다',
    409: '리소스 충돌이 발생했습니다',
    422: '입력 데이터가 유효하지 않습니다',
    429: '요청이 너무 많습니다',
    500: '서버 내부 오류가 발생했습니다',
    502: '게이트웨이 오류가 발생했습니다',
    503: '서비스를 사용할 수 없습니다',
    504: '요청 시간이 초과되었습니다'
  };
  
  return defaultMessages[status] || '예상치 못한 오류가 발생했습니다';
};

/**
 * 에러 세부 정보 정리
 */
const sanitizeErrorDetails = (err, isClientError) => {
  if (!err.details) return undefined;
  
  // Zod 오류인 경우 특별 처리
  if (err.name === 'ZodError' && err.issues) {
    return {
      type: 'validation_error',
      issues: err.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code
      }))
    };
  }
  
  // 프로덕션 환경에서는 민감한 정보 제거
  if (process.env.NODE_ENV === 'production' && !isClientError) {
    return { message: '서버 오류 세부 정보는 프로덕션 환경에서 제공되지 않습니다' };
  }
  
  return err.details;
};

/**
 * 메인 에러 핸들러
 */
export function errorHandler(err, req, res, _next) {
  // 에러 분류
  const { status, isClientError } = classifyError(err);
  
  // 에러 코드 및 메시지 생성
  const code = generateErrorCode(err, status);
  const message = generateErrorMessage(err, status, isClientError);
  const details = sanitizeErrorDetails(err, isClientError);
  
  // 에러 로깅
  const logLevel = isClientError ? 'warn' : 'error';
  logger[logLevel]('HTTP 에러 발생', {
    status,
    code,
    message,
    url: req.url,
    method: req.method,
    requestId: req.id,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    errorType: err.name || 'Error',
    isZodError: err.name === 'ZodError'
  });
  
  // 에러 응답
  const errorResponse = {
    ok: false,
    code,
    message,
    requestId: req.id,
    timestamp: new Date().toISOString()
  };
  
  if (details) {
    errorResponse.details = details;
  }
  
  // 개발 환경에서는 추가 정보 제공
  if (process.env.NODE_ENV === 'development') {
    errorResponse.debug = {
      stack: err.stack,
      originalError: err.message,
      errorType: err.name,
      errorCode: err.code
    };
  }
  
  res.status(status).json(errorResponse);
}

/**
 * 404 에러 핸들러
 */
export function notFoundHandler(req, res) {
  const errorResponse = {
    ok: false,
    code: 'NOT_FOUND',
    message: `경로를 찾을 수 없습니다: ${req.method} ${req.originalUrl}`,
    requestId: req.id,
    timestamp: new Date().toISOString()
  };
  
  logger.warn('404 에러', {
    url: req.url,
    method: req.method,
    requestId: req.id
  });
  
  res.status(404).json(errorResponse);
}

/**
 * 비동기 에러 래퍼 (Express 라우트에서 사용)
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * 커스텀 에러 클래스
 */
export class AppError extends Error {
  constructor(message, code, httpStatus = 500, details = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 'VALIDATION_ERROR', 422, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = '리소스를 찾을 수 없습니다') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = '인증이 필요합니다') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = '접근이 거부되었습니다') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
  }
}

