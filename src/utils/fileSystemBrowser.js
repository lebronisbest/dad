// 브라우저 호환 파일 시스템 유틸리티
// 로컬 스토리지를 사용하여 프로젝트별 데이터 관리

// 프로젝트 루트 키
const PROJECTS_ROOT_KEY = 'safety_projects_root';

// 안전한 키 생성 (특수문자 제거)
export const sanitizeKey = (key) => {
  return key.replace(/[<>:"/\\|?*]/g, '_');
};

// 프로젝트 폴더 생성 (로컬 스토리지에 키 생성)
export const createProjectFolder = async (projectName) => {
  try {
    const sanitizedName = sanitizeKey(projectName);
    const projectKey = `${PROJECTS_ROOT_KEY}_${sanitizedName}`;
    
    // 프로젝트 기본 정보 저장
    const projectInfo = {
      name: projectName,
      createdAt: new Date().toISOString(),
      folderKey: projectKey,
      subFolders: ['reports', 'schedule', 'attachments']
    };
    
    localStorage.setItem(projectKey, JSON.stringify(projectInfo));
    
    // 프로젝트 목록에 추가
    const projectsList = JSON.parse(localStorage.getItem(PROJECTS_ROOT_KEY) || '[]');
    if (!projectsList.find(p => p.name === projectName)) {
      projectsList.push(projectInfo);
      localStorage.setItem(PROJECTS_ROOT_KEY, JSON.stringify(projectsList));
    }
    
    return { success: true, path: projectKey };
  } catch (error) {
    console.error('프로젝트 폴더 생성 오류:', error);
    return { success: false, error: error.message };
  }
};

// 프로젝트 정보 저장
export const saveProjectData = async (project) => {
  try {
    const sanitizedName = sanitizeKey(project.name);
    const projectKey = `${PROJECTS_ROOT_KEY}_${sanitizedName}`;
    const projectFileKey = `${projectKey}_data`;
    
    // 프로젝트 폴더가 없으면 생성
    if (!localStorage.getItem(projectKey)) {
      await createProjectFolder(project.name);
    }
    
    // 프로젝트 정보를 JSON으로 저장
    const projectData = {
      ...project,
      updatedAt: new Date().toISOString(),
      folderKey: projectKey
    };
    
    localStorage.setItem(projectFileKey, JSON.stringify(projectData, null, 2));
    
    return { success: true, path: projectFileKey };
  } catch (error) {
    console.error('프로젝트 저장 오류:', error);
    return { success: false, error: error.message };
  }
};

// 프로젝트 정보 로드
export const loadProjectData = async (projectName) => {
  try {
    const sanitizedName = sanitizeKey(projectName);
    const projectKey = `${PROJECTS_ROOT_KEY}_${sanitizedName}`;
    const projectFileKey = `${projectKey}_data`;
    
    const projectData = localStorage.getItem(projectFileKey);
    if (!projectData) {
      return { success: false, error: '프로젝트 파일을 찾을 수 없습니다.' };
    }
    
    return { success: true, data: JSON.parse(projectData) };
  } catch (error) {
    console.error('프로젝트 로드 오류:', error);
    return { success: false, error: error.message };
  }
};

// 모든 프로젝트 목록 가져오기
export const getAllProjects = async () => {
  try {
    const projectsList = JSON.parse(localStorage.getItem(PROJECTS_ROOT_KEY) || '[]');
    const projects = [];
    
    for (const projectInfo of projectsList) {
      try {
        const projectData = localStorage.getItem(`${projectInfo.folderKey}_data`);
        if (projectData) {
          projects.push(JSON.parse(projectData));
        }
      } catch (error) {
        console.error(`프로젝트 ${projectInfo.name} 로드 오류:`, error);
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
    const sanitizedName = sanitizeKey(projectName);
    const projectKey = `${PROJECTS_ROOT_KEY}_${sanitizedName}`;
    
    // 프로젝트 관련 모든 데이터 삭제
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(projectKey)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // 프로젝트 목록에서 제거
    const projectsList = JSON.parse(localStorage.getItem(PROJECTS_ROOT_KEY) || '[]');
    const updatedList = projectsList.filter(p => p.name !== projectName);
    localStorage.setItem(PROJECTS_ROOT_KEY, JSON.stringify(updatedList));
    
    return { success: true };
  } catch (error) {
    console.error('프로젝트 삭제 오류:', error);
    return { success: false, error: error.message };
  }
};

// 보고서 저장
export const saveReport = async (projectName, report) => {
  try {
    const sanitizedName = sanitizeKey(projectName);
    const reportKey = `${PROJECTS_ROOT_KEY}_${sanitizedName}_report_${report.id}`;
    
    const reportData = {
      ...report,
      savedAt: new Date().toISOString(),
      projectName: sanitizedName
    };
    
    localStorage.setItem(reportKey, JSON.stringify(reportData, null, 2));
    
    return { success: true, path: reportKey };
  } catch (error) {
    console.error('보고서 저장 오류:', error);
    return { success: false, error: error.message };
  }
};

// 프로젝트의 모든 보고서 가져오기
export const getProjectReports = async (projectName) => {
  try {
    const sanitizedName = sanitizeKey(projectName);
    const reports = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(`_${sanitizedName}_report_`)) {
        try {
          const reportData = localStorage.getItem(key);
          reports.push(JSON.parse(reportData));
        } catch (error) {
          console.error(`보고서 ${key} 로드 오류:`, error);
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
    const sanitizedName = sanitizeKey(projectName);
    const scheduleKey = `${PROJECTS_ROOT_KEY}_${sanitizedName}_schedule`;
    
    const scheduleData = {
      events,
      savedAt: new Date().toISOString(),
      projectName: sanitizedName
    };
    
    localStorage.setItem(scheduleKey, JSON.stringify(scheduleData, null, 2));
    
    return { success: true, path: scheduleKey };
  } catch (error) {
    console.error('일정 저장 오류:', error);
    return { success: false, error: error.message };
  }
};

// 프로젝트 일정 가져오기
export const getProjectSchedule = async (projectName) => {
  try {
    const sanitizedName = sanitizeKey(projectName);
    const scheduleKey = `${PROJECTS_ROOT_KEY}_${sanitizedName}_schedule`;
    
    const scheduleData = localStorage.getItem(scheduleKey);
    if (!scheduleData) {
      return { success: true, events: [] };
    }
    
    const parsed = JSON.parse(scheduleData);
    return { success: true, events: parsed.events || [] };
  } catch (error) {
    console.error('일정 로드 오류:', error);
    return { success: false, error: error.message };
  }
};

// 파일 첨부 (Base64로 인코딩하여 저장)
export const saveAttachment = async (projectName, fileName, fileData, type = 'image') => {
  try {
    const sanitizedName = sanitizeKey(projectName);
    const attachmentKey = `${PROJECTS_ROOT_KEY}_${sanitizedName}_attachment_${type}_${sanitizeKey(fileName)}`;
    
    // 파일 데이터를 Base64로 인코딩하여 저장
    const base64Data = typeof fileData === 'string' ? fileData : btoa(fileData);
    
    const attachmentData = {
      fileName,
      type,
      data: base64Data,
      savedAt: new Date().toISOString(),
      projectName: sanitizedName
    };
    
    localStorage.setItem(attachmentKey, JSON.stringify(attachmentData));
    
    return { success: true, path: attachmentKey };
  } catch (error) {
    console.error('첨부파일 저장 오류:', error);
    return { success: false, error: error.message };
  }
};

// 프로젝트 백업 생성 (JSON 파일로 다운로드)
export const createProjectBackup = async (projectName) => {
  try {
    const sanitizedName = sanitizeKey(projectName);
    
    // 프로젝트 데이터 수집
    const projectData = await loadProjectData(projectName);
    const reports = await getProjectReports(projectName);
    const schedule = await getProjectSchedule(projectName);
    
    const backupData = {
      project: projectData.success ? projectData.data : null,
      reports: reports.success ? reports.reports : [],
      schedule: schedule.success ? schedule.events : [],
      backupDate: new Date().toISOString(),
      backupType: 'project'
    };
    
    // JSON 파일로 다운로드
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitizedName}_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    return { success: true, backupPath: a.download };
  } catch (error) {
    console.error('백업 생성 오류:', error);
    return { success: false, error: error.message };
  }
};

// 전체 시스템 백업
export const createSystemBackup = async () => {
  try {
    const allProjects = await getAllProjects();
    
    if (!allProjects.success || allProjects.projects.length === 0) {
      return { success: true, backupPath: null, message: '백업할 프로젝트가 없습니다.' };
    }
    
    const backupData = {
      projects: allProjects.projects,
      backupDate: new Date().toISOString(),
      backupType: 'system'
    };
    
    // JSON 파일로 다운로드
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    return { success: true, backupPath: a.download };
  } catch (error) {
    console.error('시스템 백업 오류:', error);
    return { success: false, error: error.message };
  }
};

// 백업 파일에서 복원
export const restoreFromBackup = async (backupFile) => {
  try {
    const text = await backupFile.text();
    const backupData = JSON.parse(text);
    
    if (backupData.backupType === 'project') {
      // 프로젝트 백업 복원
      if (backupData.project) {
        await saveProjectData(backupData.project);
      }
      if (backupData.schedule && backupData.schedule.length > 0) {
        await saveSchedule(backupData.project.name, backupData.schedule);
      }
      if (backupData.reports && backupData.reports.length > 0) {
        for (const report of backupData.reports) {
          await saveReport(backupData.project.name, report);
        }
      }
    } else if (backupData.backupType === 'system') {
      // 시스템 백업 복원
      for (const project of backupData.projects) {
        await saveProjectData(project);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('백업 복원 오류:', error);
    return { success: false, error: error.message };
  }
};
