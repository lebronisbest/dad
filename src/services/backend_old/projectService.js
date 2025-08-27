import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../core/logger.js';

// ES 모듈에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ProjectService {
  constructor() {
    this.projectsDir = path.join(__dirname, '../../projects');
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
      logger.info('프로젝트 서비스 초기화 완료');
    } catch (error) {
      logger.error('프로젝트 서비스 초기화 실패', { error: error.message });
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
      
      if (await this.fileExists(this.projectsFile)) {
        const data = await fs.readFile(this.projectsFile, 'utf-8');
        const projectsData = JSON.parse(data);
        
        this.projects.clear();
        for (const [id, project] of Object.entries(projectsData)) {
          this.projects.set(id, project);
        }
        logger.info('프로젝트 파일에서 로드됨', { count: Object.keys(projectsData).length });
      } else {
        logger.warn('프로젝트 파일이 존재하지 않습니다. 새로 생성합니다.');
        this.projects.clear();
      }
      
      // 프로젝트 디렉토리에서도 프로젝트 정보를 로드
      await this.scanProjectDirectories();
      
      // 각 프로젝트의 보고서 정보를 로드
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

  async deleteProject(projectId) {
    try {
      // ✅ Project TT 가이드라인: 초기화 완료 보장
      await this.ensureInitialized();
      
      logger.info('프로젝트 삭제 시작', { project_id: projectId });
      
      const project = this.projects.get(projectId);
      if (!project) {
        throw new Error(`프로젝트를 찾을 수 없습니다: ${projectId}`);
      }

      logger.info('프로젝트 찾음', { project_id: projectId, project_name: project.name });

      // 프로젝트 폴더 삭제
      const projectDir = path.join(this.projectsDir, projectId);
      if (await this.fileExists(projectDir)) {
        await fs.rm(projectDir, { recursive: true, force: true });
        logger.info('프로젝트 폴더 삭제 완료', { project_id: projectId });
      }

      // 프로젝트 맵에서 제거
      this.projects.delete(projectId);
      await this.saveProjects();

      logger.info('프로젝트 삭제 완료', { project_id: projectId, project_name: project.name });
      return { success: true, deletedProject: project };
    } catch (error) {
      logger.error('프로젝트 삭제 실패', { project_id: projectId, error: error.message });
      throw error;
    }
  }

  async getProject(projectId) {
    try {
      await this.ensureInitialized();
      
      const project = this.projects.get(projectId);
      if (!project) {
        throw new Error(`프로젝트를 찾을 수 없습니다: ${projectId}`);
      }
      
      return project;
    } catch (error) {
      logger.error('프로젝트 조회 실패', { project_id: projectId, error: error.message });
      throw error;
    }
  }

  async getAllProjects() {
    try {
      await this.ensureInitialized();
      
      const projectsList = Array.from(this.projects.values());
      return projectsList;
    } catch (error) {
      logger.error('전체 프로젝트 조회 실패', { error: error.message });
      throw error;
    }
  }

  async searchProjects(searchTerm, filters = {}) {
    try {
      await this.ensureInitialized();
      
      let results = Array.from(this.projects.values());
      
      // 검색어 필터링
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        results = results.filter(project => 
          project.name.toLowerCase().includes(term) ||
          project.description.toLowerCase().includes(term) ||
          project.location.toLowerCase().includes(term) ||
          project.client.toLowerCase().includes(term)
        );
      }
      
      // 추가 필터링
      if (filters.status) {
        results = results.filter(project => project.status === filters.status);
      }
      
      if (filters.type) {
        results = results.filter(project => project.type === filters.type);
      }
      
      if (filters.location) {
        results = results.filter(project => project.location === filters.location);
      }
      
      return results;
    } catch (error) {
      logger.error('프로젝트 검색 실패', { searchTerm, filters, error: error.message });
      throw error;
    }
  }

  async getProjectStats() {
    try {
      await this.ensureInitialized();
      
      const projects = Array.from(this.projects.values());
      
      const stats = {
        total: projects.length,
        active: projects.filter(p => p.status === 'active').length,
        completed: projects.filter(p => p.status === 'completed').length,
        suspended: projects.filter(p => p.status === 'suspended').length,
        byType: {},
        byLocation: {},
        totalReports: 0
      };
      
      // 타입별 통계
      projects.forEach(project => {
        stats.byType[project.type] = (stats.byType[project.type] || 0) + 1;
        stats.byLocation[project.location] = (stats.byLocation[project.location] || 0) + 1;
        stats.totalReports += project.total_reports || 0;
      });
      
      return stats;
    } catch (error) {
      logger.error('프로젝트 통계 조회 실패', { error: error.message });
      throw error;
    }
  }

  // 프로젝트 디렉토리 스캔
  async scanProjectDirectories() {
    try {
      const entries = await fs.readdir(this.projectsDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== 'node_modules') {
          const projectId = entry.name;
          const projectConfigPath = path.join(this.projectsDir, projectId, 'project.json');
          
          if (await this.fileExists(projectConfigPath)) {
            try {
              const configData = await fs.readFile(projectConfigPath, 'utf-8');
              const projectConfig = JSON.parse(configData);
              
              // 기존 프로젝트 정보와 병합
              const existingProject = this.projects.get(projectId);
              if (existingProject) {
                Object.assign(existingProject, projectConfig);
              } else {
                this.projects.set(projectId, projectConfig);
              }
            } catch (error) {
              logger.warn('프로젝트 설정 파일 읽기 실패', { project_id: projectId, error: error.message });
            }
          }
        }
      }
    } catch (error) {
      logger.error('프로젝트 디렉토리 스캔 실패', { error: error.message });
    }
  }

  // 프로젝트 보고서 로드
  async loadProjectReports(projectId) {
    try {
      const project = this.projects.get(projectId);
      if (!project) return;
      
      const projectDir = path.join(this.projectsDir, projectId);
      const reportsDir = path.join(projectDir, 'reports');
      
      if (await this.fileExists(reportsDir)) {
        const reportFiles = await fs.readdir(reportsDir);
        const reports = [];
        
        for (const reportFile of reportFiles) {
          if (reportFile.endsWith('.json')) {
            try {
              const reportPath = path.join(reportsDir, reportFile);
              const reportData = await fs.readFile(reportPath, 'utf-8');
              const report = JSON.parse(reportData);
              reports.push(report);
            } catch (error) {
              logger.warn('보고서 파일 읽기 실패', { project_id: projectId, report_file: reportFile, error: error.message });
            }
          }
        }
        
        project.reports = reports;
        project.total_reports = reports.length;
        
        if (reports.length > 0) {
          const lastReport = reports[reports.length - 1];
          project.last_report_date = lastReport.created_at || lastReport.updated_at;
        }
      }
    } catch (error) {
      logger.error('프로젝트 보고서 로드 실패', { project_id: projectId, error: error.message });
    }
  }
}

export default ProjectService;
