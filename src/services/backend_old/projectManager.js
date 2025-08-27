import ProjectService from './projectService.js';
import ProjectBackupService from './projectBackupService.js';
import ProjectExportService from './projectExportService.js';
import logger from '../core/logger.js';

class ProjectManager {
  constructor() {
    this.projectService = new ProjectService();
    this.backupService = new ProjectBackupService(this.projectService);
    this.exportService = new ProjectExportService(this.projectService);
    this.initialized = false;
  }

  async init() {
    try {
      if (this.initialized) return;

      await this.projectService.init();
      this.initialized = true;
      
      logger.info('ProjectManager 초기화 완료');
    } catch (error) {
      logger.error('ProjectManager 초기화 실패', { error: error.message });
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

  // ===== 프로젝트 기본 관리 =====
  
  async createProject(projectData) {
    await this.ensureInitialized();
    return await this.projectService.createProject(projectData);
  }

  async updateProject(projectId, updateData) {
    await this.ensureInitialized();
    return await this.projectService.updateProject(projectId, updateData);
  }

  async deleteProject(projectId) {
    await this.ensureInitialized();
    return await this.projectService.deleteProject(projectId);
  }

  async getProject(projectId) {
    await this.ensureInitialized();
    return await this.projectService.getProject(projectId);
  }

  async getAllProjects() {
    await this.ensureInitialized();
    return await this.projectService.getAllProjects();
  }

  async searchProjects(searchTerm, filters = {}) {
    await this.ensureInitialized();
    return await this.projectService.searchProjects(searchTerm, filters);
  }

  async getProjectStats() {
    await this.ensureInitialized();
    return await this.projectService.getProjectStats();
  }

  // ===== 프로젝트 백업 관리 =====
  
  async createBackup(projectId, backupOptions = {}) {
    await this.ensureInitialized();
    return await this.backupService.createBackup(projectId, backupOptions);
  }

  async restoreBackup(backupId, restoreOptions = {}) {
    await this.ensureInitialized();
    return await this.backupService.restoreBackup(backupId, restoreOptions);
  }

  async listBackups(projectId = null) {
    await this.ensureInitialized();
    return await this.backupService.listBackups(projectId);
  }

  async deleteBackup(backupId) {
    await this.ensureInitialized();
    return await this.backupService.deleteBackup(backupId);
  }

  async getBackupInfo(backupId) {
    await this.ensureInitialized();
    return await this.backupService.getBackupInfo(backupId);
  }

  // ===== 프로젝트 내보내기 관리 =====
  
  async exportProject(projectId, exportOptions = {}) {
    await this.ensureInitialized();
    return await this.exportService.exportProject(projectId, exportOptions);
  }

  async exportProjectToFormat(projectId, format, exportOptions = {}) {
    await this.ensureInitialized();
    return await this.exportService.exportProjectToFormat(projectId, format, exportOptions);
  }

  async listExports(projectId = null) {
    await this.ensureInitialized();
    return await this.exportService.listExports(projectId);
  }

  async deleteExport(exportId) {
    await this.ensureInitialized();
    return await this.exportService.deleteExport(exportId);
  }

  async getExportInfo(exportId) {
    await this.ensureInitialized();
    return await this.exportService.getExportInfo(exportId);
  }

  async getExportStats() {
    await this.ensureInitialized();
    return await this.exportService.getExportStats();
  }

  // ===== 통합 기능 =====
  
  async getProjectWithBackups(projectId) {
    await this.ensureInitialized();
    
    try {
      const [project, backups, exports] = await Promise.all([
        this.projectService.getProject(projectId),
        this.backupService.listBackups(projectId),
        this.exportService.listExports(projectId)
      ]);
      
      return {
        project,
        backups,
        exports,
        backupCount: backups.length,
        exportCount: exports.length
      };
    } catch (error) {
      logger.error('프로젝트 통합 정보 조회 실패', { project_id: projectId, error: error.message });
      throw error;
    }
  }

  async getProjectSummary(projectId) {
    await this.ensureInitialized();
    
    try {
      const project = await this.projectService.getProject(projectId);
      const backups = await this.backupService.listBackups(projectId);
      const exports = await this.exportService.listExports(projectId);
      
      const summary = {
        id: project.id,
        name: project.name,
        status: project.status,
        type: project.type,
        location: project.location,
        client: project.client,
        startDate: project.start_date,
        endDate: project.end_date,
        safetyManager: project.safety_manager,
        totalReports: project.total_reports || 0,
        lastReportDate: project.last_report_date,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        backupCount: backups.length,
        exportCount: exports.length,
        lastBackup: backups.length > 0 ? backups[0] : null,
        lastExport: exports.length > 0 ? exports[0] : null
      };
      
      return summary;
    } catch (error) {
      logger.error('프로젝트 요약 정보 조회 실패', { project_id: projectId, error: error.message });
      throw error;
    }
  }

  async getSystemOverview() {
    await this.ensureInitialized();
    
    try {
      const [projectStats, backupStats, exportStats] = await Promise.all([
        this.projectService.getProjectStats(),
        this.getBackupStats(),
        this.exportService.getExportStats()
      ]);
      
      return {
        projects: projectStats,
        backups: backupStats,
        exports: exportStats,
        system: {
          totalProjects: projectStats.total,
          totalBackups: backupStats.total,
          totalExports: exportStats.total,
          totalSize: (backupStats.totalSize || 0) + (exportStats.totalSize || 0)
        }
      };
    } catch (error) {
      logger.error('시스템 전체 개요 조회 실패', { error: error.message });
      throw error;
    }
  }

  async getBackupStats() {
    await this.ensureInitialized();
    
    try {
      const backups = await this.backupService.listBackups();
      
      const stats = {
        total: backups.length,
        totalSize: 0,
        byProject: {},
        byDate: {},
        recent: backups.slice(0, 10) // 최근 10개
      };
      
      backups.forEach(backup => {
        // 프로젝트별 통계
        const projectId = backup.projectId;
        stats.byProject[projectId] = (stats.byProject[projectId] || 0) + 1;
        
        // 날짜별 통계
        const date = new Date(backup.createdAt).toDateString();
        stats.byDate[date] = (stats.byDate[date] || 0) + 1;
        
        // 총 크기
        stats.totalSize += backup.size || 0;
      });
      
      return stats;
    } catch (error) {
      logger.error('백업 통계 조회 실패', { error: error.message });
      throw error;
    }
  }

  // ===== 유틸리티 메서드 =====
  
  async fileExists(filePath) {
    return await this.projectService.fileExists(filePath);
  }

  generateProjectId() {
    return this.projectService.generateProjectId();
  }

  // ===== 상태 및 헬스체크 =====
  
  getStatus() {
    return {
      initialized: this.initialized,
      projectService: this.projectService.initialized,
      services: {
        project: this.projectService.initialized,
        backup: true, // backupService는 projectService에 의존
        export: true  // exportService는 projectService에 의존
      }
    };
  }

  async healthCheck() {
    try {
      await this.ensureInitialized();
      
      const projectStats = await this.projectService.getProjectStats();
      const backupStats = await this.getBackupStats();
      const exportStats = await this.exportService.getExportStats();
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          project: 'healthy',
          backup: 'healthy',
          export: 'healthy'
        },
        metrics: {
          projects: projectStats.total,
          backups: backupStats.total,
          exports: exportStats.total,
          totalSize: backupStats.totalSize + exportStats.totalSize
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        services: {
          project: this.projectService.initialized ? 'healthy' : 'unhealthy',
          backup: 'unknown',
          export: 'unknown'
        }
      };
    }
  }

  // ===== 정리 및 종료 =====
  
  async cleanup() {
    try {
      // 임시 파일들 정리
      // 백업 및 내보내기 임시 디렉토리 정리
      logger.info('ProjectManager 정리 작업 시작');
      
      // 여기에 정리 로직 추가
      
      logger.info('ProjectManager 정리 작업 완료');
    } catch (error) {
      logger.error('ProjectManager 정리 작업 실패', { error: error.message });
    }
  }
}

export default ProjectManager;
