// web_server.js - 안전보고서 에이전트 웹앱 (UI 전용)
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

// ES 모듈에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ MCP 서버 API 래퍼를 불러와 인스턴스 생성 및 초기화
let mcpReady = false;

async function initializeMCP() {
  try {
    console.log('🔧 MCP 서버 초기화 시작...');
    const module = await import('./adapters/mcp/mcp_server.js');
    const { SafetyReportMCPAPIWrapper } = module;
    global.mcp = new SafetyReportMCPAPIWrapper();
    // MCP 서버는 stdio 모드로 실행되므로 별도 초기화 불필요
    mcpReady = true;
    console.log('✅ MCP 서버 초기화 완료');
  } catch (error) {
    console.error('❌ MCP 서버 초기화 실패:', error);
    // MCP 초기화 실패 시에도 서버는 시작하되 경고 표시
    mcpReady = false;
  }
}

// MCP 초기화 시작
initializeMCP();

const app = express();

const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 🚨 모든 요청에 로그 추가 (디버깅용) - /v1 경로는 제외
app.use((req, res, next) => {
  if (!req.originalUrl.startsWith('/v1')) {
    console.log(`🔍 일반 요청 로그: ${req.method} ${req.originalUrl}`);
  }
  next();
});

// 🚨 프록시 미들웨어 제거 - projectRouter만 사용
console.log('🔧 프록시 미들웨어 비활성화됨 - projectRouter만 사용');

// ✅ 프로젝트 API 라우터 추가 (프록시보다 뒤에 둠)
import projectRouter from './server/project_api.js';
console.log('🔧 projectRouter 등록 시작...');
app.use('/v1', projectRouter);
console.log('✅ projectRouter 등록 완료');

// ✅ 정적 파일 서빙 설정 (dist 폴더)
app.use('/assets', express.static(path.join(__dirname, 'dist', 'assets'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    } else if (filePath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    }
  }
}));

// ✅ dist 폴더 전체를 정적 파일로 서빙
app.use(express.static(path.join(__dirname, 'dist'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    } else if (filePath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    }
  }
}));

// ✅ 웹앱용 보고서 생성 API: POST /web/v1/reports?output=pdf|html
// 내부적으로 core 서비스를 직접 호출 (router → router 금지)
app.post('/web/v1/reports', async (req, res) => {
  try {
    const { output = 'pdf', ...reportData } = req.body;
    
    if (!reportData || Object.keys(reportData).length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: '보고서 데이터를 입력해주세요.' 
      });
    }

    console.log('web/v1/reports 엔드포인트 호출됨:', { output, reportData });

    // ✅ 도메인 함수 직접 호출 (router → router 금지)
    try {
      const { UnifiedReportService } = await import('./core/unified_report_service.js');
      
      if (output === 'html') {
        // HTML 생성
        const html = await UnifiedReportService.generateHTML(reportData);
        res.json({
          success: true,
          message: 'HTML이 성공적으로 생성되었습니다.',
          data: {
            html: html,
            output: 'html',
            timestamp: new Date().toISOString()
          }
        });
      } else {
        // PDF 생성
        const pdfResult = await UnifiedReportService.generatePDF(reportData, {
          outputDir: 'downloads',
          basename: '안전보고서',
          visitRound: reportData.visit?.round || 1,
          projectName: reportData.projectName || '미지정프로젝트'
        });
        
        if (!pdfResult.success) {
          return res.status(500).json({
            success: false,
            error: pdfResult.error
          });
        }
        
        res.json({
          success: true,
          message: 'PDF가 성공적으로 생성되었습니다.',
          data: {
            output: 'pdf',
            filename: pdfResult.filename,
            download_url: pdfResult.url,
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (serviceError) {
      console.error('서비스 호출 오류:', serviceError);
      return res.status(500).json({
        success: false,
        error: '보고서 생성 서비스 오류: ' + serviceError.message
      });
    }

  } catch (error) {
    console.error('web/v1/reports 오류:', error);
    res.status(500).json({
      success: false,
      error: '보고서 생성 중 오류가 발생했습니다: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ✅ 채팅 API: POST /chat (MCP 통합)
app.post('/chat', async (req, res) => {
  const { conversationId, message, apiKey } = req.body;
  
  if (!message || message.trim() === '') {
    return res.status(400).json({ 
      success: false, 
      error: '메시지를 입력해주세요.' 
    });
  }

  if (!apiKey) {
    return res.status(400).json({
      success: false,
      error: 'OpenAI API 키가 필요합니다.'
    });
  }

  try {
    console.log('채팅 요청 시작:', { conversationId, message: message.substring(0, 100) + '...' });
    
    // ✅ orchestrator의 LLM 프로바이더 사용
    console.log('LLM 프로바이더 로딩 중...');
    const { makeProvider } = await import('./orchestrator/llm/provider.mjs');
    
    console.log('OpenAI 프로바이더 생성 중...');
    const llm = await makeProvider({ 
      provider: 'openai', 
      model: 'gpt-3.5-turbo',
      apiKey: apiKey
    });
    
    console.log('LLM API 호출 시작...');
    const startTime = Date.now();
    
    // 타임아웃 설정 (30초)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('OpenAI API 타임아웃 (30초)')), 30000);
    });
    
    const responsePromise = llm.ask(message);
    const response = await Promise.race([responsePromise, timeoutPromise]);
    
    const duration = Date.now() - startTime;
    console.log(`LLM 응답 완료 (${duration}ms):`, response.substring(0, 100) + '...');
    
    res.json({
      success: true,
      response: response,
      conversationId: conversationId,
      timestamp: new Date().toISOString(),
      duration: duration
    });
    
  } catch (error) {
    console.error('채팅 오류 상세:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    
    res.status(500).json({
      success: false,
      error: '채팅 처리 중 오류가 발생했습니다: ' + error.message,
      details: {
        type: error.name,
        code: error.code
      },
      timestamp: new Date().toISOString()
    });
  }
});

// ✅ 메모리 삭제 API: DELETE /chat/:conversationId/memory
app.delete('/chat/:conversationId/memory', async (req, res) => {
  const { conversationId } = req.params;
  
  try {
    // ✅ 도메인 함수 직접 호출 (router → router 금지)
    if (global.mcp && global.mcp.clearMemory) {
      await global.mcp.clearMemory(conversationId);
    }
    
    console.log(`메모리 삭제 완료: ${conversationId}`);
    
    res.json({
      success: true,
      message: '대화 메모리가 삭제되었습니다.',
      data: {
        conversationId: conversationId,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('메모리 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: '메모리 삭제 중 오류가 발생했습니다: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ✅ 헬스체크 API: GET /healthz
app.get('/healthz', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    mcp: mcpReady ? 'ready' : 'not_ready',
    uptime: process.uptime()
  });
});

// ✅ 루트 경로: 메인 페이지
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ✅ 404 처리: SPA 라우팅을 위해 모든 경로를 index.html로 리다이렉트
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 서버 시작
server.listen(PORT, () => {
  console.log(`🚀 안전보고서 웹앱 서버가 포트 ${PORT}에서 시작되었습니다.`);
  console.log(`📱 웹앱: http://localhost:${PORT}`);
  console.log(`🔧 MCP 상태: ${mcpReady ? '준비됨' : '초기화 중'}`);
  console.log(`🔧 미들웨어 순서: cors → json → /v1 프록시 → /v1 projectRouter → 정적파일 → 웹앱API`);
});

// 프로세스 종료 시 정리
process.on('SIGINT', () => {
  console.log('\n🛑 서버를 종료합니다...');
  server.close(() => {
    console.log('✅ 서버가 정상적으로 종료되었습니다.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 서버를 종료합니다...');
  server.close(() => {
    console.log('✅ 서버가 정상적으로 종료되었습니다.');
    process.exit(0);
  });
});