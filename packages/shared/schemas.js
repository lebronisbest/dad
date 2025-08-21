import { z } from 'zod';

// 기본 공통 필드
const BaseFields = z.object({
  projectName: z.string().min(1, '프로젝트명은 필수입니다'),
  projectLocation: z.string().min(1, '현장위치는 필수입니다'),
  contractor: z.string().min(1, '시공업체는 필수입니다'),
  inspectionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)'),
  inspector: z.string().min(1, '지도자명은 필수입니다'),
  reportNumber: z.string().optional(),
  weather: z.string().optional(),
  temperature: z.string().optional(),
});

// 발견사항 스키마
const Finding = z.object({
  id: z.string().optional(),
  category: z.enum(['안전관리', '건설기계', '건설용품', '작업환경', '기타']),
  description: z.string().min(10, '발견사항은 10자 이상 입력해야 합니다'),
  severity: z.enum(['높음', '보통', '낮음']),
  lawReference: z.string().optional(),
  photoUrls: z.array(z.string()).optional(),
  location: z.string().optional(),
});

// 권고사항 스키마
const Recommendation = z.object({
  id: z.string().optional(),
  findingId: z.string().optional(),
  description: z.string().min(10, '권고사항은 10자 이상 입력해야 합니다'),
  priority: z.enum(['긴급', '높음', '보통', '낮음']),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식이 올바르지 않습니다').optional(),
  responsible: z.string().optional(),
  status: z.enum(['미조치', '조치중', '조치완료']).default('미조치'),
});

// 템플릿 1: 일반 기술지도 결과보고서
export const Template1Schema = BaseFields.extend({
  templateType: z.literal('template1'),
  findings: z.array(Finding).min(1, '최소 1개 이상의 발견사항이 필요합니다'),
  recommendations: z.array(Recommendation).min(1, '최소 1개 이상의 권고사항이 필요합니다'),
  riskAssessment: z.object({
    overallRisk: z.enum(['높음', '보통', '낮음']),
    riskFactors: z.array(z.string()).optional(),
    improvementPlan: z.string().optional(),
  }),
  attachments: z.array(z.string()).optional(),
});

// 템플릿 2: 특별기술지도 결과보고서
export const Template2Schema = BaseFields.extend({
  templateType: z.literal('template2'),
  specialInspectionType: z.enum(['사고발생', '중대재해위험', '기타']),
  accidentDetails: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    type: z.string().optional(),
    casualties: z.number().min(0).optional(),
    damageAmount: z.number().min(0).optional(),
  }).optional(),
  findings: z.array(Finding).min(1),
  recommendations: z.array(Recommendation).min(1),
  emergencyMeasures: z.array(z.string()).optional(),
  followUpActions: z.array(z.string()).optional(),
});

// 템플릿 3: 정기기술지도 결과보고서
export const Template3Schema = BaseFields.extend({
  templateType: z.literal('template3'),
  inspectionPeriod: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
  inspectionScope: z.array(z.string()).min(1, '점검 범위는 필수입니다'),
  findings: z.array(Finding).min(1),
  recommendations: z.array(Recommendation).min(1),
  complianceStatus: z.object({
    overall: z.enum(['양호', '보통', '불량']),
    details: z.array(z.object({
      category: z.string(),
      status: z.enum(['양호', '보통', '불량']),
      notes: z.string().optional(),
    })),
  }),
  nextInspectionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// 통합 스키마 (3개 템플릿 중 하나)
export const ReportSchema = z.discriminatedUnion('templateType', [
  Template1Schema,
  Template2Schema,
  Template3Schema,
]);

// 검증 함수들
export const validateReport = (data) => {
  try {
    const result = ReportSchema.parse(data);
    return { isValid: true, data: result, errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));
      return { isValid: false, data: null, errors };
    }
    return { isValid: false, data: null, errors: [{ field: 'unknown', message: error.message }] };
  }
};

// 스키마 타입 추출
export const ReportType = z.infer<typeof ReportSchema>;
export const FindingType = z.infer<typeof Finding>;
export const RecommendationType = z.infer<typeof Recommendation>;
