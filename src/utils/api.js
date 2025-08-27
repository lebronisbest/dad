/**
 * API 엔드포인트 상수 정의
 * 프로젝트 TT 가이드라인: "하드코딩된 엔드포인트 금지, 상수 사용"
 */

// ✅ 통합 보고서 API (단일 진입점) - 하드코딩된 포트 사용
export const API = {
  // 핵심 보고서 생성 API (PDF/HTML) - 포트 3001
  REPORTS: 'http://localhost:3001/v1/reports',
  
  // ❌ REPORTS_SAVE 제거 (단일 진입점 원칙)
  // REPORTS_SAVE: 'http://localhost:3001/v1/reports/save',
  
  // ✅ 새로운 워크플로우 API들 - 포트 3001
  PDF: 'http://localhost:3001/v1/reports/pdf',
  
  // 보고서 검증 API - 포트 3001
  VALIDATE: 'http://localhost:3001/v1/reports/validate',
  
  // 프로젝트 관리 API - 포트 3001
  PROJECTS: 'http://localhost:3001/v1/projects',
  PROJECT: (id) => `http://localhost:3001/v1/projects/${id}`,
  PROJECT_REPORTS: (projectId) => `http://localhost:3001/v1/projects/${projectId}/reports`,
  PROJECT_REPORT: (projectId, reportId) => `http://localhost:3001/v1/projects/${projectId}/reports/${reportId}`,
  
  // 보고서 저장소 API - 포트 3001
  REPORTS_LIST: 'http://localhost:3001/v1/reports',
  REPORT_FILE: (fileName) => `http://localhost:3001/v1/reports/${fileName}`,
  
  // 샘플 데이터 API - 포트 3001
  SAMPLES: 'http://localhost:3001/v1/samples/dto',
  
  // 헬스체크 및 메트릭스 - 포트 3001
  HEALTH: 'http://localhost:3001/healthz',
  METRICS: 'http://localhost:3001/metrics',
};

// ✅ 웹앱 전용 API - 포트 3000
export const WEB_API = {
  // 웹앱용 보고서 생성 (포트 3000)
  REPORTS: 'http://localhost:3000/web/v1/reports',
  
  // 채팅 API (포트 3000)
  CHAT: 'http://localhost:3000/chat',
  
  // 메모리 관리 (포트 3000)
  MEMORY: (conversationId) => `http://localhost:3000/chat/${conversationId}/memory`,
  MEMORY_ALIAS: (conversationId) => `http://localhost:3000/v1/memory/${conversationId}`,
  
  // 대시보드 (포트 3000)
  DASHBOARD: 'http://localhost:3000/v1/dashboard/stats',
};

// ✅ API 응답 형식 상수
export const API_RESPONSE = {
  SUCCESS: 'ok',
  ERROR: 'error',
  MESSAGE: 'message',
  DATA: 'data',
  REQUEST_ID: 'requestId',
};

// ✅ HTTP 상태 코드
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// ✅ API 타임아웃 설정
export const API_TIMEOUT = {
  REQUEST: 15000, // 15초 (프론트엔드)
  SERVER: 30000,  // 30초 (서버)
};

// ✅ 출력 형식
export const OUTPUT_FORMAT = {
  PDF: 'pdf',
  HTML: 'html',
};

// ✅ API 버전
export const API_VERSION = 'v1';

// ✅ 헤더 상수
export const HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  API_VERSION: 'X-API-Version',
  REQUEST_ID: 'X-Request-ID',
  IDEMPOTENCY_KEY: 'Idempotency-Key',
};

// ✅ MIME 타입
export const MIME_TYPES = {
  JSON: 'application/json',
  PDF: 'application/pdf',
  HTML: 'text/html',
  FORM_DATA: 'multipart/form-data',
};

// ✅ 에러 코드
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TIMEOUT: 'TIMEOUT',
  NETWORK_ERROR: 'NETWORK_ERROR',
};

// ✅ API 사용법 예시
export const API_USAGE = {
  // 보고서 생성
  CREATE_REPORT: {
    method: 'POST',
    url: API.REPORTS,
    query: '?output=pdf|html',
    body: '보고서 데이터 객체',
    example: `
      fetch('${API.REPORTS}?output=pdf', {
        method: 'POST',
        headers: { 'Content-Type': '${MIME_TYPES.JSON}' },
        body: JSON.stringify(reportData)
      })
    `
  },
  
  // 프로젝트 생성
  CREATE_PROJECT: {
    method: 'POST',
    url: API.PROJECTS,
    body: '{ name: "프로젝트명", description: "설명" }',
    example: `
      fetch('${API.PROJECTS}', {
        method: 'POST',
        headers: { 'Content-Type': '${MIME_TYPES.JSON}' },
        body: JSON.stringify(projectData)
      })
    `
  },
  
  // 보고서 검증
  VALIDATE_REPORT: {
    method: 'POST',
    url: API.VALIDATE,
    body: '보고서 데이터 객체',
    example: `
      fetch('${API.VALIDATE}', {
        method: 'POST',
        headers: { 'Content-Type': '${MIME_TYPES.JSON}' },
        body: JSON.stringify(reportData)
      })
    `
  }
};

export default API;
