import { API, TIMEOUTS } from '../constants/api';
import type { 
  ProjectType, 
  ProjectStatus, 
  ProjectPriority, 
  ProjectRisk,
  ExportFormat 
} from '../config/projectConfig';

// 프로젝트 데이터 타입 정의
export interface ProjectData {
  id: string;
  name: string;
  description?: string;
  type: ProjectType;
  status: ProjectStatus;
  priority: ProjectPriority;
  risk: ProjectRisk;
  location?: string;
  client?: string;
  start_date?: string;
  end_date?: string;
  progress: number;
  budget?: number;
  manager?: string;
  team_members?: string[];
  tags?: string[];
  created_date: string;
  updated_date: string;
  reports?: any[];
}

// 프로젝트 생성 요청 타입
export interface CreateProjectRequest {
  name: string;
  description?: string;
  type: ProjectType;
  status: ProjectStatus;
  priority: ProjectPriority;
  risk: ProjectRisk;
  location?: string;
  client?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  manager?: string;
  team_members?: string[];
  tags?: string[];
}

// 프로젝트 업데이트 요청 타입
export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  id: string;
}

// 프로젝트 필터 타입
export interface ProjectFilter {
  search?: string;
  type?: ProjectType;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  risk?: ProjectRisk;
  location?: string;
  client?: string;
  manager?: string;
  tags?: string[];
  start_date_from?: string;
  start_date_to?: string;
  end_date_from?: string;
  end_date_to?: string;
}

// 프로젝트 정렬 타입
export interface ProjectSort {
  field: string;
  direction: 'asc' | 'desc';
}

// 프로젝트 페이지네이션 타입
export interface ProjectPagination {
  page: number;
  page_size: number;
  total: number;
}

// 프로젝트 목록 응답 타입
export interface ProjectListResponse {
  projects: ProjectData[];
  pagination: ProjectPagination;
  filters: ProjectFilter;
  sort: ProjectSort;
}

// 프로젝트 백업 데이터 타입
export interface ProjectBackup {
  id: string;
  project_id: string;
  backup_date: string;
  filename: string;
  size: number;
  description?: string;
}

// 프로젝트 내보내기 요청 타입
export interface ProjectExportRequest {
  project_ids: string[];
  format: ExportFormat;
  include_reports?: boolean;
  include_attachments?: boolean;
}

// 에러 타입 정의
export interface ApiError {
  ok: false;
  code: string;
  message: string;
  details?: any;
}

export interface ApiResponse<T> {
  ok: true;
  data: T;
}

// 타입 가드
const isApiError = (response: any): response is ApiError => {
  return response && response.ok === false;
};

// 기본 fetch 설정
const createFetchConfig = (method: string, body?: any): RequestInit => {
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Version': 'v1'
    },
    signal: AbortSignal.timeout(TIMEOUTS.FRONTEND)
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  return config;
};

// 에러 처리 헬퍼
const handleApiError = async (response: Response): Promise<ApiError> => {
  try {
    const errorData = await response.json();
    if (isApiError(errorData)) {
      return errorData;
    }
  } catch {
    // JSON 파싱 실패 시 기본 에러 생성
  }

  return {
    ok: false,
    code: `HTTP_${response.status}`,
    message: response.statusText || '알 수 없는 오류가 발생했습니다.',
    details: { status: response.status }
  };
};

// 프로젝트 목록 조회
export const getProjects = async (
  filters?: ProjectFilter,
  sort?: ProjectSort,
  pagination?: { page: number; page_size: number }
): Promise<ApiResponse<ProjectListResponse> | ApiError> => {
  try {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }
    
    if (sort) {
      params.append('sort_field', sort.field);
      params.append('sort_direction', sort.direction);
    }
    
    if (pagination) {
      params.append('page', String(pagination.page));
      params.append('page_size', String(pagination.page_size));
    }

    const url = `${API.PROJECTS}?${params.toString()}`;
    const response = await fetch(url, createFetchConfig('GET'));
    
    if (!response.ok) {
      return await handleApiError(response);
    }

    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        ok: false,
        code: 'TIMEOUT',
        message: '요청 시간이 초과되었습니다. 다시 시도해주세요.',
        details: { timeout: TIMEOUTS.FRONTEND }
      };
    }

    return {
      ok: false,
      code: 'NETWORK_ERROR',
      message: '네트워크 오류가 발생했습니다. 연결을 확인해주세요.',
      details: { error: error instanceof Error ? error.message : String(error) }
    };
  }
};

// 프로젝트 생성
export const createProject = async (projectData: CreateProjectRequest): Promise<ApiResponse<ProjectData> | ApiError> => {
  try {
    const response = await fetch(API.PROJECTS, createFetchConfig('POST', projectData));
    
    if (!response.ok) {
      return await handleApiError(response);
    }

    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        ok: false,
        code: 'TIMEOUT',
        message: '프로젝트 생성 시간이 초과되었습니다. 다시 시도해주세요.',
        details: { timeout: TIMEOUTS.FRONTEND }
      };
    }

    return {
      ok: false,
      code: 'NETWORK_ERROR',
      message: '프로젝트 생성 중 네트워크 오류가 발생했습니다.',
      details: { error: error instanceof Error ? error.message : String(error) }
    };
  }
};

// 프로젝트 조회
export const getProject = async (projectId: string): Promise<ApiResponse<ProjectData> | ApiError> => {
  try {
    const response = await fetch(`${API.PROJECTS}/${projectId}`, createFetchConfig('GET'));
    
    if (!response.ok) {
      return await handleApiError(response);
    }

    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        ok: false,
        code: 'TIMEOUT',
        message: '프로젝트 조회 시간이 초과되었습니다. 다시 시도해주세요.',
        details: { timeout: TIMEOUTS.FRONTEND }
      };
    }

    return {
      ok: false,
      code: 'NETWORK_ERROR',
      message: '프로젝트 조회 중 네트워크 오류가 발생했습니다.',
      details: { error: error instanceof Error ? error.message : String(error) }
    };
  }
};

// 프로젝트 업데이트
export const updateProject = async (projectData: UpdateProjectRequest): Promise<ApiResponse<ProjectData> | ApiError> => {
  try {
    const response = await fetch(`${API.PROJECTS}/${projectData.id}`, createFetchConfig('PUT', projectData));
    
    if (!response.ok) {
      return await handleApiError(response);
    }

    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        ok: false,
        code: 'TIMEOUT',
        message: '프로젝트 업데이트 시간이 초과되었습니다. 다시 시도해주세요.',
        details: { timeout: TIMEOUTS.FRONTEND }
      };
    }

    return {
      ok: false,
      code: 'NETWORK_ERROR',
      message: '프로젝트 업데이트 중 네트워크 오류가 발생했습니다.',
      details: { error: error instanceof Error ? error.message : String(error) }
    };
  }
};

// 프로젝트 삭제
export const deleteProject = async (projectId: string): Promise<ApiResponse<{ success: boolean }> | ApiError> => {
  try {
    const response = await fetch(`${API.PROJECTS}/${projectId}`, createFetchConfig('DELETE'));
    
    if (!response.ok) {
      return await handleApiError(response);
    }

    return { ok: true, data: { success: true } };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        ok: false,
        code: 'TIMEOUT',
        message: '프로젝트 삭제 시간이 초과되었습니다. 다시 시도해주세요.',
        details: { timeout: TIMEOUTS.FRONTEND }
      };
    }

    return {
      ok: false,
      code: 'NETWORK_ERROR',
      message: '프로젝트 삭제 중 네트워크 오류가 발생했습니다.',
      details: { error: error instanceof Error ? error.message : String(error) }
    };
  }
};

// 프로젝트 백업
export const backupProject = async (projectId: string, description?: string): Promise<ApiResponse<ProjectBackup> | ApiError> => {
  try {
    const response = await fetch(`${API.PROJECTS}/${projectId}/backup`, createFetchConfig('POST', { description }));
    
    if (!response.ok) {
      return await handleApiError(response);
    }

    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        ok: false,
        code: 'TIMEOUT',
        message: '프로젝트 백업 시간이 초과되었습니다. 다시 시도해주세요.',
        details: { timeout: TIMEOUTS.FRONTEND }
      };
    }

    return {
      ok: false,
      code: 'NETWORK_ERROR',
      message: '프로젝트 백업 중 네트워크 오류가 발생했습니다.',
      details: { error: error instanceof Error ? error.message : String(error) }
    };
  }
};

// 프로젝트 백업 복원
export const restoreProject = async (backupId: string): Promise<ApiResponse<ProjectData> | ApiError> => {
  try {
    const response = await fetch(`${API.PROJECTS}/restore/${backupId}`, createFetchConfig('POST'));
    
    if (!response.ok) {
      return await handleApiError(response);
    }

    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        ok: false,
        code: 'TIMEOUT',
        message: '프로젝트 복원 시간이 초과되었습니다. 다시 시도해주세요.',
        details: { timeout: TIMEOUTS.FRONTEND }
      };
    }

    return {
      ok: false,
      code: 'NETWORK_ERROR',
      message: '프로젝트 복원 중 네트워크 오류가 발생했습니다.',
      details: { error: error instanceof Error ? error.message : String(error) }
    };
  }
};

// 프로젝트 내보내기
export const exportProjects = async (exportRequest: ProjectExportRequest): Promise<ApiResponse<Blob> | ApiError> => {
  try {
    const response = await fetch(`${API.PROJECTS}/export`, createFetchConfig('POST', exportRequest));
    
    if (!response.ok) {
      return await handleApiError(response);
    }

    const blob = await response.blob();
    return { ok: true, data: blob };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        ok: false,
        code: 'TIMEOUT',
        message: '프로젝트 내보내기 시간이 초과되었습니다. 다시 시도해주세요.',
        details: { timeout: TIMEOUTS.FRONTEND }
      };
    }

    return {
      ok: false,
      code: 'NETWORK_ERROR',
      message: '프로젝트 내보내기 중 네트워크 오류가 발생했습니다.',
      details: { error: error instanceof Error ? error.message : String(error) }
    };
  }
};

// 파일 다운로드 헬퍼
export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
