/**
 * 프로젝트 API 라우트
 * Project TT 가이드라인: withPipeline 사용, 도메인 함수 직접 호출 (내부 fetch 금지)
 */

import { Router } from 'express';
import { withPipeline, withReadPipeline, withSimplePipeline } from '../middleware/pipeline.js';
import { 
  projectCreateSchema, 
  projectQuerySchema, 
  projectUpdateSchema, 
  projectDeleteSchema,
  projectSearchSchema,
  projectBackupSchema,
  projectRestoreSchema,
  projectExportSchema,
  projectStatsSchema
} from '../../../core/schemas/project.js';
import { 
  createProject, 
  getProject, 
  getProjects, 
  updateProject, 
  deleteProject, 
  searchProjects,
  backupProject,
  restoreProject,
  getProjectStats
} from '../../../core/projects.js';

export const router = Router();

// 프로젝트 생성 (201 Created)
router.post('/v1/projects', withPipeline({
  normalize: (req) => ({ 
    body: req.body, 
    userId: req.user?.id 
  }),
  validate: (input) => projectCreateSchema.safeParse(input),
  execute: async (input) => {
    const result = await createProject(input.body, { userId: input.userId });
    // Project TT 가이드라인: 생성은 201 상태코드
    return { status: 201, data: result, message: result.message };
  }
}));

// 프로젝트 목록 조회 (200 OK)
router.get('/v1/projects', withReadPipeline({
  normalize: (req) => ({ 
    query: req.query,
    userId: req.user?.id 
  }),
  validate: (input) => projectQuerySchema.safeParse(input),
  execute: async (input) => {
    const result = await getProjects(input.query);
    return { status: 200, data: result };
  }
}));

// 특정 프로젝트 조회 (200 OK)
router.get('/v1/projects/:projectId', withReadPipeline({
  normalize: (req) => ({ 
    params: req.params,
    userId: req.user?.id 
  }),
  validate: (input) => {
    if (!input.params.projectId) {
      return { success: false, error: { message: '프로젝트 ID는 필수입니다' } };
    }
    return { success: true, data: input };
  },
  execute: async (input) => {
    const result = await getProject(input.params.projectId);
    return { status: 200, data: result };
  }
}));

// 프로젝트 업데이트 (200 OK)
router.put('/v1/projects/:projectId', withPipeline({
  normalize: (req) => ({ 
    body: req.body, 
    params: req.params,
    userId: req.user?.id 
  }),
  validate: (input) => projectUpdateSchema.safeParse(input),
  execute: async (input) => {
    const result = await updateProject(input.params.projectId, input.body, { userId: input.userId });
    return { status: 200, data: result, message: '프로젝트가 성공적으로 업데이트되었습니다' };
  }
}));

// 프로젝트 삭제 (204 No Content)
router.delete('/v1/projects/:projectId', withPipeline({
  normalize: (req) => ({ 
    params: req.params,
    userId: req.user?.id 
  }),
  validate: (input) => projectDeleteSchema.safeParse(input),
  execute: async (input) => {
    const result = await deleteProject(input.params.projectId);
    // Project TT 가이드라인: 삭제는 204 상태코드
    return { status: 204, data: undefined, message: result.message };
  }
}));

// 프로젝트 검색 (200 OK)
router.get('/v1/projects/search', withReadPipeline({
  normalize: (req) => ({ 
    query: req.query,
    userId: req.user?.id 
  }),
  validate: (input) => projectSearchSchema.safeParse(input),
  execute: async (input) => {
    const { q, ...filters } = input.query;
    const result = await searchProjects(q, filters);
    return { status: 200, data: result };
  }
}));

// 프로젝트 백업 (200 OK)
router.post('/v1/projects/:projectId/backup', withPipeline({
  normalize: (req) => ({ 
    body: req.body, 
    params: req.params,
    userId: req.user?.id 
  }),
  validate: (input) => projectBackupSchema.safeParse(input),
  execute: async (input) => {
    const result = await backupProject(input.params.projectId, input.body);
    return { status: 200, data: result, message: '프로젝트 백업이 완료되었습니다' };
  }
}));

// 프로젝트 복원 (200 OK)
router.post('/v1/projects/:projectId/restore', withPipeline({
  normalize: (req) => ({ 
    body: req.body, 
    params: req.params,
    userId: req.user?.id 
  }),
  validate: (input) => projectRestoreSchema.safeParse(input),
  execute: async (input) => {
    const result = await restoreProject(input.params.projectId, input.body.backupId, input.body);
    return { status: 200, data: result, message: '프로젝트 복원이 완료되었습니다' };
  }
}));

// 프로젝트 통계 조회 (200 OK)
router.get('/v1/projects/:projectId/stats', withReadPipeline({
  normalize: (req) => ({ 
    query: req.query,
    params: req.params,
    userId: req.user?.id 
  }),
  validate: (input) => projectStatsSchema.safeParse(input),
  execute: async (input) => {
    const result = await getProjectStats(input.params.projectId, input.query);
    return { status: 200, data: result };
  }
}));

// 프로젝트 내보내기 (구현 예정) (200 OK)
router.post('/v1/projects/:projectId/export', withPipeline({
  normalize: (req) => ({ 
    body: req.body, 
    params: req.params,
    userId: req.user?.id 
  }),
  validate: (input) => projectExportSchema.safeParse(input),
  execute: async (input) => {
    // TODO: 프로젝트 내보내기 기능 구현
    throw new Error('프로젝트 내보내기 기능은 아직 구현되지 않았습니다');
  }
}));

// 프로젝트의 보고서 목록 조회 (200 OK)
router.get('/v1/projects/:projectId/reports', withReadPipeline({
  normalize: (req) => ({ 
    query: req.query,
    params: req.params,
    userId: req.user?.id 
  }),
  validate: (input) => {
    if (!input.params.projectId) {
      return { success: false, error: { message: '프로젝트 ID는 필수입니다' } };
    }
    return { success: true, data: input };
  },
  execute: async (input) => {
    // 도메인 함수 직접 호출 (내부 fetch 금지)
    const { getReports } = await import('../../../core/reports.js');
    const result = await getReports({ 
      projectId: input.params.projectId,
      ...input.query
    });
    return { status: 200, data: result };
  }
}));

// 프로젝트의 특정 보고서 조회 (200 OK)
router.get('/v1/projects/:projectId/reports/:reportId', withReadPipeline({
  normalize: (req) => ({ 
    params: req.params,
    userId: req.user?.id 
  }),
  validate: (input) => {
    if (!input.params.projectId || !input.params.reportId) {
      return { success: false, error: { message: '프로젝트 ID와 보고서 ID는 필수입니다' } };
    }
    return { success: true, data: input };
  },
  execute: async (input) => {
    // 도메인 함수 직접 호출 (내부 fetch 금지)
    const { getReport } = await import('../../../core/reports.js');
    const result = await getReport(input.params.reportId, input.params.projectId);
    return { status: 200, data: result };
  }
}));

export default router;
