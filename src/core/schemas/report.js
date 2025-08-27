import { z } from 'zod';

/**
 * 보고서 생성 스키마
 */
export const reportCreateSchema = z.object({
  body: z.object({
    // 기본 정보
    title: z.string().min(1, '제목은 필수입니다').max(200, '제목은 200자 이하여야 합니다'),
    projectId: z.string().optional(),
    projectName: z.string().min(1, '프로젝트명은 필수입니다').max(100, '프로젝트명은 100자 이하여야 합니다'),
    
    // 방문 정보
    visit: z.object({
      date: z.string().datetime().optional(),
      round: z.number().int().min(1).optional(),
      inspector: z.string().min(1, '점검자명은 필수입니다').max(50, '점검자명은 50자 이하여야 합니다'),
      weather: z.string().optional(),
      temperature: z.number().min(-50).max(100).optional(),
    }).optional(),
    
    // 현장 정보
    site: z.object({
      name: z.string().min(1, '현장명은 필수입니다').max(100, '현장명은 100자 이하여야 합니다'),
      address: z.string().min(1, '주소는 필수입니다').max(200, '주소는 200자 이하여야 합니다'),
      type: z.enum(['construction', 'manufacturing', 'maintenance', 'other']).optional(),
      area: z.number().positive().optional(),
      workers: z.number().int().min(0).optional(),
    }).optional(),
    
    // 조직 정보
    org: z.object({
      name: z.string().min(1, '업체명은 필수입니다').max(100, '업체명은 100자 이하여야 합니다'),
      representative: z.string().optional(),
      safetyManager: z.string().optional(),
      contact: z.string().optional(),
    }).optional(),
    
    // 점검 결과
    findings: z.array(z.object({
      category: z.string().min(1, '카테고리는 필수입니다'),
      description: z.string().min(1, '설명은 필수입니다'),
      severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      action: z.string().optional(),
      deadline: z.string().datetime().optional(),
    })).optional(),
    
    // 사고 정보 (사고보고서인 경우)
    incidents: z.array(z.object({
      date: z.string().datetime().optional(),
      type: z.string().min(1, '사고 유형은 필수입니다'),
      description: z.string().min(1, '사고 설명은 필수입니다'),
      severity: z.enum(['minor', 'moderate', 'major', 'fatal']).optional(),
      injuries: z.number().int().min(0).optional(),
      damages: z.string().optional(),
    })).optional(),
    
    // 특이사항
    specificObservations: z.string().optional(),
    
    // 개선사항
    improvements: z.array(z.object({
      description: z.string().min(1, '개선사항 설명은 필수입니다'),
      priority: z.enum(['low', 'medium', 'high']).optional(),
      responsible: z.string().optional(),
      deadline: z.string().datetime().optional(),
    })).optional(),
    
    // 첨부파일
    attachments: z.array(z.object({
      name: z.string().min(1, '파일명은 필수입니다'),
      type: z.string().optional(),
      size: z.number().positive().optional(),
      url: z.string().url().optional(),
    })).optional(),
  }),
  
  // 사용자 정보 (인증된 경우)
  userId: z.string().optional(),
});

/**
 * 보고서 조회 스키마
 */
export const reportQuerySchema = z.object({
  query: z.object({
    projectId: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    type: z.string().optional(),
    status: z.enum(['draft', 'completed', 'submitted']).optional(),
    page: z.number().int().min(1).optional(),
    limit: z.number().int().min(1).max(100).optional(),
    sortBy: z.enum(['created_at', 'updated_at', 'title', 'projectName']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

/**
 * 보고서 업데이트 스키마
 */
export const reportUpdateSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    projectName: z.string().min(1).max(100).optional(),
    visit: z.object({
      date: z.string().datetime().optional(),
      round: z.number().int().min(1).optional(),
      inspector: z.string().min(1).max(50).optional(),
      weather: z.string().optional(),
      temperature: z.number().min(-50).max(100).optional(),
    }).optional(),
    site: z.object({
      name: z.string().min(1).max(100).optional(),
      address: z.string().min(1).max(200).optional(),
      type: z.enum(['construction', 'manufacturing', 'maintenance', 'other']).optional(),
      area: z.number().positive().optional(),
      workers: z.number().int().min(0).optional(),
    }).optional(),
    org: z.object({
      name: z.string().min(1).max(100).optional(),
      representative: z.string().optional(),
      safetyManager: z.string().optional(),
      contact: z.string().optional(),
    }).optional(),
    findings: z.array(z.object({
      category: z.string().min(1),
      description: z.string().min(1),
      severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      action: z.string().optional(),
      deadline: z.string().datetime().optional(),
    })).optional(),
    incidents: z.array(z.object({
      date: z.string().datetime().optional(),
      type: z.string().min(1),
      description: z.string().min(1),
      severity: z.enum(['minor', 'moderate', 'major', 'fatal']).optional(),
      injuries: z.number().int().min(0).optional(),
      damages: z.string().optional(),
    })).optional(),
    specificObservations: z.string().optional(),
    improvements: z.array(z.object({
      description: z.string().min(1),
      priority: z.enum(['low', 'medium', 'high']).optional(),
      responsible: z.string().optional(),
      deadline: z.string().datetime().optional(),
    })).optional(),
    attachments: z.array(z.object({
      name: z.string().min(1),
      type: z.string().optional(),
      size: z.number().positive().optional(),
      url: z.string().url().optional(),
    })).optional(),
  }),
  
  params: z.object({
    reportId: z.string().min(1, '보고서 ID는 필수입니다'),
  }),
  
  userId: z.string().optional(),
});

/**
 * 보고서 삭제 스키마
 */
export const reportDeleteSchema = z.object({
  params: z.object({
    reportId: z.string().min(1, '보고서 ID는 필수입니다'),
  }),
  
  userId: z.string().optional(),
});

/**
 * 보고서 검색 스키마
 */
export const reportSearchSchema = z.object({
  query: z.object({
    q: z.string().min(1, '검색어는 필수입니다').max(100, '검색어는 100자 이하여야 합니다'),
    projectId: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    type: z.string().optional(),
    page: z.number().int().min(1).optional(),
    limit: z.number().int().min(1).max(100).optional(),
  }),
});

/**
 * 보고서 내보내기 스키마
 */
export const reportExportSchema = z.object({
  body: z.object({
    reportIds: z.array(z.string().min(1)).min(1, '최소 하나의 보고서 ID가 필요합니다'),
    format: z.enum(['pdf', 'excel', 'csv', 'json']).default('pdf'),
    includeAttachments: z.boolean().default(false),
    template: z.string().optional(),
  }),
  
  userId: z.string().optional(),
});
