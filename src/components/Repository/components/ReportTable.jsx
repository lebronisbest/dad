import React, { useState } from 'react';
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
  Chip,
  IconButton,
  Tooltip,
  Skeleton,
  Alert,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

const ReportTable = ({
  reports = [],
  isLoading = false,
  error = null,
  selectedReport = null,
  filters = {},
  onReportSelect,
  onReportEdit,
  onReportDelete,
  onReportDownload,
  onFiltersChange,
  onClearFilters,
  onRefresh,
  disabled = false
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [localFilters, setLocalFilters] = useState(filters);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field, value) => {
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);
  };

  const handleApplyFilters = () => {
    onFiltersChange?.(localFilters);
  };

  const handleClearFilters = () => {
    const resetFilters = {};
    setLocalFilters(resetFilters);
    onClearFilters?.();
  };

  const handleReportSelect = (report) => {
    if (onReportSelect && !disabled) {
      onReportSelect(report);
    }
  };

  const handleReportEdit = (event, report) => {
    event.stopPropagation();
    if (onReportEdit && !disabled) {
      onReportEdit(report);
    }
  };

  const handleReportDelete = (event, report) => {
    event.stopPropagation();
    if (onReportDelete && !disabled) {
      onReportDelete(report.id);
    }
  };

  const handleReportDownload = (event, report) => {
    event.stopPropagation();
    if (onReportDownload && !disabled) {
      onReportDownload(report);
    }
  };

  const handleRefresh = () => {
    if (onRefresh && !disabled) {
      onRefresh();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('ko-KR');
    } catch {
      return dateString;
    }
  };

  const getReportTypeLabel = (type) => {
    const typeLabels = {
      'safety_inspection': '안전점검',
      'incident_report': '사고보고',
      'risk_assessment': '위험성평가',
      'training_report': '교육보고',
      'audit_report': '감사보고',
      'compliance_report': '준수보고'
    };
    return typeLabels[type] || type;
  };

  const getReportStatusLabel = (status) => {
    const statusLabels = {
      'draft': '초안',
      'completed': '완료',
      'submitted': '제출됨',
      'approved': '승인됨',
      'rejected': '반려됨'
    };
    return statusLabels[status] || status;
  };

  const getReportStatusColor = (status) => {
    const statusColors = {
      'draft': 'default',
      'completed': 'success',
      'submitted': 'info',
      'approved': 'success',
      'rejected': 'error'
    };
    return statusColors[status] || 'default';
  };

  // 필터링된 보고서 목록
  const filteredReports = reports.filter(report => {
    if (localFilters.type && report.type !== localFilters.type) return false;
    if (localFilters.status && report.status !== localFilters.status) return false;
    if (localFilters.dateFrom && new Date(report.created_date) < new Date(localFilters.dateFrom)) return false;
    if (localFilters.dateTo && new Date(report.created_date) > new Date(localFilters.dateTo)) return false;
    return true;
  });

  // 페이지네이션된 보고서 목록
  const paginatedReports = filteredReports.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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
              <Button 
                color="inherit" 
                size="small" 
                onClick={handleRefresh}
                disabled={disabled}
              >
                재시도
              </Button>
            }
          >
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        {/* 헤더 */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h3" sx={{ flexGrow: 1 }}>
            보고서 목록 ({filteredReports.length}개)
          </Typography>
          <Tooltip title="새로고침">
            <IconButton onClick={handleRefresh} disabled={disabled} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* 필터 */}
        <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>보고서 타입</InputLabel>
                <Select
                  value={localFilters.type || ''}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  disabled={disabled}
                >
                  <MenuItem value="">전체</MenuItem>
                  <MenuItem value="safety_inspection">안전점검</MenuItem>
                  <MenuItem value="incident_report">사고보고</MenuItem>
                  <MenuItem value="risk_assessment">위험성평가</MenuItem>
                  <MenuItem value="training_report">교육보고</MenuItem>
                  <MenuItem value="audit_report">감사보고</MenuItem>
                  <MenuItem value="compliance_report">준수보고</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>상태</InputLabel>
                <Select
                  value={localFilters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  disabled={disabled}
                >
                  <MenuItem value="">전체</MenuItem>
                  <MenuItem value="draft">초안</MenuItem>
                  <MenuItem value="completed">완료</MenuItem>
                  <MenuItem value="submitted">제출됨</MenuItem>
                  <MenuItem value="approved">승인됨</MenuItem>
                  <MenuItem value="rejected">반려됨</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="시작일"
                type="date"
                value={localFilters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                disabled={disabled}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="종료일"
                type="date"
                value={localFilters.dateTo || ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                disabled={disabled}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleApplyFilters}
                  disabled={disabled}
                  startIcon={<FilterIcon />}
                >
                  적용
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleClearFilters}
                  disabled={disabled}
                  startIcon={<ClearIcon />}
                >
                  초기화
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* 테이블 */}
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>제목</TableCell>
                <TableCell>타입</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>생성일</TableCell>
                <TableCell align="center">액션</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      {filteredReports.length === 0 ? '보고서가 없습니다.' : '현재 페이지에 보고서가 없습니다.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedReports.map((report) => (
                  <TableRow
                    key={report.id}
                    hover
                    selected={selectedReport?.id === report.id}
                    onClick={() => handleReportSelect(report)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {report.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getReportTypeLabel(report.type)}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getReportStatusLabel(report.status)}
                        size="small"
                        color={getReportStatusColor(report.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(report.created_date)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Tooltip title="보기">
                          <IconButton
                            size="small"
                            onClick={(e) => handleReportSelect(report)}
                            disabled={disabled}
                            sx={{ color: 'primary.main' }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="편집">
                          <IconButton
                            size="small"
                            onClick={(e) => handleReportEdit(e, report)}
                            disabled={disabled}
                            sx={{ color: 'warning.main' }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="다운로드">
                          <IconButton
                            size="small"
                            onClick={(e) => handleReportDownload(e, report)}
                            disabled={disabled}
                            sx={{ color: 'info.main' }}
                          >
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="삭제">
                          <IconButton
                            size="small"
                            onClick={(e) => handleReportDelete(e, report)}
                            disabled={disabled}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 페이지네이션 */}
        {filteredReports.length > 0 && (
          <TablePagination
            component="div"
            count={filteredReports.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
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
