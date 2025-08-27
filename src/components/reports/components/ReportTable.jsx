import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Skeleton,
  Alert,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Sort as SortIcon,
  ArrowUpward as SortAscIcon,
  ArrowDownward as SortDescIcon
} from '@mui/icons-material';
import ReportRow from './ReportRow';

const ReportTable = ({
  reports = [],
  isLoading = false,
  error = null,
  selectedReports = [],
  filters = {},
  sort = { field: 'created_date', direction: 'desc' },
  pagination = { page: 0, rowsPerPage: 10, total: 0 },
  onReportSelect,
  onReportView,
  onReportEdit,
  onReportDelete,
  onReportDownload,
  onSortChange,
  onPageChange,
  onRowsPerPageChange,
  onRefresh,
  disabled = false,
  showActions = true
}) => {
  const handleSort = (field) => {
    if (onSortChange && !disabled) {
      onSortChange(field);
    }
  };

  const handlePageChange = (event, newPage) => {
    if (onPageChange && !disabled) {
      onPageChange(newPage);
    }
  };

  const handleRowsPerPageChange = (event) => {
    if (onRowsPerPageChange && !disabled) {
      onRowsPerPageChange(parseInt(event.target.value, 10));
    }
  };

  const handleRefresh = () => {
    if (onRefresh && !disabled) {
      onRefresh();
    }
  };

  const getSortIcon = (field) => {
    if (sort.field !== field) return <SortIcon fontSize="small" />;
    return sort.direction === 'asc' ? <SortAscIcon fontSize="small" /> : <SortDescIcon fontSize="small" />;
  };

  const getSortColor = (field) => {
    if (sort.field !== field) return 'text.secondary';
    return 'primary.main';
  };

  if (isLoading) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Skeleton variant="text" width="30%" height={32} />
            <Skeleton variant="rectangular" height={400} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Alert
            severity="error"
            action={
              <Tooltip title="새로고침">
                <IconButton
                  color="inherit"
                  size="small"
                  onClick={handleRefresh}
                  disabled={disabled}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            }
          >
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (reports.length === 0) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              보고서가 없습니다
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Object.keys(filters).length > 0 
                ? '현재 필터 조건에 맞는 보고서가 없습니다. 필터를 조정해보세요.'
                : '첫 번째 보고서를 생성해보세요.'
              }
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        {/* 헤더 */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
              보고서 목록
            </Typography>
            <Chip
              label={`${reports.length}개`}
              size="small"
              color="primary"
              variant="outlined"
            />
            {Object.keys(filters).length > 0 && (
              <Chip
                label="필터 적용됨"
                size="small"
                color="warning"
                variant="outlined"
              />
            )}
          </Box>
          <Tooltip title="새로고침">
            <IconButton onClick={handleRefresh} disabled={disabled} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* 테이블 */}
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                {/* 선택 체크박스 */}
                <TableCell padding="checkbox">
                  <Typography variant="subtitle2" fontSize="0.75rem">
                    선택
                  </Typography>
                </TableCell>

                {/* 제목 */}
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2">제목</Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleSort('title')}
                      disabled={disabled}
                      sx={{ color: getSortColor('title') }}
                    >
                      {getSortIcon('title')}
                    </IconButton>
                  </Box>
                </TableCell>

                {/* 타입 */}
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2">타입</Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleSort('type')}
                      disabled={disabled}
                      sx={{ color: getSortColor('type') }}
                    >
                      {getSortIcon('type')}
                    </IconButton>
                  </Box>
                </TableCell>

                {/* 프로젝트 */}
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2">프로젝트</Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleSort('project_name')}
                      disabled={disabled}
                      sx={{ color: getSortColor('project_name') }}
                    >
                      {getSortIcon('project_name')}
                    </IconButton>
                  </Box>
                </TableCell>

                {/* 상태 */}
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2">상태</Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleSort('status')}
                      disabled={disabled}
                      sx={{ color: getSortColor('status') }}
                    >
                      {getSortIcon('status')}
                    </IconButton>
                  </Box>
                </TableCell>

                {/* 우선순위 */}
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2">우선순위</Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleSort('priority')}
                      disabled={disabled}
                      sx={{ color: getSortColor('priority') }}
                    >
                      {getSortIcon('priority')}
                    </IconButton>
                  </Box>
                </TableCell>

                {/* 작성자 */}
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2">작성자</Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleSort('author')}
                      disabled={disabled}
                      sx={{ color: getSortColor('author') }}
                    >
                      {getSortIcon('author')}
                    </IconButton>
                  </Box>
                </TableCell>

                {/* 생성일 */}
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2">생성일</Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleSort('created_date')}
                      disabled={disabled}
                      sx={{ color: getSortColor('created_date') }}
                    >
                      {getSortIcon('created_date')}
                    </IconButton>
                  </Box>
                </TableCell>

                {/* 액션 */}
                {showActions && (
                  <TableCell align="center">
                    <Typography variant="subtitle2">액션</Typography>
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((report) => (
                <ReportRow
                  key={report.id}
                  report={report}
                  isSelected={selectedReports.includes(report.id)}
                  onSelect={onReportSelect}
                  onView={onReportView}
                  onEdit={onReportEdit}
                  onDelete={onReportDelete}
                  onDownload={onReportDownload}
                  disabled={disabled}
                  showActions={showActions}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 페이지네이션 */}
        {reports.length > 0 && (
          <TablePagination
            component="div"
            count={pagination.total}
            page={pagination.page}
            onPageChange={handlePageChange}
            rowsPerPage={pagination.rowsPerPage}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="페이지당 행 수:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default ReportTable;
