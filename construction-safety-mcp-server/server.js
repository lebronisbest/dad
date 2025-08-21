import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname 설정 (ES 모듈에서)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 환경 설정
const config = {
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3001',
  exportsDir: process.env.EXPORTS_DIR || path.resolve('./exports'),
  puppeteerArgs: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
};

console.log('MCP 서버 설정:', {
  apiBaseUrl: config.apiBaseUrl,
  exportsDir: config.exportsDir,
  puppeteerArgs: config.puppeteerArgs
});

// MCP 서버 설정
const server = new Server(
  {
    name: 'construction-safety-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 도구 정의
const tools = [
  {
    name: 'sample_report_skeleton',
    description: '샘플 보고서 스켈레톤을 생성합니다. 필수/선택/예시 데이터를 포함합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        templateId: {
          type: 'string',
          enum: ['template1', 'template2', 'template3'],
          description: '보고서 템플릿 ID'
        },
        includeExamples: {
          type: 'boolean',
          description: '예시 데이터 포함 여부',
          default: true
        }
      },
      required: ['templateId']
    }
  },
  {
    name: 'law_search',
    description: '국가법령정보 API를 통해 건설안전 관련 법령을 검색합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description: '검색 키워드 (예: 양중, 슬링벨트, 안전장비)'
        },
        lawType: {
          type: 'string',
          enum: ['법률', '시행령', '시행규칙', '고시'],
          description: '법령 유형',
          default: '법률'
        },
        effectiveDate: {
          type: 'string',
          description: '효력일 (YYYY-MM-DD)',
          default: '현재 날짜'
        }
      },
      required: ['keyword']
    }
  },
  {
    name: 'law_get_article',
    description: '특정 법령의 조문을 가져옵니다.',
    inputSchema: {
      type: 'object',
      properties: {
        lawId: {
          type: 'string',
          description: '법령 ID'
        },
        articleNumber: {
          type: 'number',
          description: '조 번호'
        },
        paragraphNumber: {
          type: 'number',
          description: '항 번호 (선택사항)'
        },
        subParagraphNumber: {
          type: 'number',
          description: '목 번호 (선택사항)'
        },
        effectiveDate: {
          type: 'string',
          description: '효력일 (YYYY-MM-DD)',
          default: '현재 날짜'
        }
      },
      required: ['lawId', 'articleNumber']
    }
  },
  {
    name: 'create_report',
    description: '새로운 기술지도 결과보고서를 생성합니다. 유효성 검사 실패 시 필드별 가이드를 제공합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        report: {
          type: 'object',
          description: '보고서 데이터'
        }
      },
      required: ['report']
    }
  },
  {
    name: 'update_report',
    description: '기존 보고서를 부분 수정합니다. 찾아 교체 방식으로 동작합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: '보고서 ID'
        },
        patch: {
          type: 'object',
          description: '수정할 데이터'
        }
      },
      required: ['id', 'patch']
    }
  },
  {
    name: 'add_finding',
    description: '보고서에 새로운 발견사항을 추가합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: '보고서 ID'
        },
        finding: {
          type: 'string',
          description: '발견사항 내용'
        }
      },
      required: ['id', 'finding']
    }
  },
  {
    name: 'add_photo',
    description: '보고서에 새로운 사진을 추가합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: '보고서 ID'
        },
        fileRef: {
          type: 'string',
          description: '파일 참조 (URL 또는 파일 경로)'
        },
        description: {
          type: 'string',
          description: '사진 설명'
        },
        location: {
          type: 'string',
          description: '촬영 위치'
        }
      },
      required: ['id', 'fileRef', 'description', 'location']
    }
  },
  {
    name: 'list_reports',
    description: '보고서 목록을 조회합니다. 기간/현장명/회차로 필터링 가능합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'object',
          properties: {
            startDate: {
              type: 'string',
              description: '시작 날짜 (YYYY-MM-DD)'
            },
            endDate: {
              type: 'string',
              description: '종료 날짜 (YYYY-MM-DD)'
            },
            projectName: {
              type: 'string',
              description: '프로젝트명 (부분 일치)'
            },
            inspector: {
              type: 'string',
              description: '지도자명'
            },
            templateId: {
              type: 'string',
              enum: ['template1', 'template2', 'template3']
            }
          }
        },
        limit: {
          type: 'number',
          description: '최대 결과 수',
          default: 50
        },
        offset: {
          type: 'number',
          description: '건너뛸 결과 수',
          default: 0
        }
      }
    }
  },
  {
    name: 'export_bundle',
    description: '보고서를 여러 형식으로 내보내고 ZIP 파일로 압축합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: '보고서 ID'
        },
        format: {
          type: 'string',
          enum: ['pdf', 'docx', 'both'],
          description: '내보낼 형식',
          default: 'both'
        },
        quality: {
          type: 'string',
          enum: ['fast', 'standard', 'high'],
          description: '품질 설정',
          default: 'standard'
        }
      },
      required: ['id']
    }
  }
];

// 도구 구현
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }))
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case 'sample_report_skeleton':
        return await handleSampleReportSkeleton(args);
      
      case 'law_search':
        return await handleLawSearch(args);
      
      case 'law_get_article':
        return await handleLawGetArticle(args);
      
      case 'create_report':
        return await handleCreateReport(args);
      
      case 'update_report':
        return await handleUpdateReport(args);
      
      case 'add_finding':
        return await handleAddFinding(args);
      
      case 'add_photo':
        return await handleAddPhoto(args);
      
      case 'list_reports':
        return await handleListReports(args);
      
      case 'export_bundle':
        return await handleExportBundle(args);
      
      default:
        throw new Error(`알 수 없는 도구: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `오류 발생: ${error.message}`
        }
      ],
      isError: true
    };
  }
});

// 샘플 보고서 스켈레톤 생성
async function handleSampleReportSkeleton(args) {
  const { templateId, includeExamples = true } = args;
  
  const skeleton = {
    templateId,
    projectName: '샘플 프로젝트명',
    projectLocation: '서울시 강남구 테헤란로 123',
    projectType: '상업시설',
    contractor: '샘플 건설(주)',
    guidanceDate: new Date().toISOString(),
    guidanceType: '정기점검',
    inspector: '홍길동',
    guidanceDuration: '2시간',
    findings: includeExamples ? ['안전모 미착용자 발견', '안전띠 미착용자 발견'] : [],
    recommendations: includeExamples ? ['안전모 착용 의무화', '안전띠 착용 의무화'] : []
  };
  
  if (templateId === 'template2') {
    skeleton.responsiblePerson = '김책임';
    skeleton.riskAssessments = includeExamples ? [
      {
        riskElement: '고소작업',
        riskLevel: '높음',
        action: '안전띠 착용 의무화',
        isCompleted: false
      }
    ] : [];
  }
  
  if (templateId === 'template3') {
    skeleton.emergencyLevel = '높음';
    skeleton.immediateActions = includeExamples ? ['작업 중단', '안전장비 착용'] : [];
  }
  
  return {
    content: [
      {
        type: 'text',
        text: `템플릿 ${templateId}용 샘플 보고서 스켈레톤이 생성되었습니다:\n\n${JSON.stringify(skeleton, null, 2)}`
      }
    ]
  };
}

// 법령 검색
async function handleLawSearch(args) {
  const { keyword, lawType, effectiveDate } = args;
  
  if (!keyword) {
    return {
      content: [
        {
          type: 'text',
          text: '오류: 검색 키워드를 입력해야 합니다.'
        }
      ],
      isError: true
    };
  }
  
  try {
    const { default: fetch } = await import('node-fetch');
    const apiUrl = `${config.apiBaseUrl}/api/law/search`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ keyword, lawType, effectiveDate })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`법령 검색 API 호출 실패: ${response.status} ${response.statusText}\n응답: ${errorText}`);
    }
    
    const data = await response.json();
    return {
      content: [
        {
          type: 'text',
          text: `법령 검색 결과:\n\n${JSON.stringify(data, null, 2)}`
        }
      ]
    };
  } catch (error) {
    console.error('법령 검색 중 오류 발생:', error);
    return {
      content: [
        {
          type: 'text',
          text: `법령 검색 중 오류 발생: ${error.message}\n\n상세 오류: ${error.stack || '스택 정보 없음'}`
        }
      ],
      isError: true
    };
  }
}

// 법령 조문 가져오기
async function handleLawGetArticle(args) {
  const { lawId, articleNumber, paragraphNumber, subParagraphNumber, effectiveDate } = args;
  
  if (!lawId || articleNumber === undefined) {
    return {
      content: [
        {
          type: 'text',
          text: '오류: 법령 ID와 조 번호를 입력해야 합니다.'
        }
      ],
      isError: true
    };
  }
  
  try {
    const { default: fetch } = await import('node-fetch');
    const apiUrl = `${config.apiBaseUrl}/api/law/article`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lawId, articleNumber, paragraphNumber, subParagraphNumber, effectiveDate })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`법령 조문 가져오기 API 호출 실패: ${response.status} ${response.statusText}\n응답: ${errorText}`);
    }
    
    const data = await response.json();
    return {
      content: [
        {
          type: 'text',
          text: `법령 조문 결과:\n\n${JSON.stringify(data, null, 2)}`
        }
      ]
    };
  } catch (error) {
    console.error('법령 조문 가져오기 중 오류 발생:', error);
    return {
      content: [
        {
          type: 'text',
          text: `법령 조문 가져오기 중 오류 발생: ${error.message}\n\n상세 오류: ${error.stack || '스택 정보 없음'}`
        }
      ],
      isError: true
    };
  }
}

// 보고서 생성
async function handleCreateReport(args) {
  const { report } = args;
  
  // TODO: 실제 보고서 생성 로직 구현
  const reportId = `RPT-${Date.now()}`;
  
  return {
    content: [
      {
        type: 'text',
        text: `보고서가 성공적으로 생성되었습니다. ID: ${reportId}`
      }
    ]
  };
}

// 보고서 수정
async function handleUpdateReport(args) {
  const { id, patch } = args;
  
  // TODO: 실제 보고서 수정 로직 구현
  
  return {
    content: [
      {
        type: 'text',
        text: `보고서 ${id}가 성공적으로 수정되었습니다.`
      }
    ]
  };
}

// 발견사항 추가
async function handleAddFinding(args) {
  const { id, finding } = args;
  
  if (!finding || finding.trim().length === 0) {
    return {
      content: [
        {
          type: 'text',
          text: '오류: 발견사항 내용이 비어있습니다.'
        }
      ],
      isError: true
    };
  }
  
  // TODO: 실제 발견사항 추가 로직 구현
  
  return {
    content: [
      {
        type: 'text',
        text: `보고서 ${id}에 발견사항이 추가되었습니다: "${finding}"`
      }
    ]
  };
}

// 사진 추가
async function handleAddPhoto(args) {
  const { id, fileRef, description, location } = args;
  
  if (!fileRef || !description || !location) {
    return {
      content: [
        {
          type: 'text',
          text: '오류: 파일 참조, 설명, 위치가 모두 필요합니다.'
        }
      ],
      isError: true
    };
  }
  
  // TODO: 실제 사진 추가 로직 구현
  
  return {
    content: [
      {
        type: 'text',
        text: `보고서 ${id}에 사진이 추가되었습니다: ${description} (${location})`
      }
    ]
  };
}

// 보고서 목록 조회
async function handleListReports(args) {
  const { query = {}, limit = 50, offset = 0 } = args;
  
  // TODO: 실제 보고서 목록 조회 로직 구현
  const sampleReports = [
    {
      id: 'RPT-001',
      projectName: '강남 오피스빌딩',
      inspector: '홍길동',
      guidanceDate: '2024-01-15',
      templateId: 'template1'
    },
    {
      id: 'RPT-002',
      projectName: '서초 아파트',
      inspector: '김철수',
      guidanceDate: '2024-01-16',
      templateId: 'template2'
    }
  ];
  
  return {
    content: [
      {
        type: 'text',
        text: `총 ${sampleReports.length}개의 보고서가 조회되었습니다:\n\n${JSON.stringify(sampleReports, null, 2)}`
      }
    ]
  };
}

// 내보내기 번들
async function handleExportBundle(args) {
  const { id, format = 'pdf', quality = 'standard' } = args;
  
  try {
    // exports 폴더 생성 및 권한 확인
    const exportsDir = config.exportsDir;
    try {
      if (!fs.existsSync(exportsDir)) {
        await fs.promises.mkdir(exportsDir, { recursive: true });
        console.log(`exports 폴더 생성됨: ${exportsDir}`);
      }
      
      // 폴더 쓰기 권한 테스트
      const testFile = path.join(exportsDir, 'test.txt');
      await fs.promises.writeFile(testFile, 'test');
      await fs.promises.unlink(testFile);
      console.log('폴더 쓰기 권한 확인됨');
    } catch (dirError) {
      throw new Error(`exports 폴더 생성/권한 오류: ${dirError.message}`);
    }
    
    // 보고서 데이터 생성
    const reportData = {
      templateName: 'report_v1',
      data: {
        templateId: 'template1',
        projectName: '강남 테헤란로 상업시설 신축공사',
        projectLocation: '서울시 강남구 테헤란로 123',
        projectType: '상업시설',
        contractor: '강남건설(주)',
        guidanceDate: '2025-01-21T10:00:00.000Z',
        guidanceType: '정기안전점검',
        inspector: '김안전',
        guidanceDuration: '3시간',
        findings: [
          '안전모 미착용자 3명 발견',
          '고소작업 시 안전띠 미착용자 2명 발견',
          '전기배선 노후화로 인한 화재위험',
          '건축자재 적재 시 안전거리 미준수',
          '안전교육 미이수자 발견으로 인한 안전의식 부족',
          '소화기 배치 부족 및 비상구 통로 차단'
        ],
        recommendations: [
          '안전모 착용 의무화 및 점검 강화',
          '고소작업 시 안전띠 착용 의무화',
          '전기배선 교체 및 정기점검 실시',
          '건축자재 적재 시 안전거리 준수 교육 실시'
        ]
      },
      quality: quality
    };
    
    try {
      // 방법 1: construction-safety-app API 호출
      const { default: fetch } = await import('node-fetch');
      
      console.log(`API 호출 시작: ${config.apiBaseUrl}/api/export/pdf`);
      
      const response = await fetch(`${config.apiBaseUrl}/api/export/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData)
      });
      
      // 응답 상태 및 헤더 검증 강화
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API 호출 실패: ${response.status} ${response.statusText}\n응답: ${errorText}`);
      }
      
      const contentType = response.headers.get('content-type');
      console.log(`응답 Content-Type: ${contentType}`);
      
      const contentLength = response.headers.get('content-length');
      console.log(`응답 크기: ${contentLength} bytes`);
      
      // buffer() 대신 arrayBuffer() 사용
      const pdfBuffer = await response.arrayBuffer();
      console.log(`실제 읽은 크기: ${pdfBuffer.byteLength} bytes`);
      
      if (pdfBuffer.byteLength === 0) {
        throw new Error('PDF 데이터가 비어있습니다');
      }
      
      // ArrayBuffer를 Buffer로 변환
      const buffer = Buffer.from(pdfBuffer);
      
      // 파일명 생성
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `안전보고서_${id}_${timestamp}.pdf`;
      const filepath = path.join(exportsDir, filename);
      
      // 파일 저장 전 버퍼 검증
      if (!buffer || buffer.length === 0) {
        throw new Error('저장할 PDF 버퍼가 비어있습니다');
      }
      
      console.log(`파일 저장 시작: ${filepath} (${buffer.length} bytes)`);
      
      try {
        await fs.promises.writeFile(filepath, buffer);
        
        // 파일 저장 확인
        const stats = await fs.promises.stat(filepath);
        console.log(`파일 저장 완료: ${filepath} (${stats.size} bytes)`);
        
        if (stats.size === 0) {
          throw new Error('저장된 파일이 0바이트입니다');
        }
      } catch (writeError) {
        throw new Error(`파일 저장 실패: ${writeError.message}`);
      }
      
      // Windows에서 파일 열기
      try {
        const { exec } = await import('child_process');
        exec(`start "${filepath}"`, (error) => {
          if (error) {
            console.log('PDF 파일 열기 실패:', error.message);
            // 대안으로 explorer로 폴더 열기
            exec(`explorer "${exportsDir}"`, (err) => {
              if (err) console.log('폴더 열기 실패:', err.message);
            });
          }
        });
      } catch (openError) {
        console.log('파일 열기 시도 실패:', openError.message);
      }
      
      return {
        content: [
          {
            type: 'text',
            text: `보고서 ${id}의 ${format} 형식 내보내기가 완료되었습니다!\n\n📁 파일 위치: ${filepath}\n📄 파일명: ${filename}\n🔍 PDF 파일이 열렸습니다.`
          }
        ]
      };
      
    } catch (apiError) {
      console.log(`API 호출 실패, 대안 방법 사용: ${apiError.message}`);
      
      // 방법 2: HTML 직접 생성 후 Puppeteer로 PDF 변환
      try {
        const htmlContent = generateHTMLReport({
          id,
          ...reportData.data
        });
        
        console.log('Puppeteer로 PDF 생성 시작...');
        
        const browser = await puppeteer.launch({
          headless: true,
          args: config.puppeteerArgs
        });
        
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle2' });
        
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
        });
        
        await browser.close();
        
        console.log(`Puppeteer PDF 생성 완료: ${pdfBuffer.length} bytes`);
        
        // 파일 저장
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `안전보고서_${id}_${timestamp}_puppeteer.pdf`;
        const filepath = path.join(exportsDir, filename);
        
        await fs.promises.writeFile(filepath, pdfBuffer);
        
        // 파일 열기
        try {
          const { exec } = await import('child_process');
          exec(`start "${filepath}"`, (error) => {
            if (error) {
              console.log('PDF 파일 열기 실패:', error.message);
              exec(`explorer "${exportsDir}"`, (err) => {
                if (err) console.log('폴더 열기 실패:', err.message);
              });
            }
          });
        } catch (openError) {
          console.log('파일 열기 시도 실패:', openError.message);
        }
        
        return {
          content: [
            {
              type: 'text',
              text: `보고서 ${id}의 PDF 생성이 완료되었습니다! (Puppeteer 방식)\n\n📁 파일 위치: ${filepath}\n📄 파일명: ${filename}\n🔍 PDF 파일이 열렸습니다.`
            }
          ]
        };
        
      } catch (puppeteerError) {
        throw new Error(`Puppeteer PDF 생성 실패: ${puppeteerError.message}`);
      }
    }
    
  } catch (error) {
    console.error('PDF 생성 중 오류 발생:', error);
    return {
      content: [
        {
          type: 'text',
          text: `PDF 생성 중 오류 발생: ${error.message}\n\n상세 오류: ${error.stack || '스택 정보 없음'}`
        }
      ],
      isError: true
    };
  }
}

// HTML 보고서 템플릿 생성 함수
function generateHTMLReport(data) {
  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>건설안전 기술지도 결과보고서</title>
      <style>
        body {
          font-family: 'Malgun Gothic', '맑은 고딕', sans-serif;
          line-height: 1.6;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #2c3e50;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #2c3e50;
          margin: 0;
          font-size: 24px;
        }
        .project-info {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .project-info h2 {
          color: #2c3e50;
          border-bottom: 2px solid #3498db;
          padding-bottom: 10px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        .info-item {
          display: flex;
          align-items: center;
        }
        .info-label {
          font-weight: bold;
          min-width: 120px;
          color: #2c3e50;
        }
        .findings-section, .recommendations-section {
          margin-bottom: 30px;
        }
        .findings-section h2, .recommendations-section h2 {
          color: #2c3e50;
          border-bottom: 2px solid #e74c3c;
          padding-bottom: 10px;
        }
        .findings-section h2 {
          border-bottom-color: #e74c3c;
        }
        .recommendations-section h2 {
          border-bottom-color: #27ae60;
        }
        .list-item {
          background: #fff;
          padding: 15px;
          margin: 10px 0;
          border-left: 4px solid #3498db;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .footer {
          margin-top: 50px;
          text-align: center;
          color: #7f8c8d;
          font-size: 14px;
        }
        @media print {
          body { margin: 0; }
          .header { page-break-after: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>건설안전 기술지도 결과보고서</h1>
        <p>보고서 ID: ${data.id || 'N/A'}</p>
      </div>
      
      <div class="project-info">
        <h2>프로젝트 정보</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">현장명:</span>
            <span>${data.projectName}</span>
          </div>
          <div class="info-item">
            <span class="info-label">위치:</span>
            <span>${data.projectLocation}</span>
          </div>
          <div class="info-item">
            <span class="info-label">건물유형:</span>
            <span>${data.projectType}</span>
          </div>
          <div class="info-item">
            <span class="info-label">시공사:</span>
            <span>${data.contractor}</span>
          </div>
          <div class="info-item">
            <span class="info-label">점검일시:</span>
            <span>${new Date(data.guidanceDate).toLocaleDateString('ko-KR')}</span>
          </div>
          <div class="info-item">
            <span class="info-label">점검자:</span>
            <span>${data.inspector}</span>
          </div>
          <div class="info-item">
            <span class="info-label">점검시간:</span>
            <span>${data.guidanceDuration}</span>
          </div>
          <div class="info-item">
            <span class="info-label">점검유형:</span>
            <span>${data.guidanceType}</span>
          </div>
        </div>
      </div>
      
      <div class="findings-section">
        <h2>주요 발견사항</h2>
        ${data.findings.map(finding => `
          <div class="list-item">
            <strong>🚨</strong> ${finding}
          </div>
        `).join('')}
      </div>
      
      <div class="recommendations-section">
        <h2>개선 권고사항</h2>
        ${data.recommendations.map(rec => `
          <div class="list-item">
            <strong>✅</strong> ${rec}
          </div>
        `).join('')}
      </div>
      
      <div class="footer">
        <p>보고서 작성자: ${data.inspector}</p>
        <p>작성일시: ${new Date().toLocaleString('ko-KR')}</p>
        <p>건설재해예방전문지도기관</p>
      </div>
    </body>
    </html>
  `;
}

// 서버 시작
const transport = new StdioServerTransport();
server.connect(transport);

console.log('건설안전 MCP 서버가 시작되었습니다.');
console.log('사용 가능한 도구:', tools.map(t => t.name).join(', '));
console.log('현재 작업 디렉토리:', process.cwd());
console.log('exports 폴더:', config.exportsDir);
