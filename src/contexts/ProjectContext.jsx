import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiProjectStorage } from '../utils/fileStorage';

const ProjectContext = createContext();

export const useProjectContext = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }
  return context;
};

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // 프로젝트 목록 로드
  const loadProjects = useCallback(async () => {
    try {
      console.log('🔄 ProjectContext: 프로젝트 로드 시작...');
      setIsLoading(true);
      
      const allProjects = await apiProjectStorage.getAllProjects();
      console.log('📊 ProjectContext: API 응답:', allProjects);
      console.log('📊 ProjectContext: 응답 타입:', typeof allProjects);
      console.log('📊 ProjectContext: 배열 여부:', Array.isArray(allProjects));
      
      // ✅ 백엔드에서 이미 배열로 보내주므로 그대로 사용
      const projectsArray = allProjects;
      console.log('📋 ProjectContext: 프로젝트 배열:', projectsArray);
      console.log('📋 ProjectContext: 프로젝트 개수:', projectsArray?.length || 0);
      
      // 각 프로젝트의 구조 상세 확인
      if (Array.isArray(projectsArray)) {
        projectsArray.forEach((project, index) => {
          console.log(`🔍 프로젝트 ${index + 1} 상세 구조:`, {
            id: project.id,
            name: project.name,
            reports_count: project.reports_count,
            has_reports: !!project.reports,
            reports_count_actual: project.reports?.length || 0
          });
        });
      } else {
        console.warn('⚠️ projectsArray가 배열이 아닙니다:', projectsArray);
      }
      
      setProjects(projectsArray || []);
      
      // ✅ 백엔드에서 이미 reports 배열을 포함해서 보내주므로 그대로 사용
      const allReports = [];
      for (const project of projectsArray) {
        if (Array.isArray(project.reports) && project.reports.length > 0) {
          const mappedReports = project.reports.map(report => ({
            ...report,
            projectId: project.id,
            projectName: project.name
          }));
          allReports.push(...mappedReports);
          console.log(`📄 프로젝트 ${project.name}: ${mappedReports.length}개 보고서 수집`);
        }
      }
      console.log('📄 ProjectContext: 수집된 보고서:', allReports);
      setReports(allReports);
      
      setLastUpdate(Date.now());
      console.log('✅ ProjectContext: 프로젝트 로드 완료');
    } catch (error) {
      console.error('❌ ProjectContext: 프로젝트 로드 오류:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 프로젝트 생성
  const createProject = useCallback(async (projectData) => {
    try {
      const newProject = await apiProjectStorage.createProject(projectData);
      setProjects(prev => [...prev, newProject]);
      setLastUpdate(Date.now());
      return newProject;
    } catch (error) {
      console.error('프로젝트 생성 오류:', error);
      throw error;
    }
  }, []);

  // 프로젝트 수정
  const updateProject = useCallback(async (projectId, updateData) => {
    try {
      const updatedProject = await apiProjectStorage.updateProject(projectId, updateData);
      setProjects(prev => prev.map(project => 
        project.id === projectId ? { ...project, ...updatedProject } : project
      ));
      setLastUpdate(Date.now());
      return updatedProject;
    } catch (error) {
      console.error('프로젝트 수정 오류:', error);
      throw error;
    }
  }, []);

  // 프로젝트 삭제
  const deleteProject = useCallback(async (projectId) => {
    try {
      await apiProjectStorage.deleteProject(projectId);
      setProjects(prev => prev.filter(project => project.id !== projectId));
      // 관련 보고서도 제거
      setReports(prev => prev.filter(report => report.projectId !== projectId));
      setLastUpdate(Date.now());
    } catch (error) {
      console.error('프로젝트 삭제 오류:', error);
      throw error;
    }
  }, []);

  // 보고서 추가
  const addReportToProject = useCallback(async (projectId, reportData) => {
    try {
      const newReport = await apiProjectStorage.addReportToProject(projectId, reportData);
      // ✅ 폴더명 기반 ID로 프로젝트 찾기
      const project = projects.find(p => p.id === projectId);
      
      // 프로젝트의 보고서 목록 업데이트
      setProjects(prev => prev.map(p => 
        p.id === projectId
          ? { ...p, reports: [...(p.reports || []), newReport] }
          : p
      ));
      
      // 전체 보고서 목록에 추가
      setReports(prev => [...prev, { ...newReport, projectId, projectName: project?.name }]);
      
      setLastUpdate(Date.now());
      return newReport;
    } catch (error) {
      console.error('보고서 추가 오류:', error);
      throw error;
    }
  }, [projects]);

  // 보고서 수정
  const updateReport = useCallback(async (projectId, reportId, updateData) => {
    try {
      const updatedReport = await apiProjectStorage.updateReport(projectId, reportId, updateData);
      
      // 프로젝트의 보고서 목록 업데이트
      setProjects(prev => prev.map(project => 
        project.id === projectId
          ? {
              ...project,
              reports: project.reports?.map(report => 
                report.id === reportId ? { ...report, ...updatedReport } : report
              ) || []
            }
          : project
      ));
      
      // 전체 보고서 목록 업데이트
      setReports(prev => prev.map(report => 
        report.id === reportId ? { ...report, ...updatedReport } : report
      ));
      
      setLastUpdate(Date.now());
      return updatedReport;
    } catch (error) {
      console.error('보고서 수정 오류:', error);
      throw error;
    }
  }, []);

  // 보고서 삭제
  const deleteReport = useCallback(async (projectId, reportId) => {
    try {
      await apiProjectStorage.deleteReport(projectId, reportId);
      
      // 프로젝트의 보고서 목록에서 제거
      setProjects(prev => prev.map(project => 
        project.id === projectId
          ? {
              ...project,
              reports: project.reports?.filter(report => report.id !== reportId) || []
            }
          : project
      ));
      
      // 전체 보고서 목록에서 제거
      setReports(prev => prev.filter(report => report.id !== reportId));
      
      setLastUpdate(Date.now());
    } catch (error) {
      console.error('보고서 삭제 오류:', error);
      throw error;
    }
  }, []);

  // 프로젝트 상세 정보 로드
  const loadProjectData = useCallback(async (projectId) => {
    try {
      // ✅ 폴더명 기반 ID로 프로젝트 찾기
      const project = projects.find(p => p.id === projectId);
      if (!project) {
        throw new Error(`프로젝트를 찾을 수 없습니다: ${projectId}`);
      }
      return project;
    } catch (error) {
      console.error('프로젝트 데이터 로드 오류:', error);
      throw error;
    }
  }, [projects]);

  // 초기 로드
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // 자동 새로고침 (5분마다)
  useEffect(() => {
    const interval = setInterval(() => {
      loadProjects();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loadProjects]);

  const value = {
    projects,
    reports,
    isLoading,
    lastUpdate,
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    addReportToProject,
    updateReport,
    deleteReport,
    loadProjectData,
    refresh: loadProjects
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};
