import { ReportV1, validateReportV1 } from '../contracts/report.v1';
import { Flags, getFlagWithLogging } from '../infra/flags';

// LayoutContext는 layout.html에서 사용할 수 있는 통합된 데이터 구조
export interface LayoutContext {
  // 사이트 정보
  site: {
    name: string;
    management_number?: string;
    construction_period?: string;
    construction_amount?: string;
    responsible_person?: string;
    phone?: string;
    email?: string;
    address: string;
    safety_manager?: string;
    emergency_contact?: string;
    site_type?: string;
  };
  
  // 조직 정보
  org: {
    name: string;
    registration_number?: string;
    license_number?: string;
    phone?: string;
    address?: string;
    safety_certification?: string;
    iso_standards?: string[];
  };
  
  // 검사자 정보
  inspector: string;
  
  // 방문 정보
  visit: {
    date: string;
    round: number;
    round_total: number;
    weather?: string;
    temperature?: number;
    humidity?: number;
  };
  
  // 진행률
  progress: {
    percent?: number;
    milestone?: string;
    completion_date?: string;
  };
  
  // 가이드 정보
  guide: {
    org_name?: string;
    inspector?: string;
    phone?: string;
    email?: string;
    department?: string;
  };
  
  // 작업 정보
  work: {
    today_work?: string;
    current_work?: string;
    additional_notes?: string;
    safety_measures?: string[];
    equipment_used?: string[];
    personnel_count?: number;
  };
  
  // 날짜
  date?: string;
  
  // 위험 요소
  hazardous_location?: string;
  hazardous_factor?: string;
  
  // 지적 사항
  pointed_issue?: string;
  implementation_result?: string;
  
  // 섹션들
  sections: Array<{
    place?: string;
    factor?: string;
    measure?: string;
    possibility_level?: string;
    severity_level?: string;
    risk_level?: string;
    priority?: string;
    process?: string;
    sub_process?: string;
    hazardous_factor?: string;
    prevention_measure?: string;
    notes?: string;
    risk_score?: number;
    mitigation_cost?: string;
    responsible_person?: string;
    deadline?: string;
    status?: string;
  }>;
  
  // 알림
  notification: {
    other_method?: string;
    urgency_level?: string;
    notification_sent?: boolean;
    sent_at?: string;
  };
  
  // 캡션
  caption_main?: string;
  caption_sub?: string;
  

  
  // 렌더링 메타데이터
  _render: {
    version: string;
    timestamp: string;
    request_id: string;
    template_version: string;
  };
}

// 기본값 설정 함수
const setDefaultValues = (data: any): any => {
  const defaults = {
    site: {
      name: data.site?.name || "미지정현장",
      address: data.site?.address || "",
      management_number: data.site?.management_number || "",
      construction_period: data.site?.construction_period || "",
      construction_amount: data.site?.construction_amount || "",
      responsible_person: data.site?.responsible_person || "",
      phone: data.site?.phone || "",
      email: data.site?.email || "",
      safety_manager: data.site?.safety_manager || "",
      emergency_contact: data.site?.emergency_contact || "",
      site_type: data.site?.site_type || "construction",
    },
    org: {
      name: data.org?.name || "미지정조직",
      registration_number: data.org?.registration_number || "",
      license_number: data.org?.license_number || "",
      phone: data.org?.phone || "",
      address: data.org?.address || "",
      safety_certification: data.org?.safety_certification || "",
      iso_standards: data.org?.iso_standards || [],
    },
    inspector: data.inspector || "미지정검사자",
    visit: {
      date: data.visit?.date || new Date().toISOString().split('T')[0],
      round: data.visit?.round || 1,
      round_total: data.visit?.round_total || 1,
      weather: data.visit?.weather || "",
      temperature: data.visit?.temperature || null,
      humidity: data.visit?.humidity || null,
    },
    progress: {
      percent: data.progress?.percent || 0,
      milestone: data.progress?.milestone || "",
      completion_date: data.progress?.completion_date || "",
    },
    guide: {
      org_name: data.guide?.org_name || "",
      inspector: data.guide?.inspector || "",
      phone: data.guide?.phone || "",
      email: data.guide?.email || "",
      department: data.guide?.department || "",
    },
    work: {
      today_work: data.work?.today_work || "",
      current_work: data.work?.current_work || "",
      additional_notes: data.work?.additional_notes || "",
      safety_measures: data.work?.safety_measures || [],
      equipment_used: data.work?.equipment_used || [],
      personnel_count: data.work?.personnel_count || null,
    },
    date: data.date || "",
    hazardous_location: data.hazardous_location || "",
    hazardous_factor: data.hazardous_factor || "",
    pointed_issue: data.pointed_issue || "",
    implementation_result: data.implementation_result || "",
    sections: data.sections || [],
    notification: {
      other_method: data.notification?.other_method || "",
      urgency_level: data.notification?.urgency_level || "low",
      notification_sent: data.notification?.notification_sent || false,
      sent_at: data.notification?.sent_at || "",
    },
    caption_main: data.caption_main || "",
    caption_sub: data.caption_sub || "",
  };
  
  return defaults;
};

// V1 데이터를 LayoutContext로 변환
export const composeV1ReportData = (data: ReportV1, requestId: string): LayoutContext => {
  const validatedData = validateReportV1(data);
  const defaults = setDefaultValues(validatedData);
  
  return {
    ...defaults,
    _render: {
      version: "1.0",
      timestamp: new Date().toISOString(),
      request_id: requestId,
      template_version: "1.0",
    },
  };
};





// 통합 컴포저 함수 (V1만 지원)
export const composeReportData = (
  data: unknown, 
  requestId: string, 
  forceVersion?: "1"
): LayoutContext => {
  try {
    // V1으로만 처리
    return composeV1ReportData(data as ReportV1, requestId);
  } catch (error) {
    // 검증 실패 시 기본값으로 구성
    console.error(`[COMPOSE_ERROR] Failed to compose report data:`, error);
    
    const fallbackData = setDefaultValues({});
    return {
      ...fallbackData,
      _render: {
        version: "1.0",
        timestamp: new Date().toISOString(),
        request_id: requestId,
        template_version: "1.0",
        error: "Data validation failed, using fallback values",
      },
    };
  }
};

// 데이터 검증 및 변환 결과
export interface ComposeResult {
  success: boolean;
  data?: LayoutContext;
  errors?: string[];
  version: string;
  warnings?: string[];
}

// 안전한 컴포지션 (에러 발생하지 않음)
export const safeComposeReportData = (
  data: unknown, 
  requestId: string, 
  forceVersion?: "1"
): ComposeResult => {
  try {
    const result = composeReportData(data, requestId, forceVersion);
    
    return {
      success: true,
      data: result,
      version: result._render.version,
      warnings: undefined,
    };
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : String(error)],
      version: forceVersion || "unknown",
    };
  }
};

// 플래그 기반 컴포지션 (V1만 지원)
export const composeReportDataWithFlags = (
  data: unknown, 
  requestId: string, 
  projectId?: string
): LayoutContext => {
  // V1으로만 처리
  return composeReportData(data, requestId, "1");
};

// 사용량 통계 수집
export const getUsageStats = (): Record<string, any> => {
  return {
    timestamp: new Date().toISOString(),
    v1_calls: 0, // TODO: 실제 사용량 카운터 구현
    flags_status: {
      REPORT_V2_ENABLED: false, // V2는 제거됨
      CANARY_DEPLOYMENT: false, // V2는 제거됨
      CANARY_RATIO: 0.0, // V2는 제거됨
    }
  };
};
