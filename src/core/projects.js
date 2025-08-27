/**
 * 프로젝트 도메인 함수
 * Project TT 가이드라인: 도메인 함수 직접 호출 (내부 fetch 금지)
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { ValidationError, NotFoundError } from '../adapters/http/middleware/error-handler.js';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 프로젝트 생성
 */
export async function createProject(projectData, options = {}) {
  try {
    const { userId } = options;
    
    // 고유 ID 생성
    const projectId = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 저장할 데이터 구성
    const projectToSave = {
      id: projectId,
      ...projectData,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      reports_count: 0
    };
    
    // 프로젝트 폴더 생성
    const projectsDir = path.resolve(__dirname, '../../projects');
    const projectDir = path.join(projectsDir, projectId);
    const reportsDir = path.join(projectDir, 'reports');
    
    await fs.mkdir(projectDir, { recursive: true });
    await fs.mkdir(reportsDir, { recursive: true });
    
    // 프로젝트 정보 저장
    const projectInfoPath = path.join(projectDir, 'project.json');
    await fs.writeFile(projectInfoPath, JSON.stringify(projectToSave, null, 2), 'utf8');
    
    logger.info('프로젝트 생성 완료', { projectId, name: projectData.name });
    
    return {
      id: projectId,
      name: projectData.name,
      message: '프로젝트가 성공적으로 생성되었습니다'
    };
    
  } catch (error) {
    logger.error('프로젝트 생성 실패', { error: error.message, projectData });
    throw new Error(`프로젝트 생성에 실패했습니다: ${error.message}`);
  }
}

/**
 * 프로젝트 조회
 */
export async function getProject(projectId) {
  try {
    const projectsDir = path.resolve(__dirname, '../../projects');
    const projectDir = path.join(projectsDir, projectId);
    const projectInfoPath = path.join(projectDir, 'project.json');
    
    const projectData = await fs.readFile(projectInfoPath, 'utf8');
    const project = JSON.parse(projectData);
    
    // reports 폴더에서 실제 보고서 개수 확인
    try {
      const reportsDir = path.join(projectDir, 'reports');
      const reportFiles = await fs.readdir(reportsDir);
      const jsonFiles = reportFiles.filter(file => file.endsWith('.json'));
      project.reports_count = jsonFiles.length;
    } catch (error) {
      project.reports_count = 0;
    }
    
    return project;
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new NotFoundError('프로젝트를 찾을 수 없습니다');
    }
    throw new Error(`프로젝트 조회에 실패했습니다: ${error.message}`);
  }
}

/**
 * 프로젝트 목록 조회
 */
export async function getProjects(filters = {}) {
  try {
    const {
      status,
      type,
      location,
      client,
      startDate,
      endDate,
      riskLevel,
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = filters;
    
    const projectsDir = path.resolve(__dirname, '../../projects');
    const projectFolders = await fs.readdir(projectsDir);
    const projects = [];
    
    for (const folderName of projectFolders) {
      try {
        const projectDir = path.join(projectsDir, folderName);
        const stats = await fs.stat(projectDir);
        
        if (!stats.isDirectory()) continue;
        
        const projectInfoPath = path.join(projectDir, 'project.json');
        
        try {
          const projectInfoContent = await fs.readFile(projectInfoPath, 'utf8');
          const projectInfo = JSON.parse(projectInfoContent);
          
          // reports 폴더에서 보고서 개수 확인
          try {
            const reportsDir = path.join(projectDir, 'reports');
            const reportFiles = await fs.readdir(reportsDir);
            const jsonFiles = reportFiles.filter(file => file.endsWith('.json'));
            projectInfo.reports_count = jsonFiles.length;
          } catch (error) {
            projectInfo.reports_count = 0;
          }
          
          projects.push({
            ...projectInfo,
            folder_name: folderName
          });
          
        } catch (err) {
          logger.warn('프로젝트 정보 읽기 실패', { folder: folderName, error: err.message });
        }
      } catch (err) {
        logger.warn('프로젝트 폴더 접근 실패', { folder: folderName, error: err.message });
      }
    }
    
    // 필터링
    let filteredProjects = projects;
    
    if (status) {
      filteredProjects = filteredProjects.filter(project => project.status === status);
    }
    if (type) {
      filteredProjects = filteredProjects.filter(project => project.type === type);
    }
    if (location) {
      filteredProjects = filteredProjects.filter(project => 
        project.location && project.location.toLowerCase().includes(location.toLowerCase())
      );
    }
    if (client) {
      filteredProjects = filteredProjects.filter(project => 
        project.client && project.client.toLowerCase().includes(client.toLowerCase())
      );
    }
    if (startDate) {
      filteredProjects = filteredProjects.filter(project => 
        project.startDate && new Date(project.startDate) >= new Date(startDate)
      );
    }
    if (endDate) {
      filteredProjects = filteredProjects.filter(project => 
        project.endDate && new Date(project.endDate) <= new Date(endDate)
      );
    }
    if (riskLevel) {
      filteredProjects = filteredProjects.filter(project => project.riskLevel === riskLevel);
    }
    
    // 정렬
    filteredProjects.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    // 페이징
    const total = filteredProjects.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProjects = filteredProjects.slice(startIndex, endIndex);
    
    return {
      projects: paginatedProjects,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
    
  } catch (error) {
    logger.error('프로젝트 목록 조회 실패', { error: error.message, filters });
    throw new Error(`프로젝트 목록 조회에 실패했습니다: ${error.message}`);
  }
}

/**
 * 프로젝트 업데이트
 */
export async function updateProject(projectId, updateData, options = {}) {
  try {
    const { userId } = options;
    
    // 기존 프로젝트 조회
    const existingProject = await getProject(projectId);
    
    // 업데이트된 데이터 구성
    const updatedProject = {
      ...existingProject,
      ...updateData,
      updated_by: userId,
      updated_at: new Date().toISOString()
    };
    
    // 파일 저장
    const projectsDir = path.resolve(__dirname, '../../projects');
    const projectDir = path.join(projectsDir, projectId);
    const projectInfoPath = path.join(projectDir, 'project.json');
    
    await fs.writeFile(projectInfoPath, JSON.stringify(updatedProject, null, 2), 'utf8');
    
    logger.info('프로젝트 업데이트 완료', { projectId, name: updateData.name });
    
    return updatedProject;
    
  } catch (error) {
    logger.error('프로젝트 업데이트 실패', { error: error.message, projectId, updateData });
    throw new Error(`프로젝트 업데이트에 실패했습니다: ${error.message}`);
  }
}

/**
 * 프로젝트 삭제
 */
export async function deleteProject(projectId) {
  try {
    const projectsDir = path.resolve(__dirname, '../../projects');
    const projectDir = path.join(projectsDir, projectId);
    
    // 프로젝트 폴더와 모든 내용 삭제
    await fs.rm(projectDir, { recursive: true, force: true });
    
    logger.info('프로젝트 삭제 완료', { projectId });
    
    return { message: '프로젝트가 성공적으로 삭제되었습니다' };
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new NotFoundError('프로젝트를 찾을 수 없습니다');
    }
    throw new Error(`프로젝트 삭제에 실패했습니다: ${error.message}`);
  }
}

/**
 * 프로젝트 검색
 */
export async function searchProjects(searchQuery, filters = {}) {
  try {
    const { status, type, riskLevel, page = 1, limit = 20 } = filters;
    
    // 기본 프로젝트 목록 조회
    const projectsResult = await getProjects({
      status,
      type,
      riskLevel,
      page: 1,
      limit: 1000 // 검색을 위해 충분한 데이터 로드
    });
    
    // 검색어로 필터링
    const searchTerm = searchQuery.toLowerCase();
    const filteredProjects = projectsResult.projects.filter(project => {
      const searchableFields = [
        project.name,
        project.description,
        project.location,
        project.client,
        project.safetyManager,
        project.type
      ].filter(Boolean).join(' ').toLowerCase();
      
      return searchableFields.includes(searchTerm);
    });
    
    // 페이징
    const total = filteredProjects.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProjects = filteredProjects.slice(startIndex, endIndex);
    
    return {
      projects: paginatedProjects,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      searchQuery
    };
    
  } catch (error) {
    logger.error('프로젝트 검색 실패', { error: error.message, searchQuery, filters });
    throw new Error(`프로젝트 검색에 실패했습니다: ${error.message}`);
  }
}

/**
 * 프로젝트 백업
 */
export async function backupProject(projectId, backupOptions = {}) {
  try {
    const {
      includeReports = true,
      includeAttachments = false,
      backupName,
      description
    } = backupOptions;
    
    const project = await getProject(projectId);
    const projectsDir = path.resolve(__dirname, '../../projects');
    const projectDir = path.join(projectsDir, projectId);
    
    // 백업 데이터 구성
    const backupData = {
      project: { ...project },
      timestamp: new Date().toISOString(),
      options: backupOptions
    };
    
    if (includeReports) {
      try {
        const reportsDir = path.join(projectDir, 'reports');
        const reportFiles = await fs.readdir(reportsDir);
        const jsonFiles = reportFiles.filter(file => file.endsWith('.json'));
        
        const reports = [];
        for (const file of jsonFiles) {
          const reportPath = path.join(reportsDir, file);
          const reportContent = await fs.readFile(reportPath, 'utf8');
          const report = JSON.parse(reportContent);
          reports.push(report);
        }
        
        backupData.reports = reports;
      } catch (error) {
        logger.warn('보고서 백업 실패', { projectId, error: error.message });
        backupData.reports = [];
      }
    }
    
    // 백업 파일 저장
    const backupsDir = path.join(projectDir, 'backups');
    await fs.mkdir(backupsDir, { recursive: true });
    
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const backupFileName = backupName ? `${backupName}.json` : `${backupId}.json`;
    const backupPath = path.join(backupsDir, backupFileName);
    
    await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2), 'utf8');
    
    logger.info('프로젝트 백업 완료', { projectId, backupId, backupFileName });
    
    return {
      backupId,
      fileName: backupFileName,
      message: '프로젝트 백업이 완료되었습니다'
    };
    
  } catch (error) {
    logger.error('프로젝트 백업 실패', { error: error.message, projectId, backupOptions });
    throw new Error(`프로젝트 백업에 실패했습니다: ${error.message}`);
  }
}

/**
 * 프로젝트 복원
 */
export async function restoreProject(projectId, backupId, restoreOptions = {}) {
  try {
    const {
      overwrite = false,
      restoreReports = true,
      restoreAttachments = false
    } = restoreOptions;
    
    const projectsDir = path.resolve(__dirname, '../../projects');
    const projectDir = path.join(projectsDir, projectId);
    const backupsDir = path.join(projectDir, 'backups');
    const backupPath = path.join(backupsDir, `${backupId}.json`);
    
    // 백업 파일 읽기
    const backupContent = await fs.readFile(backupPath, 'utf8');
    const backupData = JSON.parse(backupContent);
    
    // 프로젝트 정보 복원
    if (overwrite) {
      const projectInfoPath = path.join(projectDir, 'project.json');
      await fs.writeFile(projectInfoPath, JSON.stringify(backupData.project, null, 2), 'utf8');
    }
    
    // 보고서 복원
    if (restoreReports && backupData.reports) {
      const reportsDir = path.join(projectDir, 'reports');
      await fs.mkdir(reportsDir, { recursive: true });
      
      for (const report of backupData.reports) {
        const reportFileName = `${report.id}.json`;
        const reportPath = path.join(reportsDir, reportFileName);
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
      }
    }
    
    logger.info('프로젝트 복원 완료', { projectId, backupId });
    
    return {
      message: '프로젝트 복원이 완료되었습니다',
      restoredItems: {
        project: overwrite,
        reports: restoreReports && backupData.reports ? backupData.reports.length : 0
      }
    };
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new NotFoundError('백업 파일을 찾을 수 없습니다');
    }
    logger.error('프로젝트 복원 실패', { error: error.message, projectId, backupId });
    throw new Error(`프로젝트 복원에 실패했습니다: ${error.message}`);
  }
}

/**
 * 프로젝트 통계 조회
 */
export async function getProjectStats(projectId, statsOptions = {}) {
  try {
    const {
      startDate,
      endDate,
      groupBy = 'month',
      includeCharts = true
    } = statsOptions;
    
    const project = await getProject(projectId);
    const projectsDir = path.resolve(__dirname, '../../projects');
    const projectDir = path.join(projectsDir, projectId);
    
    // 보고서 통계
    let reports = [];
    try {
      const reportsDir = path.join(projectDir, 'reports');
      const reportFiles = await fs.readdir(reportsDir);
      const jsonFiles = reportFiles.filter(file => file.endsWith('.json'));
      
      for (const file of jsonFiles) {
        const reportPath = path.join(reportsDir, file);
        const reportContent = await fs.readFile(reportPath, 'utf8');
        const report = JSON.parse(reportContent);
        reports.push(report);
      }
    } catch (error) {
      // reports 디렉토리가 없는 경우
      reports = [];
    }
    
    // 날짜 필터링
    if (startDate) {
      reports = reports.filter(report => new Date(report.created_at) >= new Date(startDate));
    }
    if (endDate) {
      reports = reports.filter(report => new Date(report.created_at) <= new Date(endDate));
    }
    
    // 기본 통계
    const stats = {
      project: {
        id: project.id,
        name: project.name,
        status: project.status,
        type: project.type,
        created_at: project.created_at,
        updated_at: project.updated_at
      },
      reports: {
        total: reports.length,
        byType: {},
        byStatus: {},
        byMonth: {},
        recent: reports.slice(0, 5) // 최근 5개
      },
      summary: {
        totalFindings: 0,
        totalIncidents: 0,
        totalImprovements: 0,
        averageSeverity: 0
      }
    };
    
    // 보고서 타입별 통계
    reports.forEach(report => {
      // 타입별 카운트
      const type = report.type || 'unknown';
      stats.reports.byType[type] = (stats.reports.byType[type] || 0) + 1;
      
      // 상태별 카운트
      const status = report.status || 'draft';
      stats.reports.byStatus[status] = (stats.reports.byStatus[status] || 0) + 1;
      
      // 월별 카운트
      const month = new Date(report.created_at).toISOString().substring(0, 7);
      stats.reports.byMonth[month] = (stats.reports.byMonth[month] || 0) + 1;
      
      // 점검 결과 통계
      if (report.findings) {
        stats.summary.totalFindings += report.findings.length;
      }
      if (report.incidents) {
        stats.summary.totalIncidents += report.incidents.length;
      }
      if (report.improvements) {
        stats.summary.totalImprovements += report.improvements.length;
      }
    });
    
    // 평균 심각도 계산
    const severityScores = { low: 1, medium: 2, high: 3, critical: 4 };
    let totalSeverity = 0;
    let severityCount = 0;
    
    reports.forEach(report => {
      if (report.findings) {
        report.findings.forEach(finding => {
          if (finding.severity && severityScores[finding.severity]) {
            totalSeverity += severityScores[finding.severity];
            severityCount++;
          }
        });
      }
    });
    
    if (severityCount > 0) {
      stats.summary.averageSeverity = totalSeverity / severityCount;
    }
    
    return stats;
    
  } catch (error) {
    logger.error('프로젝트 통계 조회 실패', { error: error.message, projectId, statsOptions });
    throw new Error(`프로젝트 통계 조회에 실패했습니다: ${error.message}`);
  }
}
