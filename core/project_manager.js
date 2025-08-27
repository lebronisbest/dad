import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

// ES 모듈에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ProjectManager {
  constructor() {
    this.projectsDir = path.join(__dirname, '../projects');
    this.projectsFile = path.join(this.projectsDir, 'projects.json');
    this.projects = new Map();
    this.initialized = false;
    this.initPromise = null;
    // 비동기 초기화 시작
    this.init();
  }

  async init() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._init();
    return this.initPromise;
  }

  async _init() {
    try {
      await fs.mkdir(this.projectsDir, { recursive: true });
      await this.loadProjects();
      this.initialized = true;
      logger.info('프로젝트 매니저 초기화 완료');
    } catch (error) {
      logger.error('프로젝트 매니저 초기화 실패', { error: error.message });
      throw error;
    }
  }

  // ✅ Project TT 가이드라인: 초기화 완료 보장
  async ensureInitialized() {
    if (!this.initialized) {
      await this.init();
    }
    return true;
  }

  async loadProjects() {
    try {
      logger.info('프로젝트 로드 시작');
      
      // ✅ Project TT 가이드라인: 디렉토리 스캔을 먼저 수행
      // 1단계: 프로젝트 디렉토리에서 프로젝트 정보 로드
      await this.scanProjectDirectories();
      logger.info('프로젝트 디렉토리 스캔 완료', { count: this.projects.size });
      
      // 2단계: projects.json 파일이 있으면 병합 (기존 데이터 덮어쓰기)
      if (await this.fileExists(this.projectsFile)) {
        try {
          const data = await fs.readFile(this.projectsFile, 'utf-8');
          const projectsData = JSON.parse(data);
          
          // 기존 디렉토리에서 로드된 프로젝트와 병합
          for (const [id, project] of Object.entries(projectsData)) {
            // 기존 프로젝트가 있으면 업데이트, 없으면 새로 추가
            const existingProject = this.projects.get(id);
            if (existingProject) {
              // 기존 프로젝트 정보를 유지하면서 projects.json의 정보로 업데이트
              Object.assign(existingProject, project);
              this.projects.set(id, existingProject);
              logger.info('기존 프로젝트 정보 업데이트', { project_id: id, name: project.name });
            } else {
              // 새 프로젝트 추가
              this.projects.set(id, project);
              logger.info('새 프로젝트 추가', { project_id: id, name: project.name });
            }
          }
          logger.info('projects.json 병합 완료', { merged_count: Object.keys(projectsData).length });
        } catch (error) {
          logger.error('projects.json 파싱 실패, 디렉토리 데이터만 사용', { error: error.message });
        }
      } else {
        logger.info('projects.json 파일이 존재하지 않습니다. 디렉토리 데이터만 사용합니다.');
      }
      
      // 3단계: 각 프로젝트의 보고서 정보를 로드
      for (const [projectId, project] of this.projects) {
        try {
          await this.loadProjectReports(projectId);
        } catch (error) {
          logger.error('개별 프로젝트 보고서 로드 실패', { project_id: projectId, error: error.message });
          // 개별 프로젝트 실패는 전체 로드에 영향을 주지 않도록 함
        }
      }
      
      logger.info('프로젝트 및 보고서 로드 완료', { total_projects: this.projects.size });
    } catch (error) {
      logger.error('프로젝트 로드 실패', { error: error.message, stack: error.stack });
      // 초기화 실패 시 빈 상태로 시작
      this.projects.clear();
      throw error;
    }
  }

  async saveProjects() {
    try {
      // 프로젝트가 없으면 파일을 생성하지 않음
      if (this.projects.size === 0) {
        logger.info('프로젝트가 없어서 저장 파일을 생성하지 않음');
        return;
      }
      
      const projectsData = {};
      for (const [id, project] of this.projects) {
        projectsData[id] = project;
      }
      
      await fs.writeFile(this.projectsFile, JSON.stringify(projectsData, null, 2));
      logger.info('프로젝트 저장 완료');
    } catch (error) {
      logger.error('프로젝트 저장 실패', { error: error.message });
      throw error;
    }
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  generateProjectId() {
    return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async createProject(projectData) {
    try {
      const projectId = this.generateProjectId();
      const project = {
        id: projectId,
        name: projectData.name,
        description: projectData.description || '',
        location: projectData.location || '',
        client: projectData.client || '',
        start_date: projectData.start_date || new Date().toISOString(),
        end_date: projectData.end_date || null,
        status: projectData.status || 'active',
        type: projectData.type || 'construction',
        safety_manager: projectData.safety_manager || '',
        contact_info: projectData.contact_info || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        reports: [],
        total_reports: 0,
        last_report_date: null
      };

      this.projects.set(projectId, project);
      await this.saveProjects();
      
      // 프로젝트별 폴더 생성
      const projectDir = path.join(this.projectsDir, projectId);
      await fs.mkdir(projectDir, { recursive: true });
      
      logger.info('프로젝트 생성 완료', { project_id: projectId, name: project.name });
      return project;
    } catch (error) {
      logger.error('프로젝트 생성 실패', { error: error.message });
      throw error;
    }
  }

  async updateProject(projectId, updateData) {
    try {
      const project = this.projects.get(projectId);
      if (!project) {
        throw new Error(`프로젝트를 찾을 수 없습니다: ${projectId}`);
      }

      // 업데이트 가능한 필드들
      const updatableFields = [
        'name', 'description', 'location', 'client', 'start_date', 
        'end_date', 'status', 'type', 'safety_manager', 'contact_info'
      ];

      for (const field of updatableFields) {
        if (updateData[field] !== undefined) {
          project[field] = updateData[field];
        }
      }

      project.updated_at = new Date().toISOString();
      this.projects.set(projectId, project);
      await this.saveProjects();

      logger.info('프로젝트 업데이트 완료', { project_id: projectId });
      return project;
    } catch (error) {
      logger.error('프로젝트 업데이트 실패', { error: error.message });
      throw error;
    }
  }

  // ✅ Project TT 가이드라인: 통합 프로젝트 검색 함수
  async findProject(identifier) {
    try {
      // ✅ Project TT 가이드라인: 초기화 완료 보장
      await this.ensureInitialized();
      
      logger.info('프로젝트 검색 시작', { identifier });
      
      // 1차: ID로 직접 검색
      let project = this.projects.get(identifier);
      let actualProjectId = identifier;
      
      if (project) {
        logger.info('ID로 프로젝트 찾음', { 
          search_identifier: identifier, 
          actual_id: actualProjectId, 
          project_name: project.name 
        });
        return { project, actualProjectId };
      }
      
      // 2차: folder_name 또는 name으로 검색
      for (const [id, proj] of this.projects) {
        if (proj.folder_name === identifier || proj.name === identifier) {
          project = proj;
          actualProjectId = id;
          logger.info('folder_name 또는 name으로 프로젝트 찾음', { 
            search_identifier: identifier, 
            actual_id: actualProjectId, 
            project_name: project.name,
            match_type: proj.folder_name === identifier ? 'folder_name' : 'name'
          });
          return { project, actualProjectId };
        }
      }
      
      // 3차: 부분 일치 검색 (name에 포함되는 경우)
      for (const [id, proj] of this.projects) {
        if (proj.name && proj.name.toLowerCase().includes(identifier.toLowerCase())) {
          project = proj;
          actualProjectId = id;
          logger.info('부분 일치로 프로젝트 찾음', { 
            search_identifier: identifier, 
            actual_id: actualProjectId, 
            project_name: project.name,
            match_type: 'partial_name'
          });
          return { project, actualProjectId };
        }
      }
      
      // 프로젝트를 찾을 수 없음
      logger.warn('프로젝트를 찾을 수 없음', { identifier });
      return { project: null, actualProjectId: null };
    } catch (error) {
      logger.error('프로젝트 검색 실패', { identifier, error: error.message });
      throw error;
    }
  }

  async deleteProject(projectId) {
    try {
      // ✅ Project TT 가이드라인: 초기화 완료 보장
      await this.ensureInitialized();
      
      logger.info('프로젝트 삭제 시작', { project_id: projectId });
      
      // ✅ Project TT 가이드라인: 통합 프로젝트 검색 함수 사용
      const { project, actualProjectId } = await this.findProject(projectId);
      
      if (!project) {
        throw new Error(`프로젝트를 찾을 수 없습니다: ${projectId}`);
      }

      logger.info('프로젝트 찾음', { 
        search_id: projectId, 
        actual_id: actualProjectId, 
        project_name: project.name 
      });

      // 프로젝트 폴더 삭제 (folder_name 사용)
      const projectDir = path.join(this.projectsDir, project.folder_name || project.name);
      logger.info('프로젝트 폴더 삭제 시도', { project_dir: projectDir });

      if (await this.fileExists(projectDir)) {
        await fs.rm(projectDir, { recursive: true, force: true });
        logger.info('프로젝트 폴더 삭제 완료', { project_dir: projectDir });
      } else {
        logger.warn('프로젝트 폴더가 존재하지 않음', { project_dir: projectDir });
      }

      // 프로젝트 제거
      this.projects.delete(actualProjectId);
      logger.info('메모리에서 프로젝트 제거 완료', { project_id: actualProjectId });
      
      await this.saveProjects();
      logger.info('프로젝트 정보 저장 완료', { project_id: actualProjectId });

      logger.info('프로젝트 삭제 완료', { 
        search_id: projectId, 
        actual_id: actualProjectId, 
        name: project.name 
      });
      return { success: true, message: '프로젝트가 삭제되었습니다.' };
    } catch (error) {
      logger.error('프로젝트 삭제 실패', { 
        project_id: projectId, 
        error: error.message,
        stack: error.stack 
      });
      throw error;
    }
  }

  async getProject(projectId) {
    try {
      // ✅ Project TT 가이드라인: 초기화 완료 보장
      await this.ensureInitialized();
      
      const project = this.projects.get(projectId);
      if (!project) {
        throw new Error(`프로젝트를 찾을 수 없습니다: ${projectId}`);
      }
      return project;
    } catch (error) {
      logger.error('프로젝트 조회 실패', { error: error.message });
      throw error;
    }
  }

  async getAllProjects() {
    // ✅ Project TT 가이드라인: normalize → validate → execute
    try {
      // ✅ Project TT 가이드라인: 초기화 완료 보장
      await this.ensureInitialized();
      
      // 1. Normalize: 파일 시스템에서 최신 데이터 로드
      try {
        await this.loadProjects();
      } catch (error) {
        logger.error('프로젝트 로드 실패, 기존 데이터로 계속 진행', { error: error.message });
        // 로드 실패 시 기존 메모리 데이터 사용
      }
      
      // 2. Validate: 데이터 유효성 검증
      const projects = Array.from(this.projects.values());
      if (!projects || projects.length === 0) {
        logger.warn('프로젝트 데이터가 없습니다. 파일 시스템을 확인합니다.');
        // 파일 시스템에서 직접 프로젝트 폴더 스캔
        try {
          await this.scanProjectDirectories();
        } catch (error) {
          logger.error('프로젝트 디렉토리 스캔 실패', { error: error.message });
        }
        return Array.from(this.projects.values());
      }
      
      // 3. Execute: 프로젝트별 보고서 정보 업데이트
      for (const project of projects) {
        try {
          await this.loadProjectReports(project.id);
        } catch (error) {
          logger.error('개별 프로젝트 보고서 로드 실패', { project_id: project.id, error: error.message });
          // 개별 프로젝트 실패는 전체 목록 반환에 영향을 주지 않도록 함
        }
      }
      
      const finalProjects = Array.from(this.projects.values());
      logger.info('프로젝트 목록 조회 완료', { total_projects: finalProjects.length });
      return finalProjects;
    } catch (error) {
      logger.error('프로젝트 목록 조회 실패', { error: error.message, stack: error.stack });
      
      // 초기화 실패 시에도 기존 메모리 데이터가 있으면 반환
      const fallbackProjects = Array.from(this.projects.values());
      if (fallbackProjects.length > 0) {
        logger.warn('초기화 실패했지만 기존 데이터 반환', { count: fallbackProjects.length });
        return fallbackProjects;
      }
      
      throw error;
    }
  }

  async searchProjects(query) {
    const results = [];
    const searchTerm = query.toLowerCase();

    for (const project of this.projects.values()) {
      if (
        project.name.toLowerCase().includes(searchTerm) ||
        project.description.toLowerCase().includes(searchTerm) ||
        project.location.toLowerCase().includes(searchTerm) ||
        project.client.toLowerCase().includes(searchTerm) ||
        project.safety_manager.toLowerCase().includes(searchTerm)
      ) {
        results.push(project);
      }
    }

    return results;
  }

  async addReportToProject(projectId, reportData) {
    try {
      const project = this.projects.get(projectId);
      if (!project) {
        throw new Error(`프로젝트를 찾을 수 없습니다: ${projectId}`);
      }

      const report = {
        id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: reportData.title || '안전보고서',
        type: reportData.type || 'safety_inspection',
        created_at: new Date().toISOString(),
        data: reportData.data || {},
        filename: reportData.filename || null,
        status: reportData.status || 'completed'
      };

      project.reports.push(report);
      project.total_reports = project.reports.length;
      project.last_report_date = report.created_at;
      project.updated_at = new Date().toISOString();

      this.projects.set(projectId, project);
      await this.saveProjects();

      logger.info('프로젝트에 보고서 추가 완료', { 
        project_id: projectId, 
        report_id: report.id,
        total_reports: project.total_reports 
      });

      return report;
    } catch (error) {
      logger.error('프로젝트에 보고서 추가 실패', { error: error.message });
      throw error;
    }
  }

  // ✅ Project TT 가이드라인: 보고서 삭제 및 파일 시스템 정리
  async deleteReportFromProject(projectId, reportId) {
    try {
      logger.info('보고서 삭제 시작', { project_id: projectId, report_id: reportId });
      
      // ✅ Project TT 가이드라인: 초기화 완료 보장
      await this.ensureInitialized();
      
      const project = this.projects.get(projectId);
      if (!project) {
        logger.error('프로젝트를 찾을 수 없음', { project_id: projectId, available_projects: Array.from(this.projects.keys()) });
        throw new Error(`프로젝트를 찾을 수 없습니다: ${projectId}`);
      }

      logger.info('프로젝트 찾음', { project_id: projectId, project_name: project.name });

      // 1. Normalize: 보고서 찾기
      if (!project.reports || !Array.isArray(project.reports)) {
        logger.error('프로젝트에 보고서 배열이 없음', { project_id: projectId, reports_type: typeof project.reports });
        throw new Error(`프로젝트에 보고서 정보가 없습니다: ${projectId}`);
      }

      const reportIndex = project.reports.findIndex(r => r && r.id === reportId);
      if (reportIndex === -1) {
        logger.error('보고서를 찾을 수 없음', { 
          project_id: projectId, 
          report_id: reportId, 
          available_reports: project.reports.map(r => r?.id).filter(Boolean) 
        });
        throw new Error(`보고서를 찾을 수 없습니다: ${reportId}`);
      }

      const report = project.reports[reportIndex];
      if (!report) {
        logger.error('보고서 객체가 null/undefined', { project_id: projectId, report_id: reportId, report_index: reportIndex });
        throw new Error(`보고서 데이터가 손상되었습니다: ${reportId}`);
      }

      logger.info('보고서 찾음', { report_id: reportId, report_title: report.title || '제목 없음', report_status: report.status || '상태 없음' });
      
      // 2. Validate: 삭제 가능 여부 확인
      if (report.status === 'locked') {
        logger.warn('잠긴 보고서 삭제 시도', { project_id: projectId, report_id: reportId, report_status: report.status });
        throw new Error('잠긴 보고서는 삭제할 수 없습니다.');
      }

      // 3. Execute: 파일 시스템에서 보고서 파일 삭제
      const projectDir = path.join(this.projectsDir, project.folder_name || projectId);
      const reportsDir = path.join(projectDir, 'reports');
      const reportFile = path.join(reportsDir, `${reportId}.json`);

      logger.info('파일 삭제 시도', { report_file: reportFile });

      try {
        if (await this.fileExists(reportFile)) {
          await fs.unlink(reportFile);
          logger.info('보고서 파일 삭제 완료', { report_file: reportFile });
        } else {
          logger.warn('보고서 파일이 존재하지 않음', { report_file: reportFile });
        }
      } catch (fileError) {
        logger.warn('보고서 파일 삭제 실패 (계속 진행)', { 
          report_file: reportFile, 
          error: fileError.message 
        });
        // 파일 삭제 실패는 전체 삭제 프로세스를 중단하지 않음
      }

      // 4. Execute: 메모리에서 보고서 제거
      project.reports.splice(reportIndex, 1);
      project.total_reports = project.reports.length;
      project.reports_count = project.reports.length; // reports_count도 업데이트
      
      // last_report_date 안전하게 계산
      if (project.reports.length > 0) {
        const lastReport = project.reports[project.reports.length - 1];
        project.last_report_date = lastReport?.created_at || lastReport?.date || null;
      } else {
        project.last_report_date = null;
      }
      
      project.updated_at = new Date().toISOString();

      logger.info('메모리에서 보고서 제거 완료', { 
        project_id: projectId, 
        report_id: reportId,
        remaining_reports: project.total_reports 
      });

      // 5. Execute: 프로젝트 정보 저장
      this.projects.set(projectId, project);
      try {
        await this.saveProjects();
      } catch (saveError) {
        logger.error('프로젝트 정보 저장 실패', { 
          project_id: projectId, 
          error: saveError.message 
        });
        // 저장 실패는 삭제 프로세스를 중단하지 않음
        // 메모리 상태는 이미 업데이트됨
      }

      // 6. Execute: 프로젝트 보고서 상태 동기화
      try {
        // 프로젝트가 여전히 존재하는지 확인
        if (this.projects.has(projectId)) {
          await this.loadProjectReports(projectId);
        } else {
          logger.warn('프로젝트가 더 이상 존재하지 않음 (동기화 건너뜀)', { project_id: projectId });
        }
      } catch (syncError) {
        logger.warn('프로젝트 보고서 상태 동기화 실패 (삭제는 계속 진행)', { 
          project_id: projectId, 
          error: syncError.message 
        });
        // 동기화 실패는 삭제 프로세스를 중단하지 않음
      }

      logger.info('프로젝트에서 보고서 삭제 완료', { 
        project_id: projectId, 
        report_id: reportId,
        remaining_reports: project.total_reports 
      });

      return { success: true, message: '보고서가 삭제되었습니다.' };
    } catch (error) {
      logger.error('프로젝트에서 보고서 삭제 실패', { 
        project_id: projectId, 
        report_id: reportId,
        error: error.message,
        stack: error.stack 
      });
      throw error;
    }
  }

  // ✅ Project TT 가이드라인: 여러 보고서 일괄 삭제
  async deleteMultipleReports(projectId, reportIds) {
    try {
      const results = [];
      
      for (const reportId of reportIds) {
        try {
          const result = await this.deleteReportFromProject(projectId, reportId);
          results.push({ reportId, success: true, result });
        } catch (error) {
          results.push({ reportId, success: false, error: error.message });
          logger.error('보고서 삭제 실패', { project_id: projectId, report_id: reportId, error: error.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      logger.info('다중 보고서 삭제 완료', { 
        project_id: projectId, 
        total_requested: reportIds.length,
        success_count: successCount,
        failure_count: failureCount
      });

      return {
        success: true,
        results,
        summary: {
          total_requested: reportIds.length,
          success_count: successCount,
          failure_count: failureCount
        }
      };
    } catch (error) {
      logger.error('다중 보고서 삭제 실패', { error: error.message });
      throw error;
    }
  }

  async getProjectReports(projectId) {
    try {
      const project = this.projects.get(projectId);
      if (!project) {
        throw new Error(`프로젝트를 찾을 수 없습니다: ${projectId}`);
      }

      return project.reports;
    } catch (error) {
      logger.error('프로젝트 보고서 조회 실패', { error: error.message });
      throw error;
    }
  }

  async getProjectStats(projectId) {
    try {
      const project = this.projects.get(projectId);
      if (!project) {
        throw new Error(`프로젝트를 찾을 수 없습니다: ${projectId}`);
      }

      const stats = {
        project_id: projectId,
        project_name: project.name,
        total_reports: project.total_reports,
        reports_by_type: {},
        reports_by_month: {},
        last_report_date: project.last_report_date,
        project_duration_days: 0,
        average_reports_per_month: 0
      };

      // 보고서 타입별 통계
      for (const report of project.reports) {
        const type = report.type;
        stats.reports_by_type[type] = (stats.reports_by_type[type] || 0) + 1;
      }

      // 월별 통계
      for (const report of project.reports) {
        const month = new Date(report.created_at).toISOString().substring(0, 7);
        stats.reports_by_month[month] = (stats.reports_by_month[month] || 0) + 1;
      }

      // 프로젝트 기간 계산
      if (project.start_date) {
        const startDate = new Date(project.start_date);
        const endDate = project.end_date ? new Date(project.end_date) : new Date();
        stats.project_duration_days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      }

      // 월평균 보고서 수
      if (stats.project_duration_days > 0) {
        const months = Math.max(1, Math.ceil(stats.project_duration_days / 30));
        stats.average_reports_per_month = (stats.total_reports / months).toFixed(2);
      }

      return stats;
    } catch (error) {
      logger.error('프로젝트 통계 조회 실패', { error: error.message });
      throw error;
    }
  }

  async getOverallStats() {
    try {
      const stats = {
        total_projects: this.projects.size,
        active_projects: 0,
        completed_projects: 0,
        total_reports: 0,
        projects_by_type: {},
        projects_by_status: {},
        recent_activity: []
      };

      for (const project of this.projects.values()) {
        // 상태별 프로젝트 수
        stats.projects_by_status[project.status] = (stats.projects_by_status[project.status] || 0) + 1;
        
        if (project.status === 'active') {
          stats.active_projects++;
        } else if (project.status === 'completed') {
          stats.completed_projects++;
        }

        // 타입별 프로젝트 수
        stats.projects_by_type[project.type] = (stats.projects_by_type[project.type] || 0) + 1;

        // 총 보고서 수
        stats.total_reports += project.total_reports;

        // 최근 활동 (최근 10개)
        if (project.updated_at) {
          stats.recent_activity.push({
            project_id: project.id,
            project_name: project.name,
            action: 'updated',
            timestamp: project.updated_at
          });
        }
      }

      // 최근 활동을 시간순으로 정렬하고 상위 10개만 유지
      stats.recent_activity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      stats.recent_activity = stats.recent_activity.slice(0, 10);

      return stats;
    } catch (error) {
      logger.error('전체 통계 조회 실패', { error: error.message });
      throw error;
    }
  }

  async backupProject(projectId) {
    try {
      const project = this.projects.get(projectId);
      if (!project) {
        throw new Error(`프로젝트를 찾을 수 없습니다: ${projectId}`);
      }

      const backupData = {
        project: project,
        backup_created_at: new Date().toISOString(),
        version: '1.0'
      };

      const backupDir = path.join(this.projectsDir, 'backups');
      await fs.mkdir(backupDir, { recursive: true });

      const backupFilename = `backup_${projectId}_${Date.now()}.json`;
      const backupPath = path.join(backupDir, backupFilename);

      await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));

      logger.info('프로젝트 백업 완료', { 
        project_id: projectId, 
        backup_path: backupPath 
      });

      return { backup_path: backupPath, filename: backupFilename };
    } catch (error) {
      logger.error('프로젝트 백업 실패', { error: error.message });
      throw error;
    }
  }

  async restoreProject(backupPath) {
    try {
      const backupData = JSON.parse(await fs.readFile(backupPath, 'utf-8'));
      const project = backupData.project;

      // 기존 프로젝트가 있다면 백업
      if (this.projects.has(project.id)) {
        await this.backupProject(project.id);
      }

      // 프로젝트 복원
      this.projects.set(project.id, project);
      await this.saveProjects();

      logger.info('프로젝트 복원 완료', { project_id: project.id });

      return project;
    } catch (error) {
      logger.error('프로젝트 복원 실패', { error: error.message });
      throw error;
    }
  }

  // 자동 완성 관련 메서드들
  async createProjectTemplate(projectId) {
    try {
      const project = this.projects.get(projectId);
      if (!project) {
        throw new Error(`프로젝트를 찾을 수 없습니다: ${projectId}`);
      }

      if (project.reports.length === 0) {
        throw new Error('프로젝트에 보고서가 없어 템플릿을 생성할 수 없습니다.');
      }

      // 첫 번째 보고서를 기반으로 템플릿 생성
      const firstReport = project.reports[0];
      
      // 반복 사용될 가능성이 높은 필드들을 추출
      const template = {
        project_info: {
          name: project.name,
          location: project.location,
          client: project.client,
          safety_manager: project.safety_manager,
          contact_info: project.contact_info
        },
        common_fields: this.extractCommonFields(firstReport.data),
        report_structure: this.analyzeReportStructure(firstReport.data),
        created_at: new Date().toISOString(),
        based_on_report: firstReport.id
      };

      // 프로젝트에 템플릿 저장
      project.template = template;
      project.updated_at = new Date().toISOString();
      
      this.projects.set(projectId, project);
      await this.saveProjects();

      logger.info('프로젝트 템플릿 생성 완료', { 
        project_id: projectId, 
        based_on_report: firstReport.id 
      });

      return template;
    } catch (error) {
      logger.error('프로젝트 템플릿 생성 실패', { error: error.message });
      throw error;
    }
  }

  extractCommonFields(reportData) {
    // 반복 사용될 가능성이 높은 필드들 추출
    const commonFields = {};
    
    // 기본 정보 필드들
    const commonFieldNames = [
      'company_name', 'project_name', 'location', 'supervisor', 
      'safety_manager', 'inspector', 'department', 'contact_phone',
      'contact_email', 'construction_type', 'work_scope'
    ];

    for (const fieldName of commonFieldNames) {
      if (reportData[fieldName]) {
        commonFields[fieldName] = reportData[fieldName];
      }
    }

    return commonFields;
  }

  analyzeReportStructure(reportData) {
    // 보고서 구조 분석
    const structure = {
      sections: [],
      field_types: {},
      required_fields: []
    };

    function analyzeObject(obj, prefix = '') {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          structure.sections.push(fullKey);
          analyzeObject(value, fullKey);
        } else {
          structure.field_types[fullKey] = Array.isArray(value) ? 'array' : typeof value;
          
          // 필수 필드로 추정되는 것들
          if (key.includes('date') || key.includes('name') || key.includes('inspector')) {
            structure.required_fields.push(fullKey);
          }
        }
      }
    }

    analyzeObject(reportData);
    return structure;
  }

  async getProjectTemplate(projectId) {
    try {
      const project = this.projects.get(projectId);
      if (!project) {
        throw new Error(`프로젝트를 찾을 수 없습니다: ${projectId}`);
      }

      // 템플릿이 없으면 자동 생성
      if (!project.template && project.reports.length > 0) {
        return await this.createProjectTemplate(projectId);
      }

      return project.template || null;
    } catch (error) {
      logger.error('프로젝트 템플릿 조회 실패', { error: error.message });
      throw error;
    }
  }

  async generateReportDefaults(projectId, reportType = null) {
    try {
      const project = this.projects.get(projectId);
      if (!project) {
        throw new Error(`프로젝트를 찾을 수 없습니다: ${projectId}`);
      }

      const template = await this.getProjectTemplate(projectId);
      if (!template) {
        throw new Error('프로젝트 템플릿이 없습니다. 먼저 보고서를 작성해주세요.');
      }

      // 기본값 생성
      const defaults = {
        // 프로젝트 기본 정보
        company_name: project.client,
        project_name: project.name,
        location: project.location,
        safety_manager: project.safety_manager,
        
        // 연락처 정보
        contact_phone: project.contact_info?.phone || '',
        contact_email: project.contact_info?.email || '',
        
        // 템플릿에서 추출한 공통 필드들
        ...template.common_fields,
        
        // 현재 날짜 정보
        inspection_date: new Date().toISOString().split('T')[0],
        report_date: new Date().toISOString().split('T')[0],
        
        // 이전 보고서에서 참조할 수 있는 정보들
        previous_reports_summary: this.generatePreviousReportsSummary(project),
        
        // 보고서 번호 자동 생성
        report_number: this.generateReportNumber(project, reportType)
      };

      // 타입별 특화 기본값
      if (reportType) {
        const typeSpecificDefaults = this.getTypeSpecificDefaults(project, reportType);
        Object.assign(defaults, typeSpecificDefaults);
      }

      logger.info('보고서 기본값 생성 완료', { 
        project_id: projectId, 
        report_type: reportType 
      });

      return defaults;
    } catch (error) {
      logger.error('보고서 기본값 생성 실패', { error: error.message });
      throw error;
    }
  }

  generatePreviousReportsSummary(project) {
    if (project.reports.length === 0) {
      return null;
    }

    const recentReports = project.reports
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 3);

    return {
      total_reports: project.total_reports,
      last_report_date: project.last_report_date,
      recent_reports: recentReports.map(report => ({
        title: report.title,
        type: report.type,
        date: report.created_at,
        status: report.status
      }))
    };
  }

  generateReportNumber(project, reportType) {
    const year = new Date().getFullYear();
    const typeCode = this.getTypeCode(reportType);
    const sequence = project.reports.filter(r => 
      r.type === reportType && 
      new Date(r.created_at).getFullYear() === year
    ).length + 1;

    return `${project.client || 'PRJ'}-${typeCode}-${year}-${sequence.toString().padStart(3, '0')}`;
  }

  getTypeCode(reportType) {
    const typeCodes = {
      'safety_inspection': 'SI',
      'incident_report': 'IR',
      'risk_assessment': 'RA',
      'training_report': 'TR',
      'audit_report': 'AR',
      'compliance_report': 'CR'
    };
    
    return typeCodes[reportType] || 'GR';
  }

  getTypeSpecificDefaults(project, reportType) {
    const defaults = {};
    
    switch (reportType) {
      case 'safety_inspection':
        defaults.inspection_type = '정기 안전점검';
        defaults.inspection_scope = '전체 현장';
        defaults.weather_condition = '맑음';
        defaults.temperature = '20°C';
        break;
        
      case 'incident_report':
        defaults.incident_severity = 'minor';
        defaults.immediate_action_taken = '';
        defaults.investigation_required = true;
        break;
        
      case 'risk_assessment':
        defaults.assessment_method = 'JSA (Job Safety Analysis)';
        defaults.risk_level = 'medium';
        defaults.control_measures = [];
        break;
        
      case 'training_report':
        defaults.training_type = '안전교육';
        defaults.duration_hours = 2;
        defaults.attendance_required = true;
        break;
    }
    
    return defaults;
  }

  async getLastReportData(projectId, reportType = null) {
    try {
      const project = this.projects.get(projectId);
      if (!project) {
        throw new Error(`프로젝트를 찾을 수 없습니다: ${projectId}`);
      }

      let targetReports = project.reports;
      
      // 특정 타입의 마지막 보고서를 찾는 경우
      if (reportType) {
        targetReports = project.reports.filter(report => report.type === reportType);
      }

      if (targetReports.length === 0) {
        return null;
      }

      // 가장 최근 보고서 반환
      const lastReport = targetReports.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      )[0];

      return {
        report: lastReport,
        reusable_data: this.extractReusableData(lastReport.data)
      };
    } catch (error) {
      logger.error('마지막 보고서 데이터 조회 실패', { error: error.message });
      throw error;
    }
  }

  extractReusableData(reportData) {
    // 재사용 가능한 데이터만 추출 (날짜, 고유 ID 등은 제외)
    const reusableData = { ...reportData };
    
    // 제외할 필드들
    const excludeFields = [
      'inspection_date', 'report_date', 'created_date',
      'report_id', 'document_id', 'sequence_number',
      'findings', 'incidents', 'specific_observations',
      'timestamp', 'signature_date'
    ];

    excludeFields.forEach(field => {
      delete reusableData[field];
    });

    return reusableData;
  }

  // ✅ Project TT 가이드라인: 파일 시스템 스캔 및 보고서 로드
  async scanProjectDirectories() {
    try {
      logger.info('프로젝트 디렉토리 스캔 시작');
      
      const entries = await fs.readdir(this.projectsDir, { withFileTypes: true });
      const projectDirs = entries.filter(entry => entry.isDirectory());
      
      logger.info('발견된 프로젝트 디렉토리', { count: projectDirs.length, directories: projectDirs.map(d => d.name) });
      
      for (const dir of projectDirs) {
        const folderName = dir.name;
        const projectDir = path.join(this.projectsDir, folderName);
        const projectFile = path.join(projectDir, 'project.json');
        
        if (await this.fileExists(projectFile)) {
          try {
            const projectData = await fs.readFile(projectFile, 'utf-8');
            const project = JSON.parse(projectData);
            
            // 폴더명 정보 추가
            project.folder_name = folderName;
            
            // 프로젝트 정보를 Map에 추가 (ID 기반)
            this.projects.set(project.id, project);
            logger.info('프로젝트 디렉토리에서 로드됨', { project_id: project.id, folder_name: folderName, name: project.name });
            
            // 프로젝트 로드 후 보고서 수 업데이트
            await this.updateProjectReportsCount(project.id);
          } catch (error) {
            logger.error('프로젝트 파일 파싱 실패', { folder_name: folderName, error: error.message, stack: error.stack });
            // 개별 프로젝트 실패는 전체 스캔에 영향을 주지 않도록 함
          }
        } else {
          logger.warn('프로젝트 파일이 존재하지 않음', { folder_name: folderName, project_dir: projectDir });
        }
      }
      
      logger.info('프로젝트 디렉토리 스캔 완료', { total_projects: this.projects.size });
    } catch (error) {
      logger.error('프로젝트 디렉토리 스캔 실패', { error: error.message, stack: error.stack });
      // 스캔 실패 시 기존 프로젝트는 유지
    }
  }

  async updateProjectReportsCount(projectId) {
    try {
      const project = this.projects.get(projectId);
      if (!project) {
        logger.warn('보고서 수 업데이트 시도했지만 프로젝트가 존재하지 않음', { project_id: projectId });
        return;
      }
      
      const projectDir = path.join(this.projectsDir, project.folder_name || projectId);
      const reportsDir = path.join(projectDir, 'reports');
      
      let reportsCount = 0;
      if (await this.fileExists(reportsDir)) {
        const reportFiles = await fs.readdir(reportsDir);
        const jsonReports = reportFiles.filter(file => file.endsWith('.json'));
        reportsCount = jsonReports.length;
      }
      
      // 프로젝트 정보 업데이트
      project.reports_count = reportsCount;
      this.projects.set(projectId, project);
      
      // project.json 파일도 업데이트
      const projectInfoPath = path.join(projectDir, 'project.json');
      if (await this.fileExists(projectInfoPath)) {
        const projectInfo = JSON.parse(await fs.readFile(projectInfoPath, 'utf-8'));
        projectInfo.reports_count = reportsCount;
        projectInfo.updated_at = new Date().toISOString();
        await fs.writeFile(projectInfoPath, JSON.stringify(projectInfo, null, 2), 'utf-8');
        logger.info('프로젝트 JSON 파일 업데이트 완료', { project_id: projectId, reports_count: reportsCount });
      }
      
      logger.info('프로젝트 보고서 수 업데이트 완료', { project_id: projectId, reports_count: reportsCount });
    } catch (error) {
      logger.error('프로젝트 보고서 수 업데이트 실패', { project_id: projectId, error: error.message });
    }
  }

  async loadProjectReports(projectId) {
    try {
      const project = this.projects.get(projectId);
      if (!project) {
        logger.warn('보고서 로드 시도했지만 프로젝트가 존재하지 않음', { project_id: projectId });
        return;
      }
      
      const projectDir = path.join(this.projectsDir, project.folder_name || projectId);
      const reportsDir = path.join(projectDir, 'reports');
      
      if (await this.fileExists(reportsDir)) {
        const reportFiles = await fs.readdir(reportsDir);
        const jsonReports = reportFiles.filter(file => file.endsWith('.json'));
        
        const reports = [];
        for (const reportFile of jsonReports) {
          try {
            const reportPath = path.join(reportsDir, reportFile);
            const reportData = await fs.readFile(reportPath, 'utf-8');
            const report = JSON.parse(reportData);
            reports.push(report);
          } catch (error) {
            logger.error('보고서 파일 파싱 실패', { project_id: projectId, report_file: reportFile, error: error.message });
            // 개별 보고서 실패는 전체 로드에 영향을 주지 않도록 함
          }
        }
        
        // 프로젝트 정보 업데이트
        project.reports = reports;
        project.total_reports = reports.length;
        project.reports_count = reports.length; // reports_count도 업데이트
        project.last_report_date = reports.length > 0 ? reports[reports.length - 1]?.created_at || null : null;
        
        this.projects.set(projectId, project);
        logger.info('프로젝트 보고서 로드 완료', { project_id: projectId, report_count: reports.length });
      } else {
        // reports 디렉토리가 없으면 빈 배열로 초기화
        project.reports = [];
        project.total_reports = 0;
        project.reports_count = 0; // reports_count도 업데이트
        project.last_report_date = null;
        this.projects.set(projectId, project);
        logger.info('프로젝트 보고서 디렉토리가 없음', { project_id: projectId });
      }
    } catch (error) {
      logger.error('프로젝트 보고서 로드 실패',
        { project_id: projectId, error: error.message });
    }
  }
}

// ✅ Project TT 가이드라인: 싱글톤 인스턴스
let instance = null;

function getProjectManager() {
  if (!instance) {
    instance = new ProjectManager();
  }
  return instance;
}

// ✅ Project TT 가이드라인: 도메인 함수 직접 export
export async function getAllProjects() {
  const projectManager = getProjectManager();
  return await projectManager.getAllProjects();
}

export async function getProject(projectId) {
  const projectManager = getProjectManager();
  return await projectManager.getProject(projectId);
}

export async function createProject(projectData) {
  const projectManager = getProjectManager();
  return await projectManager.createProject(projectData);
}

export async function updateProject(projectId, updateData) {
  const projectManager = getProjectManager();
  return await projectManager.updateProject(projectId, updateData);
}

export async function deleteProject(projectId) {
  const projectManager = getProjectManager();
  return await projectManager.deleteProject(projectId);
}

// getProjectManager 함수 export
export { getProjectManager };

// 기존 default export 유지 (하위 호환성)
export { ProjectManager };

