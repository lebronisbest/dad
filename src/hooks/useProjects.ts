import { useState, useEffect, useCallback, useRef } from 'react';
import type { 
  ProjectData, 
  ProjectFilter, 
  ProjectSort, 
  ProjectPagination,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectExportRequest
} from '../services/projectService';
import { 
  getProjects, 
  createProject, 
  updateProject, 
  deleteProject,
  backupProject,
  restoreProject,
  exportProjects,
  downloadBlob
} from '../services/projectService';
import { 
  PROJECT_SORT_OPTIONS, 
  PROJECT_PAGINATION,
  DEFAULT_PROJECT_CONFIG 
} from '../config/projectConfig';

// 프로젝트 목록 상태 타입
export interface ProjectsState {
  projects: ProjectData[];
  pagination: ProjectPagination;
  filters: ProjectFilter;
  sort: ProjectSort;
  isLoading: boolean;
  error: string | null;
}

// 프로젝트 관리 상태 타입
export interface ProjectManagementState {
  selectedProjects: string[];
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isBackingUp: boolean;
  isRestoring: boolean;
  isExporting: boolean;
  createError: string | null;
  updateError: string | null;
  deleteError: string | null;
  backupError: string | null;
  restoreError: string | null;
  exportError: string | null;
}

// 초기 상태
const getInitialProjectsState = (): ProjectsState => ({
  projects: [],
  pagination: {
    page: 1,
    page_size: PROJECT_PAGINATION.DEFAULT_PAGE_SIZE,
    total: 0
  },
  filters: {},
  sort: {
    field: PROJECT_SORT_OPTIONS.CREATED_DATE,
    direction: 'desc'
  },
  isLoading: false,
  error: null
});

const getInitialProjectManagementState = (): ProjectManagementState => ({
  selectedProjects: [],
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isBackingUp: false,
  isRestoring: false,
  isExporting: false,
  createError: null,
  updateError: null,
  deleteError: null,
  backupError: null,
  restoreError: null,
  exportError: null
});

export const useProjects = () => {
  // 프로젝트 목록 상태
  const [projectsState, setProjectsState] = useState<ProjectsState>(getInitialProjectsState());
  
  // 프로젝트 관리 상태
  const [managementState, setManagementState] = useState<ProjectManagementState>(getInitialProjectManagementState());
  
  // 디바운스 검색을 위한 타이머
  const searchTimerRef = useRef<NodeJS.Timeout>();
  
  // 프로젝트 목록 조회
  const fetchProjects = useCallback(async (
    filters?: ProjectFilter,
    sort?: ProjectSort,
    pagination?: { page: number; page_size: number }
  ) => {
    try {
      setProjectsState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await getProjects(filters, sort, pagination);
      
      if (result.ok) {
        setProjectsState(prev => ({
          ...prev,
          projects: result.data.projects,
          pagination: result.data.pagination,
          filters: result.data.filters,
          sort: result.data.sort,
          isLoading: false
        }));
      } else {
        setProjectsState(prev => ({
          ...prev,
          error: result.message,
          isLoading: false
        }));
      }
    } catch (error) {
      setProjectsState(prev => ({
        ...prev,
        error: '프로젝트 목록을 불러오는 중 오류가 발생했습니다.',
        isLoading: false
      }));
    }
  }, []);

  // 필터 변경 처리 (디바운스 적용)
  const updateFilters = useCallback((newFilters: Partial<ProjectFilter>) => {
    const updatedFilters = { ...projectsState.filters, ...newFilters };
    
    setProjectsState(prev => ({ ...prev, filters: updatedFilters }));
    
    // 디바운스 검색
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    
    searchTimerRef.current = setTimeout(() => {
      fetchProjects(updatedFilters, projectsState.sort, { page: 1, page_size: projectsState.pagination.page_size });
    }, 300);
  }, [projectsState.filters, projectsState.sort, projectsState.pagination.page_size, fetchProjects]);

  // 정렬 변경 처리
  const updateSort = useCallback((newSort: ProjectSort) => {
    setProjectsState(prev => ({ ...prev, sort: newSort }));
    fetchProjects(projectsState.filters, newSort, { page: 1, page_size: projectsState.pagination.page_size });
  }, [projectsState.filters, projectsState.pagination.page_size, fetchProjects]);

  // 페이지 변경 처리
  const updatePage = useCallback((page: number) => {
    setProjectsState(prev => ({ ...prev, pagination: { ...prev.pagination, page } }));
    fetchProjects(projectsState.filters, projectsState.sort, { page, page_size: projectsState.pagination.page_size });
  }, [projectsState.filters, projectsState.sort, projectsState.pagination.page_size, fetchProjects]);

  // 페이지 크기 변경 처리
  const updatePageSize = useCallback((pageSize: number) => {
    setProjectsState(prev => ({ 
      ...prev, 
      pagination: { ...prev.pagination, page_size: pageSize, page: 1 } 
    }));
    fetchProjects(projectsState.filters, projectsState.sort, { page: 1, page_size: pageSize });
  }, [projectsState.filters, projectsState.sort, fetchProjects]);

  // 프로젝트 생성
  const createNewProject = useCallback(async (projectData: CreateProjectRequest) => {
    try {
      setManagementState(prev => ({ ...prev, isCreating: true, createError: null }));
      
      const result = await createProject(projectData);
      
      if (result.ok) {
        // 새 프로젝트를 목록에 추가
        setProjectsState(prev => ({
          ...prev,
          projects: [result.data, ...prev.projects],
          pagination: { ...prev.pagination, total: prev.pagination.total + 1 }
        }));
        
        setManagementState(prev => ({ ...prev, isCreating: false }));
        return { success: true, project: result.data };
      } else {
        setManagementState(prev => ({ 
          ...prev, 
          isCreating: false, 
          createError: result.message 
        }));
        return { success: false, error: result.message };
      }
    } catch (error) {
      const errorMessage = '프로젝트 생성 중 오류가 발생했습니다.';
      setManagementState(prev => ({ 
        ...prev, 
        isCreating: false, 
        createError: errorMessage 
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // 프로젝트 업데이트
  const updateExistingProject = useCallback(async (projectData: UpdateProjectRequest) => {
    try {
      setManagementState(prev => ({ ...prev, isUpdating: true, updateError: null }));
      
      const result = await updateProject(projectData);
      
      if (result.ok) {
        // 프로젝트 목록에서 업데이트
        setProjectsState(prev => ({
          ...prev,
          projects: prev.projects.map(project => 
            project.id === projectData.id ? result.data : project
          )
        }));
        
        setManagementState(prev => ({ ...prev, isUpdating: false }));
        return { success: true, project: result.data };
      } else {
        setManagementState(prev => ({ 
          ...prev, 
          isUpdating: false, 
          updateError: result.message 
        }));
        return { success: false, error: result.message };
      }
    } catch (error) {
      const errorMessage = '프로젝트 업데이트 중 오류가 발생했습니다.';
      setManagementState(prev => ({ 
        ...prev, 
        isUpdating: false, 
        updateError: errorMessage 
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // 프로젝트 삭제
  const deleteExistingProject = useCallback(async (projectId: string) => {
    try {
      setManagementState(prev => ({ ...prev, isDeleting: true, deleteError: null }));
      
      const result = await deleteProject(projectId);
      
      if (result.ok) {
        // 프로젝트 목록에서 제거
        setProjectsState(prev => ({
          ...prev,
          projects: prev.projects.filter(project => project.id !== projectId),
          pagination: { ...prev.pagination, total: prev.pagination.total - 1 }
        }));
        
        // 선택된 프로젝트에서도 제거
        setManagementState(prev => ({
          ...prev,
          selectedProjects: prev.selectedProjects.filter(id => id !== projectId),
          isDeleting: false
        }));
        
        return { success: true };
      } else {
        setManagementState(prev => ({ 
          ...prev, 
          isDeleting: false, 
          deleteError: result.message 
        }));
        return { success: false, error: result.message };
      }
    } catch (error) {
      const errorMessage = '프로젝트 삭제 중 오류가 발생했습니다.';
      setManagementState(prev => ({ 
        ...prev, 
        isDeleting: false, 
        deleteError: errorMessage 
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // 프로젝트 백업
  const backupExistingProject = useCallback(async (projectId: string, description?: string) => {
    try {
      setManagementState(prev => ({ ...prev, isBackingUp: true, backupError: null }));
      
      const result = await backupProject(projectId, description);
      
      if (result.ok) {
        setManagementState(prev => ({ ...prev, isBackingUp: false }));
        return { success: true, backup: result.data };
      } else {
        setManagementState(prev => ({ 
          ...prev, 
          isBackingUp: false, 
          backupError: result.message 
        }));
        return { success: false, error: result.message };
      }
    } catch (error) {
      const errorMessage = '프로젝트 백업 중 오류가 발생했습니다.';
      setManagementState(prev => ({ 
        ...prev, 
        isBackingUp: false, 
        backupError: errorMessage 
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // 프로젝트 복원
  const restoreExistingProject = useCallback(async (backupId: string) => {
    try {
      setManagementState(prev => ({ ...prev, isRestoring: true, restoreError: null }));
      
      const result = await restoreProject(backupId);
      
      if (result.ok) {
        // 복원된 프로젝트를 목록에 추가
        setProjectsState(prev => ({
          ...prev,
          projects: [result.data, ...prev.projects],
          pagination: { ...prev.pagination, total: prev.pagination.total + 1 }
        }));
        
        setManagementState(prev => ({ ...prev, isRestoring: false }));
        return { success: true, project: result.data };
      } else {
        setManagementState(prev => ({ 
          ...prev, 
          isRestoring: false, 
          restoreError: result.message 
        }));
        return { success: false, error: result.message };
      }
    } catch (error) {
      const errorMessage = '프로젝트 복원 중 오류가 발생했습니다.';
      setManagementState(prev => ({ 
        ...prev, 
        isRestoring: false, 
        restoreError: errorMessage 
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // 프로젝트 내보내기
  const exportSelectedProjects = useCallback(async (exportRequest: ProjectExportRequest) => {
    try {
      setManagementState(prev => ({ ...prev, isExporting: true, exportError: null }));
      
      const result = await exportProjects(exportRequest);
      
      if (result.ok) {
        const filename = `projects_export_${new Date().toISOString().split('T')[0]}.${exportRequest.format}`;
        downloadBlob(result.data, filename);
        
        setManagementState(prev => ({ ...prev, isExporting: false }));
        return { success: true };
      } else {
        setManagementState(prev => ({ 
          ...prev, 
          isExporting: false, 
          exportError: result.message 
        }));
        return { success: false, error: result.message };
      }
    } catch (error) {
      const errorMessage = '프로젝트 내보내기 중 오류가 발생했습니다.';
      setManagementState(prev => ({ 
        ...prev, 
        isExporting: false, 
        exportError: errorMessage 
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // 선택된 프로젝트 관리
  const toggleProjectSelection = useCallback((projectId: string) => {
    setManagementState(prev => ({
      ...prev,
      selectedProjects: prev.selectedProjects.includes(projectId)
        ? prev.selectedProjects.filter(id => id !== projectId)
        : [...prev.selectedProjects, projectId]
    }));
  }, []);

  const selectAllProjects = useCallback(() => {
    setManagementState(prev => ({
      ...prev,
      selectedProjects: projectsState.projects.map(project => project.id)
    }));
  }, [projectsState.projects]);

  const clearProjectSelection = useCallback(() => {
    setManagementState(prev => ({ ...prev, selectedProjects: [] }));
  }, []);

  // 필터 초기화
  const resetFilters = useCallback(() => {
    const initialFilters = {};
    setProjectsState(prev => ({ ...prev, filters: initialFilters }));
    fetchProjects(initialFilters, projectsState.sort, { page: 1, page_size: projectsState.pagination.page_size });
  }, [projectsState.sort, projectsState.pagination.page_size, fetchProjects]);

  // 초기 데이터 로드
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // 정리
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  return {
    // 상태
    ...projectsState,
    ...managementState,
    
    // 액션
    fetchProjects,
    updateFilters,
    updateSort,
    updatePage,
    updatePageSize,
    createNewProject,
    updateExistingProject,
    deleteExistingProject,
    backupExistingProject,
    restoreExistingProject,
    exportSelectedProjects,
    toggleProjectSelection,
    selectAllProjects,
    clearProjectSelection,
    resetFilters
  };
};
