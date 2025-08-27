/**
 * 라우트 가드 미들웨어
 * /v1/*와 /health만 허용하고 나머지는 410 Gone 반환
 */

const ALLOW_PREFIX = ['/v1/', '/health', '/downloads/'];

export function routeGuard(req, res, next) {
  const path = req.path.endsWith('/') ? req.path : req.path + '/';
  
  // 허용된 경로인지 확인
  if (ALLOW_PREFIX.some(pref => path.startsWith(pref))) {
    return next();
  }
  
  // 레거시 엔드포인트에 대한 410 Gone 응답
  res.setHeader('X-Deprecated', 'true; retirement=2025-09-30');
  return res.status(410).json({
    ok: false,
    code: 'LEGACY_ENDPOINT_RETIRED',
    message: '이 엔드포인트는 더 이상 사용되지 않습니다. /v1/* API를 사용해주세요.',
    details: { 
      path: req.path,
      allowed: ['/v1/*', '/health'],
      migration: 'https://docs.example.com/migration-guide'
    }
  });
}

export default routeGuard;
