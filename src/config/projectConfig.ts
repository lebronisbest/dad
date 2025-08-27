// 프로젝트 타입 정의
export const PROJECT_TYPES = {
  CONSTRUCTION: 'construction',
  MANUFACTURING: 'manufacturing',
  MAINTENANCE: 'maintenance',
  RESEARCH: 'research',
  OTHER: 'other'
} as const;

export type ProjectType = typeof PROJECT_TYPES[keyof typeof PROJECT_TYPES];

// 프로젝트 상태 정의
export const PROJECT_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  SUSPENDED: 'suspended',
  CANCELLED: 'cancelled',
  PLANNING: 'planning'
} as const;

export type ProjectStatus = typeof PROJECT_STATUS[keyof typeof PROJECT_STATUS];

// 프로젝트 우선순위 정의
export const PROJECT_PRIORITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  CRITICAL: 'critical'
} as const;

export type ProjectPriority = typeof PROJECT_PRIORITY[keyof typeof PROJECT_PRIORITY];

// 프로젝트 위험도 정의
export const PROJECT_RISK = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
} as const;

export type ProjectRisk = typeof PROJECT_RISK[keyof typeof PROJECT_RISK];

// 프로젝트 타입별 라벨
export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  [PROJECT_TYPES.CONSTRUCTION]: '건설',
  [PROJECT_TYPES.MANUFACTURING]: '제조',
  [PROJECT_TYPES.MAINTENANCE]: '유지보수',
  [PROJECT_TYPES.RESEARCH]: '연구개발',
  [PROJECT_TYPES.OTHER]: '기타'
};

// 프로젝트 상태별 라벨
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  [PROJECT_STATUS.ACTIVE]: '진행중',
  [PROJECT_STATUS.COMPLETED]: '완료',
  [PROJECT_STATUS.SUSPENDED]: '일시중단',
  [PROJECT_STATUS.CANCELLED]: '취소',
  [PROJECT_STATUS.PLANNING]: '계획중'
};

// 프로젝트 우선순위별 라벨
export const PROJECT_PRIORITY_LABELS: Record<ProjectPriority, string> = {
  [PROJECT_PRIORITY.CRITICAL]: '긴급',
  [PROJECT_PRIORITY.HIGH]: '높음',
  [PROJECT_PRIORITY.MEDIUM]: '보통',
  [PROJECT_PRIORITY.LOW]: '낮음'
};

// 프로젝트 위험도별 라벨
export const PROJECT_RISK_LABELS: Record<ProjectRisk, string> = {
  [PROJECT_RISK.HIGH]: '높음',
  [PROJECT_RISK.MEDIUM]: '보통',
  [PROJECT_RISK.LOW]: '낮음'
};

// 프로젝트 타입별 색상
export const PROJECT_TYPE_COLORS: Record<ProjectType, string> = {
  [PROJECT_TYPES.CONSTRUCTION]: '#1976d2',
  [PROJECT_TYPES.MANUFACTURING]: '#388e3c',
  [PROJECT_TYPES.MAINTENANCE]: '#f57c00',
  [PROJECT_TYPES.RESEARCH]: '#7b1fa2',
  [PROJECT_TYPES.OTHER]: '#757575'
};

// 프로젝트 상태별 색상
export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  [PROJECT_STATUS.ACTIVE]: '#4caf50',
  [PROJECT_STATUS.COMPLETED]: '#2196f3',
  [PROJECT_STATUS.SUSPENDED]: '#ff9800',
  [PROJECT_STATUS.CANCELLED]: '#f44336',
  [PROJECT_STATUS.PLANNING]: '#9e9e9e'
};

// 프로젝트 우선순위별 색상
export const PROJECT_PRIORITY_COLORS: Record<ProjectPriority, string> = {
  [PROJECT_PRIORITY.CRITICAL]: '#d32f2f',
  [PROJECT_PRIORITY.HIGH]: '#f57c00',
  [PROJECT_PRIORITY.MEDIUM]: '#ff9800',
  [PROJECT_PRIORITY.LOW]: '#4caf50'
};

// 프로젝트 위험도별 색상
export const PROJECT_RISK_COLORS: Record<ProjectRisk, string> = {
  [PROJECT_RISK.HIGH]: '#f44336',
  [PROJECT_RISK.MEDIUM]: '#ff9800',
  [PROJECT_RISK.LOW]: '#4caf50'
};

// 기본 프로젝트 설정
export const DEFAULT_PROJECT_CONFIG = {
  type: PROJECT_TYPES.CONSTRUCTION,
  status: PROJECT_STATUS.PLANNING,
  priority: PROJECT_PRIORITY.MEDIUM,
  risk: PROJECT_RISK.MEDIUM
} as const;

// 프로젝트 검색 필터 옵션
export const PROJECT_FILTER_OPTIONS = {
  types: Object.values(PROJECT_TYPES),
  statuses: Object.values(PROJECT_STATUS),
  priorities: Object.values(PROJECT_PRIORITY),
  risks: Object.values(PROJECT_RISK)
} as const;

// 프로젝트 정렬 옵션
export const PROJECT_SORT_OPTIONS = {
  NAME: 'name',
  CREATED_DATE: 'created_date',
  UPDATED_DATE: 'updated_date',
  STATUS: 'status',
  PRIORITY: 'priority',
  RISK: 'risk',
  PROGRESS: 'progress'
} as const;

export type ProjectSortOption = typeof PROJECT_SORT_OPTIONS[keyof typeof PROJECT_SORT_OPTIONS];

// 프로젝트 정렬 라벨
export const PROJECT_SORT_LABELS: Record<ProjectSortOption, string> = {
  [PROJECT_SORT_OPTIONS.NAME]: '이름',
  [PROJECT_SORT_OPTIONS.CREATED_DATE]: '생성일',
  [PROJECT_SORT_OPTIONS.UPDATED_DATE]: '수정일',
  [PROJECT_SORT_OPTIONS.STATUS]: '상태',
  [PROJECT_SORT_OPTIONS.PRIORITY]: '우선순위',
  [PROJECT_SORT_OPTIONS.RISK]: '위험도',
  [PROJECT_SORT_OPTIONS.PROGRESS]: '진행률'
};

// 페이지네이션 설정
export const PROJECT_PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 100
} as const;

// 프로젝트 백업 설정
export const PROJECT_BACKUP_CONFIG = {
  AUTO_BACKUP_INTERVAL: 24 * 60 * 60 * 1000, // 24시간
  MAX_BACKUP_COUNT: 10,
  BACKUP_FILE_PREFIX: 'project_backup_',
  BACKUP_FILE_EXTENSION: '.json'
} as const;

// 프로젝트 내보내기 설정
export const PROJECT_EXPORT_CONFIG = {
  SUPPORTED_FORMATS: ['json', 'csv', 'xlsx'] as const,
  DEFAULT_FORMAT: 'json' as const,
  MAX_EXPORT_SIZE: 1000 // 최대 1000개 프로젝트
} as const;

export type ExportFormat = typeof PROJECT_EXPORT_CONFIG.SUPPORTED_FORMATS[number];
