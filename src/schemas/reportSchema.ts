import { z } from 'zod';

// 기본 정보 스키마
const siteSchema = z.object({
  name: z.string().min(1, '현장명을 입력해주세요'),
  address: z.string().min(1, '주소를 입력해주세요'),
  phone: z.string().optional(),
  email: z.string().email('올바른 이메일 형식을 입력해주세요').optional().or(z.literal('')),
  management_number: z.string().optional(),
  construction_period: z.string().optional(),
  construction_amount: z.string().optional(),
  responsible_person: z.string().optional()
});

const orgSchema = z.object({
  name: z.string().min(1, '회사명을 입력해주세요'),
  phone: z.string().optional(),
  address: z.string().optional(),
  registration_number: z.string().optional(),
  license_number: z.string().optional()
});

// ✅ 지도 기관 정보 스키마 추가
const myorgSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  inspector: z.string().optional()  // 지도자명
});

// ✅ guide 스키마 복구 (이전 지도 이행여부)
const guideSchema = z.object({
  previous_completed: z.boolean(),
  previous_incomplete: z.boolean()
});

const visitSchema = z.object({
  date: z.string().min(1, '방문일을 입력해주세요'),
  round: z.number().min(1, '방문차수를 입력해주세요'),
  round_total: z.number().min(1, '총 방문차수를 입력해주세요'),
  purpose: z.string().optional()
});

const progressSchema = z.object({
  percent: z.number().min(0).max(100, '진행률은 0-100 사이여야 합니다')
});

const categorySchema = z.object({
  type: z.string().min(1, '카테고리 타입을 선택해주세요'),
  subtype: z.string().min(1, '카테고리 서브타입을 선택해주세요'),
  is_construction: z.boolean(),
  is_electrical: z.boolean()
});

const workSchema = z.object({
  status_html: z.string().optional(),
  description: z.string().optional(),
  is_working_today: z.boolean(),
  today_work: z.string().optional(),
  current_work: z.string().optional(),
  additional_notes: z.string().optional()
});

const notificationSchema = z.object({
  registered_mail: z.boolean(),
  email: z.boolean(),
  mobile: z.boolean(),
  other: z.boolean(),
  other_method: z.string().optional()
});

const hazardSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, '위험 요소 설명을 입력해주세요'),
  risk_level: z.enum(['high', 'medium', 'low'], {
    errorMap: () => ({ message: '위험도를 선택해주세요' })
  }),
  improvement_method: z.string().optional()
});

const riskAssessmentSchema = z.object({
  possibility: z.object({
    high: z.string().optional(),
    medium: z.string().optional(),
    low: z.string().optional()
  }),
  severity: z.object({
    high: z.string().optional(),
    medium: z.string().optional(),
    low: z.string().optional()
  }),
  improvement_methods: z.object({
    high: z.string().optional(),
    medium: z.string().optional(),
    low: z.string().optional()
  })
});

const futureWorkSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, '향후 작업 내용을 입력해주세요'),
  priority: z.enum(['high', 'medium', 'low'], {
    errorMap: () => ({ message: '우선순위를 선택해주세요' })
  }),
  deadline: z.string().optional()
});

const supportSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, '지원 사항을 입력해주세요'),
  type: z.enum(['technical', 'financial', 'personnel', 'other'], {
    errorMap: () => ({ message: '지원 유형을 선택해주세요' })
  }),
  status: z.enum(['pending', 'in_progress', 'completed'], {
    errorMap: () => ({ message: '상태를 선택해주세요' })
  })
});

const photoSchema = z.object({
  id: z.string().optional(),
  url: z.string().optional(),
  caption: z.string().optional(),
  timestamp: z.string().optional()
});

// 메인 보고서 스키마
export const reportSchema = z.object({
  site: siteSchema,
  org: orgSchema,
  myorg: myorgSchema,
  guide: guideSchema,  // ✅ guide 스키마 복구
  visit: visitSchema,
  progress: progressSchema,
  category: categorySchema,
  work: workSchema,
  notification: notificationSchema,
  previous_guidance: z.array(z.string()).optional(),
  hazards: z.array(hazardSchema),
  risk_assessment: riskAssessmentSchema,
  future_work: z.array(futureWorkSchema),
  support: z.array(supportSchema),
  photos: z.array(photoSchema)
});

// 타입 추론
export type ReportData = z.infer<typeof reportSchema>;
export type SiteData = z.infer<typeof siteSchema>;
export type OrgData = z.infer<typeof orgSchema>;
export type MyorgData = z.infer<typeof myorgSchema>;  // ✅ 지도 기관 타입 추가
export type VisitData = z.infer<typeof visitSchema>;
export type HazardData = z.infer<typeof hazardSchema>;
export type FutureWorkData = z.infer<typeof futureWorkSchema>;
export type SupportData = z.infer<typeof supportSchema>;

// 부분 업데이트를 위한 스키마
export const reportUpdateSchema = reportSchema.partial();

// 검증 함수
export const validateReport = (data: unknown) => {
  return reportSchema.safeParse(data);
};

// 에러 포맷팅
export const formatValidationErrors = (errors: z.ZodError) => {
  return errors.errors.map(error => ({
    field: error.path.join('.'),
    message: error.message
  }));
};
