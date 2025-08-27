// src/utils/localStorage.js
// 로컬 스토리지를 사용한 프로젝트 데이터 관리

const PROJECTS_KEY = 'safety_projects';
const REPORTS_KEY = 'safety_reports';

// 프로젝트 관련 함수들
export const localProjectStorage = {
  // 모든 프로젝트 조회
  getAllProjects: () => {
    try {
      const projects = localStorage.getItem(PROJECTS_KEY);
      return projects ? JSON.parse(projects) : {};
    } catch (error) {
      console.error('프로젝트 로드 오류:', error);
      return {};
    }
  },

  // 프로젝트 목록을 배열로 반환
  getProjectsList: () => {
    try {
      const projects = localStorage.getItem(PROJECTS_KEY);
      if (!projects) return [];
      
      const projectsObj = JSON.parse(projects);
      return Object.values(projectsObj);
    } catch (error) {
      console.error('프로젝트 목록 로드 오류:', error);
      return [];
    }
  },

  // 특정 프로젝트 조회
  getProject: (id) => {
    try {
      const projects = localStorage.getItem(PROJECTS_KEY);
      if (!projects) return null;
      
      const projectsObj = JSON.parse(projects);
      return projectsObj[id] || null;
    } catch (error) {
      console.error('프로젝트 조회 오류:', error);
      return null;
    }
  },

  // 프로젝트 생성
  createProject: (projectData) => {
    try {
      const projects = localStorage.getItem(PROJECTS_KEY);
      const projectsObj = projects ? JSON.parse(projects) : {};
      
      const newProject = {
        id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...projectData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        reports: [],
        total_reports: 0,
        last_report_date: null
      };
      
      projectsObj[newProject.id] = newProject;
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(projectsObj));
      
      return newProject;
    } catch (error) {
      console.error('프로젝트 생성 오류:', error);
      throw error;
    }
  },

  // 프로젝트 수정
  updateProject: (id, updateData) => {
    try {
      const projects = localStorage.getItem(PROJECTS_KEY);
      if (!projects) throw new Error('프로젝트를 찾을 수 없습니다.');
      
      const projectsObj = JSON.parse(projects);
      if (!projectsObj[id]) throw new Error('프로젝트를 찾을 수 없습니다.');
      
      projectsObj[id] = {
        ...projectsObj[id],
        ...updateData,
        updated_at: new Date().toISOString()
      };
      
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(projectsObj));
      return projectsObj[id];
    } catch (error) {
      console.error('프로젝트 수정 오류:', error);
      throw error;
    }
  },

  // 프로젝트 삭제 (휴지통으로 이동)
  deleteProject: (id) => {
    try {
      const projects = localStorage.getItem(PROJECTS_KEY);
      if (!projects) throw new Error('프로젝트를 찾을 수 없습니다.');
      
      const projectsObj = JSON.parse(projects);
      if (!projectsObj[id]) throw new Error('프로젝트를 찾을 수 없습니다.');
      
      projectsObj[id] = {
        ...projectsObj[id],
        deleted: true,
        deleted_at: new Date().toISOString(),
        original_id: id
      };
      
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(projectsObj));
      return { message: '프로젝트가 휴지통으로 이동되었습니다.' };
    } catch (error) {
      console.error('프로젝트 삭제 오류:', error);
      throw error;
    }
  },

  // 휴지통에서 프로젝트 복구
  restoreProject: (id) => {
    try {
      const projects = localStorage.getItem(PROJECTS_KEY);
      if (!projects) throw new Error('프로젝트를 찾을 수 없습니다.');
      
      const projectsObj = JSON.parse(projects);
      if (!projectsObj[id] || !projectsObj[id].deleted) {
        throw new Error('휴지통에서 프로젝트를 찾을 수 없습니다.');
      }
      
      delete projectsObj[id].deleted;
      delete projectsObj[id].deleted_at;
      delete projectsObj[id].original_id;
      
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(projectsObj));
      return { message: '프로젝트가 복구되었습니다.' };
    } catch (error) {
      console.error('프로젝트 복구 오류:', error);
      throw error;
    }
  },

  // 휴지통에서 프로젝트 완전 삭제
  permanentDeleteProject: (id) => {
    try {
      const projects = localStorage.getItem(PROJECTS_KEY);
      if (!projects) throw new Error('프로젝트를 찾을 수 없습니다.');
      
      const projectsObj = JSON.parse(projects);
      if (!projectsObj[id] || !projectsObj[id].deleted) {
        throw new Error('휴지통에서 프로젝트를 찾을 수 없습니다.');
      }
      
      delete projectsObj[id];
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(projectsObj));
      return { message: '프로젝트가 완전히 삭제되었습니다.' };
    } catch (error) {
      console.error('프로젝트 완전 삭제 오류:', error);
      throw error;
    }
  },

  // 휴지통 목록 조회
  getTrashProjects: () => {
    try {
      const projects = localStorage.getItem(PROJECTS_KEY);
      if (!projects) return [];
      
      const projectsObj = JSON.parse(projects);
      return Object.values(projectsObj)
        .filter(project => project.deleted)
        .map(project => ({
          id: project.id,
          name: project.name,
          description: project.description,
          location: project.location,
          client: project.client,
          safety_manager: project.safety_manager,
          status: project.status,
          type: project.type,
          start_date: project.start_date,
          end_date: project.end_date,
          total_reports: project.total_reports || 0,
          last_report_date: project.last_report_date,
          deleted_at: project.deleted_at
        }));
    } catch (error) {
      console.error('휴지통 목록 로드 오류:', error);
      return [];
    }
  }
};

// 보고서 관련 함수들
export const reportStorage = {
  // 프로젝트에 보고서 추가
  addReportToProject: (projectId, reportData) => {
    try {
      const projects = localStorage.getItem(PROJECTS_KEY);
      if (!projects) throw new Error('프로젝트를 찾을 수 없습니다.');
      
      const projectsObj = JSON.parse(projects);
      if (!projectsObj[projectId]) throw new Error('프로젝트를 찾을 수 없습니다.');
      
      // 다음 차수 번호 계산
      const existingReports = projectsObj[projectId].reports || [];
      const nextRound = existingReports.length + 1;
      
      // 새로운 보고서 객체 생성
      const newReport = {
        id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: `${nextRound}차 안전점검보고서`,
        type: 'safety_inspection',
        created_at: new Date().toISOString(),
        data: reportData,
        round: nextRound,
        status: 'completed'
      };
      
      // 프로젝트에 보고서 추가
      if (!projectsObj[projectId].reports) {
        projectsObj[projectId].reports = [];
      }
      projectsObj[projectId].reports.push(newReport);
      projectsObj[projectId].total_reports = projectsObj[projectId].reports.length;
      projectsObj[projectId].last_report_date = new Date().toISOString();
      projectsObj[projectId].updated_at = new Date().toISOString();
      
      // 프로젝트 파일 업데이트
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(projectsObj));
      
      return newReport;
    } catch (error) {
      console.error('프로젝트에 보고서 추가 오류:', error);
      throw error;
    }
  },

  // 프로젝트의 보고서 목록 조회
  getProjectReports: (projectId) => {
    try {
      const projects = localStorage.getItem(PROJECTS_KEY);
      if (!projects) return [];
      
      const projectsObj = JSON.parse(projects);
      if (!projectsObj[projectId]) return [];
      
      return projectsObj[projectId].reports || [];
    } catch (error) {
      console.error('프로젝트 보고서 목록 조회 오류:', error);
      return [];
    }
  }
};

// 데이터 초기화 (샘플 데이터)
export const initializeSampleData = () => {
  try {
    const projects = localStorage.getItem(PROJECTS_KEY);
    if (projects) return; // 이미 데이터가 있으면 초기화하지 않음
    
    const sampleProjects = {
      "project_sample_1": {
        id: "project_sample_1",
        name: "샘플 건설 프로젝트",
        description: "프로젝트 관리 시스템 테스트용 샘플 프로젝트입니다.",
        location: "서울시 강남구",
        client: "샘플 건설사",
        safety_manager: "샘플 관리자",
        status: "active",
        type: "construction",
        start_date: "2024-01-01T00:00:00.000Z",
        end_date: "2025-12-31T23:59:59.999Z",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        reports: [],
        total_reports: 0,
        last_report_date: null
      }
    };
    
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(sampleProjects));
    console.log('샘플 데이터가 초기화되었습니다.');
  } catch (error) {
    console.error('샘플 데이터 초기화 오류:', error);
  }
};

// 데이터 백업
export const backupData = () => {
  try {
    const projects = localStorage.getItem(PROJECTS_KEY);
    const reports = localStorage.getItem(REPORTS_KEY);
    
    const backup = {
      timestamp: new Date().toISOString(),
      projects: projects ? JSON.parse(projects) : {},
      reports: reports ? JSON.parse(reports) : {}
    };
    
    const backupStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([backupStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `safety_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return { success: true, message: '백업이 완료되었습니다.' };
  } catch (error) {
    console.error('백업 오류:', error);
    return { success: false, error: error.message };
  }
};

// 데이터 복원
export const restoreData = (backupData) => {
  try {
    if (backupData.projects) {
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(backupData.projects));
    }
    if (backupData.reports) {
      localStorage.setItem(REPORTS_KEY, JSON.stringify(backupData.reports));
    }
    
    return { success: true, message: '데이터 복원이 완료되었습니다.' };
  } catch (error) {
    console.error('복원 오류:', error);
    return { success: false, error: error.message };
  }
};
