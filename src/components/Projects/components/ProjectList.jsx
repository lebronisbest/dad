import React from 'react';
import {
  Box,
  Grid,
  Typography,
  Skeleton,
  Alert,
  Button,
  Pagination,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Stack,
  Chip
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import ProjectCard from './ProjectCard';
import { PROJECT_PAGINATION } from '../../config/projectConfig';

const ProjectList = ({
  projects = [],
  isLoading = false,
  error = null,
  selectedProjects = [],
  onProjectSelect,
  onProjectEdit,
  onProjectDelete,
  onProjectBackup,
  onProjectMoreActions,
  onRefresh,
  disabled = false,
  showActions = true,
  viewMode = 'grid', // 'grid' | 'list'
  pagination = { page: 1, page_size: 20, total: 0 },
  onPageChange,
  onPageSizeChange,
  sortOptions = [],
  currentSort = { field: 'created_date', direction: 'desc' },
  onSortChange
}) => {
  const handleRefresh = () => {
    if (onRefresh && !disabled) {
      onRefresh();
    }
  };

  const handlePageChange = (event, page) => {
    if (onPageChange && !disabled) {
      onPageChange(page);
    }
  };

  const handlePageSizeChange = (event) => {
    if (onPageSizeChange && !disabled) {
      onPageSizeChange(event.target.value);
    }
  };

  const handleSortChange = (event) => {
    if (onSortChange && !disabled) {
      const [field, direction] = event.target.value.split(':');
      onSortChange({ field, direction });
    }
  };

  const renderLoadingSkeletons = () => {
    const skeletons = [];
    const count = pagination.page_size || PROJECT_PAGINATION.DEFAULT_PAGE_SIZE;
    
    for (let i = 0; i < count; i++) {
      skeletons.push(
        <Grid item key={i} xs={12} sm={6} md={4} lg={3}>
          <Skeleton
            variant="rectangular"
            height={300}
            sx={{ borderRadius: 2 }}
          />
        </Grid>
      );
    }
    
    return skeletons;
  };

  const renderEmptyState = () => (
    <Box sx={{ 
      textAlign: 'center', 
      py: 8,
      px: 2 
    }}>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
        프로젝트가 없습니다
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        새로운 프로젝트를 생성하거나 검색 조건을 변경해보세요.
      </Typography>
      <Button
        variant="outlined"
        onClick={handleRefresh}
        disabled={disabled}
        startIcon={<RefreshIcon />}
      >
        새로고침
      </Button>
    </Box>
  );

  const renderErrorState = () => (
    <Box sx={{ py: 2 }}>
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
        {error || '프로젝트 목록을 불러오는 중 오류가 발생했습니다.'}
      </Alert>
    </Box>
  );

  const renderProjectCards = () => {
    if (viewMode === 'list') {
      // 리스트 뷰 (향후 구현)
      return (
        <Grid container spacing={2}>
          {projects.map((project) => (
            <Grid item key={project.id} xs={12}>
              <ProjectCard
                project={project}
                isSelected={selectedProjects.includes(project.id)}
                onSelect={onProjectSelect}
                onEdit={onProjectEdit}
                onDelete={onProjectDelete}
                onBackup={onProjectBackup}
                onMoreActions={onProjectMoreActions}
                disabled={disabled}
                showActions={showActions}
              />
            </Grid>
          ))}
        </Grid>
      );
    }

    // 그리드 뷰 (기본)
    return (
      <Grid container spacing={2}>
        {projects.map((project) => (
          <Grid item key={project.id} xs={12} sm={6} md={4} lg={3}>
            <ProjectCard
              project={project}
              isSelected={selectedProjects.includes(project.id)}
              onSelect={onProjectSelect}
              onEdit={onProjectEdit}
              onDelete={onProjectDelete}
              onBackup={onProjectBackup}
              onMoreActions={onProjectMoreActions}
              disabled={disabled}
              showActions={showActions}
            />
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderPagination = () => {
    if (pagination.total <= pagination.page_size) {
      return null;
    }

    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        gap: 2,
        py: 3 
      }}>
        <Pagination
          count={Math.ceil(pagination.total / pagination.page_size)}
          page={pagination.page}
          onChange={handlePageChange}
          disabled={disabled}
          showFirstButton
          showLastButton
          size="large"
        />
        
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>페이지 크기</InputLabel>
          <Select
            value={pagination.page_size}
            onChange={handlePageSizeChange}
            disabled={disabled}
            label="페이지 크기"
          >
            {PROJECT_PAGINATION.PAGE_SIZE_OPTIONS.map((size) => (
              <MenuItem key={size} value={size}>
                {size}개
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    );
  };

  const renderSortControls = () => {
    if (!sortOptions.length) {
      return null;
    }

    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2,
        p: 2,
        backgroundColor: 'background.paper',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            정렬:
          </Typography>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select
              value={`${currentSort.field}:${currentSort.direction}`}
              onChange={handleSortChange}
              disabled={disabled}
            >
              {sortOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            총 {pagination.total}개 프로젝트
          </Typography>
          {selectedProjects.length > 0 && (
            <Chip
              label={`${selectedProjects.length}개 선택됨`}
              color="primary"
              variant="outlined"
              size="small"
            />
          )}
        </Box>
      </Box>
    );
  };

  if (isLoading && projects.length === 0) {
    return (
      <Box>
        {renderSortControls()}
        <Grid container spacing={2}>
          {renderLoadingSkeletons()}
        </Grid>
      </Box>
    );
  }

  if (error && projects.length === 0) {
    return (
      <Box>
        {renderSortControls()}
        {renderErrorState()}
      </Box>
    );
  }

  if (projects.length === 0) {
    return (
      <Box>
        {renderSortControls()}
        {renderEmptyState()}
      </Box>
    );
  }

  return (
    <Box>
      {renderSortControls()}
      
      {renderProjectCards()}
      
      {renderPagination()}
    </Box>
  );
};

export default ProjectList;
