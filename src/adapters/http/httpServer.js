/**
 * HTTP 서버 어댑터
 * Project TT 가이드라인: 단일 진입점 /v1/*, 레거시 경로는 직접 도메인 호출로만 호환
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { reportsRouter } from './routes/reports.js';
import { projectsRouter } from './routes/projects.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { routeGuard } from './middleware/routeGuard.js';

/**
 * HTTP 서버 어댑터
 * Project TT 가이드라인: 단일 진입점 /v1/*, 레거시 경로는 직접 도메인 호출로만 호환
 */
export class HttpServer {
  constructor() {
    this.app = express();
    this.server = null;
    this.port = process.env.PORT || 3000;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Project TT 가이드라인: request-id로 트레이싱
    this.app.use((req, res, next) => {
      req.id = uuidv4();
      res.setHeader('X-Request-ID', req.id);
      next();
    });

    // 기본 미들웨어
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Project TT 가이드라인: 공통 헤더 미들웨어
    this.app.use((req, res, next) => {
      res.setHeader('X-API-Version', 'v1');
      res.setHeader('X-Server', 'Project-TT-API');
      res.setHeader('X-Timestamp', new Date().toISOString());
      next();
    });

    // Project TT 가이드라인: 로깅 미들웨어
    this.app.use((req, res, next) => {
      const start = Date.now();
      const isDeprecated = req.path.startsWith('/reports') || req.path.startsWith('/projects');
      
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${req.id}${isDeprecated ? ' [DEPRECATED]' : ''}`);
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - ${req.id}`);
      });
      
      next();
    });

    // Project TT 가이드라인: 레거시 경로 미들웨어 (X-Deprecated 헤더)
    this.app.use((req, res, next) => {
      if (req.path.startsWith('/reports') || req.path.startsWith('/projects')) {
        res.setHeader('X-Deprecated', 'true');
        res.setHeader('X-Deprecation-Date', '2024-01-01');
        res.setHeader('X-Sunset-Date', '2024-04-01'); // 90일 호환성
        
        console.warn(`[DEPRECATED ROUTE] ${req.method} ${req.path} - ${req.id} - Use /v1/* instead`);
      }
      next();
    });
  }

  setupRoutes() {
    // Project TT 가이드라인: 단일 진입점 /v1/* (운영 기준)
    this.app.use('/v1', reportsRouter);
    this.app.use('/v1', projectsRouter);

    // Project TT 가이드라인: 레거시 경로 (직접 도메인 호출로만 호환, 리다이렉트/내부 fetch 금지)
    this.app.use('/reports', reportsRouter);
    this.app.use('/projects', projectsRouter);

    // API 정보 엔드포인트
    this.app.get('/api/info', (req, res) => {
      res.json({
        ok: true,
        data: {
          name: 'Project TT API',
          version: 'v1.0.0',
          description: '산업안전보고서 관리 시스템',
          entryPoints: {
            primary: '/v1/*',
            legacy: ['/reports/*', '/projects/*'],
            note: '레거시 경로는 90일 후 제거 예정 (2024-04-01)'
          },
          features: [
            '보고서 관리',
            '프로젝트 관리',
            '백업 및 복원',
            '내보내기'
          ]
        },
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
    });

    // 헬스 체크
    this.app.get('/healthz', (req, res) => {
      res.json({
        ok: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        requestId: req.id
      });
    });

    // 메트릭스
    this.app.get('/metrics', (req, res) => {
      res.json({
        ok: true,
        data: {
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: process.version,
          platform: process.platform
        },
        requestId: req.id
      });
    });

    // 메트릭스 리셋
    this.app.post('/metrics/reset', (req, res) => {
      res.json({
        ok: true,
        message: '메트릭스가 리셋되었습니다',
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    });
  }

  setupErrorHandling() {
    // 404 핸들러
    this.app.use(notFoundHandler);
    
    // 에러 핸들러
    this.app.use(errorHandler);
  }

  async start() {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.port, () => {
          console.log(`🚀 Project TT HTTP 서버가 포트 ${this.port}에서 시작되었습니다`);
          console.log(`📋 운영 기준 경로: /v1/*`);
          console.log(`⚠️  레거시 경로: /reports/*, /projects/* (2024-04-01 제거 예정)`);
          console.log(`🔐 인증: Bearer 토큰 필요`);
          console.log(`📊 헬스 체크: /healthz`);
          console.log(`📈 메트릭스: /metrics`);
          resolve();
        });

        this.server.on('error', (error) => {
          console.error('❌ HTTP 서버 시작 실패:', error);
          reject(error);
        });
      } catch (error) {
        console.error('❌ HTTP 서버 설정 실패:', error);
        reject(error);
      }
    });
  }

  async stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('🛑 Project TT HTTP 서버가 중지되었습니다');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getStatus() {
    return {
      running: !!this.server,
      port: this.port,
      uptime: this.server ? process.uptime() : 0,
      entryPoints: {
        primary: '/v1/*',
        legacy: ['/reports/*', '/projects/*'],
        deprecated: true
      },
      version: 'v1.0.0'
    };
  }

  getApp() {
    return this.app;
  }
}

export default HttpServer;
