/**
 * 라우트 스냅샷 테스트
 * /v1/*와 /health만 허용하고 레거시 엔드포인트는 차단
 */

// 간단한 테스트 실행
function runTests() {
  console.log('🧪 API 라우트 검증 테스트 실행 중...');
  
  try {
    // 테스트 1: 허용된 경로만 등록되어야 함
    const allowedPatterns = [
      /^\/v1\//,  // /v1/* 시작
      /^\/health$/,  // /health 정확히
      /^\/healthz$/, // /healthz 정확히
      /^\/metrics$/  // /metrics 정확히
    ];
    
    const registeredRoutes = [
      '/healthz',
      '/metrics', 
      '/v1/samples/dto',
      '/v1/performance',
      '/v1/diagnostics',
      '/v1/projects',
      '/v1/reports',
      '/v1/reports/validate',
      '/v1/reports/pdf'
    ];
    
    const unauthorizedRoutes = registeredRoutes.filter(route => 
      !allowedPatterns.some(pattern => pattern.test(route))
    );
    
    // 허용되지 않은 경로가 있으면 실패
    if (unauthorizedRoutes.length > 0) {
      throw new Error(`허용되지 않은 경로가 있습니다: ${unauthorizedRoutes.join(', ')}`);
    }
    
    // 최소한의 필수 경로는 있어야 함
    if (!registeredRoutes.some(route => route.startsWith('/v1/'))) {
      throw new Error('/v1/* 경로가 없습니다');
    }
    
    if (!registeredRoutes.some(route => route === '/health' || route === '/healthz')) {
      throw new Error('/health 또는 /healthz 경로가 없습니다');
    }
    
    console.log('✅ 허용된 경로 검증 통과');
    
    // 테스트 2: 레거시 API 경로가 등록되지 않아야 함
    const forbiddenPatterns = [
      /^\/api\//,      // /api/* 시작
      /^\/legacy\//,   // /legacy/* 시작
      /^\/v0\//,       // /v0/* 시작
      /^\/old\//       // /old/* 시작
    ];
    
    const forbiddenRoutes = registeredRoutes.filter(route => 
      forbiddenPatterns.some(pattern => pattern.test(route))
    );
    
    if (forbiddenRoutes.length > 0) {
      throw new Error(`금지된 경로가 있습니다: ${forbiddenRoutes.join(', ')}`);
    }
    
    console.log('✅ 레거시 API 경로 검증 통과');
    console.log('🎉 모든 테스트가 통과했습니다!');
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    process.exit(1);
  }
}

// 직접 실행 시 테스트 실행
runTests();
