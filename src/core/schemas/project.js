import { z } from 'zod';

/**
 * 프로젝트 생성 스키마
 */
export const projectCreateSchema = z.object({
  body: z.object({
    name: z.string().min(1, '프로젝트명은 필수입니다').max(100, '프로젝트명은 100자 이하여야 합니다'),
    description: z.string().max(500, '설명은 500자 이하여야 합니다').optional(),
    location: z.string().min(1, '위치는 필수입니다').max(200, '위치는 200자 이하여야 합니다'),
    client: z.string().min(1, '클라이언트명은 필수입니다').max(100, '클라이언트명은 100자 이하여야 합니다'),
    startDate: z.string().datetime('시작일은 유효한 날짜여야 합니다').optional(),
    endDate: z.string().datetime('종료일은 유효한 날짜여야 합니다').optional(),
    status: z.enum(['active', 'completed', 'suspended', 'cancelled']).default('active'),
    type: z.enum(['construction', 'manufacturing', 'maintenance', 'inspection', 'other']).default('construction'),
    safetyManager: z.string().min(1, '안전관리자명은 필수입니다').max(50, '안전관리자명은 50자 이하여야 합니다'),
    contactInfo: z.object({
      phone: z.string().max(20).optional(),
      email: z.string().email('유효한 이메일 주소여야 합니다').optional(),
      address: z.string().max(200).optional(),
    }).optional(),
    budget: z.number().positive('예산은 양수여야 합니다').optional(),
    workers: z.number().int().min(0, '작업자 수는 0 이상이어야 합니다').optional(),
    riskLevel: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  }),
  
  userId: z.string().optional(),
});

/**
 * 프로젝트 조회 스키마
 */
export const projectQuerySchema = z.object({
  query: z.object({
    status: z.enum(['active', 'completed', 'suspended', 'cancelled']).optional(),
    type: z.enum(['construction', 'manufacturing', 'maintenance', 'inspection', 'other']).optional(),
    location: z.string().optional(),
    client: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    page: z.number().int().min(1).optional(),
    limit: z.number().int().min(1).max(100).optional(),
    sortBy: z.enum(['name', 'startDate', 'endDate', 'created_at', 'updated_at']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

/**
 * 프로젝트 업데이트 스키마
 */
export const projectUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    location: z.string().min(1).max(200).optional(),
    client: z.string().min(1).max(100).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    status: z.enum(['active', 'completed', 'suspended', 'cancelled']).optional(),
    type: z.enum(['construction', 'manufacturing', 'maintenance', 'inspection', 'other']).optional(),
    safetyManager: z.string().min(1).max(50).optional(),
    contactInfo: z.object({
      phone: z.string().max(20).optional(),
      email: z.string().email().optional(),
      address: z.string().max(200).optional(),
    }).optional(),
    budget: z.number().positive().optional(),
    workers: z.number().int().min(0).optional(),
    riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  }),
  
  params: z.object({
    projectId: z.string().min(1, '프로젝트 ID는 필수입니다'),
  }),
  
  userId: z.string().optional(),
});

/**
 * 프로젝트 삭제 스키마
 */
export const projectDeleteSchema = z.object({
  params: z.object({
    projectId: z.string().min(1, '프로젝트 ID는 필수입니다'),
  }),
  
  userId: z.string().optional(),
});

/**
 * 프로젝트 검색 스키마
 */
export const projectSearchSchema = z.object({
  query: z.object({
    q: z.string().min(1, '검색어는 필수입니다').max(100, '검색어는 100자 이하여야 합니다'),
    status: z.enum(['active', 'completed', 'suspended', 'cancelled']).optional(),
    type: z.enum(['construction', 'manufacturing', 'maintenance', 'inspection', 'other']).optional(),
    riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    page: z.number().int().min(1).optional(),
    limit: z.number().int().min(1).max(100).optional(),
  }),
});

/**
 * 프로젝트 백업 스키마
 */
export const projectBackupSchema = z.object({
  body: z.object({
    includeReports: z.boolean().default(true),
    includeAttachments: z.boolean().default(false),
    backupName: z.string().max(100).optional(),
    description: z.string().max(500).optional(),
  }),
  
  params: z.object({
    projectId: z.string().min(1, '프로젝트 ID는 필수입니다'),
  }),
  
  userId: z.string().optional(),
});

/**
 * 프로젝트 복원 스키마
 */
export const projectRestoreSchema = z.object({
  body: z.object({
    backupId: z.string().min(1, '백업 ID는 필수입니다'),
    overwrite: z.boolean().default(false),
    restoreReports: z.boolean().default(true),
    restoreAttachments: z.boolean().default(false),
  }),
  
  params: z.object({
    projectId: z.string().min(1, '프로젝트 ID는 필수입니다'),
  }),
  
  userId: z.string().optional(),
});

/**
 * 프로젝트 내보내기 스키마
 */
export const projectExportSchema = z.object({
  body: z.object({
    format: z.enum(['zip', 'json', 'csv', 'pdf']).default('zip'),
    includeReports: z.boolean().default(true),
    includeAttachments: z.boolean().default(false),
    includeBackups: z.boolean().default(false),
    template: z.string().optional(),
  }),
  
  params: z.object({
    projectId: z.string().min(1, '프로젝트 ID는 필수입니다'),
  }),
  
  userId: z.string().optional(),
});

/**
 * 프로젝트 통계 조회 스키마
 */
export const projectStatsSchema = z.object({
  query: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    groupBy: z.enum(['day', 'week', 'month', 'quarter', 'year']).default('month'),
    includeCharts: z.boolean().default(true),
  }),
  
  params: z.object({
    projectId: z.string().min(1, '프로젝트 ID는 필수입니다'),
  }),
});
