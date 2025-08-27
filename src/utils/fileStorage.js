// src/utils/fileStorage.js
// 파일 시스템 기반 프로젝트 및 보고서 관리 (API 사용)

import { API } from './api.js';

// 프로젝트 관련 함수들
export const apiProjectStorage = {
  // 모든 프로젝트 조회
  getAllProjects: async () => {
    try {
      console.log('🔄 fileStorage: getAllProjects 호출 시작...');
      console.log('🌐 API URL:', API.PROJECTS);
      
      const response = await fetch(API.PROJECTS);
      console.log('📡 API 응답 상태:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log('📊 fileStorage: 받은 API 응답:', responseData);
      
      // API 응답 구조 확인 및 처리
      if (responseData && responseData.ok === true && responseData.data) {
        if (Array.isArray(responseData.data)) {
          console.log('✅ data 필드에서 배열 추출:', responseData.data.length, '개 프로젝트');
          return responseData.data;
        } else if (typeof responseData.data === 'object') {
          // data가 객체인 경우 values 추출
          const projectArray = Object.values(responseData.data);
          console.log('✅ data 필드에서 객체를 배열로 변환:', projectArray.length, '개 프로젝트');
          return projectArray;
        }
      }
      
      // 예상치 못한 응답 구조
      console.warn('⚠️ 예상치 못한 API 응답 구조:', responseData);
      return [];
      
    } catch (error) {
      console.error('❌ fileStorage: 프로젝트 로드 오류:', error);
      return [];
    }
  },

  // 프로젝트 목록을 배열로 반환
  getProjectsList: async () => {
    try {
      const response = await fetch(API.PROJECTS);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const projects = await response.json();
      return Object.values(projects);
    } catch (error) {
      console.error('프로젝트 목록 로드 오류:', error);
      return [];
    }
  },

  // 특정 프로젝트 조회
  getProject: async (id) => {
    try {
      const response = await fetch(API.PROJECT(id));
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const project = await response.json();
      return project;
    } catch (error) {
      console.error('프로젝트 조회 오류:', error);
      return null;
    }
  },

  // 프로젝트 생성
  createProject: async (projectData) => {
    try {
      const response = await fetch(API.PROJECTS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const newProject = await response.json();
      console.log(`프로젝트 ${newProject.name}이(가) 생성되었습니다. ID: ${newProject.id}`);
      return newProject;
    } catch (error) {
      console.error('프로젝트 생성 오류:', error);
      throw error;
    }
  },

  // 프로젝트 수정
  updateProject: async (id, updateData) => {
    try {
      const response = await fetch(API.PROJECT(id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const updatedProject = await response.json();
      return updatedProject;
    } catch (error) {
      console.error('프로젝트 수정 오류:', error);
      throw error;
    }
  },

  // 프로젝트 삭제
  deleteProject: async (id) => {
    try {
      const response = await fetch(API.PROJECT(id), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('프로젝트 삭제 오류:', error);
      throw error;
    }
  },

  // 보고서 삭제
  deleteReport: async (projectId, reportId) => {
    try {
      console.log('apiProjectStorage.deleteReport 호출:', { projectId, reportId });
      
      const response = await fetch(API.PROJECT_REPORT(projectId, reportId), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('deleteReport API 응답 상태:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('deleteReport API 응답 결과:', result);
      return result;
    } catch (error) {
      console.error('보고서 삭제 오류:', error);
      throw error;
    }
  },



  // 프로젝트 디렉토리 구조 다운로드
  downloadProjectStructure: async (projectId) => {
    try {
      const response = await fetch(API.PROJECT(projectId) + '/download');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `project_${projectId}_structure.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log(`프로젝트 ${projectId} 구조가 다운로드되었습니다.`);
      return { success: true, message: '프로젝트 구조가 다운로드되었습니다.' };
    } catch (error) {
      console.error('프로젝트 구조 다운로드 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // 전체 프로젝트 구조 다운로드
  downloadAllProjects: async () => {
    try {
      const response = await fetch(API.PROJECTS + '/download-all');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `all_projects_structure.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('전체 프로젝트 구조가 다운로드되었습니다.');
      return { success: true, message: '전체 프로젝트 구조가 다운로드되었습니다.' };
    } catch (error) {
      console.error('전체 프로젝트 구조 다운로드 오류:', error);
      return { success: false, error: error.message };
    }
  },

  // 프로젝트에 보고서 추가
  addReportToProject: async (projectId, reportData) => {
    try {
      const response = await fetch(API.PROJECT_REPORTS(projectId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const newReport = await response.json();
      // ✅ 프로젝트 ID 대신 보고서 제목으로 로그 표시
      console.log(`보고서 "${newReport.title || '제목 없음'}"이(가) 생성되었습니다.`);
      return newReport;
    } catch (error) {
      console.error('보고서 추가 오류:', error);
      throw error;
    }
  },

  // 프로젝트의 보고서 목록 조회
  getProjectReports: async (projectId) => {
    try {
      console.log('🔍 apiProjectStorage: 프로젝트 보고서 조회 시작:', projectId);
      const response = await fetch(API.PROJECT_REPORTS(projectId));
      
      if (!response.ok) {
        console.warn(`⚠️ 보고서 API 응답 오류: ${response.status} ${response.statusText}`);
        // API 엔드포인트가 구현되지 않은 경우 빈 배열 반환
        return [];
      }
      
      const reports = await response.json();
      console.log('📊 apiProjectStorage: 받은 보고서 목록:', reports);
      
      if (Array.isArray(reports)) {
        return reports;
      } else {
        console.warn('⚠️ 보고서 응답이 배열이 아님:', reports);
        return [];
      }
    } catch (error) {
      console.error('❌ apiProjectStorage: 프로젝트 보고서 목록 조회 오류:', error);
      // 네트워크 오류나 기타 오류 시 빈 배열 반환
      return [];
    }
  }
};

// 보고서 관련 함수들
export const reportStorage = {
  // 프로젝트에 보고서 추가
  addReportToProject: async (projectId, reportData) => {
    try {
      const response = await fetch(API.PROJECT_REPORTS(projectId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const newReport = await response.json();
      // ✅ 프로젝트 ID 대신 보고서 제목으로 로그 표시
      console.log(`보고서 "${newReport.title || '제목 없음'}"이(가) 생성되었습니다.`);
      return newReport;
    } catch (error) {
      console.error('보고서 생성 오류:', error);
      throw error;
    }
  },

  // 프로젝트의 보고서 목록 조회
  getProjectReports: async (projectId) => {
    try {
      console.log('🔍 프로젝트 보고서 조회 시작:', projectId);
      const response = await fetch(API.PROJECT_REPORTS(projectId));
      
      if (!response.ok) {
        console.warn(`⚠️ 보고서 API 응답 오류: ${response.status} ${response.statusText}`);
        // API 엔드포인트가 구현되지 않은 경우 빈 배열 반환
        return [];
      }
      
      const reports = await response.json();
      console.log('📊 받은 보고서 목록:', reports);
      
      if (Array.isArray(reports)) {
        return reports;
      } else {
        console.warn('⚠️ 보고서 응답이 배열이 아님:', reports);
        return [];
      }
    } catch (error) {
      console.error('❌ 프로젝트 보고서 목록 조회 오류:', error);
      // 네트워크 오류나 기타 오류 시 빈 배열 반환
      return [];
    }
  },

  // 특정 보고서 조회
  getReport: async (projectId, reportId) => {
    try {
      const response = await fetch(API.PROJECT_REPORT(projectId, reportId));
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const report = await response.json();
      return report;
    } catch (error) {
      console.error('보고서 조회 오류:', error);
      return null;
    }
  }
};

// 브라우저용 함수들 (동기 버전 - API 호출을 위해 async로 변경)
export const getAllReports = async () => {
  try {
    const projects = await apiProjectStorage.getAllProjects();
    const allReports = [];
    
    for (const project of Object.values(projects)) {
      if (project.reports && project.reports.length > 0) {
        const reportsWithProject = project.reports.map(report => ({
          ...report,
          projectId: project.id,
          projectName: project.name,
          projectLocation: project.location
        }));
        allReports.push(...reportsWithProject);
      }
    }
    
    return allReports;
  } catch (error) {
    console.error('모든 보고서 조회 오류:', error);
    return [];
  }
};

export const updateReport = async (projectId, reportId, updateData) => {
  try {
          const response = await fetch(API.PROJECT_REPORT(projectId, reportId), {
        method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const updatedReport = await response.json();
    return updatedReport;
  } catch (error) {
    console.error('보고서 수정 오류:', error);
    throw error;
  }
};

export const deleteReport = async (projectId, reportId) => {
  try {
          console.log('fileStorage.deleteReport 호출:', { projectId, reportId });
      
      const response = await fetch(API.PROJECT_REPORT(projectId, reportId), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('deleteReport API 응답 상태:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('deleteReport API 응답 결과:', result);
    return result;
  } catch (error) {
    console.error('보고서 삭제 오류:', error);
    throw error;
  }
};

// 데이터 초기화 (샘플 데이터)
export const initializeSampleData = async () => {
  try {
    // 이미 프로젝트가 있으면 초기화하지 않음
    const existingProjects = await apiProjectStorage.getAllProjects();
    if (Object.keys(existingProjects).length > 0) {
      return;
    }
    
    const sampleProject = {
      name: "샘플 건설 프로젝트",
      description: "프로젝트 관리 시스템 테스트용 샘플 프로젝트입니다.",
      location: "서울시 강남구",
      client: "샘플 건설사",
      safety_manager: "샘플 관리자",
      status: "active",
      type: "construction",
      start_date: "2024-01-01T00:00:00.000Z",
      end_date: "2025-12-31T23:59:59.999Z"
    };
    
    await apiProjectStorage.createProject(sampleProject);
    console.log('샘플 데이터가 초기화되었습니다.');
  } catch (error) {
    console.error('샘플 데이터 초기화 오류:', error);
  }
};

// 데이터 백업
export const backupData = async () => {
  try {
    const projects = await apiProjectStorage.getAllProjects();
    const backup = {
      timestamp: new Date().toISOString(),
      projects: projects
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
    
    console.log('백업이 완료되었습니다.');
    return { success: true, message: '백업이 완료되었습니다.' };
  } catch (error) {
    console.error('백업 오류:', error);
    return { success: false, error: error.message };
  }
};

// 데이터 복원
export const restoreData = (file) => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const backupData = JSON.parse(e.target.result);
          
          if (backupData.projects) {
            // 각 프로젝트를 API를 통해 복원
            for (const project of Object.values(backupData.projects)) {
              try {
                await apiProjectStorage.createProject(project);
              } catch (error) {
                console.error(`프로젝트 ${project.name} 복원 오류:`, error);
              }
            }
            
            console.log('데이터 복원이 완료되었습니다.');
            resolve({ success: true, message: '데이터 복원이 완료되었습니다.' });
          } else {
            reject(new Error('백업 파일에 프로젝트 데이터가 없습니다.'));
          }
        } catch (parseError) {
          reject(new Error('백업 파일 파싱에 실패했습니다.'));
        }
      };
      
      reader.onerror = () => reject(new Error('파일 읽기에 실패했습니다.'));
      reader.readAsText(file);
    } catch (error) {
      reject(new Error('파일 처리에 실패했습니다.'));
    }
  });
};
