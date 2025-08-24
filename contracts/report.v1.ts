import { z } from 'zod';

// 기본 필수 필드
export const ReportV1 = z.object({
  // 사이트 정보
  site: z.object({
    name: z.string().min(1, "사이트명은 필수입니다"),
    management_number: z.string().optional(),
    construction_period: z.string().optional(),
    construction_amount: z.string().optional(),
    responsible_person: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    address: z.string().default(""),
  }),
  
  // 조직 정보
  org: z.object({
    name: z.string().min(1, "조직명은 필수입니다"),
    registration_number: z.string().optional(),
    license_number: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
  }),
  
  // 검사자 정보
  inspector: z.string().min(1, "검사자명은 필수입니다"),
  
  // 방문 정보
  visit: z.object({
    date: z.string().min(1, "방문일은 필수입니다"),
    round: z.number().int().positive("라운드는 양의 정수여야 합니다"),
    round_total: z.number().int().positive("전체 라운드는 양의 정수여야 합니다"),
  }),
  
  // 진행률
  progress: z.object({
    percent: z.number().min(0).max(100).optional(),
  }),
  
  // 가이드 정보
  guide: z.object({
    org_name: z.string().optional(),
    inspector: z.string().optional(),
    phone: z.string().optional(),
  }),
  
  // 작업 정보
  work: z.object({
    today_work: z.string().optional(),
    current_work: z.string().optional(),
    additional_notes: z.string().optional(),
  }),
  
  // 날짜
  date: z.string().optional(),
  
  // 위험 요소
  hazardous_location: z.string().optional(),
  hazardous_factor: z.string().optional(),
  
  // 지적 사항
  pointed_issue: z.string().optional(),
  implementation_result: z.string().optional(),
  
  // 섹션들 (동적 구조)
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
  })).optional(),
  
  // 알림
  notification: z.object({
    other_method: z.string().optional(),
  }),
  
  // 캡션
  caption_main: z.string().optional(),
  caption_sub: z.string().optional(),
});

export type ReportV1 = z.infer<typeof ReportV1>;

// 검증 함수
export const validateReportV1 = (data: unknown): ReportV1 => {
  return ReportV1.parse(data);
};

// 안전한 검증 (에러 발생하지 않음)
export const safeValidateReportV1 = (data: unknown): { success: true; data: ReportV1 } | { success: false; errors: string[] } => {
  const result = ReportV1.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { 
      success: false, 
      errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
    };
  }
};
