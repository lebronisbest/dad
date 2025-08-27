import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  Divider
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon
} from '@mui/icons-material';

const ReportFilters = ({
  filters = {},
  onFiltersChange,
  onClearFilters,
  onSearch,
  disabled = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

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

  const handleSearch = (searchTerm) => {
    onSearch?.(searchTerm);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
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

  const getPriorityLabel = (priority) => {
    const priorityLabels = {
      'low': '낮음',
      'medium': '보통',
      'high': '높음',
      'critical': '긴급'
    };
    return priorityLabels[priority] || priority;
  };

  // 활성 필터 개수 계산
  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== undefined && value !== '' && value !== null
  ).length;

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        {/* 헤더 */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterIcon color="primary" />
            <Typography variant="h6" component="h3">
              보고서 필터
            </Typography>
            {activeFiltersCount > 0 && (
              <Chip
                label={`${activeFiltersCount}개 활성`}
                color="primary"
                size="small"
                variant="outlined"
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title={isExpanded ? '필터 축소' : '필터 확장'}>
              <IconButton onClick={toggleExpanded} size="small">
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* 검색 필드 */}
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="보고서 제목, 내용으로 검색..."
            value={localFilters.searchTerm || ''}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch(e.target.value)}
            disabled={disabled}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              endAdornment: localFilters.searchTerm && (
                <IconButton
                  size="small"
                  onClick={() => handleFilterChange('searchTerm', '')}
                  disabled={disabled}
                >
                  <ClearIcon />
                </IconButton>
              )
            }}
          />
        </Box>

        {/* 기본 필터 */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
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

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>우선순위</InputLabel>
              <Select
                value={localFilters.priority || ''}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                disabled={disabled}
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="low">낮음</MenuItem>
                <MenuItem value="medium">보통</MenuItem>
                <MenuItem value="high">높음</MenuItem>
                <MenuItem value="critical">긴급</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>프로젝트</InputLabel>
              <Select
                value={localFilters.project || ''}
                onChange={(e) => handleFilterChange('project', e.target.value)}
                disabled={disabled}
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="서울역 고가도로 건설">서울역 고가도로 건설</MenuItem>
                <MenuItem value="부산항 컨테이너 터미널 확장">부산항 컨테이너 터미널 확장</MenuItem>
                <MenuItem value="대구 지하철 3호선 연장">대구 지하철 3호선 연장</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* 확장된 필터 */}
        <Collapse in={isExpanded}>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="작성자"
                value={localFilters.author || ''}
                onChange={(e) => handleFilterChange('author', e.target.value)}
                disabled={disabled}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
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

            <Grid item xs={12} sm={6} md={3}>
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

            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'end', height: '100%' }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    handleFilterChange('dateFrom', '');
                    handleFilterChange('dateTo', '');
                  }}
                  disabled={disabled}
                  fullWidth
                >
                  날짜 초기화
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Collapse>

        {/* 액션 버튼들 */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={handleClearFilters}
            disabled={disabled}
            size="small"
          >
            초기화
          </Button>
          <Button
            variant="contained"
            startIcon={<FilterIcon />}
            onClick={handleApplyFilters}
            disabled={disabled}
            size="small"
          >
            필터 적용
          </Button>
        </Box>

        {/* 활성 필터 표시 */}
        {activeFiltersCount > 0 && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              활성 필터:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.entries(filters).map(([key, value]) => {
                if (!value || value === '') return null;
                
                let label = '';
                switch (key) {
                  case 'type':
                    label = `타입: ${getReportTypeLabel(value)}`;
                    break;
                  case 'status':
                    label = `상태: ${getReportStatusLabel(value)}`;
                    break;
                  case 'priority':
                    label = `우선순위: ${getPriorityLabel(value)}`;
                    break;
                  case 'project':
                    label = `프로젝트: ${value}`;
                    break;
                  case 'author':
                    label = `작성자: ${value}`;
                    break;
                  case 'dateFrom':
                    label = `시작일: ${value}`;
                    break;
                  case 'dateTo':
                    label = `종료일: ${value}`;
                    break;
                  case 'searchTerm':
                    label = `검색: ${value}`;
                    break;
                  default:
                    label = `${key}: ${value}`;
                }

                return (
                  <Chip
                    key={key}
                    label={label}
                    size="small"
                    variant="outlined"
                    color="primary"
                    onDelete={() => handleFilterChange(key, '')}
                    disabled={disabled}
                  />
                );
              })}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportFilters;
