import { useState, useEffect, useCallback, useRef } from 'react';
import { useProjectContext } from '../contexts/ProjectContext';
import { prefillReportWithUserProfile, getUserProfile } from '../utils/userProfile';
import { getKoreanDate } from '../utils/dateUtils';
import { validateReport, formatValidationErrors, type ReportData } from '../schemas/reportSchema';
import { createReport, generateReportHTML, generateReportPDF, downloadBlob, type ApiError } from '../services/reportService';

// 에러 모달 상태 타입
export interface ErrorModalState {
  open: boolean;
  error: {
    message: string;
    details?: any;
    diagnosticLogs?: string;
  } | null;
  showDiagnostics: boolean;
}

// 중복 확인 모달 상태 타입
export interface DuplicateModalState {
  open: boolean;
  fileName: string;
  existingPath: string;
  message: string;
}

// 폼 상태 타입
export interface FormState {
  formData: ReportData;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isPreviewLoading: boolean;
  isPdfLoading: boolean;
  success: string | null;
  previewHtml: string | null;
  previewError: string | null;
}

// 초기 폼 데이터
const getInitialFormData = (): ReportData => ({
  site: {
    name: '',
    address: '',
    phone: '',
    email: '',
    management_number: '',
    construction_period: '',
    construction_amount: '',
    responsible_person: ''
  },
  org: {
    name: '',           // 회사명
    phone: '',          // 본사 연락처
    address: '',        // 본사 주소
    registration_number: '', // 법인등록번호
    license_number: ''  // 면허번호
  },
  myorg: {              // ✅ 지도 기관 정보 추가
    name: '',
    phone: '',
    inspector: ''        // 지도자명
  },
  visit: {
    date: getKoreanDate(),  // ✅ 한국 시간대 기준 오늘 날짜
    round: 1,
    round_total: 1,
    purpose: ''
  },
  progress: {
    percent: 0
  },
  category: {
    type: '건설',
    subtype: '건축',
    is_construction: true,
    is_electrical: false
  },
  guide: {              // ✅ guide 스키마 복구
    previous_completed: false,
    previous_incomplete: false
  },
  work: {
    status_html: '',
    description: '',
    is_working_today: true,
    today_work: '',
    current_work: '',
    additional_notes: ''
  },
  notification: {
    registered_mail: false,
    email: false,
    mobile: false,
    other: false,
    other_method: ''
  },
  previous_guidance: [],
  hazards: [],
  risk_assessment: {
    possibility: { high: '', medium: '', low: '' },
    severity: { high: '', medium: '', low: '' },
    improvement_methods: { high: '', medium: '', low: '' }
  },
  future_work: [],
  support: [],
  photos: []
});

export const useReportForm = (projectId: string | null = null, projectData: any = null) => {
  const { projects, addReportToProject } = useProjectContext();
  
  // 상태 관리
  const [selectedProject, setSelectedProject] = useState(projectId || '');
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [errorModal, setErrorModal] = useState<ErrorModalState>({
    open: false,
    error: null,
    showDiagnostics: false
  });
  
  const [formState, setFormState] = useState<FormState>({
    formData: getInitialFormData(),
    errors: {},
    isSubmitting: false,
    isPreviewLoading: false,
    isPdfLoading: false,
    success: null,
    previewHtml: null,
    previewError: null
  });

  // 중복 확인 모달 상태
  const [duplicateModal, setDuplicateModal] = useState<DuplicateModalState>({
    open: false,
    fileName: '',
    existingPath: '',
    message: ''
  });

  // 디바운스 저장을 위한 타이머
  const saveTimerRef = useRef<NodeJS.Timeout>();

  // 에러 처리 함수
  const handleError = useCallback((error: Error | ApiError, details?: any) => {
    const message = 'message' in error ? error.message : '알 수 없는 오류가 발생했습니다.';
    const diagnosticLogs = error instanceof Error ? error.stack : undefined;
    
    setErrorModal({
      open: true,
      error: {
        message,
        details,
        diagnosticLogs
      },
      showDiagnostics: false
    });
  }, []);

  // 에러 모달 닫기
  const closeErrorModal = useCallback(() => {
    setErrorModal(prev => ({ ...prev, open: false }));
  }, []);

  // 재시도 핸들러
  const handleRetry = useCallback(() => {
    closeErrorModal();
    if (formState.isSubmitting) {
      handleSubmit();
    }
  }, [formState.isSubmitting, closeErrorModal]);

  // HTML 열기 핸들러
  const handleOpenHTML = useCallback(async () => {
    try {
      setFormState(prev => ({ ...prev, isPreviewLoading: true }));
      const result = await generateReportHTML(formState.formData);
      
      if (result.ok) {
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(result.data);
          newWindow.document.close();
        }
      } else {
        handleError(result, 'HTML 생성 실패');
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('HTML 생성 실패'), 'HTML 생성 중 오류 발생');
    } finally {
      setFormState(prev => ({ ...prev, isPreviewLoading: false }));
    }
  }, [formState.formData, handleError]);

  // 로그 보기 핸들러
  const handleViewLogs = useCallback(() => {
    console.group('보고서 생성 오류 로그');
    if (errorModal.error) {
      console.error('에러:', errorModal.error);
      if (errorModal.error.diagnosticLogs) {
        console.log('진단 로그:', errorModal.error.diagnosticLogs);
      }
    }
    console.groupEnd();
  }, [errorModal.error]);

  // 폼 데이터 업데이트
  const updateFormData = useCallback((path: string, value: any) => {
    setFormState(prev => {
      const newFormData = { ...prev.formData };
      const keys = path.split('.');
      let current: any = newFormData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      
      return {
        ...prev,
        formData: newFormData,
        errors: { ...prev.errors, [path]: undefined } // 해당 필드 에러 제거
      };
    });

    // 디바운스 저장
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    
    saveTimerRef.current = setTimeout(() => {
      // 로컬 스토리지에 임시 저장
      localStorage.setItem('reportForm_draft', JSON.stringify(formState.formData));
    }, 1000);
  }, [formState.formData]);

  // 배열 필드 업데이트
  const updateArrayField = useCallback((path: string, index: number, value: any) => {
    setFormState(prev => {
      const newFormData = { ...prev.formData };
      const keys = path.split('.');
      let current: any = newFormData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      const array = [...current];
      array[index] = value;
      current[keys[keys.length - 1]] = array;
      
      return {
        ...prev,
        formData: newFormData
      };
    });
  }, []);

  // 배열에 항목 추가
  const addArrayItem = useCallback((path: string, newItem: any) => {
    setFormState(prev => {
      const newFormData = { ...prev.formData };
      const keys = path.split('.');
      let current: any = newFormData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      const array = [...current, newItem];
      current[keys[keys.length - 1]] = array;
      
      return {
        ...prev,
        formData: newFormData
      };
    });
  }, []);

  // 배열에서 항목 제거
  const removeArrayItem = useCallback((path: string, index: number) => {
    setFormState(prev => {
      const newFormData = { ...prev.formData };
      const keys = path.split('.');
      let current: any = newFormData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      const array = [...current];
      array.splice(index, 1);
      current[keys[keys.length - 1]] = array;
      
      return {
        ...prev,
        formData: newFormData
      };
    });
  }, []);

  // 중복 확인 모달 열기
  const openDuplicateModal = useCallback((error: any) => {
    setDuplicateModal({
      open: true,
      fileName: error.details?.fileName || '',
      existingPath: error.details?.existingPath || '',
      message: error.details?.message || '동일한 방문차수와 프로젝트명의 보고서가 이미 존재합니다.'
    });
  }, []);

  // 중복 확인 모달 닫기
  const closeDuplicateModal = useCallback(() => {
    setDuplicateModal({
      open: false,
      fileName: '',
      existingPath: '',
      message: ''
    });
  }, []);

  // 중복 보고서 덮어쓰기
  const handleOverwrite = useCallback(async () => {
    try {
      setFormState(prev => ({ ...prev, isSubmitting: true }));
      
      // 기존 파일 삭제 후 새로 생성
      const result = await createReport(formState.formData);
      
      if (result.ok) {
        setFormState(prev => ({ 
          ...prev, 
          success: '보고서가 성공적으로 덮어쓰기되었습니다.',
          isSubmitting: false 
        }));
        
        // 프로젝트에 보고서 추가
        if (selectedProject) {
          addReportToProject(selectedProject, {
            id: result.data.id,
            title: `기술지도결과보고서_${formState.formData.site.name}_${formState.formData.visit.date}`,
            type: 'safety_inspection',
            data: formState.formData,
            status: 'completed'
          });
        }
        
        // 로컬 스토리지 정리
        localStorage.removeItem('reportForm_draft');
        
        closeDuplicateModal();
        return result.data;
      } else {
        handleError(result, '보고서 덮어쓰기 실패');
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('덮어쓰기 중 오류 발생'), '덮어쓰기 중 오류 발생');
    } finally {
      setFormState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [formState.formData, selectedProject, addReportToProject, handleError, closeDuplicateModal]);

  // PDF 생성
  const handleGeneratePDF = useCallback(async () => {
    try {
      setFormState(prev => ({ ...prev, isPdfLoading: true }));
      
      const result = await generateReportPDF(formState.formData);
      
      if (result.ok) {
        const filename = `기술지도결과보고서_${formState.formData.site.name}_${formState.formData.visit.date}.pdf`;
        downloadBlob(result.data, filename);
      } else {
        handleError(result, 'PDF 생성 실패');
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('PDF 생성 실패'), 'PDF 생성 중 오류 발생');
    } finally {
      setFormState(prev => ({ ...prev, isPdfLoading: false }));
    }
  }, [formState.formData, handleError]);

  // HTML 미리보기
  const handlePreviewHTML = useCallback(async () => {
    try {
      setFormState(prev => ({ ...prev, isPreviewLoading: true, previewError: null }));
      
      const result = await generateReportHTML(formState.formData);
      
      if (result.ok) {
        setFormState(prev => ({ 
          ...prev, 
          previewHtml: result.data,
          previewError: null 
        }));
      } else {
        setFormState(prev => ({ 
          ...prev, 
          previewError: result.message 
        }));
        handleError(result, 'HTML 미리보기 생성 실패');
      }
    } catch (error) {
      setFormState(prev => ({ 
        ...prev, 
        previewError: 'HTML 미리보기 생성 중 오류가 발생했습니다.' 
      }));
      handleError(error instanceof Error ? error : new Error('HTML 미리보기 생성 실패'), 'HTML 미리보기 생성 중 오류 발생');
    } finally {
      setFormState(prev => ({ ...prev, isPreviewLoading: false }));
    }
  }, [formState.formData, handleError]);

  // 폼 제출
  const handleSubmit = useCallback(async () => {
    try {
      setFormState(prev => ({ ...prev, isSubmitting: true, errors: {} }));
      
      // 스키마 검증
      const validation = validateReport(formState.formData);
      if (!validation.success) {
        const formattedErrors = formatValidationErrors(validation.error);
        const errorMap: Record<string, string> = {};
        formattedErrors.forEach(error => {
          errorMap[error.field] = error.message;
        });
        
        setFormState(prev => ({ ...prev, errors: errorMap }));
        return;
      }

      // ✅ 1단계: 보고서 생성 (PDF/HTML) - projectId 포함
      const reportDataWithProject = {
        ...formState.formData,
        projectId: selectedProject // 프로젝트 ID 추가
      };
      
      const createResult = await createReport(reportDataWithProject);
      
      if (!createResult.ok) {
        // 중복 보고서인 경우 중복 확인 모달 표시
        if (createResult.code === 'DUPLICATE_REPORT') {
          openDuplicateModal(createResult);
          return;
        }
        handleError(createResult, '보고서 생성 실패');
        return;
      }

      // ✅ 성공 처리 (저장은 이미 백엔드 createReport에서 완료)
      const projectName = projects.find((p: any) => p.id === selectedProject)?.name || '알 수 없는 프로젝트';
      
      setFormState(prev => ({ 
        ...prev, 
        success: `🎉 보고서가 프로젝트 "${projectName}"에 성공적으로 저장되었습니다!`,
        isSubmitting: false 
      }));
      
      // 프로젝트에 보고서 추가
      if (selectedProject) {
        addReportToProject(selectedProject, {
          id: createResult.data.id, // createReport의 결과를 사용
          title: `기술지도결과보고서_${formState.formData.site.name}_${formState.formData.visit.date}`,
          type: 'safety_inspection',
          data: formState.formData,
          status: 'completed'
        });
      }
      
      // 로컬 스토리지 정리
      localStorage.removeItem('reportForm_draft');
      
      return createResult.data; // createReport의 결과를 반환
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('제출 중 오류 발생'), '폼 제출 중 오류 발생');
    } finally {
      setFormState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [formState.formData, selectedProject, addReportToProject, handleError, openDuplicateModal, projects]);

  // 프로젝트 선택 변경
  const handleProjectChange = useCallback((projectId: string) => {
    setSelectedProject(projectId);
    // ✅ 프로젝트의 현장 정보와 기관 정보로 폼 미리 채우기
    if (projectId && Array.isArray(projects)) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        // 백엔드 데이터 구조에 맞게 프리필
        const projectInfo = {
          site: {
            name: project.name || '',
            address: project.location || '',
            phone: project.site?.phone || '',
            email: project.site?.email || '',
            management_number: project.site?.management_number || '',
            construction_period: `${project.startDate || ''} ~ ${project.endDate || ''}`,
            construction_amount: project.site?.construction_amount || project.budget || '',
            responsible_person: project.site?.responsible_person || ''
          },
          org: {
            name: project.org?.name || '', // 본사 회사명
            phone: project.org?.phone || '', // 본사 연락처
            address: project.org?.address || '', // 본사 주소
            registration_number: project.org?.registration_number || '', // 법인등록번호
            license_number: project.org?.license_number || '' // 면허번호
          },
          // 추가 정보들
          category: {
            type: project.type === 'construction' ? '건설' : '기타',
            subtype: '건축',
            is_construction: project.type === 'construction',
            is_electrical: false
          },
          progress: {
            percent: project.progress || 0
          }
        };
        
        setFormState(prev => ({
          ...prev,
          formData: { 
            ...prev.formData, 
            site: { ...prev.formData.site, ...projectInfo.site },
            org: { ...prev.formData.org, ...projectInfo.org },
            category: { ...prev.formData.category, ...projectInfo.category },
            progress: { ...prev.formData.progress, ...projectInfo.progress }
          },
          errors: {} as Record<string, string> // 타입 명시
        }));
      }
    }
  }, [projects]);

  // 초기화
  useEffect(() => {
    // ✅ 1. 사용자 프로필로 myorg 설정 (무조건 1순위)
    const userProfile = getUserProfile();
    if (userProfile) {
      const prefilledData = prefillReportWithUserProfile(formState.formData);
      setFormState(prev => ({
        ...prev,
        formData: prefilledData
      }));
    }

    // ✅ 2. 프로젝트가 이미 선택된 경우 자동 설정
    if (projectId && projectData) {
      setSelectedProject(projectId);
      setFormState(prev => ({
        ...prev,
        formData: { ...prev.formData, ...projectData }
      }));
    }

    // ✅ 3. 프로젝트가 선택된 경우 해당 프로젝트의 기본 정보로 미리 채우기 (org, site)
    if (projectId && Array.isArray(projects)) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        // 백엔드 데이터 구조에 맞게 프리필
        const projectInfo = {
          site: {
            name: project.name || '',
            address: project.location || '',
            phone: project.site?.phone || '',
            email: project.site?.email || '',
            management_number: project.site?.management_number || '',
            construction_period: `${project.startDate || ''} ~ ${project.endDate || ''}`,
            construction_amount: project.site?.construction_amount || project.budget || '',
            responsible_person: project.site?.responsible_person || project.safetyManager || ''
          },
          org: {
            name: project.org?.name || '', // 본사 회사명
            phone: project.org?.phone || '', // 본사 연락처
            address: project.org?.address || '', // 본사 주소
            registration_number: project.org?.registration_number || '', // 법인등록번호
            license_number: project.org?.license_number || '' // 면허번호
          },
          // 추가 정보들
          category: {
            type: project.type === 'construction' ? '건설' : '기타',
            subtype: '건축',
            is_construction: project.type === 'construction',
            is_electrical: false
          },
          progress: {
            percent: project.progress || 0
          }
        };
        
        setFormState(prev => ({
          ...prev,
          formData: { 
            ...prev.formData, 
            site: { ...prev.formData.site, ...projectInfo.site },
            org: { ...prev.formData.org, ...projectInfo.org },
            category: { ...prev.formData.category, ...projectInfo.category },
            progress: { ...prev.formData.progress, ...projectInfo.progress }
          },
          errors: {} as Record<string, string> // 타입 명시
        }));
      }
    }
  }, [projectId, projectData, projects]);

  // 임시 저장된 데이터 수동 불러오기 함수
  const loadDraftData = useCallback(() => {
    const savedDraft = localStorage.getItem('reportForm_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setFormState(prev => ({
          ...prev,
          formData: { ...prev.formData, ...parsed }
        }));
        return { success: true, message: '임시 저장된 데이터를 불러왔습니다.' };
      } catch (error) {
        console.warn('저장된 초안 데이터 파싱 실패:', error);
        return { success: false, message: '임시 저장된 데이터 파싱에 실패했습니다.' };
      }
    } else {
      return { success: false, message: '임시 저장된 데이터가 없습니다.' };
    }
  }, []);

  // 임시 저장된 데이터가 있는지 확인하는 함수
  const hasDraftData = useCallback(() => {
    const savedDraft = localStorage.getItem('reportForm_draft');
    return savedDraft !== null;
  }, []);

  // 정리
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  return {
    // 상태
    formState,
    selectedProject,
    isLoadingProjects,
    errorModal,
    duplicateModal,
    
    // 액션
    updateFormData,
    updateArrayField,
    addArrayItem,
    removeArrayItem,
    handleSubmit,
    handleGeneratePDF,
    handlePreviewHTML,
    handleProjectChange,
    setSelectedProject,
    
    // 에러 처리
    handleError,
    closeErrorModal,
    handleRetry,
    handleOpenHTML,
    handleViewLogs,
    
    // 중복 처리
    closeDuplicateModal,
    handleOverwrite,
    
    loadDraftData,
    hasDraftData
  };
};
