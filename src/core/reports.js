/**
 * 보고서 도메인 함수
 * Project TT 가이드라인: 도메인 함수 직접 호출 (내부 fetch 금지)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { ValidationError, NotFoundError } from '../adapters/http/middleware/error-handler.js';
import logger from './logger.js';
import { FileNameGenerator } from '../../core/utils.js';
import { getProjectManager } from '../../core/project_manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ updateProjectInfo 함수 구현
async function updateProjectInfo(projectDir, reportsDir) {
  try {
    const projectJsonPath = path.join(projectDir, 'project.json');
    const projectData = await fs.readFile(projectJsonPath, 'utf8');
    const project = JSON.parse(projectData);
    
    // reports 폴더의 파일 개수 계산
    const reportFiles = await fs.readdir(reportsDir);
    const jsonFiles = reportFiles.filter(file => file.endsWith('.json'));
    
    // 프로젝트 정보 업데이트
    project.reports_count = jsonFiles.length;
    project.updated_at = new Date().toISOString();
    
    // 업데이트된 프로젝트 정보 저장
    await fs.writeFile(projectJsonPath, JSON.stringify(project, null, 2), 'utf8');
    
    logger.info('프로젝트 정보 업데이트 완료', { 
      projectName: project.name, 
      reportsCount: project.reports_count 
    });
  } catch (error) {
    logger.warn('프로젝트 정보 업데이트 실패', { error: error.message });
  }
}

/**
 * 보고서 생성 및 저장 (통합)
 * Project TT 가이드라인: 단일 함수에서 모든 처리
 */
export async function createReport(reportData, options = {}) {
  try {
    const { userId, projectId } = options;
    
    // ✅ 1단계: 고유 ID 생성
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // ✅ 2단계: 저장할 데이터 구성
    const reportToSave = {
      id: reportId,
      ...reportData,
      projectId: projectId, // 프로젝트 ID 추가
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // ✅ 3단계: 프로젝트 폴더 찾기 (ID 기반)
    const projectsDir = path.resolve(__dirname, '../../projects');
    let projectDir = null;
    let projectName = '미지정프로젝트';
    
    // 프로젝트 ID로 폴더 찾기
    if (projectId) {
      try {
        const projectFolders = await fs.readdir(projectsDir);
        for (const folder of projectFolders) {
          const projectPath = path.join(projectsDir, folder);
          const projectJsonPath = path.join(projectPath, 'project.json');
          
          try {
            const projectData = await fs.readFile(projectJsonPath, 'utf8');
            const project = JSON.parse(projectData);
            
            if (project.id === projectId) {
              projectDir = projectPath;
              projectName = project.name || folder;
              console.log(`✅ 프로젝트 폴더 찾음: ${projectName} (${projectDir})`);
              break;
            }
          } catch (err) {
            // project.json 파일이 없거나 파싱 오류는 무시
            continue;
          }
        }
      } catch (err) {
        console.warn('프로젝트 폴더 검색 중 오류:', err);
      }
    }
    
    // 프로젝트 폴더를 찾지 못한 경우 기본값 사용
    if (!projectDir) {
      projectDir = path.join(projectsDir, projectName);
      console.log(`⚠️ 프로젝트 폴더를 찾지 못함, 기본 폴더 사용: ${projectDir}`);
    }
    
    // ✅ 4단계: reports 디렉토리 생성
    const reportsDir = path.join(projectDir, 'reports');
    console.log(`📁 reports 디렉토리 생성: ${reportsDir}`);
    await fs.mkdir(reportsDir, { recursive: true });
    
    // 파일명 생성
    const fileName = FileNameGenerator.generateReportFileName({
      visitRound: reportData.visit?.round || 1,
      projectName: projectName,
      extension: 'json'
    });
    
    const filePath = path.join(reportsDir, fileName);
    console.log(`📄 파일 경로: ${filePath}`);
    
    // 중복 검사
    const fileExists = await FileNameGenerator.checkFileExists(filePath);
    if (fileExists) {
      throw new Error(`중복된 보고서가 있습니다: ${fileName}`);
    }
    
    // JSON 파일 저장
    console.log(`💾 JSON 파일 저장 시작...`);
    console.log(`📊 저장할 데이터 크기: ${JSON.stringify(reportToSave).length} bytes`);
    await fs.writeFile(filePath, JSON.stringify(reportToSave, null, 2), 'utf8');
    console.log(`✅ JSON 파일 저장 완료: ${filePath}`);
    
    // 프로젝트 정보 업데이트
    console.log(`🔄 프로젝트 정보 업데이트 시작...`);
    await updateProjectInfo(projectDir, reportsDir);
    console.log(`✅ 프로젝트 정보 업데이트 완료`);
    
    logger.info('보고서 생성 및 저장 완료', { 
      reportId, 
      fileName, 
      projectName: projectName,
      projectPath: projectDir,
      projectId: projectId
    });
    
    return {
      id: reportId,
      fileName: fileName,
      projectPath: projectDir,
      projectName: projectName,
      projectId: projectId,
      message: `보고서가 프로젝트 "${projectName}"에 성공적으로 저장되었습니다`
    };
    
  } catch (error) {
    logger.error('보고서 생성 실패', { error: error.message, reportData });
    throw new Error(`보고서 생성에 실패했습니다: ${error.message}`);
  }
}

/**
 * 보고서 조회
 */
export async function getReport(reportId, projectId) {
  try {
    const projectsDir = path.resolve(__dirname, '../../projects');
    const projectDir = path.join(projectsDir, projectId);
    const reportPath = path.join(projectDir, 'reports', `${reportId}.json`);
    
    const reportData = await fs.readFile(reportPath, 'utf8');
    const report = JSON.parse(reportData);
    
    return report;
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new NotFoundError('보고서를 찾을 수 없습니다');
    }
    throw new Error(`보고서 조회에 실패했습니다: ${error.message}`);
  }
}

/**
 * 보고서 목록 조회
 */
export async function getReports(filters = {}) {
  try {
    const {
      projectId,
      startDate,
      endDate,
      type,
      status,
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = filters;
    
    const projectsDir = path.resolve(__dirname, '../../projects');
    let reports = [];
    
    if (projectId) {
      // 특정 프로젝트의 보고서만 조회
      const projectDir = path.join(projectsDir, projectId);
      const reportsDir = path.join(projectDir, 'reports');
      
      try {
        const files = await fs.readdir(reportsDir);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        for (const file of jsonFiles) {
          const reportPath = path.join(reportsDir, file);
          const content = await fs.readFile(reportPath, 'utf8');
          const report = JSON.parse(content);
          reports.push({
            ...report,
            fileName: file,
            filePath: reportPath
          });
        }
      } catch (error) {
        // 프로젝트가 없거나 reports 디렉토리가 없는 경우
        return { reports: [], total: 0, page, limit };
      }
    } else {
      // 모든 프로젝트의 보고서 조회
      const projectFolders = await fs.readdir(projectsDir);
      
      for (const folderName of projectFolders) {
        try {
          const projectDir = path.join(projectsDir, folderName);
          const stats = await fs.stat(projectDir);
          
          if (!stats.isDirectory()) continue;
          
          const reportsDir = path.join(projectDir, 'reports');
          
          try {
            const reportFiles = await fs.readdir(reportsDir);
            const jsonFiles = reportFiles.filter(file => file.endsWith('.json'));
            
            for (const reportFile of jsonFiles) {
              try {
                const reportPath = path.join(reportsDir, reportFile);
                const reportContent = await fs.readFile(reportPath, 'utf8');
                const report = JSON.parse(reportContent);
                reports.push({
                  ...report,
                  fileName: reportFile,
                  filePath: reportPath,
                  projectFolder: folderName
                });
              } catch (err) {
                logger.warn('보고서 파일 읽기 실패', { file: reportFile, error: err.message });
              }
            }
          } catch (error) {
            // reports 디렉토리가 없는 경우 무시
            continue;
          }
        } catch (err) {
          logger.warn('프로젝트 폴더 접근 실패', { folder: folderName, error: err.message });
        }
      }
    }
    
    // 필터링
    if (startDate) {
      reports = reports.filter(report => new Date(report.created_at) >= new Date(startDate));
    }
    if (endDate) {
      reports = reports.filter(report => new Date(report.created_at) <= new Date(endDate));
    }
    if (type) {
      reports = reports.filter(report => report.type === type);
    }
    if (status) {
      reports = reports.filter(report => report.status === status);
    }
    
    // 정렬
    reports.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    // 페이징
    const total = reports.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedReports = reports.slice(startIndex, endIndex);
    
    return {
      reports: paginatedReports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
    
  } catch (error) {
    logger.error('보고서 목록 조회 실패', { error: error.message, filters });
    throw new Error(`보고서 목록 조회에 실패했습니다: ${error.message}`);
  }
}

/**
 * 보고서 업데이트
 */
export async function updateReport(reportId, updateData, options = {}) {
  try {
    const { userId } = options;
    
    // 기존 보고서 조회
    const existingReport = await getReport(reportId, updateData.projectId);
    
    // 업데이트된 데이터 구성
    const updatedReport = {
      ...existingReport,
      ...updateData,
      updated_by: userId,
      updated_at: new Date().toISOString()
    };
    
    // 파일 저장
    const projectsDir = path.resolve(__dirname, '../../projects');
    const projectDir = path.join(projectsDir, updateData.projectName || existingReport.projectName);
    const reportsDir = path.join(projectDir, 'reports');
    const reportPath = path.join(reportsDir, `${reportId}.json`);
    
    await fs.writeFile(reportPath, JSON.stringify(updatedReport, null, 2), 'utf8');
    
    logger.info('보고서 업데이트 완료', { reportId, projectName: updateData.projectName });
    
    return updatedReport;
    
  } catch (error) {
    logger.error('보고서 업데이트 실패', { error: error.message, reportId, updateData });
    throw new Error(`보고서 업데이트에 실패했습니다: ${error.message}`);
  }
}

/**
 * 보고서 삭제
 */
export async function deleteReport(reportId, projectId) {
  try {
    const projectsDir = path.resolve(__dirname, '../../projects');
    const projectDir = path.join(projectsDir, projectId);
    const reportPath = path.join(projectDir, 'reports', `${reportId}.json`);
    
    // 파일 삭제
    await fs.unlink(reportPath);
    
    // 프로젝트 정보 업데이트
    const reportsDir = path.join(projectDir, 'reports');
    await updateProjectInfo(projectDir, reportsDir);
    
    logger.info('보고서 삭제 완료', { reportId, projectId });
    
    return { message: '보고서가 성공적으로 삭제되었습니다' };
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new NotFoundError('보고서를 찾을 수 없습니다');
    }
    throw new Error(`보고서 삭제에 실패했습니다: ${error.message}`);
  }
}

/**
 * 보고서 검색
 */
export async function searchReports(searchQuery, filters = {}) {
  try {
    const { projectId, startDate, endDate, type, page = 1, limit = 20 } = filters;
    
    // 기본 보고서 목록 조회
    const reportsResult = await getReports({
      projectId,
      startDate,
      endDate,
      type,
      page: 1,
      limit: 1000 // 검색을 위해 충분한 데이터 로드
    });
    
    // 검색어로 필터링
    const searchTerm = searchQuery.toLowerCase();
    const filteredReports = reportsResult.reports.filter(report => {
      const searchableFields = [
        report.title,
        report.projectName,
        report.site?.name,
        report.org?.name,
        report.safetyManager,
        report.specificObservations
      ].filter(Boolean).join(' ').toLowerCase();
      
      return searchableFields.includes(searchTerm);
    });
    
    // 페이징
    const total = filteredReports.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedReports = filteredReports.slice(startIndex, endIndex);
    
    return {
      reports: paginatedReports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      searchQuery
    };
    
  } catch (error) {
    logger.error('보고서 검색 실패', { error: error.message, searchQuery, filters });
    throw new Error(`보고서 검색에 실패했습니다: ${error.message}`);
  }
}

/**
 * 보고서 내보내기
 */
export async function exportReports(reportIds, format, options = {}) {
  try {
    const { includeAttachments = false, template } = options;
    
    // 보고서 데이터 수집
    const reports = [];
    for (const reportId of reportIds) {
      try {
        // reportId에서 projectId 추출 (파일명에서)
        const projectId = reportId.split('_')[2]; // 임시 로직, 실제로는 더 정교해야 함
        const report = await getReport(reportId, projectId);
        reports.push(report);
      } catch (error) {
        logger.warn('보고서 내보내기 중 일부 보고서 로드 실패', { reportId, error: error.message });
      }
    }
    
    if (reports.length === 0) {
      throw new Error('내보낼 수 있는 보고서가 없습니다');
    }
    
    // 형식별 처리
    switch (format) {
      case 'json':
        return {
          format: 'json',
          data: JSON.stringify(reports, null, 2),
          filename: `reports_${Date.now()}.json`
        };
        
      case 'csv':
        const csvData = convertToCSV(reports);
        return {
          format: 'csv',
          data: csvData,
          filename: `reports_${Date.now()}.csv`
        };
        
      case 'pdf':
        // PDF 생성 로직 (별도 구현 필요)
        throw new Error('PDF 내보내기는 아직 구현되지 않았습니다');
        
      default:
        throw new Error(`지원하지 않는 형식입니다: ${format}`);
    }
    
  } catch (error) {
    logger.error('보고서 내보내기 실패', { error: error.message, reportIds, format });
    throw new Error(`보고서 내보내기에 실패했습니다: ${error.message}`);
  }
}

/**
 * CSV 변환 헬퍼 함수
 */
function convertToCSV(reports) {
  if (reports.length === 0) return '';
  
  const headers = ['ID', '제목', '프로젝트명', '현장명', '업체명', '생성일', '상태'];
  const rows = reports.map(report => [
    report.id,
    report.title || '',
    report.projectName || '',
    report.site?.name || '',
    report.org?.name || '',
    report.created_at || '',
    report.status || ''
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  
  return csvContent;
}
