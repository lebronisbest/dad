import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { requestId } from './middleware/request-id.js';
import { routeGuard } from './middleware/routeGuard.js';
import { validateReportData } from '../../core/validation.js';
import { renderPDFBuffer, isChromeAvailable, getPerformanceStats, getRenderStatus } from '../../core/render.js';
import { normalizeReportDTO, createSampleDTO } from '../../core/normalize.js';
import { MetricsHelpers } from '../../core/metrics.js';
import { getUserDiagnosticsForAPI, toggleUserDiagnostics, setUserDiagnosticsLevel } from '../../core/logger.js';
import { router as reportRouter } from './routes.report.js';
import { FileNameGenerator } from '../../core/utils.js';
import { CONFIG } from '../../core/config.js';
import { getProjectManager } from '../../core/project_manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.API_PORT || 3001;

// 미들웨어 설정
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(requestId);

// /downloads 정적 서빙 (가드보다 "앞"에 둠)
app.use('/downloads', express.static(path.join(process.cwd(), 'downloads'), {
  setHeaders(res, filePath) {
    if (filePath.endsWith('.pdf')) res.setHeader('Content-Type', 'application/pdf');
  }
}));

// ✅ 헬스체크 엔드포인트
app.get('/healthz', (req, res) => {
  const chromeAvailable = isChromeAvailable();

  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    requestId: req.id,
    services: {
      chrome: chromeAvailable,
      validation: true,
      rendering: true,
      projectManagement: true,
      performanceMonitoring: true,
      errorRateMonitoring: true,
      userDiagnostics: true
    },
    env: {
      nodeEnv: process.env.NODE_ENV,
      port: PORT,
      chromePath: process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH || 'system-default'
    }
  });
});

// ✅ 메트릭스 엔드포인트
app.get('/metrics', (req, res) => {
  try {
    const metrics = MetricsHelpers.getMetrics();
    const health = MetricsHelpers.getHealthStatus();
    
    res.json({
      metrics,
      health,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  } catch (error) {
    res.status(500).json({
      error: '메트릭스 조회 실패',
      message: error.message,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
});

// ✅ 메트릭스 초기화 엔드포인트
app.post('/metrics/reset', (req, res) => {
  try {
    MetricsHelpers.reset();
    res.json({
      message: '메트릭스 초기화 완료',
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  } catch (error) {
    res.status(500).json({
      error: '메트릭스 초기화 실패',
      message: error.message,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  }
});

// ✅ 샘플 DTO 조회
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

// ✅ 성능 모니터링 API
app.get('/v1/performance', (req, res) => {
  try {
    const performanceStats = getPerformanceStats();
    const renderStatus = getRenderStatus();
    
    res.json({
      ok: true,
      data: {
        performance: performanceStats,
        renderStatus: renderStatus,
        targets: {
          pdf10Pages: '2000ms (2초)',
          warningThreshold: '1500ms (1.5초)',
          criticalThreshold: '3000ms (3초)'
        }
      },
      requestId: req.id
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: '성능 모니터링 데이터 조회 실패: ' + error.message,
      requestId: req.id
    });
  }
});

// ✅ 사용자 진단 로그 API
app.get('/v1/diagnostics', (req, res) => {
  try {
    const diagnostics = getUserDiagnosticsForAPI();
    
    res.json({
      ok: true,
      data: diagnostics,
      requestId: req.id
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: '진단 로그 조회 실패: ' + error.message,
      requestId: req.id
    });
  }
});

// ✅ 사용자 진단 로그 토글
app.post('/v1/diagnostics/toggle', (req, res) => {
  try {
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        ok: false,
        error: 'enabled 필드는 boolean이어야 합니다',
        requestId: req.id
      });
    }
    
    const result = toggleUserDiagnostics(enabled);
    
    res.json({
      ok: true,
      data: result,
      requestId: req.id
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: '진단 로그 토글 실패: ' + error.message,
      requestId: req.id
    });
  }
});

// ✅ 사용자 진단 로그 레벨 설정
app.post('/v1/diagnostics/level', (req, res) => {
  try {
    const { level } = req.body;
    
    if (!level) {
      return res.status(400).json({
        ok: false,
        error: 'level 필드는 필수입니다',
        requestId: req.id
      });
    }
    
    const result = setUserDiagnosticsLevel(level);
    
    if (!result.success) {
      return res.status(400).json({
        ok: false,
        error: result.error,
        requestId: req.id
      });
    }
    
    res.json({
      ok: true,
      data: result,
      requestId: req.id
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: '진단 로그 레벨 설정 실패: ' + error.message,
      requestId: req.id
    });
  }
});

// ✅ 프로젝트 관리 API
app.get('/v1/projects', async (req, res) => {
  try {
    console.log('프로젝트 목록 조회 요청');
    
    // ✅ 새로운 프로젝트 구조: projects 폴더에서 프로젝트 목록 읽기
    const projectsDir = path.resolve(__dirname, '../../projects');
    
    try {
      await fs.access(projectsDir);
    } catch {
      // projects 디렉토리가 없으면 빈 배열 반환
      console.log('📁 projects 디렉토리가 없습니다. 빈 배열 반환');
      return res.json({
        ok: true,
        data: [],
        requestId: req.id
      });
    }
    
    const projectFolders = await fs.readdir(projectsDir);
    const projects = [];
    
    for (const folderName of projectFolders) {
      try {
        const projectDir = path.join(projectsDir, folderName);
        
        // 폴더인지 확인 (파일은 건너뛰기)
        const stats = await fs.stat(projectDir);
        if (!stats.isDirectory()) {
          console.log(`🔍 ${folderName}은(는) 폴더가 아닙니다. 건너뜁니다.`);
          continue;
        }
        
        const projectInfoPath = path.join(projectDir, 'project.json');
        
        // project.json 파일 읽기
        const projectInfoContent = await fs.readFile(projectInfoPath, 'utf8');
        const projectInfo = JSON.parse(projectInfoContent);
        
        // reports 폴더에서 보고서 개수 확인 및 모든 보고서 로드
        const reportsDir = path.join(projectDir, 'reports');
        let reportsCount = 0;
        let allReports = [];
        
        try {
          const reportFiles = await fs.readdir(reportsDir);
          const jsonFiles = reportFiles.filter(file => file.endsWith('.json'));
          reportsCount = jsonFiles.length;
          
          console.log(`🔍 프로젝트 ${projectInfo.name}: ${reportsCount}개 보고서 발견`);
          
          // 모든 보고서 로드 (최근 3개가 아님!)
          if (jsonFiles.length > 0) {
            const sortedFiles = jsonFiles.sort().reverse(); // 최신순 정렬
            
            for (const reportFile of sortedFiles) {
              try {
                const reportPath = path.join(reportsDir, reportFile);
                const reportContent = await fs.readFile(reportPath, 'utf8');
                const report = JSON.parse(reportContent);
                allReports.push({
                  id: report.id,
                  fileName: reportFile,
                  created_at: report.created_at,
                  round: report.visit?.round || 1,
                  // 보고서 전체 내용도 포함 (필요시)
                  ...report
                });
              } catch (err) {
                console.error(`보고서 읽기 오류 (${reportFile}):`, err);
              }
            }
            
            console.log(`🔍 프로젝트 ${projectInfo.name}: ${allReports.length}개 보고서 전체 로드`);
          }
          
        } catch {
          reportsCount = 0;
          console.log(`🔍 프로젝트 ${projectInfo.name}: reports 폴더 접근 실패`);
        }
        
        projects.push({
          ...projectInfo,
          reports_count: reportsCount,
          folder_name: folderName,
          reports: allReports // 모든 보고서 추가
        });
        
      } catch (err) {
        console.error(`프로젝트 정보 읽기 오류 (${folderName}):`, err);
      }
    }
    
    console.log('프로젝트 목록 조회 성공:', { count: projects.length });
    
    res.json({
      ok: true,
      data: projects,
      requestId: req.id
    });
    
  } catch (error) {
    console.error('프로젝트 목록 조회 API 오류:', error);
    
    // ✅ Project TT 가이드라인: Schema-first handling
    res.status(500).json({
      ok: false,
      code: 'PROJECTS_FETCH_FAILED',
      message: '프로젝트 목록 조회에 실패했습니다',
      details: error.message,
      requestId: req.id
    });
  }
});

app.post('/v1/projects', async (req, res) => {
  try {
    const projectData = req.body;
    
    console.log('프로젝트 생성 요청:', projectData);
    
    // ✅ 폴더명 기반 통일: 프로젝트명을 ID로 사용
    const projectName = projectData.name || '미지정프로젝트';
    const projectId = projectName; // 폴더명을 ID로 사용
    
    // 프로젝트 폴더 경로 생성
    const projectsDir = path.resolve(__dirname, '../../projects');
    const projectDir = path.join(projectsDir, projectName);
    const reportsDir = path.join(projectDir, 'reports');
    const attachmentsDir = path.join(projectDir, 'attachments');
    
    try {
      // 프로젝트 폴더 구조 생성
      await fs.mkdir(projectDir, { recursive: true });
      await fs.mkdir(reportsDir, { recursive: true });
      await fs.mkdir(attachmentsDir, { recursive: true });
      
      console.log(`✅ 프로젝트 폴더 구조 생성 완료: ${projectDir}`);
      
      // 프로젝트 정보 파일 저장
      const projectInfo = {
        id: projectId, // 폴더명을 ID로 사용
        name: projectName,
        folder_name: projectName, // 폴더명 명시적 추가
        ...projectData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        folder_path: projectDir,
        reports_count: 0
      };
      
      const projectInfoPath = path.join(projectDir, 'project.json');
      await fs.writeFile(projectInfoPath, JSON.stringify(projectInfo, null, 2), 'utf8');
      
      console.log(`✅ 프로젝트 정보 저장 완료: ${projectInfoPath}`);
      
      res.status(201).json({
        ok: true,
        data: projectInfo,
        requestId: req.id
      });
      
    } catch (mkdirError) {
      console.error('프로젝트 폴더 생성 오류:', mkdirError);
      throw new Error(`프로젝트 폴더 생성 실패: ${mkdirError.message}`);
    }
    
  } catch (error) {
    console.error('프로젝트 생성 API 오류:', error);
    
    // ✅ Project TT 가이드라인: Schema-first handling
    res.status(500).json({
      ok: false,
      code: 'PROJECT_CREATE_FAILED',
      message: '프로젝트 생성에 실패했습니다',
      details: error.message,
      requestId: req.id
    });
  }
});

app.get('/v1/projects/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    console.log(`프로젝트 조회 요청: projectId=${projectId}`);
    
    // ✅ 새로운 구조: projects 폴더에서 프로젝트 찾기
    const projectsDir = path.resolve(__dirname, '../../projects');
    
    try {
      await fs.access(projectsDir);
    } catch {
      return res.status(404).json({
        ok: false,
        code: 'PROJECT_NOT_FOUND',
        message: '프로젝트를 찾을 수 없습니다',
        details: 'projects 디렉토리가 존재하지 않습니다',
        requestId: req.id
      });
    }
    
    const projectFolders = await fs.readdir(projectsDir);
    let foundProject = null;
    
    for (const folderName of projectFolders) {
      try {
        const projectDir = path.join(projectsDir, folderName);
        
        // 폴더인지 확인 (파일은 건너뛰기)
        const stats = await fs.stat(projectDir);
        if (!stats.isDirectory()) {
          console.log(`🔍 ${folderName}은(는) 폴더가 아닙니다. 건너뜁니다.`);
          continue;
        }
        
        const projectInfoPath = path.join(projectDir, 'project.json');
        
        console.log(`🔍 폴더 ${folderName} 검사 중...`);
        
        const projectInfoContent = await fs.readFile(projectInfoPath, 'utf8');
        const projectInfo = JSON.parse(projectInfoContent);
        
        console.log(`🔍 프로젝트 정보: ID=${projectInfo.id}, Name=${projectInfo.name}`);
        
        // ✅ 폴더명 또는 프로젝트 ID로 매칭
        if (projectInfo.id === projectId || folderName === projectId) {
          // reports 폴더에서 보고서 목록 읽기
          const reportsDir = path.join(projectDir, 'reports');
          let reports = [];
          try {
            const reportFiles = await fs.readdir(reportsDir);
            console.log(`🔍 reports 폴더 내용: ${reportFiles.join(', ')}`);
            
            for (const reportFile of reportFiles) {
              if (reportFile.endsWith('.json')) {
                const reportPath = path.join(reportsDir, reportFile);
                const reportContent = await fs.readFile(reportPath, 'utf8');
                const report = JSON.parse(reportContent);
                reports.push(report);
                console.log(`🔍 보고서 읽기 완료: ${reportFile}`);
              }
            }
            
            console.log(`🔍 총 ${reports.length}개 보고서 로드 완료`);
          } catch (error) {
            console.error(`🔍 reports 폴더 읽기 오류:`, error);
            reports = [];
          }
          
          foundProject = {
            ...projectInfo,
            reports: reports,
            reports_count: reports.length
          };
          break;
        }
      } catch (err) {
        console.error(`프로젝트 정보 읽기 오류 (${folderName}):`, err);
      }
    }
    
    if (!foundProject) {
      return res.status(404).json({
        ok: false,
        code: 'PROJECT_NOT_FOUND',
        message: '프로젝트를 찾을 수 없습니다',
        details: `프로젝트 ID ${projectId}에 해당하는 프로젝트가 없습니다`,
        requestId: req.id
      });
    }
    
    console.log('프로젝트 조회 성공:', foundProject);
    
    res.json({
      ok: true,
      data: foundProject,
      requestId: req.id
    });
    
  } catch (error) {
    console.error('프로젝트 조회 API 오류:', error);
    
    // ✅ Project TT 가이드라인: Schema-first handling - execution failure → 5xx
    res.status(500).json({
      ok: false,
      code: 'PROJECT_FETCH_FAILED',
      message: '프로젝트 조회에 실패했습니다',
      details: error.message,
      requestId: req.id
    });
  }
});

// ✅ Project TT 가이드라인: 보고서 삭제 API
app.delete('/v1/projects/:projectId/reports/:reportId', async (req, res) => {
  try {
    const { projectId, reportId } = req.params;
    
    console.log(`보고서 삭제 요청: projectId=${projectId}, reportId=${reportId}`);
    
    // ✅ 도메인 함수 직접 호출 (router → router 금지)
    const projectManager = getProjectManager();
    const result = await projectManager.deleteReportFromProject(projectId, reportId);
    
    console.log('보고서 삭제 성공:', result);
    
    res.json({
      ok: true,
      data: result,
      requestId: req.id
    });
  } catch (error) {
    console.error('보고서 삭제 API 오류:', {
      projectId: req.params.projectId,
      reportId: req.params.reportId,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      ok: false,
      error: '보고서 삭제 실패: ' + error.message,
      requestId: req.id
    });
  }
});

// ✅ Project TT 가이드라인: 여러 보고서 일괄 삭제 API
app.delete('/v1/projects/:projectId/reports', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { reportIds } = req.body;
    
    if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
      return res.status(400).json({
        ok: false,
        error: '삭제할 보고서 ID 목록이 필요합니다',
        requestId: req.id
      });
    }
    
    // ✅ 도메인 함수 직접 호출 (router → router 금지)
    const projectManager = getProjectManager();
    const result = await projectManager.deleteMultipleReports(projectId, reportIds);
    
    res.json({
      ok: true,
      data: result,
      requestId: req.id
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: '보고서 일괄 삭제 실패: ' + error.message,
      requestId: req.id
    });
  }
});

app.put('/v1/projects/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const updateData = req.body;
    
    console.log(`프로젝트 수정 요청: projectId=${projectId}`, updateData);
    
    // ✅ Project TT 가이드라인: 도메인 함수 직접 호출 (router → router 금지)
    const projectManager = getProjectManager();
    const project = await projectManager.updateProject(projectId, updateData);
    
    if (!project) {
      return res.status(404).json({
        ok: false,
        code: 'PROJECT_NOT_FOUND',
        message: '프로젝트를 찾을 수 없습니다',
        requestId: req.id
      });
    }
    
    console.log('프로젝트 수정 성공:', project);
    
    res.json({
      ok: true,
      data: project,
      requestId: req.id
    });
  } catch (error) {
    console.error('프로젝트 수정 API 오류:', error);
    
    // ✅ Project TT 가이드라인: Schema-first handling
    res.status(500).json({
      ok: false,
      code: 'PROJECT_UPDATE_FAILED',
      message: '프로젝트 수정에 실패했습니다',
      details: error.message,
      requestId: req.id
    });
  }
});

app.delete('/v1/projects/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    console.log(`프로젝트 삭제 요청: projectId=${projectId}`);
    
    // ✅ Project TT 가이드라인: 도메인 함수 직접 호출 (router → router 금지)
    const projectManager = getProjectManager();
    const result = await projectManager.deleteProject(projectId);
    
    console.log('프로젝트 삭제 성공:', result);
    
    res.json({
      ok: true,
      message: '프로젝트가 삭제되었습니다',
      requestId: req.id
    });
  } catch (error) {
    console.error('프로젝트 삭제 API 오류:', {
      projectId: req.params.projectId,
      error: error.message,
      stack: error.stack
    });
    
    // ✅ Project TT 가이드라인: Schema-first handling
    res.status(500).json({
      ok: false,
      code: 'PROJECT_DELETE_FAILED',
      message: '프로젝트 삭제에 실패했습니다',
      details: error.message,
      requestId: req.id
    });
  }
});

// ✅ 보고서 관련 API는 routes.report.js에서 처리

// ✅ 프로젝트 관리 API
// 프로젝트 목록 조회
app.get('/v1/projects', async (req, res) => {
  try {
    // 임시로 하드코딩된 프로젝트 데이터 반환
    const projects = {
      "project_1756106632940_88ueo0uvn": {
        id: "project_1756106632940_88ueo0uvn",
        name: "샘플 프로젝트",
        description: "샘플 프로젝트 설명",
        location: "서울시 강남구",
        client: "샘플 클라이언트",
        startDate: "2025-01-01",
        endDate: "2025-12-31",
        status: "active",
        type: "construction",
        safetyManager: "홍길동",
        reports: []
      }
    };
    
    res.json(projects);
  } catch (error) {
    console.error('프로젝트 목록 조회 오류:', error);
    res.status(500).json({
      ok: false,
      error: '프로젝트 목록 조회 중 오류가 발생했습니다',
      requestId: req.id
    });
  }
});

// 특정 프로젝트 조회
app.get('/v1/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 임시로 하드코딩된 프로젝트 데이터 반환
    const project = {
      id: id,
      name: "샘플 프로젝트",
      description: "샘플 프로젝트 설명",
      location: "서울시 강남구",
      client: "샘플 클라이언트",
      startDate: "2025-01-01",
      endDate: "2025-12-31",
      status: "active",
      type: "construction",
      safetyManager: "홍길동",
      reports: []
    };
    
    res.json(project);
  } catch (error) {
    console.error('프로젝트 조회 오류:', error);
    res.status(500).json({
      ok: false,
      error: '프로젝트 조회 중 오류가 발생했습니다',
      requestId: req.id
    });
  }
});

// 프로젝트 생성
app.post('/v1/projects', async (req, res) => {
  try {
    const projectData = req.body;
    const projectName = projectData.name || '미지정프로젝트';
    const newProject = {
      id: projectName, // ✅ 폴더명을 ID로 사용
      ...projectData,
      reports: [],
      createdAt: new Date().toISOString()
    };
    
    res.status(201).json(newProject);
  } catch (error) {
    console.error('프로젝트 생성 오류:', error);
    res.status(500).json({
      ok: false,
      error: '프로젝트 생성 중 오류가 발생했습니다',
      requestId: req.id
    });
  }
});

// 프로젝트 수정
app.put('/v1/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedProject = {
      id: id,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    res.json(updatedProject);
  } catch (error) {
    console.error('프로젝트 수정 오류:', error);
    res.status(500).json({
      ok: false,
      error: '프로젝트 수정 중 오류가 발생했습니다',
      requestId: req.id
    });
  }
});

// 프로젝트 삭제
app.delete('/v1/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    res.json({
      ok: true,
      message: `프로젝트 ${id}가 삭제되었습니다`
    });
  } catch (error) {
    console.error('프로젝트 삭제 오류:', error);
    res.status(500).json({
      ok: false,
      error: '프로젝트 삭제 중 오류가 발생했습니다',
      requestId: req.id
    });
  }
});

// 프로젝트에 보고서 추가
app.post('/v1/projects/:id/reports', async (req, res) => {
  try {
    const { id } = req.params;
    const reportData = req.body;
    
    const newReport = {
      id: `report_${Date.now()}`, // ✅ UUID 제거, 타임스탬프만 사용
      projectId: id,
      ...reportData,
      createdAt: new Date().toISOString()
    };
    
    res.status(201).json(newReport);
  } catch (error) {
    console.error('보고서 추가 오류:', error);
    res.status(500).json({
      ok: false,
      error: '보고서 추가 중 오류가 발생했습니다',
      requestId: req.id
    });
  }
});

// 프로젝트의 보고서 목록 조회
app.get('/v1/projects/:id/reports', async (req, res) => {
  try {
    const { id } = req.params;
    
    // ✅ 실제 프로젝트 폴더에서 보고서 파일들을 읽어서 반환
    const projectsDir = path.resolve(__dirname, '../../projects');
    const projectDir = path.join(projectsDir, id);
    const reportsDir = path.join(projectDir, 'reports');
    
    console.log(`🔍 프로젝트 ${id}의 보고서 목록 조회:`);
    console.log(`  - 프로젝트 폴더: ${projectDir}`);
    console.log(`  - 보고서 폴더: ${reportsDir}`);
    
    try {
      // reports 디렉토리 존재 확인
      await fs.access(reportsDir);
      
      // 보고서 파일들 읽기
      const files = await fs.readdir(reportsDir);
      const reports = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const reportPath = path.join(reportsDir, file);
            const reportData = await fs.readFile(reportPath, 'utf8');
            const report = JSON.parse(reportData);
            reports.push(report);
          } catch (fileError) {
            console.error(`보고서 파일 ${file} 읽기 실패:`, fileError.message);
          }
        }
      }
      
      // 생성일 기준으로 정렬 (최신순)
      reports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      console.log(`✅ 프로젝트 ${id}: ${reports.length}개 보고서 발견`);
      
      res.json({
        ok: true,
        data: reports,
        requestId: req.id
      });
      
    } catch (dirError) {
      // reports 디렉토리가 없으면 빈 배열 반환
      console.log(`📁 프로젝트 ${id}의 reports 디렉토리가 없습니다.`);
      res.json({
        ok: true,
        data: [],
        requestId: req.id
      });
    }
    
  } catch (error) {
    console.error('프로젝트 보고서 목록 조회 오류:', error);
    res.status(500).json({
      ok: false,
      error: '프로젝트 보고서 목록 조회 중 오류가 발생했습니다',
      details: error.message,
      requestId: req.id
    });
  }
});

// ✅ 핵심 보고서 생성 API: POST /v1/reports?output=pdf|html
app.post('/v1/reports', async (req, res) => {
  try {
    const { output = 'pdf', ...reportData } = req.body;
    
    if (!reportData || Object.keys(reportData).length === 0) {
      return res.status(400).json({ 
        ok: false, 
        code: 'MISSING_DATA',
        message: '보고서 데이터를 입력해주세요.',
        details: { required: ['site', 'org', 'visit'] }
      });
    }

    console.log('🔍 /v1/reports 엔드포인트 호출됨:', { output, reportData });

    // ✅ 1단계: 보고서 JSON 저장 (프로젝트 폴더에)
    let savedReportId = null;
    let savedFileName = null;
    
    if (reportData.projectId) {
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        
        // FileNameGenerator import
        const { FileNameGenerator } = await import('../../core/utils.js');
        
        // ✅ Project TT 가이드라인: findProject() 함수를 사용하여 프로젝트 검색
        const projectManager = getProjectManager();
        const { project, actualProjectId } = await projectManager.findProject(reportData.projectId);
        
        let projectDir = null;
        let projectName = '미지정프로젝트';
        
        if (project) {
          // 프로젝트를 찾았으면 해당 폴더 경로 구성
          const projectsDir = path.resolve(__dirname, '../../projects');
          projectDir = path.join(projectsDir, project.folder_name || project.name || actualProjectId);
          projectName = project.name || project.folder_name || actualProjectId;
          
          console.log(`✅ 프로젝트 찾음: ${projectName} (${projectDir})`, {
            search_id: reportData.projectId,
            actual_id: actualProjectId,
            folder_name: project.folder_name,
            name: project.name
          });
        } else {
          console.error(`❌ 프로젝트를 찾을 수 없음: ${reportData.projectId}`);
          console.log(`🔍 사용 가능한 프로젝트들:`, Array.from(projectManager.projects.values()).map(p => ({ id: p.id, name: p.name, folder_name: p.folder_name })));
        }
        
        if (projectDir) {
          // reports 디렉토리 생성
          const reportsDir = path.join(projectDir, 'reports');
          await fs.mkdir(reportsDir, { recursive: true });
          console.log(`📁 reports 디렉토리 생성/확인: ${reportsDir}`);
          
          // ✅ FileNameGenerator 사용하여 올바른 파일명 생성
          const fileName = FileNameGenerator.generateReportFileName({
            visitRound: reportData.visit?.round || 1,
            projectName: projectName,
            extension: 'json'
          });
          
          const filePath = path.join(reportsDir, fileName);
          console.log(`📄 생성된 파일명: ${fileName}`);
          console.log(`📄 전체 파일 경로: ${filePath}`);
          
          // 중복 파일 검사
          const fileExists = await FileNameGenerator.checkFileExists(filePath);
          if (fileExists) {
            console.warn(`⚠️ 중복 파일 발견: ${fileName}`);
            // 중복 시 타임스탬프 추가
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const uniqueFileName = fileName.replace('.json', `_${timestamp}.json`);
            const uniqueFilePath = path.join(reportsDir, uniqueFileName);
            
            console.log(`📄 중복 방지 파일명: ${uniqueFileName}`);
            const reportToSave = {
              id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              ...reportData,
              projectId: reportData.projectId,
              projectName: projectName,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            await fs.writeFile(uniqueFilePath, JSON.stringify(reportToSave, null, 2), 'utf8');
            console.log(`✅ 중복 방지 보고서 JSON 저장 완료: ${uniqueFilePath}`);
            
            savedReportId = reportToSave.id;
            savedFileName = uniqueFileName;
          } else {
            // 보고서 데이터 구성
            const reportToSave = {
              id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              ...reportData,
              projectId: reportData.projectId,
              projectName: projectName,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            // JSON 파일 저장
            await fs.writeFile(filePath, JSON.stringify(reportToSave, null, 2), 'utf8');
            console.log(`✅ 보고서 JSON 저장 완료: ${filePath}`);
            console.log(`📊 저장된 데이터 크기: ${JSON.stringify(reportToSave).length} bytes`);
            
            savedReportId = reportToSave.id;
            savedFileName = fileName;
          }
          
          // 프로젝트 정보 업데이트
          try {
            const projectInfoPath = path.join(projectDir, 'project.json');
            const existingProjectInfo = JSON.parse(await fs.readFile(projectInfoPath, 'utf8'));
            
            // reports 폴더에서 실제 보고서 개수 다시 계산
            const currentReportFiles = await fs.readdir(reportsDir);
            const currentJsonFiles = currentReportFiles.filter(file => file.endsWith('.json'));
            const currentReportsCount = currentJsonFiles.length;
            
            existingProjectInfo.reports_count = currentReportsCount;
            existingProjectInfo.updated_at = new Date().toISOString();
            
            await fs.writeFile(projectInfoPath, JSON.stringify(existingProjectInfo, null, 2), 'utf8');
            console.log(`✅ 프로젝트 정보 업데이트 완료: reports_count = ${currentReportsCount}`);
            
          } catch (updateError) {
            console.warn('⚠️ 프로젝트 정보 업데이트 실패:', updateError);
          }
        } else {
          console.warn(`⚠️ 프로젝트 폴더를 찾을 수 없음: ${reportData.projectId}`);
        }
      } catch (saveError) {
        console.error('❌ 보고서 JSON 저장 실패:', saveError);
        // 저장 실패해도 계속 진행
      }
    } else {
      console.log('⚠️ projectId가 없어서 JSON 저장 건너뜀');
    }

    // ✅ 2단계: 도메인 함수 직접 호출 (router → router 금지)
    try {
      const { UnifiedReportService } = await import('../../core/unified_report_service.js');
      
      if (output === 'html') {
        // HTML 생성
        const html = await UnifiedReportService.generateHTML(reportData);
        res.json({
          ok: true,
          message: 'HTML이 성공적으로 생성되었습니다.',
          data: {
            id: savedReportId,
            html: html,
            output: 'html',
            fileName: savedFileName,
            timestamp: new Date().toISOString()
          },
          requestId: req.id
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
            ok: false,
            code: 'PDF_GENERATION_FAILED',
            message: 'PDF 생성에 실패했습니다.',
            details: { error: pdfResult.error },
            requestId: req.id
          });
        }
        
        res.json({
          ok: true,
          message: 'PDF가 성공적으로 생성되었습니다.',
          data: {
            id: savedReportId,
            output: 'pdf',
            filename: pdfResult.filename,
            fileName: savedFileName,
            download_url: pdfResult.url,
            timestamp: new Date().toISOString()
          },
          requestId: req.id
        });
      }
    } catch (serviceError) {
      console.error('❌ 서비스 호출 오류:', serviceError);
      return res.status(500).json({
        ok: false,
        code: 'SERVICE_ERROR',
        message: '보고서 생성 서비스 오류가 발생했습니다.',
        details: { error: serviceError.message },
        requestId: req.id
      });
    }

  } catch (error) {
    console.error('❌ /v1/reports 오류:', error);
    res.status(500).json({
      ok: false,
      code: 'INTERNAL_ERROR',
      message: '보고서 생성 중 오류가 발생했습니다.',
      details: { error: error.message },
      requestId: req.id
    });
  }
});

// ✅ 보고서 저장 API (프로젝트별 저장)
app.post('/v1/reports/save', async (req, res) => {
  try {
    const reportData = req.body;
    
    console.log('🔍 받은 보고서 데이터:', reportData);
    console.log('🔍 projectId:', reportData.projectId);
    console.log('🔍 projectName:', reportData.projectName);
    
    // 고유 ID 생성
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 저장할 데이터 구성
    const reportToSave = {
      id: reportId,
      ...reportData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // ✅ 새로운 구조: 프로젝트 폴더 내 reports 디렉토리에 저장
    const projectsDir = path.resolve(__dirname, '../../projects');
    
    // ✅ projectId를 사용하여 기존 프로젝트 폴더 찾기
    let projectDir;
    if (reportData.projectId) {
      // projectId로 기존 프로젝트 폴더 찾기
      const items = await fs.readdir(projectsDir);
      for (const item of items) {
        if (!item.includes('.')) { // 폴더만 확인
          try {
            const projectPath = path.join(projectsDir, item, 'project.json');
            const projectData = await fs.readFile(projectPath, 'utf8');
            const project = JSON.parse(projectData);
            if (project.id === reportData.projectId) {
              projectDir = path.join(projectsDir, item);
              break;
            }
          } catch (error) {
            console.log(`프로젝트 ${item} 로드 실패:`, error.message);
          }
        }
      }
    }
    
    // projectId로 찾지 못한 경우 projectName 사용
    if (!projectDir) {
      projectDir = path.join(projectsDir, reportData.projectName || '미지정프로젝트');
    }
    
    const reportsDir = path.join(projectDir, 'reports');
    
    console.log('🔍 프로젝트 폴더 경로 계산:');
    console.log('  - projectsDir:', projectsDir);
    console.log('  - projectId:', reportData.projectId);
    console.log('  - projectName:', reportData.projectName);
    console.log('  - projectDir:', projectDir);
    console.log('  - reportsDir:', reportsDir);
    
    try {
      // 프로젝트 폴더와 reports 디렉토리 확인
      await fs.access(projectDir);
      console.log(`✅ 프로젝트 폴더 존재: ${projectDir}`);
    } catch {
      console.log(`📁 프로젝트 폴더 생성 중: ${projectDir}`);
      await fs.mkdir(projectDir, { recursive: true });
      console.log(`✅ 프로젝트 폴더 생성 완료: ${projectDir}`);
    }
    
    try {
      await fs.access(reportsDir);
      console.log(`✅ reports 디렉토리 존재: ${reportsDir}`);
    } catch {
      console.log(`📁 reports 디렉토리 생성 중: ${reportsDir}`);
      await fs.mkdir(reportsDir, { recursive: true });
      console.log(`✅ reports 디렉토리 생성 완료: ${reportsDir}`);
    }
    
    // JSON 파일로 저장 - 새로운 파일명 생성 로직 적용
    const fileName = FileNameGenerator.generateReportFileName({
      visitRound: reportData.visit?.round || 1,
      projectName: reportData.projectName || '미지정프로젝트',
      extension: 'json'
    });
    
    const filePath = path.join(reportsDir, fileName);
    const absolutePath = path.resolve(filePath);
    
    // 중복 파일 검사
    const fileExists = await FileNameGenerator.checkFileExists(filePath);
    if (fileExists) {
      return res.status(409).json({
        success: false,
        error: '중복된 보고서가 있습니다',
        code: 'DUPLICATE_REPORT',
        details: {
          fileName: fileName,
          existingPath: filePath,
          message: '동일한 방문차수와 프로젝트명의 보고서가 이미 존재합니다.'
        },
        requestId: req.id
      });
    }
    
    console.log(`💾 파일 저장 시작:`);
    console.log(`  - 상대 경로: ${filePath}`);
    console.log(`  - 절대 경로: ${absolutePath}`);
    
    await fs.writeFile(filePath, JSON.stringify(reportToSave, null, 2), 'utf8');
    
    // 파일 저장 확인
    try {
      const stats = await fs.stat(filePath);
      console.log(`✅ 파일 저장 완료: ${fileName}`);
      console.log(`  - 파일 크기: ${stats.size} bytes`);
      console.log(`  - 생성 시간: ${stats.birthtime}`);
    } catch (statError) {
      console.error(`❌ 파일 저장 확인 실패:`, statError);
    }
    
    // ✅ 보고서 저장 후 프로젝트 정보 업데이트
    try {
      const projectInfoPath = path.join(projectDir, 'project.json');
      const existingProjectInfo = JSON.parse(await fs.readFile(projectInfoPath, 'utf8'));
      
      // reports 폴더에서 실제 보고서 개수 다시 계산
      const currentReportFiles = await fs.readdir(reportsDir);
      const currentJsonFiles = currentReportFiles.filter(file => file.endsWith('.json'));
      const currentReportsCount = currentJsonFiles.length;
      
      existingProjectInfo.reports_count = currentReportsCount;
      existingProjectInfo.updated_at = new Date().toISOString();
      
      await fs.writeFile(projectInfoPath, JSON.stringify(existingProjectInfo, null, 2), 'utf8');
      console.log(`✅ 프로젝트 정보 업데이트 완료: reports_count = ${currentReportsCount}`);
      
    } catch (updateError) {
      console.warn('⚠️ 프로젝트 정보 업데이트 실패:', updateError);
      // 업데이트 실패해도 보고서 저장은 성공으로 처리
    }
    
    res.status(201).json({
      ok: true,
      data: {
        id: reportId,
        fileName: fileName,
        message: '보고서가 성공적으로 저장되었습니다'
      },
      requestId: req.id
    });
    
  } catch (error) {
    console.error('보고서 저장 오류:', error);
    res.status(500).json({
      ok: false,
      error: '보고서 저장에 실패했습니다',
      details: error.message,
      requestId: req.id
    });
  }
});



// ✅ 보고서 PDF 생성 API는 routes.report.js에서 처리

// ✅ 보고서 라우터 마운트
app.use('/v1', reportRouter);

// ✅ 라우트 가드 적용 (레거시 엔드포인트 차단)
app.use(routeGuard);

// ✅ 404 핸들러
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: 'API 엔드포인트를 찾을 수 없습니다',
    requestId: req.id,
    path: req.path,
    method: req.method
  });
});

// ✅ 에러 핸들러
app.use((error, req, res, next) => {
  console.error(`[${req.id}] 서버 오류:`, error);

  res.status(500).json({
    ok: false,
    error: '서버 내부 오류가 발생했습니다',
    requestId: req.id
  });
});

// ✅ 서버 시작
const server = app.listen(PORT, () => {
  console.log(`🚀 HTTP API 서버가 http://localhost:${PORT} 에서 실행중입니다`);
  console.log(`📋 헬스체크: http://localhost:${PORT}/healthz`);
  console.log(`📋 메트릭스: http://localhost:${PORT}/metrics`);
  console.log(`📋 성능 모니터링: http://localhost:${PORT}/v1/performance`);
  console.log(`📋 사용자 진단: http://localhost:${PORT}/v1/diagnostics`);
  console.log(`📋 샘플 DTO: http://localhost:${PORT}/v1/samples/dto`);
  console.log(`📋 프로젝트 관리: GET/POST/PUT/DELETE http://localhost:${PORT}/v1/projects`);
  console.log(`📋 보고서 저장소: GET http://localhost:${PORT}/v1/reports`);
  console.log(`📋 검증 API: POST http://localhost:${PORT}/v1/reports/validate`);
  console.log(`📋 생성 API: POST http://localhost:${PORT}/v1/reports`);
  
  // ✅ 디버깅 정보 추가
  console.log(`🔍 현재 작업 디렉토리: ${process.cwd()}`);
  console.log(`🔍 __dirname: ${__dirname}`);
  console.log(`🔍 projects 디렉토리 예상 경로: ${path.resolve(__dirname, '../../projects')}`);
  console.log(`🔍 새로운 구조: projects/프로젝트명/reports/보고서.json`);
});

// ✅ Graceful shutdown
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