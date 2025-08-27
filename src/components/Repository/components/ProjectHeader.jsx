import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Skeleton,
  Alert,
  Grid,
  Divider
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import {
  PROJECT_TYPE_LABELS,
  PROJECT_STATUS_LABELS,
  PROJECT_PRIORITY_LABELS,
  PROJECT_RISK_LABELS,
  PROJECT_TYPE_COLORS,
  PROJECT_STATUS_COLORS,
  PROJECT_PRIORITY_COLORS,
  PROJECT_RISK_COLORS
} from '../../../config/projectConfig';

const ProjectHeader = ({
  project,
  isLoading = false,
  error = null,
  isEditing = false,
  hasUnsavedChanges = false,
  onEdit,
  onSave,
  onCancel,
  onRefresh,
  disabled = false
}) => {
  const handleEdit = () => {
    if (onEdit && !disabled) {
      onEdit();
    }
  };

  const handleSave = () => {
    if (onSave && !disabled) {
      onSave();
    }
  };

  const handleCancel = () => {
    if (onCancel && !disabled) {
      onCancel();
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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Skeleton variant="text" width="60%" height={40} />
                <Skeleton variant="text" width="40%" height={24} />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Skeleton variant="rectangular" width={80} height={32} />
                  <Skeleton variant="rectangular" width={80} height={32} />
                  <Skeleton variant="rectangular" width={80} height={32} />
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Skeleton variant="rectangular" width={80} height={36} />
                <Skeleton variant="rectangular" width={80} height={36} />
              </Box>
            </Grid>
          </Grid>
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

  if (!project) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" color="text.secondary">
            프로젝트 정보를 불러올 수 없습니다.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Grid container spacing={2}>
          {/* 프로젝트 기본 정보 */}
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* 제목 및 설명 */}
              <Box>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
                  {project.name}
                </Typography>
                {project.description && (
                  <Typography variant="body1" color="text.secondary">
                    {project.description}
                  </Typography>
                )}
              </Box>

              {/* 태그들 */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip
                  label={PROJECT_TYPE_LABELS[project.type] || project.type}
                  size="small"
                  sx={{
                    backgroundColor: PROJECT_TYPE_COLORS[project.type] || 'default',
                    color: 'white',
                    fontWeight: 500
                  }}
                />
                
                <Chip
                  label={PROJECT_STATUS_LABELS[project.status] || project.status}
                  size="small"
                  sx={{
                    backgroundColor: PROJECT_STATUS_COLORS[project.status] || 'default',
                    color: 'white',
                    fontWeight: 500
                  }}
                />
                
                <Chip
                  label={PROJECT_PRIORITY_LABELS[project.priority] || project.priority}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: PROJECT_PRIORITY_COLORS[project.priority] || 'default',
                    color: PROJECT_PRIORITY_COLORS[project.priority] || 'default',
                    fontWeight: 500
                  }}
                />
                
                <Chip
                  label={PROJECT_RISK_LABELS[project.risk] || project.risk}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: PROJECT_RISK_COLORS[project.risk] || 'default',
                    color: PROJECT_RISK_COLORS[project.risk] || 'default',
                    fontWeight: 500
                  }}
                />
              </Box>

              {/* 진행률 */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    진행률
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {project.progress}%
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ flexGrow: 1, bgcolor: 'grey.200', borderRadius: 1, height: 8 }}>
                    <Box
                      sx={{
                        width: `${project.progress}%`,
                        height: '100%',
                        bgcolor: project.progress >= 80 ? 'success.main' : 
                                project.progress >= 50 ? 'warning.main' : 'error.main',
                        borderRadius: 1,
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </Box>
                  <TrendingUpIcon fontSize="small" color="action" />
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* 프로젝트 메타 정보 */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* 메타 정보 */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {project.location && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {project.location}
                    </Typography>
                  </Box>
                )}
                
                {project.client && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusinessIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {project.client}
                    </Typography>
                  </Box>
                )}
                
                {project.manager && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      {project.manager}
                    </Typography>
                  </Box>
                )}
                
                {project.start_date && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      시작: {formatDate(project.start_date)}
                    </Typography>
                  </Box>
                )}
                
                {project.end_date && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      종료: {formatDate(project.end_date)}
                    </Typography>
                  </Box>
                )}
                
                {project.budget && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      예산: {project.budget.toLocaleString()}원
                    </Typography>
                  </Box>
                )}
              </Box>

              <Divider />

              {/* 액션 버튼들 */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {isEditing ? (
                  <>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSave}
                      disabled={disabled || !hasUnsavedChanges}
                      fullWidth
                    >
                      저장
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={handleCancel}
                      disabled={disabled}
                      fullWidth
                    >
                      취소
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={handleEdit}
                    disabled={disabled}
                    fullWidth
                  >
                    편집
                  </Button>
                )}
                
                <Tooltip title="새로고침">
                  <IconButton
                    onClick={handleRefresh}
                    disabled={disabled}
                    sx={{ alignSelf: 'center' }}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ProjectHeader;
