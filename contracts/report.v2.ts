import { z } from 'zod';

/**
 * @deprecated V2 스키마는 현재 사용되지 않습니다. V1을 계속 사용하세요.
 * 향후 V2 기능이 필요할 때까지 이 파일은 제거 예정입니다.
 */
export const ReportV2 = z.object({
  // V1과 동일한 기본 구조
  site: z.object({
    name: z.string().min(1, "사이트명은 필수입니다"),
    management_number: z.string().optional(),
    construction_period: z.string().optional(),
    construction_amount: z.string().optional(),
    responsible_person: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    address: z.string().default(""),
    // V2에서 추가된 필드들
    safety_manager: z.string().optional(),
    emergency_contact: z.string().optional(),
    site_type: z.enum(["construction", "manufacturing", "maintenance", "other"]).optional(),
  }),
  
  org: z.object({
    name: z.string().min(1, "조직명은 필수입니다"),
    registration_number: z.string().optional(),
    license_number: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    // V2에서 추가된 필드들
    safety_certification: z.string().optional(),
    iso_standards: z.array(z.string()).optional(),
  }),
  
  inspector: z.string().min(1, "검사자명은 필수입니다"),
  
  visit: z.object({
    date: z.string().min(1, "방문일은 필수입니다"),
    round: z.number().int().positive("라운드는 양의 정수여야 합니다"),
    round_total: z.number().int().positive("전체 라운드는 양의 정수여야 합니다"),
    // V2에서 추가된 필드들
    weather: z.string().optional(),
    temperature: z.number().optional(),
    humidity: z.number().optional(),
  }),
  
  progress: z.object({
    percent: z.number().min(0).max(100).optional(),
    // V2에서 추가된 필드들
    milestone: z.string().optional(),
    completion_date: z.string().optional(),
  }),
  
  guide: z.object({
    org_name: z.string().optional(),
    inspector: z.string().optional(),
    phone: z.string().optional(),
    // V2에서 추가된 필드들
    email: z.string().email().optional(),
    department: z.string().optional(),
  }),
  
  work: z.object({
    today_work: z.string().optional(),
    current_work: z.string().optional(),
    additional_notes: z.string().optional(),
    // V2에서 추가된 필드들
    safety_measures: z.array(z.string()).optional(),
    equipment_used: z.array(z.string()).optional(),
    personnel_count: z.number().int().positive().optional(),
  }),
  
  date: z.string().optional(),
  
  hazardous_location: z.string().optional(),
  hazardous_factor: z.string().optional(),
  
  pointed_issue: z.string().optional(),
  implementation_result: z.string().optional(),
  
  // V2에서 개선된 섹션 구조
  sections: z.array(z.object({
    place: z.string().optional(),
    factor: z.string().optional(),
    measure: z.string().optional(),
    possibility_level: z.string().optional(),
    severity_level: z.string().optional(),
    risk_level: z.string().optional(),
    priority: z.string().optional(),
    process: z.string().optional(),
    sub_process: z.string().optional(),
    hazardous_factor: z.string().optional(),
    prevention_measure: z.string().optional(),
    notes: z.string().optional(),
    // V2에서 추가된 필드들
    risk_score: z.number().min(1).max(25).optional(),
    mitigation_cost: z.string().optional(),
    responsible_person: z.string().optional(),
    deadline: z.string().optional(),
    status: z.enum(["open", "in_progress", "completed", "closed"]).optional(),
  })).optional(),
  
  notification: z.object({
    other_method: z.string().optional(),
    // V2에서 추가된 필드들
    urgency_level: z.enum(["low", "medium", "high", "critical"]).optional(),
    notification_sent: z.boolean().optional(),
    sent_at: z.string().optional(),
  }),
  
  caption_main: z.string().optional(),
  caption_sub: z.string().optional(),
  
  // V2에서 새로 추가된 최상위 필드들
  metadata: z.object({
    version: z.literal("2.0"),
    created_at: z.string(),
    updated_at: z.string(),
    created_by: z.string(),
    template_version: z.string(),
  }),
  
  // 안전 관련 추가 정보
  safety_summary: z.object({
    total_risks: z.number().int().min(0).optional(),
    high_risk_count: z.number().int().min(0).optional(),
    medium_risk_count: z.number().int().min(0).optional(),
    low_risk_count: z.number().int().min(0).optional(),
    overall_safety_score: z.number().min(0).max(100).optional(),
  }).optional(),
  
  // 법적 준수 정보
  compliance: z.object({
    applicable_laws: z.array(z.string()).optional(),
    compliance_status: z.enum(["compliant", "non_compliant", "pending", "unknown"]).optional(),
    violations_found: z.array(z.string()).optional(),
    corrective_actions: z.array(z.string()).optional(),
  }).optional(),
});

/**
 * @deprecated V2 타입은 현재 사용되지 않습니다. ReportV1을 계속 사용하세요.
 */
export type ReportV2 = z.infer<typeof ReportV2>;

/**
 * @deprecated V1에서 V2로 마이그레이션하는 기능은 현재 사용되지 않습니다.
 * 향후 V2 기능이 필요할 때까지 이 함수는 제거 예정입니다.
 */
export const migrateV1ToV2 = (v1Data: any): ReportV2 => {
  return {
    ...v1Data,
    metadata: {
      version: "2.0",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: v1Data.inspector || "unknown",
      template_version: "2.0",
    },
    // 기본값 설정
    safety_summary: {
      total_risks: v1Data.sections?.length || 0,
      high_risk_count: 0,
      medium_risk_count: 0,
      low_risk_count: 0,
      overall_safety_score: 100,
    },
    compliance: {
      applicable_laws: [],
      compliance_status: "unknown",
      violations_found: [],
      corrective_actions: [],
    },
  };
};

/**
 * @deprecated V2 검증 함수는 현재 사용되지 않습니다. validateReportV1을 계속 사용하세요.
 */
export const validateReportV2 = (data: unknown): ReportV2 => {
  return ReportV2.parse(data);
};

/**
 * @deprecated V2 안전 검증 함수는 현재 사용되지 않습니다. safeValidateReportV1을 계속 사용하세요.
 */
export const safeValidateReportV2 = (data: unknown): { success: true; data: ReportV2 } | { success: false; errors: string[] } => {
  const result = ReportV2.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { 
      success: false, 
      errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
    };
  }
};
