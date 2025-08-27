// 파일 시스템 유틸리티
import fs from 'fs';
import path from 'path';
import { FileNameGenerator } from '../../core/utils.js';

// 프로젝트 루트 경로
const PROJECTS_ROOT = 'projects';

// 안전한 파일명 생성 (특수문자 제거)
export const sanitizeFileName = (fileName) => {
  return fileName.replace(/[<>:"/\\|?*]/g, '_');
};

// 프로젝트 폴더 생성
export const createProjectFolder = async (projectName) => {
  try {
    const sanitizedName = sanitizeFileName(projectName);
    const projectPath = path.join(PROJECTS_ROOT, sanitizedName);
    
    // 프로젝트 루트 폴더가 없으면 생성
    if (!fs.existsSync(PROJECTS_ROOT)) {
      fs.mkdirSync(PROJECTS_ROOT, { recursive: true });
    }
    
    // 프로젝트 폴더 생성
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true });
    }
    
    // 하위 폴더들 생성
    const subFolders = ['reports', 'schedule', 'attachments', 'attachments/images'];
    for (const folder of subFolders) {
      const subPath = path.join(projectPath, folder);
      if (!fs.existsSync(subPath)) {
        fs.mkdirSync(subPath, { recursive: true });
      }
    }
    
    return { success: true, path: projectPath };
  } catch (error) {
    console.error('프로젝트 폴더 생성 오류:', error);
    return { success: false, error: error.message };
  }
};

// 프로젝트 정보 저장
export const saveProjectData = async (project) => {
  try {
    const sanitizedName = sanitizeFileName(project.name);
    const projectPath = path.join(PROJECTS_ROOT, sanitizedName);
    const projectFile = path.join(projectPath, 'project.json');
    
    // 프로젝트 폴더가 없으면 생성
    if (!fs.existsSync(projectPath)) {
      await createProjectFolder(project.name);
    }
    
    // 프로젝트 정보를 JSON 파일로 저장
    const projectData = {
      ...project,
      updatedAt: new Date().toISOString(),
      folderPath: projectPath
    };
    
    fs.writeFileSync(projectFile, JSON.stringify(projectData, null, 2), 'utf8');
    
    return { success: true, path: projectFile };
  } catch (error) {
    console.error('프로젝트 저장 오류:', error);
    return { success: false, error: error.message };
  }
};

// 프로젝트 정보 로드
export const loadProjectData = async (projectName) => {
  try {
    const sanitizedName = sanitizeFileName(projectName);
    const projectPath = path.join(PROJECTS_ROOT, sanitizedName);
    const projectFile = path.join(projectPath, 'project.json');
    
    if (!fs.existsSync(projectFile)) {
      return { success: false, error: '프로젝트 파일을 찾을 수 없습니다.' };
    }
    
    const projectData = fs.readFileSync(projectFile, 'utf8');
    return { success: true, data: JSON.parse(projectData) };
  } catch (error) {
    console.error('프로젝트 로드 오류:', error);
    return { success: false, error: error.message };
  }
};

// 모든 프로젝트 목록 가져오기
export const getAllProjects = async () => {
  try {
    if (!fs.existsSync(PROJECTS_ROOT)) {
      return { success: true, projects: [] };
    }
    
    const projectFolders = fs.readdirSync(PROJECTS_ROOT);
    const projects = [];
    
    for (const folder of projectFolders) {
      const projectFile = path.join(PROJECTS_ROOT, folder, 'project.json');
      if (fs.existsSync(projectFile)) {
        try {
          const projectData = fs.readFileSync(projectFile, 'utf8');
          projects.push(JSON.parse(projectData));
        } catch (error) {
          console.error(`프로젝트 ${folder} 로드 오류:`, error);
        }
      }
    }
    
    return { success: true, projects };
  } catch (error) {
    console.error('프로젝트 목록 로드 오류:', error);
    return { success: false, error: error.message };
  }
};

// 프로젝트 삭제
export const deleteProject = async (projectName) => {
  try {
    const sanitizedName = sanitizeFileName(projectName);
    const projectPath = path.join(PROJECTS_ROOT, sanitizedName);
    
    if (fs.existsSync(projectPath)) {
      // 폴더 내 모든 파일 삭제
      const deleteFolderRecursive = (folderPath) => {
        if (fs.existsSync(folderPath)) {
          fs.readdirSync(folderPath).forEach((file) => {
            const curPath = path.join(folderPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
              deleteFolderRecursive(curPath);
            } else {
              fs.unlinkSync(curPath);
            }
          });
          fs.rmdirSync(folderPath);
        }
      };
      
      deleteFolderRecursive(projectPath);
      return { success: true };
    }
    
    return { success: false, error: '프로젝트를 찾을 수 없습니다.' };
  } catch (error) {
    console.error('프로젝트 삭제 오류:', error);
    return { success: false, error: error.message };
  }
};

// 보고서 저장
export const saveReport = async (projectName, report) => {
  try {
    const sanitizedName = sanitizeFileName(projectName);
    const reportPath = path.join(PROJECTS_ROOT, sanitizedName, 'reports');
    
    // 새로운 파일명 생성 로직 적용
    const fileName = FileNameGenerator.generateReportFileName({
      visitRound: report.visit?.round || 1,
      projectName: projectName,
      extension: 'json'
    });
    
    const reportFile = path.join(reportPath, fileName);
    
    // 중복 파일 검사
    if (fs.existsSync(reportFile)) {
      return { 
        success: false, 
        error: '중복된 보고서가 있습니다',
        code: 'DUPLICATE_REPORT',
        details: {
          fileName: fileName,
          existingPath: reportFile
        }
      };
    }
    
    // 보고서 폴더가 없으면 생성
    if (!fs.existsSync(reportPath)) {
      fs.mkdirSync(reportPath, { recursive: true });
    }
    
    const reportData = {
      ...report,
      savedAt: new Date().toISOString(),
      projectName: sanitizedName
    };
    
    fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2), 'utf8');
    
    return { success: true, path: reportFile };
  } catch (error) {
    console.error('보고서 저장 오류:', error);
    return { success: false, error: error.message };
  }
};

// 프로젝트의 모든 보고서 가져오기
export const getProjectReports = async (projectName) => {
  try {
    const sanitizedName = sanitizeFileName(projectName);
    const reportPath = path.join(PROJECTS_ROOT, sanitizedName, 'reports');
    
    if (!fs.existsSync(reportPath)) {
      return { success: true, reports: [] };
    }
    
    const reportFiles = fs.readdirSync(reportPath);
    const reports = [];
    
    for (const file of reportFiles) {
      if (file.endsWith('.json')) {
        try {
          const reportData = fs.readFileSync(path.join(reportPath, file), 'utf8');
          reports.push(JSON.parse(reportData));
        } catch (error) {
          console.error(`보고서 ${file} 로드 오류:`, error);
        }
      }
    }
    
    return { success: true, reports };
  } catch (error) {
    console.error('보고서 목록 로드 오류:', error);
    return { success: false, error: error.message };
  }
};

// 일정 저장
export const saveSchedule = async (projectName, events) => {
  try {
    const sanitizedName = sanitizeFileName(projectName);
    const schedulePath = path.join(PROJECTS_ROOT, sanitizedName, 'schedule');
    const scheduleFile = path.join(schedulePath, 'events.json');
    
    // 일정 폴더가 없으면 생성
    if (!fs.existsSync(schedulePath)) {
      fs.mkdirSync(schedulePath, { recursive: true });
    }
    
    const scheduleData = {
      events,
      savedAt: new Date().toISOString(),
      projectName: sanitizedName
    };
    
    fs.writeFileSync(scheduleFile, JSON.stringify(scheduleData, null, 2), 'utf8');
    
    return { success: true, path: scheduleFile };
  } catch (error) {
    console.error('일정 저장 오류:', error);
    return { success: false, error: error.message };
  }
};

// 프로젝트 일정 가져오기
export const getProjectSchedule = async (projectName) => {
  try {
    const sanitizedName = sanitizeFileName(projectName);
    const scheduleFile = path.join(PROJECTS_ROOT, sanitizedName, 'schedule', 'events.json');
    
    if (!fs.existsSync(scheduleFile)) {
      return { success: true, events: [] };
    }
    
    const scheduleData = fs.readFileSync(scheduleFile, 'utf8');
    const parsed = JSON.parse(scheduleData);
    
    return { success: true, events: parsed.events || [] };
  } catch (error) {
    console.error('일정 로드 오류:', error);
    return { success: false, error: error.message };
  }
};

// 파일 첨부
export const saveAttachment = async (projectName, fileName, fileData, type = 'image') => {
  try {
    const sanitizedName = sanitizeFileName(projectName);
    const attachmentPath = path.join(PROJECTS_ROOT, sanitizedName, 'attachments', type);
    
    // 첨부파일 폴더가 없으면 생성
    if (!fs.existsSync(attachmentPath)) {
      fs.mkdirSync(attachmentPath, { recursive: true });
    }
    
    const safeFileName = sanitizeFileName(fileName);
    const filePath = path.join(attachmentPath, safeFileName);
    
    fs.writeFileSync(filePath, fileData);
    
    return { success: true, path: filePath };
  } catch (error) {
    console.error('첨부파일 저장 오류:', error);
    return { success: false, error: error.message };
  }
};

// 프로젝트 백업 생성
export const createProjectBackup = async (projectName) => {
  try {
    const sanitizedName = sanitizeFileName(projectName);
    const projectPath = path.join(PROJECTS_ROOT, sanitizedName);
    const backupPath = path.join(PROJECTS_ROOT, `${sanitizedName}_backup_${new Date().toISOString().split('T')[0]}`);
    
    if (!fs.existsSync(projectPath)) {
      return { success: false, error: '프로젝트를 찾을 수 없습니다.' };
    }
    
    // 폴더 복사 함수
    const copyFolderRecursive = (src, dest) => {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      
      const items = fs.readdirSync(src);
      for (const item of items) {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);
        
        if (fs.lstatSync(srcPath).isDirectory()) {
          copyFolderRecursive(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    };
    
    copyFolderRecursive(projectPath, backupPath);
    
    return { success: true, backupPath };
  } catch (error) {
    console.error('백업 생성 오류:', error);
    return { success: false, error: error.message };
  }
};

// 전체 시스템 백업
export const createSystemBackup = async () => {
  try {
    const backupPath = path.join(PROJECTS_ROOT, `system_backup_${new Date().toISOString().split('T')[0]}`);
    
    if (!fs.existsSync(PROJECTS_ROOT)) {
      return { success: true, backupPath: null, message: '백업할 프로젝트가 없습니다.' };
    }
    
    // 시스템 백업 폴더 생성
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }
    
    // 프로젝트 루트 폴더 복사
    const copyFolderRecursive = (src, dest) => {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      
      const items = fs.readdirSync(src);
      for (const item of items) {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);
        
        if (fs.lstatSync(srcPath).isDirectory()) {
          copyFolderRecursive(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    };
    
    copyFolderRecursive(PROJECTS_ROOT, backupPath);
    
    return { success: true, backupPath };
  } catch (error) {
    console.error('시스템 백업 오류:', error);
    return { success: false, error: error.message };
  }
};
