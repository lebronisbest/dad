// API 엔드포인트 상수
export const API = {
  REPORTS: 'http://localhost:3001/v1/reports',
  PROJECTS: 'http://localhost:3001/v1/projects',  // v1/projects로 수정
  HEALTH: 'http://localhost:3001/healthz'
};

// HTTP 상태 코드
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};

// API 버전
export const API_VERSION = 'v1';

// 타임아웃 설정
export const TIMEOUTS = {
  SERVER: 30000, // 30초
  FRONTEND: 15000 // 15초
};
