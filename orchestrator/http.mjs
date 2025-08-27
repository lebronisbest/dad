import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { cfg } from './config.mjs';
import { createMCP } from './mcp_client.mjs';
import { makeProvider } from './llm/provider.mjs';
import { runLoop } from './agent/router.mjs';
import { getPromptForTask, getFillReportPrompt } from './agent/planner.mjs';
import { logger } from './util/logger.mjs';

const app = express();
const PORT = process.env.HTTP_PORT || 5057;

// 미들웨어 설정
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// 요청 로깅 미들웨어
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    bodySize: req.body ? JSON.stringify(req.body).length : 0
  });
  next();
});

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 안전보고서 생성 API
app.post('/v1/assistants/safety-report/generate', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { prompt, taskType, options = {} } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        error: 'prompt는 필수입니다',
        example: '강남구 신축아파트 안전점검 보고서 PDF 초안 만들어줘'
      });
    }

    logger.info('API 요청 시작', { 
      prompt: prompt.substring(0, 100) + '...',
      taskType,
      options
    });

    // MCP 클라이언트 생성
    const mcp = await createMCP();
    
    // LLM 프로바이더 생성
    const llm = await makeProvider({ 
      provider: cfg.provider, 
      model: cfg.model,
      temperature: cfg.temperature,
      timeout: cfg.timeoutMs
    });

    // fill_report 도구 사용 시 특별한 프롬프트 적용
    let systemPrompt = null;
    let enhancedPrompt = prompt;
    
    if (prompt.includes('fill_report') || prompt.includes('보고서 생성')) {
      // fill_report 도구 사용 시 더 구체적인 프롬프트 제공
      const sampleData = {
        site: { name: 'ABC제조공장', address: '서울시 강남구 테헤란로 456' },
        org: { name: 'ABC제조공장', inspector: '김안전' },
        visit: { date: '24.08.22(목)', round: '1', round_total: '3' }
      };
      
      systemPrompt = getFillReportPrompt(sampleData);
      enhancedPrompt = `${prompt}\n\n중요: fill_report 도구 사용 시 반드시 site, org, visit 객체를 포함한 완전한 데이터 구조를 전달해야 합니다.`;
      
      logger.info('fill_report 도구 사용 감지 - 특별 프롬프트 적용');
    } else if (taskType && getPromptForTask(taskType)) {
      systemPrompt = getPromptForTask(taskType).system;
    } else {
      // 자동 감지
      if (prompt.includes('안전점검') || prompt.includes('점검')) {
        systemPrompt = getPromptForTask('SAFETY_INSPECTION').system;
      } else if (prompt.includes('사고') || prompt.includes('재해') || prompt.includes('화재')) {
        systemPrompt = getPromptForTask('INCIDENT_ANALYSIS').system;
      } else if (prompt.includes('준수') || prompt.includes('감사') || prompt.includes('규정')) {
        systemPrompt = getPromptForTask('COMPLIANCE_REPORT').system;
      } else {
        systemPrompt = getPromptForTask('SAFETY_REPORT').system;
      }
    }

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: enhancedPrompt });

    // 오케스트레이터 루프 실행
    const result = await runLoop({ 
      llm, 
      mcp, 
      messages, 
      parallel: cfg.parallel,
      maxIterations: options.maxIterations || 5
    });

    const duration = Date.now() - startTime;
    
    // 응답 데이터 구성
    const responseData = {
      success: true,
      duration,
      iterations: result.iterations,
      toolCount: result.tools.length,
      content: result.message.content,
      timestamp: new Date().toISOString()
    };

    // fill_report 도구 사용 시 추가 정보 제공
    if (prompt.includes('fill_report') || prompt.includes('보고서 생성')) {
      responseData.tips = {
        requiredFields: ['site.name', 'site.address', 'org.name', 'org.inspector', 'visit.date', 'visit.round', 'visit.round_total'],
        dataStructure: '중첩된 객체 구조로 전달해야 합니다',
        warning: 'visit 객체가 누락되면 오류가 발생합니다'
      };
    }

    logger.success('API 요청 완료', { 
      duration, 
      iterations: result.iterations,
      toolCount: result.tools.length
    });

    res.json(responseData);

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('API 요청 실패', error);
    
    let errorMessage = error.message;
    let errorType = 'unknown';
    
    if (error.status === 429) {
      errorType = 'rate_limit';
      errorMessage = 'API 호출 한도 초과. 잠시 후 다시 시도해주세요.';
    } else if (error.status >= 500) {
      errorType = 'server_error';
      errorMessage = '서버 오류. 잠시 후 다시 시도해주세요.';
    } else if (error.message.includes('visit')) {
      errorType = 'fill_report_error';
      errorMessage = 'fill_report 도구 오류: 필수 필드(site, org, visit)가 누락되었습니다.';
    }
    
    res.status(error.status || 500).json({
      success: false,
      error: errorMessage,
      errorType,
      duration,
      timestamp: new Date().toISOString(),
      suggestion: errorType === 'fill_report_error' ? 
        '필수 필드(site.name, site.address, org.name, visit.date, visit.round, visit.round_total)를 포함한 완전한 데이터 구조를 제공해주세요.' :
        '요청을 다시 시도해주세요.'
    });
  }
});

// 사용 가능한 도구 목록 조회
app.get('/v1/tools', async (req, res) => {
  try {
    const mcp = await createMCP();
    const { tools } = await mcp.listTools();
    
    res.json({
      success: true,
      data: {
        tools: tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema
        })),
        count: tools.length
      }
    });
  } catch (error) {
    logger.error('도구 목록 조회 실패', error);
    res.status(500).json({
      success: false,
      error: {
        message: '도구 목록 조회 실패',
        details: error.message
      }
    });
  }
});

// 설정 정보 조회
app.get('/v1/config', (req, res) => {
  res.json({
    success: true,
    data: {
      provider: cfg.provider,
      model: cfg.model,
      parallel: cfg.parallel,
      timeout: cfg.timeoutMs,
      temperature: cfg.temperature
    }
  });
});

// 404 처리
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: '요청한 엔드포인트를 찾을 수 없습니다',
      path: req.originalUrl
    }
  });
});

// 에러 핸들러
app.use((error, req, res, next) => {
  logger.error('Express 에러 핸들러', error);
  
  res.status(500).json({
    success: false,
    error: {
      message: '서버 내부 오류',
      details: process.env.NODE_ENV === 'development' ? error.message : '알 수 없는 오류'
    }
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log('✅ 🚀 안전보고서 오케스트레이터 HTTP 서버 시작');
  console.log(`🌐 HTTP API 서버가 포트 ${PORT}에서 실행 중입니다`);
  console.log(`📖 API 문서: http://localhost:${PORT}/health`);
  console.log(`🔧 안전보고서 생성: POST http://localhost:${PORT}/v1/assistants/safety-report/generate`);
});

// 프로세스 종료 처리
process.on('SIGINT', () => {
  console.log('\n👋 HTTP 서버를 종료합니다.');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 HTTP 서버를 종료합니다.');
  process.exit(0);
});
