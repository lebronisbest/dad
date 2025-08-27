import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';
import logger from '../core/logger.js';

// ES 모듈에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ProjectExportService {
  constructor(projectService) {
    this.projectService = projectService;
    this.exportsDir = path.join(__dirname, '../../exports');
    this.ensureExportDirectory();
  }

  async ensureExportDirectory() {
    try {
      await fs.mkdir(this.exportsDir, { recursive: true });
    } catch (error) {
      logger.error('내보내기 디렉토리 생성 실패', { error: error.message });
    }
  }

  async exportProject(projectId, exportOptions = {}) {
    try {
      logger.info('프로젝트 내보내기 시작', { project_id: projectId });
      
      const project = await this.projectService.getProject(projectId);
      if (!project) {
        throw new Error(`프로젝트를 찾을 수 없습니다: ${projectId}`);
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const exportId = `export_${projectId}_${timestamp}`;
      const exportPath = path.join(this.exportsDir, `${exportId}.zip`);
      
      // 내보내기 메타데이터 생성
      const exportMetadata = {
        id: exportId,
        projectId: projectId,
        projectName: project.name,
        exportedAt: new Date().toISOString(),
        format: exportOptions.format || 'zip',
        includesReports: exportOptions.includesReports !== false,
        includesFiles: exportOptions.includesFiles !== false,
        includesMetadata: exportOptions.includesMetadata !== false,
        size: 0
      };

      // 내보내기 파일 생성
      const archive = archiver('zip', {
        zlib: { level: 9 } // 최고 압축률
      });

      const output = fs.createWriteStream(exportPath);
      archive.pipe(output);

      // 프로젝트 정보 추가
      if (exportOptions.includesMetadata !== false) {
        archive.append(JSON.stringify(project, null, 2), { name: 'project.json' });
        archive.append(JSON.stringify(exportMetadata, null, 2), { name: 'export.json' });
      }

      // 보고서 포함 여부
      if (exportOptions.includesReports !== false && project.reports) {
        for (const report of project.reports) {
          const reportPath = path.join(this.projectService.projectsDir, projectId, 'reports', `${report.id}.json`);
          if (await this.projectService.fileExists(reportPath)) {
            archive.file(reportPath, { name: `reports/${report.id}.json` });
          }
        }
      }

      // 프로젝트 파일 포함 여부
      if (exportOptions.includesFiles !== false) {
        const projectDir = path.join(this.projectService.projectsDir, projectId);
        await this.addDirectoryToArchive(archive, projectDir, `project/${projectId}`);
      }

      // 내보내기 완료 대기
      await new Promise((resolve, reject) => {
        output.on('close', () => {
          exportMetadata.size = archive.pointer();
          resolve();
        });
        
        archive.on('error', (err) => {
          reject(err);
        });
        
        archive.finalize();
      });

      // 내보내기 메타데이터 저장
      const metadataPath = path.join(this.exportsDir, `${exportId}.json`);
      await fs.writeFile(metadataPath, JSON.stringify(exportMetadata, null, 2));

      logger.info('프로젝트 내보내기 완료', { 
        project_id: projectId, 
        export_id: exportId, 
        size: exportMetadata.size 
      });

      return {
        success: true,
        exportId: exportId,
        exportPath: exportPath,
        metadata: exportMetadata
      };
    } catch (error) {
      logger.error('프로젝트 내보내기 실패', { project_id: projectId, error: error.message });
      throw error;
    }
  }

  async exportProjectToFormat(projectId, format, exportOptions = {}) {
    try {
      switch (format.toLowerCase()) {
        case 'zip':
          return await this.exportProject(projectId, exportOptions);
        case 'json':
          return await this.exportProjectToJSON(projectId, exportOptions);
        case 'csv':
          return await this.exportProjectToCSV(projectId, exportOptions);
        case 'pdf':
          return await this.exportProjectToPDF(projectId, exportOptions);
        default:
          throw new Error(`지원하지 않는 내보내기 형식입니다: ${format}`);
      }
    } catch (error) {
      logger.error('프로젝트 형식별 내보내기 실패', { project_id: projectId, format, error: error.message });
      throw error;
    }
  }

  async exportProjectToJSON(projectId, exportOptions = {}) {
    try {
      const project = await this.projectService.getProject(projectId);
      if (!project) {
        throw new Error(`프로젝트를 찾을 수 없습니다: ${projectId}`);
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const exportId = `export_${projectId}_${timestamp}`;
      const exportPath = path.join(this.exportsDir, `${exportId}.json`);

      // 내보낼 데이터 구성
      const exportData = {
        project: project,
        metadata: {
          exportedAt: new Date().toISOString(),
          format: 'json',
          version: '1.0'
        }
      };

      // 보고서 포함 여부
      if (exportOptions.includesReports !== false && project.reports) {
        exportData.reports = project.reports;
      }

      // JSON 파일로 저장
      await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2));

      logger.info('프로젝트 JSON 내보내기 완료', { project_id: projectId, export_path: exportPath });

      return {
        success: true,
        exportId: exportId,
        exportPath: exportPath,
        format: 'json'
      };
    } catch (error) {
      logger.error('프로젝트 JSON 내보내기 실패', { project_id: projectId, error: error.message });
      throw error;
    }
  }

  async exportProjectToCSV(projectId, exportOptions = {}) {
    try {
      const project = await this.projectService.getProject(projectId);
      if (!project) {
        throw new Error(`프로젝트를 찾을 수 없습니다: ${projectId}`);
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const exportId = `export_${projectId}_${timestamp}`;
      const exportPath = path.join(this.exportsDir, `${exportId}.csv`);

      // CSV 헤더 생성
      let csvContent = '프로젝트 ID,프로젝트명,설명,위치,클라이언트,시작일,종료일,상태,타입,안전관리자,생성일,수정일\n';
      
      // 프로젝트 정보 추가
      csvContent += `"${project.id}","${project.name}","${project.description}","${project.location}","${project.client}","${project.start_date}","${project.end_date}","${project.status}","${project.type}","${project.safety_manager}","${project.created_at}","${project.updated_at}"\n`;

      // 보고서 포함 여부
      if (exportOptions.includesReports !== false && project.reports) {
        csvContent += '\n보고서 정보\n';
        csvContent += '보고서 ID,제목,타입,상태,생성일,수정일\n';
        
        for (const report of project.reports) {
          csvContent += `"${report.id}","${report.title}","${report.type}","${report.status}","${report.created_at}","${report.updated_at}"\n`;
        }
      }

      // CSV 파일로 저장
      await fs.writeFile(exportPath, csvContent, 'utf-8');

      logger.info('프로젝트 CSV 내보내기 완료', { project_id: projectId, export_path: exportPath });

      return {
        success: true,
        exportId: exportId,
        exportPath: exportPath,
        format: 'csv'
      };
    } catch (error) {
      logger.error('프로젝트 CSV 내보내기 실패', { project_id: projectId, error: error.message });
      throw error;
    }
  }

  async exportProjectToPDF(projectId, exportOptions = {}) {
    try {
      // PDF 내보내기는 별도 구현 필요
      // 현재는 기본 JSON 내보내기로 대체
      logger.warn('PDF 내보내기는 아직 구현되지 않았습니다. JSON 형식으로 대체합니다.');
      return await this.exportProjectToJSON(projectId, exportOptions);
    } catch (error) {
      logger.error('프로젝트 PDF 내보내기 실패', { project_id: projectId, error: error.message });
      throw error;
    }
  }

  async listExports(projectId = null) {
    try {
      const exportFiles = await fs.readdir(this.exportsDir);
      const exports = [];
      
      for (const file of exportFiles) {
        if (file.endsWith('.json') && file !== 'export.json') {
          try {
            const metadataPath = path.join(this.exportsDir, file);
            const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
            
            // 특정 프로젝트의 내보내기만 필터링
            if (!projectId || metadata.projectId === projectId) {
              exports.push(metadata);
            }
          } catch (error) {
            logger.warn('내보내기 메타데이터 읽기 실패', { file, error: error.message });
          }
        }
      }
      
      // 내보내기일 기준으로 정렬
      exports.sort((a, b) => new Date(b.exportedAt) - new Date(a.exportedAt));
      
      return exports;
    } catch (error) {
      logger.error('내보내기 목록 조회 실패', { error: error.message });
      throw error;
    }
  }

  async deleteExport(exportId) {
    try {
      logger.info('내보내기 삭제 시작', { export_id: exportId });
      
      const exportPath = path.join(this.exportsDir, `${exportId}.zip`);
      const jsonPath = path.join(this.exportsDir, `${exportId}.json`);
      const csvPath = path.join(this.exportsDir, `${exportId}.csv`);
      const metadataPath = path.join(this.exportsDir, `${exportId}.json`);
      
      // 내보내기 파일들 삭제
      const filesToDelete = [exportPath, jsonPath, csvPath, metadataPath];
      
      for (const filePath of filesToDelete) {
        if (await this.projectService.fileExists(filePath)) {
          await fs.unlink(filePath);
        }
      }
      
      logger.info('내보내기 삭제 완료', { export_id: exportId });
      
      return { success: true };
    } catch (error) {
      logger.error('내보내기 삭제 실패', { export_id: exportId, error: error.message });
      throw error;
    }
  }

  async getExportInfo(exportId) {
    try {
      const metadataPath = path.join(this.exportsDir, `${exportId}.json`);
      
      if (!await this.projectService.fileExists(metadataPath)) {
        throw new Error(`내보내기를 찾을 수 없습니다: ${exportId}`);
      }
      
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
      
      // 파일 크기 정보 추가
      const exportPath = path.join(this.exportsDir, `${exportId}.${metadata.format || 'zip'}`);
      if (await this.projectService.fileExists(exportPath)) {
        const stats = await fs.stat(exportPath);
        metadata.fileSize = stats.size;
        metadata.lastModified = stats.mtime;
      }
      
      return metadata;
    } catch (error) {
      logger.error('내보내기 정보 조회 실패', { export_id: exportId, error: error.message });
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

  // 내보내기 통계 조회
  async getExportStats() {
    try {
      const exports = await this.listExports();
      
      const stats = {
        total: exports.length,
        byFormat: {},
        byProject: {},
        totalSize: 0
      };
      
      exports.forEach(exportItem => {
        // 형식별 통계
        const format = exportItem.format || 'unknown';
        stats.byFormat[format] = (stats.byFormat[format] || 0) + 1;
        
        // 프로젝트별 통계
        const projectId = exportItem.projectId;
        stats.byProject[projectId] = (stats.byProject[projectId] || 0) + 1;
        
        // 총 크기
        stats.totalSize += exportItem.size || 0;
      });
      
      return stats;
    } catch (error) {
      logger.error('내보내기 통계 조회 실패', { error: error.message });
      throw error;
    }
  }
}

export default ProjectExportService;
