import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useReports } from './hooks/useReports';
import ReportListView from './ReportListView';

const ReportListContainer = () => {
  const navigate = useNavigate();

  // useReports 훅을 사용하여 상태와 로직 관리
  const {
    // 상태
    reports,
    isLoading,
    error,
    selectedReports,
    filters,
    sort,
    pagination,

    // 액션 함수들
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
  } = useReports();

  // 이벤트 핸들러들
  const handleNewReport = () => {
    navigate('/reports/new');
  };

  const handleRefresh = () => {
    fetchReports();
  };

  const handleFiltersChange = (newFilters) => {
    updateFilters(newFilters);
  };

  const handleFiltersClear = () => {
    clearFilters();
  };

  const handleSearch = (searchTerm) => {
    searchReports(searchTerm);
  };

  const handleSortChange = (field) => {
    updateSort(field);
  };

  const handlePageChange = (newPage) => {
    updatePage(newPage);
  };

  const handleRowsPerPageChange = (newRowsPerPage) => {
    updateRowsPerPage(newRowsPerPage);
  };

  // 보고서 관련 핸들러
  const handleReportSelect = (reportId) => {
    toggleReportSelection(reportId);
  };

  const handleReportView = (report) => {
    navigate(`/reports/${report.id}`);
  };

  const handleReportEdit = (report) => {
    navigate(`/reports/${report.id}/edit`);
  };

  const handleReportDelete = async (reportId) => {
    // TODO: 보고서 삭제 확인 다이얼로그 및 삭제 로직
    console.log('보고서 삭제:', reportId);
  };

  const handleReportDownload = (report) => {
    // TODO: 보고서 다운로드 로직
    console.log('보고서 다운로드:', report);
  };

  // 일괄 액션 핸들러
  const handleBatchDownload = async (selectedReports) => {
    const result = await downloadSelectedReports();
    if (result.success) {
      console.log('일괄 다운로드 성공');
    } else {
      console.error('일괄 다운로드 실패:', result.error);
    }
  };

  const handleBatchDelete = async (selectedReports) => {
    const result = await deleteSelectedReports();
    if (result.success) {
      console.log('일괄 삭제 성공');
    } else {
      console.error('일괄 삭제 실패:', result.error);
    }
  };

  const handleBatchStatusChange = async (selectedReports, newStatus) => {
    // TODO: 선택된 보고서들의 상태를 일괄 변경
    console.log('일괄 상태 변경:', selectedReports, newStatus);
    
    // 각 보고서의 상태를 개별적으로 변경
    for (const report of selectedReports) {
      await updateReportStatus(report.id, newStatus);
    }
  };

  const handleBatchArchive = async (selectedReports, reason) => {
    // TODO: 선택된 보고서들을 보관
    console.log('일괄 보관:', selectedReports, reason);
  };

  const handleBatchRestore = async (selectedReports) => {
    // TODO: 선택된 보고서들을 복원
    console.log('일괄 복원:', selectedReports);
  };

  const handleBatchShare = async (selectedReports) => {
    // TODO: 선택된 보고서들을 공유
    console.log('일괄 공유:', selectedReports);
  };

  const handleBatchPrint = async (selectedReports) => {
    // TODO: 선택된 보고서들을 인쇄
    console.log('일괄 인쇄:', selectedReports);
  };

  const handleClearSelection = () => {
    // 선택된 보고서들을 모두 해제
    if (selectedReports.length > 0) {
      selectedReports.forEach(reportId => {
        toggleReportSelection(reportId);
      });
    }
  };

  return (
    <ReportListView
      // 보고서 데이터
      reports={reports}
      isLoading={isLoading}
      error={error}

      // 상태 관리
      selectedReports={selectedReports}
      filters={filters}
      sort={sort}
      pagination={pagination}

      // 이벤트 핸들러들
      onNewReport={handleNewReport}
      onRefresh={handleRefresh}
      onFiltersChange={handleFiltersChange}
      onFiltersClear={handleFiltersClear}
      onSearch={handleSearch}
      onSortChange={handleSortChange}
      onPageChange={handlePageChange}
      onRowsPerPageChange={handleRowsPerPageChange}
      onReportSelect={handleReportSelect}
      onReportView={handleReportView}
      onReportEdit={handleReportEdit}
      onReportDelete={handleReportDelete}
      onReportDownload={handleReportDownload}
      onBatchDownload={handleBatchDownload}
      onBatchDelete={handleBatchDelete}
      onBatchStatusChange={handleBatchStatusChange}
      onBatchArchive={handleBatchArchive}
      onBatchRestore={handleBatchRestore}
      onBatchShare={handleBatchShare}
      onBatchPrint={handleBatchPrint}
      onClearSelection={handleClearSelection}

      disabled={isLoading}
    />
  );
};

export default ReportListContainer;
