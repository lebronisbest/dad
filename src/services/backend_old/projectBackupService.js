import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';
import extract from 'extract-zip';
import logger from '../core/logger.js';

// ES 모듈에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ProjectBackupService {
  constructor(projectService) {
    this.projectService = projectService;
    this.backupsDir = path.join(__dirname, '../../backups');
    this.ensureBackupDirectory();
  }

  async ensureBackupDirectory() {
    try {
      await fs.mkdir(this.backupsDir, { recursive: true });
    } catch (error) {
      logger.error('백업 디렉토리 생성 실패', { error: error.message });
    }
  }

  async createBackup(projectId, backupOptions = {}) {
    try {
      logger.info('프로젝트 백업 시작', { project_id: projectId });
      
      const project = await this.projectService.getProject(projectId);
      if (!project) {
        throw new Error(`프로젝트를 찾을 수 없습니다: ${projectId}`);
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupId = `backup_${projectId}_${timestamp}`;
      const backupPath = path.join(this.backupsDir, `${backupId}.zip`);
      
      // 백업 메타데이터 생성
      const backupMetadata = {
        id: backupId,
        projectId: projectId,
        projectName: project.name,
        createdAt: new Date().toISOString(),
        description: backupOptions.description || '자동 백업',
        version: backupOptions.version || '1.0',
        includesReports: backupOptions.includesReports !== false,
        includesFiles: backupOptions.includesFiles !== false,
        size: 0
      };

      // 백업 파일 생성
      const archive = archiver('zip', {
        zlib: { level: 9 } // 최고 압축률
      });

      const output = fs.createWriteStream(backupPath);
      archive.pipe(output);

      // 프로젝트 정보 추가
      archive.append(JSON.stringify(project, null, 2), { name: 'project.json' });
      archive.append(JSON.stringify(backupMetadata, null, 2), { name: 'backup.json' });

      // 보고서 포함 여부
      if (backupOptions.includesReports !== false && project.reports) {
        for (const report of project.reports) {
          const reportPath = path.join(this.projectService.projectsDir, projectId, 'reports', `${report.id}.json`);
          if (await this.projectService.fileExists(reportPath)) {
            archive.file(reportPath, { name: `reports/${report.id}.json` });
          }
        }
      }

      // 프로젝트 파일 포함 여부
      if (backupOptions.includesFiles !== false) {
        const projectDir = path.join(this.projectService.projectsDir, projectId);
        await this.addDirectoryToArchive(archive, projectDir, `project/${projectId}`);
      }

      // 백업 완료 대기
      await new Promise((resolve, reject) => {
        output.on('close', () => {
          backupMetadata.size = archive.pointer();
          resolve();
        });
        
        archive.on('error', (err) => {
          reject(err);
        });
        
        archive.finalize();
      });

      // 백업 메타데이터 저장
      const metadataPath = path.join(this.backupsDir, `${backupId}.json`);
      await fs.writeFile(metadataPath, JSON.stringify(backupMetadata, null, 2));

      logger.info('프로젝트 백업 완료', { 
        project_id: projectId, 
        backup_id: backupId, 
        size: backupMetadata.size 
      });

      return {
        success: true,
        backupId: backupId,
        backupPath: backupPath,
        metadata: backupMetadata
      };
    } catch (error) {
      logger.error('프로젝트 백업 실패', { project_id: projectId, error: error.message });
      throw error;
    }
  }

  async restoreBackup(backupId, restoreOptions = {}) {
    try {
      logger.info('프로젝트 백업 복원 시작', { backup_id: backupId });
      
      const backupPath = path.join(this.backupsDir, `${backupId}.zip`);
      const metadataPath = path.join(this.backupsDir, `${backupId}.json`);
      
      if (!await this.projectService.fileExists(backupPath)) {
        throw new Error(`백업 파일을 찾을 수 없습니다: ${backupId}`);
      }

      // 백업 메타데이터 읽기
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
      
      // 임시 디렉토리 생성
      const tempDir = path.join(this.backupsDir, `temp_${backupId}`);
      await fs.mkdir(tempDir, { recursive: true });
      
      // 백업 파일 압축 해제
      await extract(backupPath, { dir: tempDir });
      
      // 프로젝트 정보 읽기
      const projectPath = path.join(tempDir, 'project.json');
      const projectData = JSON.parse(await fs.readFile(projectPath, 'utf-8'));
      
      // 기존 프로젝트 확인
      const existingProject = await this.projectService.getProject(projectData.id).catch(() => null);
      
      if (existingProject && !restoreOptions.overwrite) {
        throw new Error('프로젝트가 이미 존재합니다. overwrite 옵션을 사용하세요.');
      }
      
      // 프로젝트 복원
      let restoredProject;
      if (existingProject && restoreOptions.overwrite) {
        // 기존 프로젝트 업데이트
        restoredProject = await this.projectService.updateProject(projectData.id, projectData);
      } else {
        // 새 프로젝트 생성
        restoredProject = await this.projectService.createProject(projectData);
      }
      
      // 보고서 복원
      if (metadata.includesReports && restoreOptions.includesReports !== false) {
        const reportsDir = path.join(tempDir, 'reports');
        if (await this.projectService.fileExists(reportsDir)) {
          const reportFiles = await fs.readdir(reportsDir);
          for (const reportFile of reportFiles) {
            if (reportFile.endsWith('.json')) {
              const reportPath = path.join(reportsDir, reportFile);
              const reportData = JSON.parse(await fs.readFile(reportPath, 'utf-8'));
              
              // 보고서 파일 복사
              const targetReportPath = path.join(
                this.projectService.projectsDir, 
                projectData.id, 
                'reports', 
                reportFile
              );
              
              await fs.mkdir(path.dirname(targetReportPath), { recursive: true });
              await fs.copyFile(reportPath, targetReportPath);
            }
          }
        }
      }
      
      // 프로젝트 파일 복원
      if (metadata.includesFiles && restoreOptions.includesFiles !== false) {
        const projectFilesDir = path.join(tempDir, 'project', projectData.id);
        if (await this.projectService.fileExists(projectFilesDir)) {
          await this.copyDirectory(projectFilesDir, path.join(this.projectService.projectsDir, projectData.id));
        }
      }
      
      // 임시 디렉토리 정리
      await fs.rm(tempDir, { recursive: true, force: true });
      
      logger.info('프로젝트 백업 복원 완료', { 
        backup_id: backupId, 
        project_id: restoredProject.id 
      });
      
      return {
        success: true,
        project: restoredProject,
        metadata: metadata
      };
    } catch (error) {
      logger.error('프로젝트 백업 복원 실패', { backup_id: backupId, error: error.message });
      throw error;
    }
  }

  async listBackups(projectId = null) {
    try {
      const backupFiles = await fs.readdir(this.backupsDir);
      const backups = [];
      
      for (const file of backupFiles) {
        if (file.endsWith('.json') && file !== 'backup.json') {
          try {
            const metadataPath = path.join(this.backupsDir, file);
            const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
            
            // 특정 프로젝트의 백업만 필터링
            if (!projectId || metadata.projectId === projectId) {
              backups.push(metadata);
            }
          } catch (error) {
            logger.warn('백업 메타데이터 읽기 실패', { file, error: error.message });
          }
        }
      }
      
      // 생성일 기준으로 정렬
      backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      return backups;
    } catch (error) {
      logger.error('백업 목록 조회 실패', { error: error.message });
      throw error;
    }
  }

  async deleteBackup(backupId) {
    try {
      logger.info('백업 삭제 시작', { backup_id: backupId });
      
      const backupPath = path.join(this.backupsDir, `${backupId}.zip`);
      const metadataPath = path.join(this.backupsDir, `${backupId}.json`);
      
      // 백업 파일 삭제
      if (await this.projectService.fileExists(backupPath)) {
        await fs.unlink(backupPath);
      }
      
      // 메타데이터 파일 삭제
      if (await this.projectService.fileExists(metadataPath)) {
        await fs.unlink(metadataPath);
      }
      
      logger.info('백업 삭제 완료', { backup_id: backupId });
      
      return { success: true };
    } catch (error) {
      logger.error('백업 삭제 실패', { backup_id: backupId, error: error.message });
      throw error;
    }
  }

  async getBackupInfo(backupId) {
    try {
      const metadataPath = path.join(this.backupsDir, `${backupId}.json`);
      const backupPath = path.join(this.backupsDir, `${backupId}.zip`);
      
      if (!await this.projectService.fileExists(metadataPath)) {
        throw new Error(`백업을 찾을 수 없습니다: ${backupId}`);
      }
      
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
      
      // 파일 크기 정보 추가
      if (await this.projectService.fileExists(backupPath)) {
        const stats = await fs.stat(backupPath);
        metadata.fileSize = stats.size;
        metadata.lastModified = stats.mtime;
      }
      
      return metadata;
    } catch (error) {
      logger.error('백업 정보 조회 실패', { backup_id: backupId, error: error.message });
      throw error;
    }
  }

  // 디렉토리를 아카이브에 추가하는 헬퍼 함수
  async addDirectoryToArchive(archive, sourceDir, targetPath) {
    try {
      const entries = await fs.readdir(sourceDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const sourcePath = path.join(sourceDir, entry.name);
        const archivePath = path.join(targetPath, entry.name);
        
        if (entry.isDirectory()) {
          await this.addDirectoryToArchive(archive, sourcePath, archivePath);
        } else {
          archive.file(sourcePath, { name: archivePath });
        }
      }
    } catch (error) {
      logger.warn('디렉토리 아카이브 추가 실패', { sourceDir, error: error.message });
    }
  }

  // 디렉토리 복사 헬퍼 함수
  async copyDirectory(source, target) {
    try {
      await fs.mkdir(target, { recursive: true });
      const entries = await fs.readdir(source, { withFileTypes: true });
      
      for (const entry of entries) {
        const sourcePath = path.join(source, entry.name);
        const targetPath = path.join(target, entry.name);
        
        if (entry.isDirectory()) {
          await this.copyDirectory(sourcePath, targetPath);
        } else {
          await fs.copyFile(sourcePath, targetPath);
        }
      }
    } catch (error) {
      logger.warn('디렉토리 복사 실패', { source, target, error: error.message });
    }
  }
}

export default ProjectBackupService;
