import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { requestId } from './middleware/request-id.js';
import { validateReportData } from '../../core/validation.js';
import { renderPDFBuffer, isChromeAvailable } from '../../core/render.js';
import { normalizeReportDTO, createSampleDTO } from '../../core/normalize.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.API_PORT || 3001;

// 미들웨어 설정
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(requestId);

// 헬스체크 엔드포인트
app.get('/healthz', (req, res) => {
  const chromeAvailable = isChromeAvailable();

  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    requestId: req.id,
    services: {
      chrome: chromeAvailable,
      validation: true,
      rendering: true
    },
    env: {
      nodeEnv: process.env.NODE_ENV,
      port: PORT,
      chromePath: process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH || 'system-default'
    }
  });
});

// 샘플 DTO 조회
app.get('/v1/samples/dto', (req, res) => {
  try {
    const sample = createSampleDTO();
    res.json({
      ok: true,
      data: sample,
      requestId: req.id
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message,
      requestId: req.id
    });
  }
});

// 보고서 데이터 검증 API
app.post('/v1/reports/validate', (req, res) => {
  try {
    const input = req.body;

    if (!input || typeof input !== 'object') {
      return res.status(400).json({
        ok: false,
        error: '요청 본문이 객체여야 합니다',
        requestId: req.id
      });
    }

    const result = validateReportData(input);

    if (result.ok) {
      res.json({
        ok: true,
        data: result.data,
        requestId: req.id
      });
    } else {
      res.status(422).json({
        ok: false,
        errors: result.errors,
        normalizedData: result.normalizedData,
        requestId: req.id
      });
    }

  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message,
      requestId: req.id
    });
  }
});

// 보고서 PDF 생성 API
app.post('/v1/reports', async (req, res) => {
  const startTime = Date.now();

  try {
    const input = req.body;

    if (!input || typeof input !== 'object') {
      return res.status(400).json({
        ok: false,
        error: '요청 본문이 객체여야 합니다',
        requestId: req.id
      });
    }

    // 1. 데이터 검증
    const validation = validateReportData(input);
    if (!validation.ok) {
      return res.status(422).json({
        ok: false,
        errors: validation.errors,
        requestId: req.id
      });
    }

    const reportData = validation.data;

    // 2. HTML 템플릿 로드
    const templatePath = path.join(__dirname, '../../templates/layout.html');
    let templateHtml;

    try {
      templateHtml = await fs.readFile(templatePath, 'utf-8');
    } catch (error) {
      return res.status(500).json({
        ok: false,
        error: '템플릿 파일을 읽을 수 없습니다',
        requestId: req.id
      });
    }

    // 3. 데이터 주입 (간단한 템플릿 엔진)
    let htmlContent = templateHtml;

    // 기본 데이터 치환
    const replacements = {
      '{{site}}': reportData.site || '',
      '{{org}}': reportData.org || '',
      '{{inspector}}': reportData.inspector || '',
      '{{round}}': reportData.round || '',
      '{{round_total}}': reportData.round_total || '',
      '{{visit_date}}': reportData.visit?.date || '',
      '{{visit_time}}': reportData.visit?.time || '',
      '{{visit_purpose}}': reportData.visit?.purpose || ''
    };

    Object.entries(replacements).forEach(([key, value]) => {
      htmlContent = htmlContent.replace(new RegExp(key, 'g'), value);
    });

    // 섹션 데이터 치환
    if (reportData.sections && Array.isArray(reportData.sections)) {
      let sectionsHtml = '';
      reportData.sections.forEach(section => {
        if (section.title && section.items && Array.isArray(section.items)) {
          sectionsHtml += `<div class="section">
            <h3>${section.title}</h3>
            <ul>
              ${section.items.map(item => `<li>${item}</li>`).join('')}
            </ul>
          </div>`;
        }
      });

      htmlContent = htmlContent.replace('{{sections}}', sectionsHtml);
    }

    // 4. PDF 생성
    const renderResult = await renderPDFBuffer(htmlContent);

    if (!renderResult.ok) {
      return res.status(500).json({
        ok: false,
        error: renderResult.error,
        requestId: req.id
      });
    }

    // 5. 파일 저장
    const downloadsDir = path.join(__dirname, '../../downloads');
    await fs.mkdir(downloadsDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `report_${timestamp}.pdf`;
    const filePath = path.join(downloadsDir, fileName);

    await fs.writeFile(filePath, renderResult.buffer);

    // 6. 응답
    const processingTime = Date.now() - startTime;

    res.json({
      ok: true,
      file: {
        name: fileName,
        path: filePath,
        size: renderResult.buffer.length,
        sha256: null // 실제로는 해시 계산 필요
      },
      meta: {
        requestId: req.id,
        processingTime,
        renderLog: renderResult.renderLog
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;

    res.status(500).json({
      ok: false,
      error: error.message,
      requestId: req.id,
      processingTime
    });
  }
});

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: 'API 엔드포인트를 찾을 수 없습니다',
    requestId: req.id,
    path: req.path,
    method: req.method
  });
});

// 에러 핸들러
app.use((error, req, res, next) => {
  console.error(`[${req.id}] 서버 오류:`, error);

  res.status(500).json({
    ok: false,
    error: '서버 내부 오류가 발생했습니다',
    requestId: req.id
  });
});

// 서버 시작
const server = app.listen(PORT, () => {
  console.log(`🚀 HTTP API 서버가 http://localhost:${PORT} 에서 실행중입니다`);
  console.log(`📋 헬스체크: http://localhost:${PORT}/healthz`);
  console.log(`📋 샘플 DTO: http://localhost:${PORT}/v1/samples/dto`);
  console.log(`📋 검증 API: POST http://localhost:${PORT}/v1/reports/validate`);
  console.log(`📋 생성 API: POST http://localhost:${PORT}/v1/reports`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('HTTP 서버를 종료합니다...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nHTTP 서버를 종료합니다...');
  server.close(() => {
    process.exit(0);
  });
});

export default app;