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
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  ViewList as ListIcon
} from '@mui/icons-material';

const CalendarControls = ({
  filters = {},
  onFiltersChange,
  onClearFilters,
  onSearch,
  onAddEvent,
  onRefresh,
  onToggleListView,
  showListView = false,
  disabled = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleSearch = () => {
    onSearch?.(searchTerm);
  };

  const handleSearchClear = () => {
    setSearchTerm('');
    onSearch?.('');
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleAddEvent = () => {
    if (onAddEvent && !disabled) {
      onAddEvent();
    }
  };

  const handleRefresh = () => {
    if (onRefresh && !disabled) {
      onRefresh();
    }
  };

  const handleToggleListView = () => {
    if (onToggleListView && !disabled) {
      onToggleListView();
    }
  };

  const getEventTypeLabel = (type) => {
    const typeLabels = {
      'safety_inspection': '안전점검',
      'incident_report': '사고보고',
      'training': '교육',
      'meeting': '회의',
      'deadline': '마감일',
      'other': '기타'
    };
    return typeLabels[type] || type;
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

  const getStatusLabel = (status) => {
    const statusLabels = {
      'pending': '대기중',
      'in_progress': '진행중',
      'completed': '완료',
      'cancelled': '취소됨'
    };
    return statusLabels[status] || status;
  };

  // 활성 필터 개수 계산
  const activeFiltersCount = Object.values(filters).filter(value => 
    Array.isArray(value) ? value.length > 0 : value !== undefined && value !== '' && value !== null
  ).length;

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        {/* 헤더 */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterIcon color="primary" />
            <Typography variant="h6" component="h3">
              캘린더 컨트롤
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

        {/* 검색 및 빠른 액션 */}
        <Box sx={{ mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="일정 제목, 설명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                disabled={disabled}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  endAdornment: searchTerm && (
                    <IconButton
                      size="small"
                      onClick={handleSearchClear}
                      disabled={disabled}
                    >
                      <ClearIcon />
                    </IconButton>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Tooltip title="새 일정 추가">
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddEvent}
                    disabled={disabled}
                    size="small"
                  >
                    새 일정
                  </Button>
                </Tooltip>
                <Tooltip title="새로고침">
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={handleRefresh}
                    disabled={disabled}
                    size="small"
                  >
                    새로고침
                  </Button>
                </Tooltip>
                <Tooltip title={showListView ? '그리드 뷰' : '리스트 뷰'}>
                  <Button
                    variant={showListView ? "contained" : "outlined"}
                    startIcon={<ListIcon />}
                    onClick={handleToggleListView}
                    disabled={disabled}
                    size="small"
                  >
                    {showListView ? '그리드' : '리스트'}
                  </Button>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* 기본 필터 */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>이벤트 타입</InputLabel>
              <Select
                multiple
                value={localFilters.eventTypes || []}
                onChange={(e) => handleFilterChange('eventTypes', e.target.value)}
                disabled={disabled}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={getEventTypeLabel(value)} size="small" />
                    ))}
                  </Box>
                )}
              >
                <MenuItem value="safety_inspection">안전점검</MenuItem>
                <MenuItem value="incident_report">사고보고</MenuItem>
                <MenuItem value="training">교육</MenuItem>
                <MenuItem value="meeting">회의</MenuItem>
                <MenuItem value="deadline">마감일</MenuItem>
                <MenuItem value="other">기타</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>우선순위</InputLabel>
              <Select
                multiple
                value={localFilters.priorities || []}
                onChange={(e) => handleFilterChange('priorities', e.target.value)}
                disabled={disabled}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={getPriorityLabel(value)} size="small" />
                    ))}
                  </Box>
                )}
              >
                <MenuItem value="low">낮음</MenuItem>
                <MenuItem value="medium">보통</MenuItem>
                <MenuItem value="high">높음</MenuItem>
                <MenuItem value="critical">긴급</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>상태</InputLabel>
              <Select
                multiple
                value={localFilters.statuses || []}
                onChange={(e) => handleFilterChange('statuses', e.target.value)}
                disabled={disabled}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={getStatusLabel(value)} size="small" />
                    ))}
                  </Box>
                )}
              >
                <MenuItem value="pending">대기중</MenuItem>
                <MenuItem value="in_progress">진행중</MenuItem>
                <MenuItem value="completed">완료</MenuItem>
                <MenuItem value="cancelled">취소됨</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>프로젝트</InputLabel>
              <Select
                multiple
                value={localFilters.projects || []}
                onChange={(e) => handleFilterChange('projects', e.target.value)}
                disabled={disabled}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
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
                label="담당자"
                value={localFilters.assignees || []}
                onChange={(e) => handleFilterChange('assignees', e.target.value.split(',').map(s => s.trim()))}
                disabled={disabled}
                placeholder="쉼표로 구분"
                helperText="여러 명은 쉼표로 구분"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>기간 필터</InputLabel>
                <Select
                  value={localFilters.periodFilter || ''}
                  onChange={(e) => handleFilterChange('periodFilter', e.target.value)}
                  disabled={disabled}
                >
                  <MenuItem value="">전체 기간</MenuItem>
                  <MenuItem value="today">오늘</MenuItem>
                  <MenuItem value="tomorrow">내일</MenuItem>
                  <MenuItem value="this_week">이번 주</MenuItem>
                  <MenuItem value="next_week">다음 주</MenuItem>
                  <MenuItem value="this_month">이번 달</MenuItem>
                  <MenuItem value="next_month">다음 달</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={localFilters.showCompleted || false}
                    onChange={(e) => handleFilterChange('showCompleted', e.target.checked)}
                    disabled={disabled}
                  />
                }
                label="완료된 일정 표시"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={localFilters.showCancelled || false}
                    onChange={(e) => handleFilterChange('showCancelled', e.target.checked)}
                    disabled={disabled}
                  />
                }
                label="취소된 일정 표시"
              />
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
                if (!value || (Array.isArray(value) && value.length === 0)) return null;
                
                let label = '';
                if (Array.isArray(value)) {
                  switch (key) {
                    case 'eventTypes':
                      label = `타입: ${value.map(v => getEventTypeLabel(v)).join(', ')}`;
                      break;
                    case 'priorities':
                      label = `우선순위: ${value.map(v => getPriorityLabel(v)).join(', ')}`;
                      break;
                    case 'statuses':
                      label = `상태: ${value.map(v => getStatusLabel(v)).join(', ')}`;
                      break;
                    case 'projects':
                      label = `프로젝트: ${value.join(', ')}`;
                      break;
                    case 'assignees':
                      label = `담당자: ${value.join(', ')}`;
                      break;
                    default:
                      label = `${key}: ${value.join(', ')}`;
                  }
                } else {
                  switch (key) {
                    case 'periodFilter':
                      const periodLabels = {
                        'today': '오늘',
                        'tomorrow': '내일',
                        'this_week': '이번 주',
                        'next_week': '다음 주',
                        'this_month': '이번 달',
                        'next_month': '다음 달'
                      };
                      label = `기간: ${periodLabels[value] || value}`;
                      break;
                    case 'showCompleted':
                      label = `완료된 일정: ${value ? '표시' : '숨김'}`;
                      break;
                    case 'showCancelled':
                      label = `취소된 일정: ${value ? '표시' : '숨김'}`;
                      break;
                    default:
                      label = `${key}: ${value}`;
                  }
                }

                return (
                  <Chip
                    key={key}
                    label={label}
                    size="small"
                    variant="outlined"
                    color="primary"
                    onDelete={() => {
                      if (Array.isArray(value)) {
                        handleFilterChange(key, []);
                      } else {
                        handleFilterChange(key, '');
                      }
                    }}
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

export default CalendarControls;
