/**
 * 타입 정의 - 작업 컨텍스트와 내보내기 DTO 분리
 */

// 법령 인용 정보 (작업 컨텍스트용)
export interface LawCitation {
  lawName: string;
  article: string;
  content: string;
  source: string;
  relevance?: number;
}

// 작업 컨텍스트 (PDF와 무관한 내부 정보)
export interface WorkContext {
  // 법령 정보 (features.lawTool이 true일 때만)
  laws?: LawCitation[];
  
  // 향후 확장 가능한 필드들
  weather?: {
    temperature: number;
    humidity: number;
    condition: string;
  };
  
  geocode?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  
  // 기타 작업 관련 컨텍스트
  [key: string]: any;
}

// 내보내기용 보고서 DTO (PDF 렌더링 전용)
export interface ExportReportDTO {
  // 기본 정보
  site: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    management_number?: string;
    construction_period?: string;
    construction_amount?: string;
    responsible_person?: string;
  };
  
  org: {
    name: string;
    inspector: string;
    position?: string;
    phone?: string;
    email?: string;
    registration_number?: string;
    license_number?: string;
    address?: string;
    // 로고는 data URI로 변환
    logo_data_uri?: string;
  };
  
  inspector: string;
  round: number;
  round_total: number;
  
  visit: {
    date: string;
    time?: string;
    purpose?: string;
  };
  
  // 진행 상황
  progress?: {
    percent: number;
  };
  
  // 카테고리
  category?: {
    type?: string;
    subtype?: string;
    is_construction?: boolean;
    is_electrical?: boolean;
  };
  
  // 지도 정보
  guide?: {
    org_name?: string;
    inspector?: string;
    phone?: string;
    previous_completed?: boolean;
    previous_incomplete?: boolean;
  };
  
  // 작업 현황
  work?: {
    status_html?: string;
    description?: string;
    is_working_today?: boolean;
    today_work?: string;
    current_work?: string;
    additional_notes?: string;
  };
  
  // 통지 방법
  notification?: {
    registered_mail?: boolean;
    email?: boolean;
    mobile?: boolean;
    other?: boolean;
    other_method?: string;
  };
  
  // 이전 지도 이력 (정규화된 형태)
  previous_guidance?: Array<{
    hazardous_location: string;
    hazardous_factor: string;
    pointed_issue: string;
    implementation_result: string;
    date: string;
  }>;
  
  // 위험요소
  hazards?: Array<{
    place: string;
    factor: string;
    measure: string;
    possibility_level: string;
    severity_level: string;
    risk_level: number;
    priority: string;
  }>;
  
  // 위험도 평가
  risk_assessment?: {
    possibility?: {
      high?: string;
      medium?: string;
      low?: string;
    };
    severity?: {
      high?: string;
      medium?: string;
      low?: string;
    };
    improvement_methods?: {
      high?: string;
      medium?: string;
      low?: string;
    };
  };
  
  // 향후 작업
  future_work?: Array<{
    process: string;
    sub_process: string;
    hazardous_factor: string;
    prevention_measure: string;
    notes?: string;
  }>;
  
  // 지원 사항
  support?: Array<{
    type: string;
    description: string;
    date?: string;
    status?: string;
  }>;
  
  // 사진 (data URI로 변환)
  photos?: Array<{
    url: string;
    caption_main?: string;
    caption_sub?: string;
    taken_at?: string;
    index?: number;
  }>;
  
  // 섹션
  sections?: Array<{
    title: string;
    items: string[];
  }>;
  
  // 요약 (HTML 정제됨)
  summary_html?: string;
  
  // 조치사항 (HTML 정제됨)
  measures?: Array<{
    detail_html?: string;
    [key: string]: any;
  }>;
}

// 입력 DTO (사용자 입력)
export interface InputDTO {
  [key: string]: any;
}

// PDF 생성 결과
export interface PDFGenerationResult {
  success: boolean;
  buffer?: Buffer;
  filename?: string;
  error?: string;
  processingTime: number;
  renderLog?: any;
}

// 통합 보고서 서비스 타입들
export interface UnifiedReportOptions {
  type: 'pdf' | 'html';
  projectId?: string;
  saveFile?: boolean;
  immediate?: boolean;
  outputDir?: string;
  basename?: string;
}

export interface UnifiedReportResult {
  success: boolean;
  report: any;
  projectLinked?: boolean;
  saved?: boolean;
  filename?: string;
  projectInfo?: any;
  error?: string;
  processingTime: number;
}

export interface UnifiedReportResponse {
  success: boolean;
  message: string;
  data: {
    type: 'pdf' | 'html';
    projectLinked: boolean;
    saved: boolean;
    filename?: string;
    projectInfo?: any;
    processingTime: number;
  };
  timestamp: string;
}
