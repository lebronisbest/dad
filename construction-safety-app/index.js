const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { generateReport } = require('./services/reportGenerator');
const { validateReportData } = require('./services/validator');
const TemplateEngine = require('./services/templateEngine');
const PDFGenerator = require('./services/pdfGenerator');
const DOCXGenerator = require('./services/docxGenerator');
const ImageProcessor = require('./services/imageProcessor');

const app = express();
const PORT = process.env.PORT || 3001;

// 환경 변수 설정
const EXPORT_DIR = process.env.EXPORT_DIR || './exports';
const EXPORT_PROFILE = process.env.EXPORT_PROFILE || 'fast';

// 서비스 인스턴스 생성
const templateEngine = new TemplateEngine();
const pdfGenerator = new PDFGenerator();
const docxGenerator = new DOCXGenerator();
const imageProcessor = new ImageProcessor();

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 정적 파일 서빙
app.use('/uploads', express.static('uploads'));
app.use('/processed', express.static('processed'));
app.use('/thumbnails', express.static('thumbnails'));
app.use('/exports', express.static(EXPORT_DIR));

// 파일 업로드 설정 (메모리 스토리지)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10 // 최대 10개 파일
  },
  fileFilter: (req, file, cb) => {
    // 이미지 파일만 허용
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다'), false);
    }
  }
});

// 서버 시작 시 템플릿 로드
app.listen(PORT, async () => {
  try {
    // exports 디렉토리 생성
    try {
      await fs.mkdir(EXPORT_DIR, { recursive: true });
      console.log(`내보내기 디렉토리가 생성되었습니다: ${EXPORT_DIR}`);
    } catch (error) {
      console.warn('내보내기 디렉토리 생성 실패:', error.message);
    }
    
    await templateEngine.loadTemplates();
    console.log(`건설재해예방전문지도기관 기술지도 결과보고서 앱이 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`http://localhost:${PORT}에서 앱에 접속할 수 있습니다.`);
    console.log(`내보내기 프로파일: ${EXPORT_PROFILE}`);
  } catch (error) {
    console.error('템플릿 로드 실패:', error);
    process.exit(1);
  }
});

// 라우트 설정
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 헬스체크 엔드포인트
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// 기술지도 결과보고서 생성 API
app.post('/api/report/generate', async (req, res) => {
  try {
    const reportData = req.body;
    
    // 데이터 유효성 검사
    const validationResult = validateReportData(reportData);
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        errors: validationResult.errors
      });
    }

    // 보고서 생성
    const report = await generateReport(reportData);
    
    res.json({
      success: true,
      report: report,
      message: '기술지도 결과보고서가 성공적으로 생성되었습니다.'
    });
  } catch (error) {
    console.error('보고서 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '보고서 생성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// PDF 내보내기 API
app.post('/api/export/pdf', async (req, res) => {
  try {
    const { templateName = 'report_v1', data, quality = 'standard' } = req.body;
    
    if (!data) {
      return res.status(400).json({
        success: false,
        message: '보고서 데이터가 필요합니다.'
      });
    }

    // PDF 품질 프로파일 적용
    const pdfOptions = pdfGenerator.getQualityProfile(quality);
    
    // PDF 생성
    const pdfBuffer = await pdfGenerator.generatePDFFromTemplate(
      templateEngine, 
      templateName, 
      data, 
      pdfOptions
    );

    // 응답 헤더 설정
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report_${Date.now()}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF 내보내기 오류:', error);
    res.status(500).json({
      success: false,
      message: 'PDF 생성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// DOCX 내보내기 API
app.post('/api/export/docx', async (req, res) => {
  try {
    const { templateName = 'report_v1', data, mode = 'fast', quality = 'standard' } = req.body;
    
    if (!data) {
      return res.status(400).json({
        success: false,
        message: '보고서 데이터가 필요합니다.'
      });
    }

    // DOCX 품질 프로파일 적용
    const docxOptions = {
      ...docxGenerator.getQualityProfile(quality),
      ...docxGenerator.getTableOptions()
    };
    
    // DOCX 생성
    const docxBuffer = await docxGenerator.generateDOCXFromTemplate(
      templateEngine, 
      templateName, 
      data, 
      mode, 
      docxOptions
    );

    // 응답 헤더 설정
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="report_${Date.now()}.docx"`);
    res.setHeader('Content-Length', docxBuffer.length);
    
    res.send(docxBuffer);
  } catch (error) {
    console.error('DOCX 내보내기 오류:', error);
    res.status(500).json({
      success: false,
      message: 'DOCX 생성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// GET 방식 DOCX 내보내기 (모드 스위치)
app.get('/api/reports/:id.docx', async (req, res) => {
  try {
    const { id } = req.params;
    const { profile = 'fast' } = req.query;
    
    // TODO: ID로 보고서 데이터 조회
    const reportData = {
      projectName: '샘플 프로젝트',
      projectLocation: '서울시 강남구',
      inspector: '홍길동',
      findings: ['샘플 발견사항'],
      recommendations: ['샘플 권고사항']
    };

    const mode = profile === 'native' ? 'native' : 'fast';
    const quality = profile === 'native' ? 'high' : 'standard';
    
    const docxOptions = {
      ...docxGenerator.getQualityProfile(quality),
      ...docxGenerator.getTableOptions()
    };
    
    const docxBuffer = await docxGenerator.generateDOCXFromTemplate(
      templateEngine, 
      'report_v1', 
      reportData, 
      mode, 
      docxOptions
    );

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="report_${id}.docx"`);
    res.setHeader('Content-Length', docxBuffer.length);
    
    res.send(docxBuffer);
  } catch (error) {
    console.error('GET DOCX 내보내기 오류:', error);
    res.status(500).json({
      success: false,
      message: 'DOCX 생성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 저장형 내보내기 API
app.post('/api/reports/:id/export', async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'pdf', profile = EXPORT_PROFILE, quality = 'standard' } = req.body;
    
    // TODO: ID로 보고서 데이터 조회 (실제 구현에서는 데이터베이스에서 조회)
    const reportData = {
      projectName: '샘플 프로젝트',
      projectLocation: '서울시 강남구',
      inspector: '홍길동',
      findings: ['샘플 발견사항'],
      recommendations: ['샘플 권고사항'],
      inspectionDate: new Date().toISOString().split('T')[0]
    };

    let buffer, filename, contentType;
    const timestamp = Date.now();
    
    if (format === 'pdf') {
      const pdfOptions = pdfGenerator.getQualityProfile(quality);
      buffer = await pdfGenerator.generatePDFFromTemplate(
        templateEngine, 
        'report_v1', 
        reportData, 
        pdfOptions
      );
      filename = `report_${id}_${timestamp}.pdf`;
      contentType = 'application/pdf';
    } else if (format === 'docx') {
      const mode = profile === 'native' ? 'native' : 'fast';
      const docxOptions = {
        ...docxGenerator.getQualityProfile(quality),
        ...docxGenerator.getTableOptions()
      };
      
      buffer = await docxGenerator.generateDOCXFromTemplate(
        templateEngine, 
        'report_v1', 
        reportData, 
        mode, 
        docxOptions
      );
      filename = `report_${id}_${timestamp}.docx`;
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else {
      return res.status(400).json({
        success: false,
        message: '지원하지 않는 형식입니다. pdf 또는 docx를 사용하세요.'
      });
    }

    // 파일 저장
    const filePath = path.join(EXPORT_DIR, filename);
    await fs.writeFile(filePath, buffer);
    
    // 파일 크기 확인
    const stats = await fs.stat(filePath);
    const fileSize = stats.size;
    
    // URL 생성
    const downloadUrl = `/exports/${filename}`;
    
    console.log(`EXPORT_DONE: ${format.toUpperCase()} 생성 완료 - ${filename} (${fileSize} bytes)`);
    
    res.json({
      success: true,
      message: `${format.toUpperCase()} 파일이 성공적으로 생성되었습니다.`,
      result: {
        id: id,
        format: format,
        filename: filename,
        url: downloadUrl,
        size: fileSize,
        profile: profile,
        quality: quality,
        createdAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('저장형 내보내기 오류:', error);
    res.status(500).json({
      success: false,
      message: '파일 생성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 이미지 업로드 API (개선된 버전)
app.post('/api/upload/images', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '이미지 파일이 업로드되지 않았습니다.'
      });
    }

    // 이미지 처리
    const results = await imageProcessor.processBatch(req.files);
    
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.length - successCount;

    res.json({
      success: true,
      message: `${successCount}개 이미지가 성공적으로 처리되었습니다.`,
      results: results,
      summary: {
        total: results.length,
        success: successCount,
        failed: failedCount
      }
    });
  } catch (error) {
    console.error('이미지 업로드 오류:', error);
    res.status(500).json({
      success: false,
      message: '이미지 처리 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 단일 이미지 업로드 API
app.post('/api/upload/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '이미지 파일이 업로드되지 않았습니다.'
      });
    }

    // 이미지 처리
    const result = await imageProcessor.processImage(req.file.buffer, req.file.originalname);
    
    res.json({
      success: true,
      message: '이미지가 성공적으로 처리되었습니다.',
      result: result
    });
  } catch (error) {
    console.error('이미지 업로드 오류:', error);
    res.status(500).json({
      success: false,
      message: '이미지 처리 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 이미지 정보 조회 API
app.get('/api/images/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const imageInfo = await imageProcessor.getImageInfo(filename);
    
    res.json({
      success: true,
      imageInfo: imageInfo
    });
  } catch (error) {
    console.error('이미지 정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '이미지 정보 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 이미지 삭제 API
app.delete('/api/images/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const result = await imageProcessor.deleteImage(filename);
    
    res.json({
      success: true,
      message: '이미지가 성공적으로 삭제되었습니다.',
      result: result
    });
  } catch (error) {
    console.error('이미지 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '이미지 삭제 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 기존 파일 업로드 API (하위 호환성)
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '파일이 업로드되지 않았습니다.'
      });
    }

    res.json({
      success: true,
      message: '파일이 성공적으로 업로드되었습니다.',
      filename: req.file.filename,
      originalName: req.file.originalname
    });
  } catch (error) {
    console.error('파일 업로드 오류:', error);
    res.status(500).json({
      success: false,
      message: '파일 업로드 중 오류가 발생했습니다.'
    });
  }
});

// 보고서 템플릿 목록 조회 API
app.get('/api/templates', (req, res) => {
  const templates = [
    {
      id: 'template1',
      name: '기본 기술지도 결과보고서',
      description: '일반적인 건설현장 기술지도 결과보고서 템플릿'
    },
    {
      id: 'template2',
      name: '상세 기술지도 결과보고서',
      description: '상세한 분석과 개선사항이 포함된 보고서 템플릿'
    },
    {
      id: 'template3',
      name: '긴급 기술지도 결과보고서',
      description: '긴급 상황에 대한 신속한 보고서 템플릿'
    }
  ];

  res.json({
    success: true,
    templates: templates
  });
});

// 프로세스 종료 시 정리
process.on('SIGINT', async () => {
  console.log('서버 종료 중...');
  await pdfGenerator.close();
  process.exit(0);
});

// 법령 검색 API
app.post('/api/law/search', async (req, res) => {
  try {
    const { keyword, lawType = '법률', effectiveDate } = req.body;
    
    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: '검색 키워드가 필요합니다.'
      });
    }

    // TODO: 실제 국가법령정보 API 연동
    // 현재는 샘플 데이터 반환
    const sampleResults = [
      {
        id: 'LAW-001',
        title: '건설기계관리법',
        type: lawType,
        effectiveDate: effectiveDate || new Date().toISOString().split('T')[0],
        articles: [
          { number: 15, title: '양중기 등의 안전기준' },
          { number: 16, title: '안전장비 착용 의무' },
          { number: 17, title: '작업환경 점검' }
        ],
        relevance: '높음',
        description: `${keyword}와 관련된 안전기준 및 규정을 포함`
      },
      {
        id: 'LAW-002',
        title: '산업안전보건법',
        type: lawType,
        effectiveDate: effectiveDate || new Date().toISOString().split('T')[0],
        articles: [
          { number: 42, title: '안전장비 착용' },
          { number: 43, title: '작업환경 개선' }
        ],
        relevance: '중간',
        description: `${keyword} 관련 일반적인 안전 규정`
      }
    ];

    res.json({
      success: true,
      message: '법령 검색이 완료되었습니다.',
      results: sampleResults,
      searchInfo: {
        keyword,
        lawType,
        effectiveDate: effectiveDate || new Date().toISOString().split('T')[0],
        totalResults: sampleResults.length
      }
    });
    
  } catch (error) {
    console.error('법령 검색 오류:', error);
    res.status(500).json({
      success: false,
      message: '법령 검색 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 법령 조문 가져오기 API
app.post('/api/law/article', async (req, res) => {
  try {
    const { lawId, articleNumber, paragraphNumber, subParagraphNumber, effectiveDate } = req.body;
    
    if (!lawId || articleNumber === undefined) {
      return res.status(400).json({
        success: false,
        message: '법령 ID와 조 번호가 필요합니다.'
      });
    }

    // TODO: 실제 국가법령정보 API 연동
    // 현재는 샘플 데이터 반환
    const articleData = {
      lawId,
      articleNumber,
      title: `${articleNumber}조`,
      content: `이 조는 ${lawId}의 ${articleNumber}조에 대한 내용입니다.`,
      paragraphs: paragraphNumber ? [
        {
          number: paragraphNumber,
          content: `${paragraphNumber}항의 내용입니다.`,
          subParagraphs: subParagraphNumber ? [
            {
              number: subParagraphNumber,
              content: `${subParagraphNumber}목의 내용입니다.`
            }
          ] : []
        }
      ] : [],
      effectiveDate: effectiveDate || new Date().toISOString().split('T')[0],
      source: `https://www.law.go.kr/DRF/lawService.do?OC=${process.env.MOLEG_OC || 'sample'}&target=law&type=HTML&ID=${lawId}`,
      retrievedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: '법령 조문을 성공적으로 가져왔습니다.',
      article: articleData
    });
    
  } catch (error) {
    console.error('법령 조문 가져오기 오류:', error);
    res.status(500).json({
      success: false,
      message: '법령 조문 가져오기 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

module.exports = app;
