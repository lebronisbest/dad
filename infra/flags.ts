// 피처 플래그 시스템
// 3계층 구조: 빌드타임, 런타임 환경변수, 원격 구성

export interface Flags {
  // PDF 파이프라인 관련
  NEW_PDF_PIPELINE: boolean;           // 새 PDF 파이프라인 토글
  STRICT_SCHEMA_ENFORCE: boolean;      // 유효성 검사 fail-fast
  PDF_COMPRESSION: boolean;            // PDF 압축 기능
  
  // MCP 및 외부 API 관련
  MCP_NEW_LAW_SEARCH: boolean;         // 새 법령 검색 툴
  MCP_IMAGE_PROCESSING: boolean;       // 이미지 처리 기능
  MCP_WEB_SNAPSHOT: boolean;           // 웹 스냅샷 기능
  
  // 보고서 기능 관련
  REPORT_V2_ENABLED: boolean;          // V2 보고서 활성화
  REPORT_TEMPLATE_CACHING: boolean;    // 템플릿 캐싱
  REPORT_VALIDATION_STRICT: boolean;   // 엄격한 검증
  
  // 성능 및 모니터링 관련
  PERFORMANCE_MONITORING: boolean;     // 성능 모니터링
  REQUEST_ID_TRACKING: boolean;        // 요청 ID 추적
  FAILURE_ARTIFACT_UPLOAD: boolean;    // 실패 시 아티팩트 업로드
  
  // 카나리 배포 관련
  CANARY_DEPLOYMENT: boolean;          // 카나리 배포 활성화
  CANARY_RATIO: number;                // 카나리 비율 (0.0 ~ 1.0)
}

// 환경변수에서 플래그 로드
const loadFlagFromEnv = (key: string, defaultValue: boolean = false): boolean => {
  const value = process.env[`FLAG_${key}`];
  if (value === undefined) return defaultValue;
  return value === "1" || value === "true" || value === "yes";
};

const loadFlagRatioFromEnv = (key: string, defaultValue: number = 0.0): number => {
  const value = process.env[`FLAG_${key}_RATIO`];
  if (value === undefined) return defaultValue;
  const ratio = parseFloat(value);
  return isNaN(ratio) ? defaultValue : Math.max(0.0, Math.min(1.0, ratio));
};

// 기본 플래그 설정 - 모든 새로운 기능은 기본적으로 Off
export const Flags: Flags = {
  // PDF 파이프라인 - 기본 Off (사용량 모니터링 중)
  NEW_PDF_PIPELINE: loadFlagFromEnv("NEW_PDF_PIPELINE", false),
  STRICT_SCHEMA_ENFORCE: loadFlagFromEnv("STRICT_SCHEMA_ENFORCE", false),
  PDF_COMPRESSION: loadFlagFromEnv("PDF_COMPRESSION", true),
  
  // MCP 기능 - 기본 Off (사용량 모니터링 중)
  MCP_NEW_LAW_SEARCH: loadFlagFromEnv("MCP_NEW_LAW_SEARCH", false),
  MCP_IMAGE_PROCESSING: loadFlagFromEnv("MCP_IMAGE_PROCESSING", true),
  MCP_WEB_SNAPSHOT: loadFlagFromEnv("MCP_WEB_SNAPSHOT", true),
  
  // 보고서 기능 - 기본 Off (사용량 모니터링 중)
  REPORT_V2_ENABLED: loadFlagFromEnv("REPORT_V2_ENABLED", false),
  REPORT_TEMPLATE_CACHING: loadFlagFromEnv("REPORT_TEMPLATE_CACHING", true),
  REPORT_VALIDATION_STRICT: loadFlagFromEnv("REPORT_VALIDATION_STRICT", false),
  
  // 성능 및 모니터링 - 기본 On (안정적인 기능)
  PERFORMANCE_MONITORING: loadFlagFromEnv("PERFORMANCE_MONITORING", true),
  REQUEST_ID_TRACKING: loadFlagFromEnv("REQUEST_ID_TRACKING", true),
  FAILURE_ARTIFACT_UPLOAD: loadFlagFromEnv("FAILURE_ARTIFACT_UPLOAD", false),
  
  // 카나리 배포 - 기본 Off (사용량 모니터링 중)
  CANARY_DEPLOYMENT: loadFlagFromEnv("CANARY_DEPLOYMENT", false),
  CANARY_RATIO: loadFlagRatioFromEnv("CANARY_RATIO", 0.0),
};

// 플래그 동적 업데이트 (런타임에 변경 가능)
export const updateFlag = (key: keyof Flags, value: boolean | number): void => {
  if (typeof value === "boolean") {
    (Flags as any)[key] = value;
  } else if (typeof value === "number" && key === "CANARY_RATIO") {
    Flags.CANARY_RATIO = Math.max(0.0, Math.min(1.0, value));
  }
};

// 카나리 배포 확인 함수
export const isInCanary = (bucketKey: string, ratio?: number): boolean => {
  if (!Flags.CANARY_DEPLOYMENT) return false;
  
  const canaryRatio = ratio ?? Flags.CANARY_RATIO;
  if (canaryRatio <= 0) return false;
  if (canaryRatio >= 1) return true;
  
  // 간단한 해시 기반 버킷팅
  let hash = 0;
  for (let i = 0; i < bucketKey.length; i++) {
    const char = bucketKey.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit 정수로 변환
  }
  
  const normalizedHash = Math.abs(hash) % 1000;
  return normalizedHash < (canaryRatio * 1000);
};

// 플래그 상태 조회
export const getFlagsStatus = (): Record<string, any> => {
  return {
    ...Flags,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  };
};

// 플래그 리셋 (기본값으로 복원)
export const resetFlags = (): void => {
  Flags.NEW_PDF_PIPELINE = false;
  Flags.STRICT_SCHEMA_ENFORCE = false;
  Flags.PDF_COMPRESSION = true;
  Flags.MCP_NEW_LAW_SEARCH = false;
  Flags.MCP_IMAGE_PROCESSING = true;
  Flags.MCP_WEB_SNAPSHOT = true;
  Flags.REPORT_V2_ENABLED = false;
  Flags.REPORT_TEMPLATE_CACHING = true;
  Flags.REPORT_VALIDATION_STRICT = false;
  Flags.PERFORMANCE_MONITORING = true;
  Flags.REQUEST_ID_TRACKING = true;
  Flags.FAILURE_ARTIFACT_UPLOAD = false;
  Flags.CANARY_DEPLOYMENT = false;
  Flags.CANARY_RATIO = 0.0;
};

// 플래그 유효성 검사
export const validateFlags = (): string[] => {
  const errors: string[] = [];
  
  if (Flags.CANARY_RATIO < 0 || Flags.CANARY_RATIO > 1) {
    errors.push("CANARY_RATIO는 0.0과 1.0 사이여야 합니다");
  }
  
  if (Flags.NEW_PDF_PIPELINE && !Flags.PERFORMANCE_MONITORING) {
    errors.push("NEW_PDF_PIPELINE 활성화 시 PERFORMANCE_MONITORING도 활성화해야 합니다");
  }
  
  return errors;
};

// 플래그 변경 로깅
export const logFlagChange = (key: keyof Flags, oldValue: any, newValue: any): void => {
  console.log(`[FLAG_CHANGE] ${key}: ${oldValue} → ${newValue} at ${new Date().toISOString()}`);
};

// 플래그 변경 시 로깅 포함
export const setFlagWithLogging = (key: keyof Flags, value: boolean | number): void => {
  const oldValue = (Flags as any)[key];
  updateFlag(key, value);
  logFlagChange(key, oldValue, value);
};

// 사용량 모니터링을 위한 플래그 접근 로깅
export const logFlagAccess = (key: keyof Flags, context: string): void => {
  console.log(`[FLAG_ACCESS] ${key} accessed in ${context} at ${new Date().toISOString()}`);
};

// 플래그 접근 시 로깅을 포함한 값 반환
export const getFlagWithLogging = (key: keyof Flags, context: string): boolean | number => {
  logFlagAccess(key, context);
  return (Flags as any)[key];
};
