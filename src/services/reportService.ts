import { API, TIMEOUTS } from '../constants/api';
import type { ReportData } from '../schemas/reportSchema';

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
      // DUPLICATE_REPORT 에러 코드 특별 처리
      if (errorData.code === 'DUPLICATE_REPORT') {
        return {
          ...errorData,
          message: '중복된 보고서가 있습니다. 동일한 방문차수와 프로젝트명의 보고서가 이미 존재합니다.'
        };
      }
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

// 보고서 생성
export const createReport = async (reportData: ReportData): Promise<ApiResponse<{ id: string }> | ApiError> => {
  try {
    const response = await fetch(API.REPORTS, createFetchConfig('POST', reportData));
    
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

// HTML 형식으로 보고서 생성
export const generateReportHTML = async (reportData: ReportData): Promise<ApiResponse<string> | ApiError> => {
  try {
    const response = await fetch(`${API.REPORTS}?output=html`, createFetchConfig('POST', reportData));
    
    if (!response.ok) {
      return await handleApiError(response);
    }

    const html = await response.text();
    return { ok: true, data: html };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        ok: false,
        code: 'TIMEOUT',
        message: 'HTML 생성 시간이 초과되었습니다. 다시 시도해주세요.',
        details: { timeout: TIMEOUTS.FRONTEND }
      };
    }

    return {
      ok: false,
      code: 'NETWORK_ERROR',
      message: 'HTML 생성 중 네트워크 오류가 발생했습니다.',
      details: { error: error instanceof Error ? error.message : String(error) }
    };
  }
};

// PDF 형식으로 보고서 생성
export const generateReportPDF = async (reportData: ReportData): Promise<ApiResponse<Blob> | ApiError> => {
  try {
    const response = await fetch(`${API.REPORTS}?output=pdf`, createFetchConfig('POST', reportData));
    
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
        message: 'PDF 생성 시간이 초과되었습니다. 다시 시도해주세요.',
        details: { timeout: TIMEOUTS.FRONTEND }
      };
    }

    return {
      ok: false,
      code: 'NETWORK_ERROR',
      message: 'PDF 생성 중 네트워크 오류가 발생했습니다.',
      details: { error: error instanceof Error ? error.message : String(error) }
    };
  }
};

// 보고서 조회
export const getReport = async (reportId: string): Promise<ApiResponse<ReportData> | ApiError> => {
  try {
    const response = await fetch(`${API.REPORTS}/${reportId}`, createFetchConfig('GET'));
    
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
        message: '보고서 조회 시간이 초과되었습니다. 다시 시도해주세요.',
        details: { timeout: TIMEOUTS.FRONTEND }
      };
    }

    return {
      ok: false,
      code: 'NETWORK_ERROR',
      message: '보고서 조회 중 네트워크 오류가 발생했습니다.',
      details: { error: error instanceof Error ? error.message : String(error) }
    };
  }
};

// 보고서 업데이트
export const updateReport = async (reportId: string, reportData: Partial<ReportData>): Promise<ApiResponse<{ id: string }> | ApiError> => {
  try {
    const response = await fetch(`${API.REPORTS}/${reportId}`, createFetchConfig('PUT', reportData));
    
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
        message: '보고서 업데이트 시간이 초과되었습니다. 다시 시도해주세요.',
        details: { timeout: TIMEOUTS.FRONTEND }
      };
    }

    return {
      ok: false,
      code: 'NETWORK_ERROR',
      message: '보고서 업데이트 중 네트워크 오류가 발생했습니다.',
      details: { error: error instanceof Error ? error.message : String(error) }
    };
  }
};

// 보고서 삭제
export const deleteReport = async (reportId: string): Promise<ApiResponse<{ success: boolean }> | ApiError> => {
  try {
    const response = await fetch(`${API.REPORTS}/${reportId}`, createFetchConfig('DELETE'));
    
    if (!response.ok) {
      return await handleApiError(response);
    }

    return { ok: true, data: { success: true } };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        ok: false,
        code: 'TIMEOUT',
        message: '보고서 삭제 시간이 초과되었습니다. 다시 시도해주세요.',
        details: { timeout: TIMEOUTS.FRONTEND }
      };
    }

    return {
      ok: false,
      code: 'NETWORK_ERROR',
      message: '보고서 삭제 중 네트워크 오류가 발생했습니다.',
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
