import { useState, useEffect, useCallback } from 'react';

// 보고서 데이터 타입
export interface ReportData {
  id: string;
  title: string;
  type: string;
  project_name: string;
  status: string;
  created_date: string;
  updated_date: string;
  author: string;
  priority: string;
  tags?: string[];
}

// 필터 타입
export interface ReportFilters {
  type?: string;
  status?: string;
  project?: string;
  author?: string;
  priority?: string;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
}

// 정렬 타입
export interface ReportSort {
  field: string;
  direction: 'asc' | 'desc';
}

// 페이지네이션 타입
export interface ReportPagination {
  page: number;
  rowsPerPage: number;
  total: number;
}

// 보고서 상태 타입
export interface ReportState {
  reports: ReportData[];
  isLoading: boolean;
  error: string | null;
  selectedReports: string[];
  filters: ReportFilters;
  sort: ReportSort;
  pagination: ReportPagination;
}

// 초기 상태
const getInitialReportState = (): ReportState => ({
  reports: [],
  isLoading: false,
  error: null,
  selectedReports: [],
  filters: {},
  sort: { field: 'created_date', direction: 'desc' },
  pagination: { page: 0, rowsPerPage: 10, total: 0 }
});

export const useReports = () => {
  const [reportState, setReportState] = useState<ReportState>(getInitialReportState());

  // 보고서 목록 조회
  const fetchReports = useCallback(async () => {
    try {
      setReportState(prev => ({ ...prev, isLoading: true, error: null }));

      // TODO: reportService에서 보고서 목록 조회 API 호출
      // const result = await getReports(reportState.filters, reportState.sort, reportState.pagination);

      // 임시 데이터 (실제 구현 시 제거)
      const mockReports: ReportData[] = [
        {
          id: '1',
          title: '안전점검 보고서 - 12월 3주차',
          type: 'safety_inspection',
          project_name: '서울역 고가도로 건설',
          status: 'completed',
          created_date: '2024-12-19',
          updated_date: '2024-12-19',
          author: '김철수',
          priority: 'high',
          tags: ['안전점검', '고가도로']
        },
        {
          id: '2',
          title: '사고 보고서 - 지반 침하',
          type: 'incident_report',
          project_name: '부산항 컨테이너 터미널 확장',
          status: 'submitted',
          created_date: '2024-12-18',
          updated_date: '2024-12-18',
          author: '이영희',
          priority: 'critical',
          tags: ['사고', '지반침하']
        },
        {
          id: '3',
          title: '위험성평가 보고서',
          type: 'risk_assessment',
          project_name: '대구 지하철 3호선 연장',
          status: 'approved',
          created_date: '2024-12-15',
          updated_date: '2024-12-15',
          author: '박민수',
          priority: 'medium',
          tags: ['위험성평가', '지하철']
        }
      ];

      setReportState(prev => ({
        ...prev,
        reports: mockReports,
        pagination: { ...prev.pagination, total: mockReports.length },
        isLoading: false
      }));
    } catch (error) {
      setReportState(prev => ({
        ...prev,
        error: '보고서 목록을 불러오는 중 오류가 발생했습니다.',
        isLoading: false
      }));
    }
  }, [reportState.filters, reportState.sort, reportState.pagination]);

  // 필터 변경
  const updateFilters = useCallback((newFilters: Partial<ReportFilters>) => {
    setReportState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters },
      pagination: { ...prev.pagination, page: 0 } // 필터 변경 시 첫 페이지로
    }));
  }, []);

  // 필터 초기화
  const clearFilters = useCallback(() => {
    setReportState(prev => ({
      ...prev,
      filters: {},
      pagination: { ...prev.pagination, page: 0 }
    }));
  }, []);

  // 정렬 변경
  const updateSort = useCallback((field: string) => {
    setReportState(prev => ({
      ...prev,
      sort: {
        field,
        direction: prev.sort.field === field && prev.sort.direction === 'asc' ? 'desc' : 'asc'
      }
    }));
  }, []);

  // 페이지 변경
  const updatePage = useCallback((newPage: number) => {
    setReportState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, page: newPage }
    }));
  }, []);

  // 페이지당 행 수 변경
  const updateRowsPerPage = useCallback((newRowsPerPage: number) => {
    setReportState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, page: 0, rowsPerPage: newRowsPerPage }
    }));
  }, []);

  // 보고서 선택/해제
  const toggleReportSelection = useCallback((reportId: string) => {
    setReportState(prev => ({
      ...prev,
      selectedReports: prev.selectedReports.includes(reportId)
        ? prev.selectedReports.filter(id => id !== reportId)
        : [...prev.selectedReports, reportId]
    }));
  }, []);

  // 전체 선택/해제
  const toggleAllReports = useCallback(() => {
    setReportState(prev => ({
      ...prev,
      selectedReports: prev.selectedReports.length === prev.reports.length ? [] : prev.reports.map(r => r.id)
    }));
  }, []);

  // 선택된 보고서 삭제
  const deleteSelectedReports = useCallback(async () => {
    if (reportState.selectedReports.length === 0) return;

    try {
      // TODO: reportService에서 선택된 보고서 삭제 API 호출
      // const result = await deleteReports(reportState.selectedReports);

      // 임시 구현 (실제 구현 시 제거)
      setReportState(prev => ({
        ...prev,
        reports: prev.reports.filter(r => !prev.selectedReports.includes(r.id)),
        selectedReports: [],
        pagination: { ...prev.pagination, total: prev.reports.length - prev.selectedReports.length }
      }));

      return { success: true };
    } catch (error) {
      return { success: false, error: '선택된 보고서 삭제 중 오류가 발생했습니다.' };
    }
  }, [reportState.selectedReports]);

  // 선택된 보고서 다운로드
  const downloadSelectedReports = useCallback(async () => {
    if (reportState.selectedReports.length === 0) return;

    try {
      // TODO: reportService에서 선택된 보고서 다운로드 API 호출
      // const result = await downloadReports(reportState.selectedReports);

      // 임시 구현 (실제 구현 시 제거)
      console.log('다운로드할 보고서:', reportState.selectedReports);

      return { success: true };
    } catch (error) {
      return { success: false, error: '선택된 보고서 다운로드 중 오류가 발생했습니다.' };
    }
  }, [reportState.selectedReports]);

  // 보고서 상태 변경
  const updateReportStatus = useCallback(async (reportId: string, newStatus: string) => {
    try {
      // TODO: reportService에서 보고서 상태 업데이트 API 호출
      // const result = await updateReportStatus(reportId, newStatus);

      // 임시 구현 (실제 구현 시 제거)
      setReportState(prev => ({
        ...prev,
        reports: prev.reports.map(r =>
          r.id === reportId ? { ...r, status: newStatus, updated_date: new Date().toISOString() } : r
        )
      }));

      return { success: true };
    } catch (error) {
      return { success: false, error: '보고서 상태 업데이트 중 오류가 발생했습니다.' };
    }
  }, []);

  // 보고서 검색
  const searchReports = useCallback((searchTerm: string) => {
    updateFilters({ searchTerm });
  }, [updateFilters]);

  // 초기 데이터 로드
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // 필터, 정렬, 페이지네이션 변경 시 데이터 새로고침
  useEffect(() => {
    fetchReports();
  }, [reportState.filters, reportState.sort, reportState.pagination.page, reportState.pagination.rowsPerPage]);

  return {
    // 상태
    ...reportState,

    // 액션
    fetchReports,
    updateFilters,
    clearFilters,
    updateSort,
    updatePage,
    updateRowsPerPage,
    toggleReportSelection,
    toggleAllReports,
    deleteSelectedReports,
    downloadSelectedReports,
    updateReportStatus,
    searchReports
  };
};
