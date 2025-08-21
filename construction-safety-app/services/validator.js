const { z } = require('zod');

// 공통 스키마 import (향후 워크스페이스 설정 후)
// const { ReportSchema, validateReport } = require('@construction-safety/shared');

// 법정 참조 스키마
const LegalReferenceSchema = z.union([
  z.string().regex(/^산안법\s*§\s*\d+/, '산안법 형식이 올바르지 않습니다'),
  z.string().regex(/^고시\s*\d{4}-\d+/, '고시 형식이 올바르지 않습니다'),
  z.string().min(1, '법정 참조는 필수입니다')
]);

// 전화번호 스키마
const PhoneSchema = z.string().regex(
  /^(\+82|0)?1[016789]-?\d{3,4}-?\d{4}$/,
  '올바른 전화번호 형식이 아닙니다'
);

// 이메일 스키마
const EmailSchema = z.string().email('올바른 이메일 형식이 아닙니다');

// 금액 스키마 (원 단위)
const MoneySchema = z.number().positive('금액은 양수여야 합니다').int('금액은 정수여야 합니다');

// 비율 스키마 (0-100%)
const PercentageSchema = z.number().min(0, '비율은 0 이상이어야 합니다').max(100, '비율은 100 이하여야 합니다');

// 날짜 스키마
const DateSchema = z.string().datetime('올바른 날짜 형식이 아닙니다');

// 위험도 평가 스키마
const RiskAssessmentSchema = z.object({
  riskElement: z.string().min(1, '위험요소는 필수입니다'),
  riskLevel: z.enum(['높음', '중간', '낮음'], '위험도는 높음/중간/낮음 중 하나여야 합니다'),
  action: z.string().min(1, '조치사항은 필수입니다'),
  isCompleted: z.boolean().default(false)
});

// 사진 첨부 스키마
const PhotoSchema = z.object({
  photoUrl: z.string().url('올바른 URL 형식이 아닙니다'),
  description: z.string().min(1, '사진 설명은 필수입니다'),
  takenDate: DateSchema,
  location: z.string().min(1, '촬영 위치는 필수입니다')
});

// 통보 데이터 스키마
const NotificationSchema = z.object({
  method: z.enum(['전화', '이메일', '방문', '기타'], '통보 방법은 필수입니다'),
  timestamp: DateSchema,
  target: z.string().min(1, '통보 대상은 필수입니다'),
  evidenceFiles: z.array(z.string()).optional(),
  emailMeta: z.object({
    recipient: EmailSchema,
    subject: z.string().min(1, '이메일 제목은 필수입니다'),
    messageId: z.string().optional()
  }).optional()
});

// 메인 보고서 스키마
const ReportSchema = z.object({
  // 기본 정보
  templateId: z.enum(['template1', 'template2', 'template3'], '올바른 템플릿 ID가 아닙니다'),
  projectName: z.string().min(1, '프로젝트명은 필수입니다').max(200, '프로젝트명은 200자 이하여야 합니다'),
  projectLocation: z.string().min(1, '프로젝트 위치는 필수입니다'),
  projectType: z.enum(['주거시설', '상업시설', '공업시설', '교통시설', '토목시설', '환경시설', '기타']).optional(),
  contractor: z.string().min(1, '시공사명은 필수입니다'),
  
  // 기술지도 정보
  guidanceDate: DateSchema,
  guidanceType: z.enum(['정기점검', '수시점검', '긴급점검', '사고조사', '안전교육', '기타']),
  inspector: z.string().min(1, '지도자명은 필수입니다'),
  guidanceDuration: z.string().optional(),
  
  // 발견사항 및 권고사항
  findings: z.array(z.string().min(1, '발견사항은 비어있을 수 없습니다')).min(1, '최소 1개 이상의 발견사항이 필요합니다'),
  recommendations: z.array(z.string().min(1, '권고사항은 비어있을 수 없습니다')).min(1, '최소 1개 이상의 권고사항이 필요합니다'),
  
  // 상세 정보 (상세보고서용)
  responsiblePerson: z.string().optional(),
  
  // 긴급 조치사항 (긴급보고서용)
  emergencyLevel: z.enum(['높음', '중간', '낮음']).optional(),
  immediateActions: z.array(z.string().min(1, '즉시조치사항은 비어있을 수 없습니다')).optional(),
  
  // 위험도 평가
  riskAssessments: z.array(RiskAssessmentSchema).optional(),
  
  // 사진 첨부
  photos: z.array(PhotoSchema).optional(),
  
  // 법정 참조
  legalRefs: z.array(LegalReferenceSchema).optional(),
  
  // 통보 데이터
  notifications: z.array(NotificationSchema).optional(),
  
  // 메타데이터
  ownerClassOver50B: z.boolean().default(false),
  requiresQuarterlyReport: z.boolean().default(false),
  
  // 연락처 정보
  contactPhone: PhoneSchema.optional(),
  contactEmail: EmailSchema.optional(),
  
  // 금액 정보
  projectBudget: MoneySchema.optional(),
  safetyInvestment: MoneySchema.optional(),
  safetyInvestmentRatio: PercentageSchema.optional(),
  
  // 날짜 제약 검증
}).refine((data) => {
  // 상세보고서인 경우 책임자 필수
  if (data.templateId === 'template2' && !data.responsiblePerson) {
    return false;
  }
  
  // 긴급보고서인 경우 긴급도와 즉시조치사항 필수
  if (data.templateId === 'template3') {
    if (!data.emergencyLevel || !data.immediateActions || data.immediateActions.length === 0) {
      return false;
    }
  }
  
  // 50억 이상 프로젝트는 분기 보고 필요
  if (data.ownerClassOver50B && data.projectBudget && data.projectBudget >= 5000000000) {
    data.requiresQuarterlyReport = true;
  }
  
  return true;
}, {
  message: '템플릿별 필수 필드가 누락되었습니다',
  path: ['templateId']
});

// 부분 수정 스키마 - 모든 필드를 선택적으로 만듦
const ReportPatchSchema = z.object({
  templateId: z.enum(['template1', 'template2', 'template3']).optional(),
  projectName: z.string().min(1, '프로젝트명은 필수입니다').max(200, '프로젝트명은 200자 이하여야 합니다').optional(),
  projectLocation: z.string().min(1, '프로젝트 위치는 필수입니다').optional(),
  projectType: z.enum(['주거시설', '상업시설', '공업시설', '교통시설', '토목시설', '환경시설', '기타']).optional(),
  contractor: z.string().min(1, '시공사명은 필수입니다').optional(),
  guidanceDate: DateSchema.optional(),
  guidanceType: z.enum(['정기점검', '수시점검', '긴급점검', '사고조사', '안전교육', '기타']).optional(),
  inspector: z.string().min(1, '지도자명은 필수입니다').optional(),
  guidanceDuration: z.string().optional(),
  findings: z.array(z.string().min(1, '발견사항은 비어있을 수 없습니다')).optional(),
  recommendations: z.array(z.string().min(1, '권고사항은 비어있을 수 없습니다')).optional(),
  responsiblePerson: z.string().optional(),
  emergencyLevel: z.enum(['높음', '중간', '낮음']).optional(),
  immediateActions: z.array(z.string().min(1, '즉시조치사항은 비어있을 수 없습니다')).optional(),
  riskAssessments: z.array(RiskAssessmentSchema).optional(),
  photos: z.array(PhotoSchema).optional(),
  legalRefs: z.array(LegalReferenceSchema).optional(),
  notifications: z.array(NotificationSchema).optional(),
  ownerClassOver50B: z.boolean().optional(),
  requiresQuarterlyReport: z.boolean().optional(),
  contactPhone: PhoneSchema.optional(),
  contactEmail: EmailSchema.optional(),
  projectBudget: MoneySchema.optional(),
  safetyInvestment: MoneySchema.optional(),
  safetyInvestmentRatio: PercentageSchema.optional()
});

// 검증 함수
function validateReportData(data) {
  try {
    const validatedData = ReportSchema.parse(data);
    return {
      isValid: true,
      data: validatedData,
      errors: []
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }));
      
      return {
        isValid: false,
        data: null,
        errors: errors
      };
    }
    
    return {
      isValid: false,
      data: null,
      errors: [{
        field: 'unknown',
        message: '알 수 없는 검증 오류가 발생했습니다',
        code: 'UNKNOWN_ERROR'
      }]
    };
  }
}

// 부분 수정 검증
function validateReportPatch(data) {
  try {
    const validatedData = ReportPatchSchema.parse(data);
    return {
      isValid: true,
      data: validatedData,
      errors: []
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }));
      
      return {
        isValid: false,
        data: null,
        errors: errors
      };
    }
    
    return {
      isValid: false,
      data: null,
      errors: [{
        field: 'unknown',
        message: '알 수 없는 검증 오류가 발생했습니다',
        code: 'UNKNOWN_ERROR'
      }]
    };
  }
}

// 새로운 공통 스키마 검증 함수 (향후 사용)
function validateReportDataV2(data) {
  try {
    // 공통 스키마 사용 (워크스페이스 설정 후)
    // const result = ReportSchema.parse(data);
    // return { isValid: true, data: result, errors: null };
    
    // 임시로 기존 검증 사용
    return validateReportData(data);
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
}

// 에러 메시지 한글화
function getKoreanErrorMessage(field, code) {
  const errorMessages = {
    'projectName': {
      'too_small': '프로젝트명을 입력해주세요',
      'too_big': '프로젝트명이 너무 깁니다 (200자 이하)'
    },
    'projectLocation': {
      'too_small': '프로젝트 위치를 입력해주세요'
    },
    'inspector': {
      'too_small': '지도자명을 입력해주세요'
    },
    'findings': {
      'too_small': '최소 1개 이상의 발견사항이 필요합니다'
    },
    'recommendations': {
      'too_small': '최소 1개 이상의 권고사항이 필요합니다'
    },
    'guidanceDate': {
      'invalid_string': '올바른 날짜 형식이 아닙니다'
    },
    'contactPhone': {
      'invalid_string': '올바른 전화번호 형식이 아닙니다'
    },
    'contactEmail': {
      'invalid_string': '올바른 이메일 형식이 아닙니다'
    }
  };
  
  return errorMessages[field]?.[code] || '입력값이 올바르지 않습니다';
}

module.exports = {
  validateReportData,
  validateReportDataV2,
  validateReportPatch,
  getKoreanErrorMessage,
  ReportSchema,
  ReportPatchSchema
};
