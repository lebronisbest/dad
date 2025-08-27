import { useState, useEffect, useCallback } from 'react';
import { apiProjectStorage } from '../../../utils/fileStorage';

// 프로젝트 데이터 타입 정의
export interface ProjectData {
  id: string;
  name: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  location: string;
  client: string;
  safetyManager: string;
  priority: string;
  budget: string;
  teamSize: number;
  progress: number;
  safetyScore: number;
  reports: number;
  lastInspection: string;
  riskLevel: string;
  compliance: string;
  createdAt: string;
  updatedAt: string;
  site?: {
    phone: string;
    email: string;
    management_number: string;
    construction_amount: string;
    responsible_person: string;
  };
  org?: {
    phone: string;
    email: string;
    registration_number: string;
    license_number: string;
    address: string;
  };
}

// 프로젝트 상세 상태 타입
export interface ProjectDetailState {
  project: ProjectData | null;
  isLoading: boolean;
  error: string | null;
  isEditing: boolean;
  hasUnsavedChanges: boolean;
}

// 보고서 관련 상태 타입
export interface ReportState {
  reports: any[];
  isLoadingReports: boolean;
  reportsError: string | null;
  selectedReport: any | null;
  reportFilters: {
    type?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
  };
}

// 백업 관련 상태 타입
export interface BackupState {
  backups: any[];
  isLoadingBackups: boolean;
  backupsError: string | null;
  selectedBackup: any | null;
  isCreatingBackup: boolean;
  isRestoringBackup: boolean;
  createBackupError: string | null;
  restoreBackupError: string | null;
}

// 초기 상태
const getInitialProjectDetailState = (): ProjectDetailState => ({
  project: null,
  isLoading: false,
  error: null,
  isEditing: false,
  hasUnsavedChanges: false
});

const getInitialReportState = (): ReportState => ({
  reports: [],
  isLoadingReports: false,
  reportsError: null,
  selectedReport: null,
  reportFilters: {}
});

const getInitialBackupState = (): BackupState => ({
  backups: [],
  isLoadingBackups: false,
  backupsError: null,
  selectedBackup: null,
  isCreatingBackup: false,
  isRestoringBackup: false,
  createBackupError: null,
  restoreBackupError: null
});

export const useProjectDetail = (projectId: string) => {
  // 프로젝트 상세 상태
  const [projectDetailState, setProjectDetailState] = useState<ProjectDetailState>(
    getInitialProjectDetailState()
  );
  
  // 보고서 상태
  const [reportState, setReportState] = useState<ReportState>(
    getInitialReportState()
  );
  
  // 백업 상태
  const [backupState, setBackupState] = useState<BackupState>(
    getInitialBackupState()
  );

  // 프로젝트 정보 조회
  const fetchProjectDetail = useCallback(async () => {
    if (!projectId) return;

    try {
      console.log('🔍 프로젝트 조회 시작:', projectId);
      setProjectDetailState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // 모든 프로젝트를 가져와서 해당 projectId로 필터링
      const allProjects = await apiProjectStorage.getAllProjects();
      console.log('📊 받은 프로젝트 목록:', allProjects);
      console.log('🔍 찾는 projectId:', projectId);
      
      const targetProject = allProjects.find(p => p.id === projectId);
      console.log('🎯 찾은 프로젝트:', targetProject);
      
      if (targetProject) {
        console.log('✅ 프로젝트 찾음, 상태 업데이트 중...');
        setProjectDetailState(prev => ({
          ...prev,
          project: targetProject,
          isLoading: false
        }));
        console.log('✅ 프로젝트 상태 업데이트 완료');
      } else {
        console.log('❌ 프로젝트를 찾을 수 없음');
        setProjectDetailState(prev => ({
          ...prev,
          error: '프로젝트를 찾을 수 없습니다.',
          isLoading: false
        }));
      }
    } catch (error) {
      console.error('❌ 프로젝트 조회 오류:', error);
      setProjectDetailState(prev => ({
        ...prev,
        error: '프로젝트 정보를 불러오는 중 오류가 발생했습니다.',
        isLoading: false
      }));
    }
  }, [projectId]);

  // 보고서 목록 조회
  const fetchReports = useCallback(async () => {
    if (!projectId) return;

    try {
      console.log('🔍 보고서 목록 조회 시작:', projectId);
      setReportState(prev => ({ ...prev, isLoadingReports: true, reportsError: null }));
      
      // API를 통해 프로젝트별 보고서 조회
      const reports = await apiProjectStorage.getProjectReports(projectId);
      console.log('📊 받은 보고서:', reports);
      
      if (reports && Array.isArray(reports)) {
        setReportState(prev => ({
          ...prev,
          reports: reports,
          isLoadingReports: false
        }));
        console.log('✅ 보고서 목록 업데이트 완료:', reports.length, '개');
      } else {
        console.log('ℹ️ 보고서가 없음 또는 빈 배열');
        setReportState(prev => ({
          ...prev,
          reports: [],
          isLoadingReports: false
        }));
      }
    } catch (error) {
      console.error('❌ 보고서 목록 조회 오류:', error);
      setReportState(prev => ({
        ...prev,
        reportsError: '보고서 목록을 불러오는 중 오류가 발생했습니다.',
        isLoadingReports: false
      }));
    }
  }, [projectId]);

  // 백업 목록 조회
  const fetchBackups = useCallback(async () => {
    if (!projectId) return;

    try {
      setBackupState(prev => ({ ...prev, isLoadingBackups: true, backupsError: null }));
      
      // TODO: 백업 API 구현 시 실제 호출로 변경
      // const backups = await apiProjectStorage.getProjectBackups(projectId);
      
      // 현재는 빈 배열로 설정 (백업 기능 미구현)
      setBackupState(prev => ({
        ...prev,
        backups: [],
        isLoadingBackups: false
      }));
    } catch (error) {
      console.error('❌ 백업 목록 조회 오류:', error);
      setBackupState(prev => ({
        ...prev,
        backupsError: '백업 목록을 불러오는 중 오류가 발생했습니다.',
        isLoadingBackups: false
      }));
    }
  }, [projectId]);

  // 프로젝트 편집 모드 토글
  const toggleEditMode = useCallback(() => {
    setProjectDetailState(prev => ({
      ...prev,
      isEditing: !prev.isEditing
    }));
  }, []);

  // 프로젝트 정보 업데이트
  const updateProjectInfo = useCallback(async (updatedData: Partial<ProjectData>) => {
    if (!projectDetailState.project) return;

    try {
      // TODO: projectService에서 프로젝트 업데이트 API 호출
      // const result = await updateProject({ id: projectDetailState.project.id, ...updatedData });
      
      // 임시 구현 (실제 구현 시 제거)
      setProjectDetailState(prev => ({
        ...prev,
        project: prev.project ? { ...prev.project, ...updatedData } : null,
        hasUnsavedChanges: false,
        isEditing: false
      }));
      
      return { success: true };
    } catch (error) {
      return { success: false, error: '프로젝트 업데이트 중 오류가 발생했습니다.' };
    }
  }, [projectDetailState.project]);

  // 보고서 필터 변경
  const updateReportFilters = useCallback((newFilters: Partial<ReportState['reportFilters']>) => {
    setReportState(prev => ({
      ...prev,
      reportFilters: { ...prev.reportFilters, ...newFilters }
    }));
  }, []);

  // 보고서 선택
  const selectReport = useCallback((report: any) => {
    setReportState(prev => ({
      ...prev,
      selectedReport: report
    }));
  }, []);

  // 백업 생성
  const createBackup = useCallback(async (description?: string) => {
    if (!projectId) return { success: false, error: '프로젝트 ID가 없습니다.' };

    try {
      setBackupState(prev => ({ 
        ...prev, 
        isCreatingBackup: true, 
        createBackupError: null 
      }));
      
      // TODO: projectService에서 백업 생성 API 호출
      // const result = await backupProject(projectId, description);
      
      // 임시 구현 (실제 구현 시 제거)
      await new Promise(resolve => setTimeout(resolve, 1000)); // 시뮬레이션
      
      const newBackup = {
        id: Date.now().toString(),
        backup_date: new Date().toISOString(),
        filename: `project_backup_${new Date().toISOString().split('T')[0]}.json`,
        size: 1024 * 1024,
        description: description || '수동 백업'
      };
      
      setBackupState(prev => ({
        ...prev,
        backups: [newBackup, ...prev.backups],
        isCreatingBackup: false
      }));
      
      return { success: true, backup: newBackup };
    } catch (error) {
      const errorMessage = '백업 생성 중 오류가 발생했습니다.';
      setBackupState(prev => ({ 
        ...prev, 
        isCreatingBackup: false, 
        createBackupError: errorMessage 
      }));
      return { success: false, error: errorMessage };
    }
  }, [projectId]);

  // 백업 복원
  const restoreBackup = useCallback(async (backupId: string) => {
    if (!projectId) return { success: false, error: '프로젝트 ID가 없습니다.' };

    try {
      setBackupState(prev => ({ 
        ...prev, 
        isRestoringBackup: true, 
        restoreBackupError: null 
      }));
      
      // TODO: projectService에서 백업 복원 API 호출
      // const result = await restoreProject(backupId);
      
      // 임시 구현 (실제 구현 시 제거)
      await new Promise(resolve => setTimeout(resolve, 2000)); // 시뮬레이션
      
      setBackupState(prev => ({
        ...prev,
        isRestoringBackup: false
      }));
      
      // 프로젝트 정보 새로고침
      await fetchProjectDetail();
      
      return { success: true };
    } catch (error) {
      const errorMessage = '백업 복원 중 오류가 발생했습니다.';
      setBackupState(prev => ({ 
        ...prev, 
        isRestoringBackup: false, 
        restoreBackupError: errorMessage 
      }));
      return { success: false, error: errorMessage };
    }
  }, [projectId, fetchProjectDetail]);

  // 백업 선택
  const selectBackup = useCallback((backup: any) => {
    setBackupState(prev => ({
      ...prev,
      selectedBackup: backup
    }));
  }, []);

  // 프로젝트 삭제
  const deleteProject = useCallback(async () => {
    try {
      if (!projectId) {
        return { success: false, error: '프로젝트 ID가 없습니다.' };
      }

      // 프로젝트 상세 정보에서 folder_name을 가져와서 삭제에 사용
      if (!projectDetailState.project) {
        return { success: false, error: '프로젝트 정보를 찾을 수 없습니다.' };
      }

      const folderName = projectDetailState.project.folder_name || projectDetailState.project.name;
      console.log('프로젝트 삭제 시작:', { projectId, folderName });
      
      // API 서버에서 프로젝트 삭제 (folder_name 사용)
      const response = await fetch(`http://localhost:3001/v1/projects/${encodeURIComponent(folderName)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.ok) {
        console.log('프로젝트 삭제 성공:', result);
        return { success: true, message: '프로젝트가 성공적으로 삭제되었습니다.' };
      } else {
        throw new Error(result.message || '프로젝트 삭제에 실패했습니다.');
      }
      
    } catch (error) {
      console.error('프로젝트 삭제 오류:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
      };
    }
  }, [projectId, projectDetailState.project]);

  // 변경사항 저장
  const saveChanges = useCallback(async () => {
    if (!projectDetailState.hasUnsavedChanges) return { success: true };

    try {
      // TODO: 실제 저장 로직 구현
      setProjectDetailState(prev => ({
        ...prev,
        hasUnsavedChanges: false
      }));
      
      return { success: true };
    } catch (error) {
      return { success: false, error: '변경사항 저장 중 오류가 발생했습니다.' };
    }
  }, [projectDetailState.hasUnsavedChanges]);

  // 변경사항 취소
  const cancelChanges = useCallback(() => {
    setProjectDetailState(prev => ({
      ...prev,
      hasUnsavedChanges: false,
      isEditing: false
    }));
    
    // 원본 데이터로 복원
    fetchProjectDetail();
  }, [fetchProjectDetail]);

  // 초기 데이터 로드
  useEffect(() => {
    if (projectId) {
      fetchProjectDetail();
      fetchReports();
      fetchBackups();
    }
  }, [projectId, fetchProjectDetail, fetchReports, fetchBackups]);

  return {
    // 프로젝트 상세 상태
    ...projectDetailState,
    
    // 보고서 상태
    ...reportState,
    
    // 백업 상태
    ...backupState,
    
    // 액션
    fetchProjectDetail,
    fetchReports,
    fetchBackups,
    toggleEditMode,
    updateProjectInfo,
    updateReportFilters,
    selectReport,
    createBackup,
    restoreBackup,
    selectBackup,
    deleteProject,
    saveChanges,
    cancelChanges
  };
};
