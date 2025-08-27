import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Chip,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  ViewModule as GridIcon,
  ViewList as ListIcon
} from '@mui/icons-material';

const GalleryHeader = ({
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
  sortBy,
  sortOrder,
  onSortChange,
  viewMode,
  onViewModeChange,
  totalImages,
  filteredCount
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchClear = () => {
    onSearchChange('');
  };

  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handleSortChange = (key, value) => {
    onSortChange(key, value);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      {/* 상단 행: 검색 및 기본 액션 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        {/* 검색바 */}
        <Box sx={{ flexGrow: 1, maxWidth: 400 }}>
          <TextField
            fullWidth
            placeholder="이미지 검색..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={handleSearchClear}
                    edge="end"
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
            size="small"
          />
        </Box>

        {/* 우측 액션 버튼들 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* 뷰 모드 전환 */}
          <Box sx={{ display: 'flex', border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Tooltip title="그리드 보기">
              <IconButton
                size="small"
                onClick={() => onViewModeChange('grid')}
                sx={{
                  backgroundColor: viewMode === 'grid' ? 'primary.main' : 'transparent',
                  color: viewMode === 'grid' ? 'primary.contrastText' : 'text.primary',
                  borderRadius: 0,
                  '&:first-of-type': { borderTopLeftRadius: 4, borderBottomLeftRadius: 4 },
                  '&:hover': {
                    backgroundColor: viewMode === 'grid' ? 'primary.dark' : 'action.hover'
                  }
                }}
              >
                <GridIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem />
            <Tooltip title="리스트 보기">
              <IconButton
                size="small"
                onClick={() => onViewModeChange('list')}
                sx={{
                  backgroundColor: viewMode === 'list' ? 'primary.main' : 'transparent',
                  color: viewMode === 'list' ? 'primary.contrastText' : 'text.primary',
                  borderRadius: 0,
                  '&:last-of-type': { borderTopRightRadius: 4, borderBottomRightRadius: 4 },
                  '&:hover': {
                    backgroundColor: viewMode === 'list' ? 'primary.dark' : 'action.hover'
                  }
                }}
              >
                <ListIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* 필터 토글 버튼 */}
          <Tooltip title="필터 표시/숨김">
            <IconButton
              onClick={toggleFilters}
              sx={{
                backgroundColor: showFilters ? 'primary.main' : 'transparent',
                color: showFilters ? 'primary.contrastText' : 'text.primary',
                '&:hover': {
                  backgroundColor: showFilters ? 'primary.dark' : 'action.hover'
                }
              }}
            >
              <FilterIcon />
            </IconButton>
          </Tooltip>

          {/* 정렬 드롭다운 */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>정렬</InputLabel>
            <Select
              value={`${sortBy}-${sortOrder}`}
              label="정렬"
              onChange={(e) => {
                const [key, order] = e.target.value.split('-');
                handleSortChange(key, order);
              }}
            >
              <MenuItem value="name-asc">이름 (오름차순)</MenuItem>
              <MenuItem value="name-desc">이름 (내림차순)</MenuItem>
              <MenuItem value="date-asc">날짜 (오름차순)</MenuItem>
              <MenuItem value="date-desc">날짜 (내림차순)</MenuItem>
              <MenuItem value="size-asc">크기 (오름차순)</MenuItem>
              <MenuItem value="size-desc">크기 (내림차순)</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* 이미지 개수 표시 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Chip
          label={`전체: ${totalImages}개`}
          size="small"
          variant="outlined"
          color="primary"
        />
        {searchTerm || Object.values(filters).some(v => v && v !== 'all') ? (
          <Chip
            label={`검색 결과: ${filteredCount}개`}
            size="small"
            variant="outlined"
            color="secondary"
          />
        ) : null}
      </Box>

      {/* 필터 섹션 */}
      {showFilters && (
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* 파일 형식 필터 */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>파일 형식</InputLabel>
              <Select
                value={filters.format || 'all'}
                label="파일 형식"
                onChange={(e) => handleFilterChange('format', e.target.value)}
              >
                <MenuItem value="all">모든 형식</MenuItem>
                <MenuItem value=".jpg">JPG</MenuItem>
                <MenuItem value=".jpeg">JPEG</MenuItem>
                <MenuItem value=".png">PNG</MenuItem>
                <MenuItem value=".gif">GIF</MenuItem>
                <MenuItem value=".webp">WebP</MenuItem>
                <MenuItem value=".svg">SVG</MenuItem>
              </Select>
            </FormControl>

            {/* 크기 범위 필터 */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>크기 범위</InputLabel>
              <Select
                value={filters.sizeRange || 'all'}
                label="크기 범위"
                onChange={(e) => handleFilterChange('sizeRange', e.target.value)}
              >
                <MenuItem value="all">모든 크기</MenuItem>
                <MenuItem value="small">1MB 미만</MenuItem>
                <MenuItem value="medium">1MB - 5MB</MenuItem>
                <MenuItem value="large">5MB 이상</MenuItem>
              </Select>
            </FormControl>

            {/* 날짜 범위 필터 */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>날짜 범위</InputLabel>
              <Select
                value={filters.dateRange || 'all'}
                label="날짜 범위"
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              >
                <MenuItem value="all">모든 날짜</MenuItem>
                <MenuItem value="today">오늘</MenuItem>
                <MenuItem value="week">이번 주</MenuItem>
                <MenuItem value="month">이번 달</MenuItem>
                <MenuItem value="year">올해</MenuItem>
              </Select>
            </FormControl>

            {/* 필터 초기화 버튼 */}
            <Tooltip title="필터 초기화">
              <IconButton
                size="small"
                onClick={() => onFiltersChange({})}
                sx={{ color: 'error.main' }}
              >
                <ClearIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default GalleryHeader;
