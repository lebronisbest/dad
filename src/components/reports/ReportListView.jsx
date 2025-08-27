import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Button,
  Alert,
  Skeleton
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

// 컴포넌트들
import ReportFilters from './components/ReportFilters';
import ReportTable from './components/ReportTable';
import BatchActionsBar from './components/BatchActionsBar';

const ReportListView = ({
  // 보고서 데이터
  reports = [],
  isLoading = false,
  error = null,

  // 상태 관리
  selectedReports = [],
  filters = {},
  sort = { field: 'created_date', direction: 'desc' },
  pagination = { page: 0, rowsPerPage: 10, total: 0 },

  // 이벤트 핸들러들
  onNewReport,
  onRefresh,
  onFiltersChange,
  onFiltersClear,
  onSearch,
  onSortChange,
  onPageChange,
  onRowsPerPageChange,
  onReportSelect,
  onReportView,
  onReportEdit,
  onReportDelete,
  onReportDownload,
  onBatchDownload,
  onBatchDelete,
  onBatchStatusChange,
  onBatchArchive,
  onBatchRestore,
  onBatchShare,
  onBatchPrint,
  onClearSelection,

  disabled = false
}) => {
  const handleNewReport = () => {
    if (onNewReport && !disabled) {
      onNewReport();
    }
  };

  const handleRefresh = () => {
    if (onRefresh && !disabled) {
      onRefresh();
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Skeleton variant="text" width="60%" height={48} />
          <Skeleton variant="rectangular" height={200} />
          <Skeleton variant="rectangular" height={400} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* 헤더 */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
              보고서 관리
            </Typography>
            <Typography variant="h6" color="text.secondary">
              모든 안전보고서를 체계적으로 관리하세요
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={disabled}
            >
              새로고침
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNewReport}
              disabled={disabled}
              size="large"
              sx={{ px: 4, py: 1.5 }}
            >
              새 보고서
            </Button>
          </Box>
        </Box>

        {/* 통계 정보 */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
                {pagination.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                총 보고서
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 600 }}>
                {reports.filter(r => r.status === 'completed').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                완료된 보고서
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h4" color="info.main" sx={{ fontWeight: 600 }}>
                {reports.filter(r => r.status === 'submitted').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                제출된 보고서
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h4" color="warning.main" sx={{ fontWeight: 600 }}>
                {reports.filter(r => r.status === 'draft').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                초안 보고서
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* 에러 표시 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 필터 */}
      <ReportFilters
        filters={filters}
        onFiltersChange={onFiltersChange}
        onClearFilters={onFiltersClear}
        onSearch={onSearch}
        disabled={disabled}
      />

      {/* 일괄 액션 바 */}
      <BatchActionsBar
        selectedReports={selectedReports}
        totalReports={pagination.total}
        onBatchDownload={onBatchDownload}
        onBatchDelete={onBatchDelete}
        onBatchStatusChange={onBatchStatusChange}
        onBatchArchive={onBatchArchive}
        onBatchRestore={onBatchRestore}
        onBatchShare={onBatchShare}
        onBatchPrint={onBatchPrint}
        onClearSelection={onClearSelection}
        disabled={disabled}
      />

      {/* 보고서 테이블 */}
      <ReportTable
        reports={reports}
        isLoading={isLoading}
        error={error}
        selectedReports={selectedReports}
        filters={filters}
        sort={sort}
        pagination={pagination}
        onReportSelect={onReportSelect}
        onReportView={onReportView}
        onReportEdit={onReportEdit}
        onReportDelete={onReportDelete}
        onReportDownload={onReportDownload}
        onSortChange={onSortChange}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        onRefresh={onRefresh}
        disabled={disabled}
        showActions={true}
      />

      {/* 빈 상태 안내 */}
      {!isLoading && reports.length === 0 && !error && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            📄 보고서가 없습니다
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {Object.keys(filters).length > 0 
              ? '현재 필터 조건에 맞는 보고서가 없습니다. 필터를 조정하거나 첫 번째 보고서를 생성해보세요.'
              : '첫 번째 안전보고서를 생성해보세요!'
            }
          </Typography>
          {Object.keys(filters).length === 0 && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNewReport}
              disabled={disabled}
              size="large"
              sx={{ px: 4, py: 1.5 }}
            >
              첫 번째 보고서 생성
            </Button>
          )}
        </Box>
      )}
    </Container>
  );
};

export default ReportListView;
