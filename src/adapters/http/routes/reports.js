/**
 * 보고서 API 라우트
 * Project TT 가이드라인: withPipeline 사용, 도메인 함수 직접 호출 (내부 fetch 금지)
 */

import { Router } from 'express';
import { withPipeline, withReadPipeline, withSimplePipeline } from '../middleware/pipeline.js';
import { 
  reportCreateSchema, 
  reportQuerySchema, 
  reportUpdateSchema, 
  reportDeleteSchema,
  reportSearchSchema,
  reportExportSchema
} from '../../../core/schemas/report.js';
import { 
  createReport, 
  getReport, 
  getReports, 
  updateReport, 
  deleteReport, 
  searchReports,
  exportReports
} from '../../../core/reports.js';

export const router = Router();

// 보고서 생성 (201 Created)
router.post('/v1/reports', withPipeline({
  normalize: (req) => ({ 
    body: req.body, 
    userId: req.user?.id,
    query: req.query // projectId 확인
  }),
  validate: (input) => reportCreateSchema.safeParse(input),
  execute: async (input) => {
    // ✅ Project TT 가이드라인: projectId를 options에 포함하여 전달
    const result = await createReport(input.body, { 
      userId: input.userId,
      projectId: input.body.projectId || input.query?.projectId
    });
    // Project TT 가이드라인: 생성은 201 상태코드
    return { status: 201, data: result, message: result.message };
  }
}));

// 보고서 목록 조회 (200 OK)
router.get('/v1/reports', withReadPipeline({
  normalize: (req) => ({ 
    query: req.query,
    userId: req.user?.id 
  }),
  validate: (input) => reportQuerySchema.safeParse(input),
  execute: async (input) => {
    const result = await getReports(input.query);
    return { status: 200, data: result };
  }
}));

// 특정 보고서 조회 (200 OK)
router.get('/v1/reports/:reportId', withReadPipeline({
  normalize: (req) => ({ 
    params: req.params,
    userId: req.user?.id 
  }),
  validate: (input) => {
    if (!input.params.reportId) {
      return { success: false, error: { message: '보고서 ID는 필수입니다' } };
    }
    return { success: true, data: input };
  },
  execute: async (input) => {
    // reportId에서 projectId 추출 (임시 로직)
    const projectId = input.params.reportId.split('_')[2] || 'unknown';
    const result = await getReport(input.params.reportId, projectId);
    return { status: 200, data: result };
  }
}));

// 보고서 업데이트 (200 OK)
router.put('/v1/reports/:reportId', withPipeline({
  normalize: (req) => ({ 
    body: req.body, 
    params: req.params,
    userId: req.user?.id 
  }),
  validate: (input) => reportUpdateSchema.safeParse(input),
  execute: async (input) => {
    const result = await updateReport(input.params.reportId, input.body, { userId: input.userId });
    return { status: 200, data: result, message: '보고서가 성공적으로 업데이트되었습니다' };
  }
}));

// 보고서 삭제 (204 No Content)
router.delete('/v1/reports/:reportId', withPipeline({
  normalize: (req) => ({ 
    params: req.params,
    userId: req.user?.id 
  }),
  validate: (input) => reportDeleteSchema.safeParse(input),
  execute: async (input) => {
    // reportId에서 projectId 추출 (임시 로직)
    const projectId = input.params.reportId.split('_')[2] || 'unknown';
    const result = await deleteReport(input.params.reportId, projectId);
    // Project TT 가이드라인: 삭제는 204 상태코드
    return { status: 204, data: undefined, message: result.message };
  }
}));

// 보고서 검색 (200 OK)
router.get('/v1/reports/search', withReadPipeline({
  normalize: (req) => ({ 
    query: req.query,
    userId: req.user?.id 
  }),
  validate: (input) => reportSearchSchema.safeParse(input),
  execute: async (input) => {
    const { q, ...filters } = input.query;
    const result = await searchReports(q, filters);
    return { status: 200, data: result };
  }
}));

// 보고서 내보내기 (200 OK)
router.post('/v1/reports/export', withPipeline({
  normalize: (req) => ({ 
    body: req.body,
    userId: req.user?.id 
  }),
  validate: (input) => reportExportSchema.safeParse(input),
  execute: async (input) => {
    const { reportIds, format, ...options } = input.body;
    const result = await exportReports(reportIds, format, options);
    return { status: 200, data: result, message: '보고서 내보내기가 완료되었습니다' };
  }
}));

// 보고서 데이터 검증 (200 OK)
router.post('/v1/reports/validate', withSimplePipeline({
  normalize: (req) => ({ 
    body: req.body,
    userId: req.user?.id 
  }),
  execute: async (input) => {
    const validationResult = reportCreateSchema.safeParse(input);
    if (!validationResult.success) {
      return {
        status: 200,
        data: {
          valid: false,
          errors: validationResult.error.format ? validationResult.error.format() : validationResult.error
        }
      };
    }
    return {
      status: 200,
      data: {
        valid: true,
        data: validationResult.data
      }
    };
  }
}));

export default router;
