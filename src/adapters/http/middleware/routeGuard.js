/**
 * 라우트 가드 미들웨어
 * Project TT 가이드라인: 인증/권한을 파이프라인 앞에 붙여 일관화
 */

/**
 * 기본 인증 미들웨어
 * @param {Object} options - 옵션
 * @param {boolean} options.required - 인증 필수 여부 (기본값: true)
 * @param {string[]} options.roles - 허용된 역할 목록
 * @returns {Function} Express 미들웨어 함수
 */
export function requireAuth(options = {}) {
  const { required = true, roles = [] } = options;
  
  return (req, res, next) => {
    try {
      // Project TT 가이드라인: requestId로 트레이싱
      const requestId = req.headers['x-request-id'] || req.id;
      
      // 인증 토큰 확인
      const authHeader = req.headers.authorization;
      if (!authHeader && required) {
        return res.status(401).json({
          ok: false,
          code: 'UNAUTHORIZED',
          message: '인증이 필요합니다',
          requestId,
          timestamp: new Date().toISOString()
        });
      }
      
      if (authHeader) {
        // Bearer 토큰 파싱
        const token = authHeader.replace('Bearer ', '');
        
        // TODO: JWT 토큰 검증 로직 구현
        // const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // req.user = decoded;
        
        // 임시 사용자 정보 (실제로는 JWT에서 추출)
        req.user = {
          id: 'temp-user-id',
          email: 'temp@example.com',
          role: 'user'
        };
        
        // 역할 기반 권한 확인
        if (roles.length > 0 && !roles.includes(req.user.role)) {
          return res.status(403).json({
            ok: false,
            code: 'FORBIDDEN',
            message: '접근 권한이 없습니다',
            requestId,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * 관리자 권한 미들웨어
 */
export const requireAdmin = requireAuth({ required: true, roles: ['admin'] });

/**
 * 사용자 권한 미들웨어
 */
export const requireUser = requireAuth({ required: true, roles: ['user', 'admin'] });

/**
 * 선택적 인증 미들웨어 (인증이 있으면 사용자 정보 설정, 없어도 통과)
 */
export const optionalAuth = requireAuth({ required: false });

/**
 * 프로젝트 소유권 확인 미들웨어
 * @param {string} projectIdParam - 프로젝트 ID 파라미터명 (기본값: 'projectId')
 */
export function requireProjectOwnership(projectIdParam = 'projectId') {
  return async (req, res, next) => {
    try {
      const requestId = req.headers['x-request-id'] || req.id;
      
      if (!req.user) {
        return res.status(401).json({
          ok: false,
          code: 'UNAUTHORIZED',
          message: '인증이 필요합니다',
          requestId,
          timestamp: new Date().toISOString()
        });
      }
      
      const projectId = req.params[projectIdParam];
      if (!projectId) {
        return res.status(400).json({
          ok: false,
          code: 'BAD_REQUEST',
          message: '프로젝트 ID가 필요합니다',
          requestId,
          timestamp: new Date().toISOString()
        });
      }
      
      // TODO: 프로젝트 소유권 확인 로직 구현
      // const project = await getProject(projectId);
      // if (project.userId !== req.user.id && req.user.role !== 'admin') {
      //   return res.status(403).json({
      //     ok: false,
      //     code: 'FORBIDDEN',
      //     message: '해당 프로젝트에 대한 접근 권한이 없습니다',
      //     requestId,
      //     timestamp: new Date().toISOString()
      //   });
      // }
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * 보고서 소유권 확인 미들웨어
 * @param {string} reportIdParam - 보고서 ID 파라미터명 (기본값: 'reportId')
 */
export function requireReportOwnership(reportIdParam = 'reportId') {
  return async (req, res, next) => {
    try {
      const requestId = req.headers['x-request-id'] || req.id;
      
      if (!req.user) {
        return res.status(401).json({
          ok: false,
          code: 'UNAUTHORIZED',
          message: '인증이 필요합니다',
          requestId,
          timestamp: new Date().toISOString()
        });
      }
      
      const reportId = req.params[reportIdParam];
      if (!reportId) {
        return res.status(400).json({
          ok: false,
          code: 'BAD_REQUEST',
          message: '보고서 ID가 필요합니다',
          requestId,
          timestamp: new Date().toISOString()
        });
      }
      
      // TODO: 보고서 소유권 확인 로직 구현
      // const report = await getReport(reportId);
      // if (report.userId !== req.user.id && req.user.role !== 'admin') {
      //   return res.status(403).json({
      //     ok: false,
      //     code: 'FORBIDDEN',
      //     message: '해당 보고서에 대한 접근 권한이 없습니다',
      //     requestId,
      //     timestamp: new Date().toISOString()
      //   });
      // }
      
      next();
    } catch (error) {
      next(error);
    }
  };
}

export default {
  requireAuth,
  requireAdmin,
  requireUser,
  optionalAuth,
  requireProjectOwnership,
  requireReportOwnership
};
