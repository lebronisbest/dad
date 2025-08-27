import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Grid,
  Chip,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Backup as BackupIcon,
  RestorePage as RestoreIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Share as ShareIcon,
  Print as PrintIcon,
  Visibility as ViewIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

const ActionsBar = ({
  project,
  selectedReport = null,
  isEditing = false,
  hasUnsavedChanges = false,
  onNewReport,
  onEditProject,
  onDeleteProject,
  onBackupProject,
  onRestoreProject,
  onExportProject,
  onImportProject,
  onShareProject,
  onPrintProject,
  onViewProject,
  onProjectSettings,
  disabled = false,
  showReportActions = true,
  showProjectActions = true
}) => {
  const handleNewReport = () => {
    if (onNewReport && !disabled) {
      onNewReport();
    }
  };

  const handleEditProject = () => {
    if (onEditProject && !disabled) {
      onEditProject();
    }
  };

  const handleDeleteProject = () => {
    if (onDeleteProject && !disabled) {
      onDeleteProject();
    }
  };

  const handleBackupProject = () => {
    if (onBackupProject && !disabled) {
      onBackupProject();
    }
  };

  const handleRestoreProject = () => {
    if (onRestoreProject && !disabled) {
      onRestoreProject();
    }
  };

  const handleExportProject = () => {
    if (onExportProject && !disabled) {
      onExportProject();
    }
  };

  const handleImportProject = () => {
    if (onImportProject && !disabled) {
      onImportProject();
    }
  };

  const handleShareProject = () => {
    if (onShareProject && !disabled) {
      onShareProject();
    }
  };

  const handlePrintProject = () => {
    if (onPrintProject && !disabled) {
      onPrintProject();
    }
  };

  const handleViewProject = () => {
    if (onViewProject && !disabled) {
      onViewProject();
    }
  };

  const handleProjectSettings = () => {
    if (onProjectSettings && !disabled) {
      onProjectSettings();
    }
  };

  if (!project) {
    return null;
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        {/* 헤더 */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h3" sx={{ flexGrow: 1 }}>
            프로젝트 액션
          </Typography>
          {isEditing && (
            <Chip
              label="편집 모드"
              color="warning"
              variant="outlined"
              size="small"
            />
          )}
          {hasUnsavedChanges && (
            <Chip
              label="저장되지 않은 변경사항"
              color="error"
              variant="outlined"
              size="small"
              sx={{ ml: 1 }}
            />
          )}
        </Box>

        {/* 보고서 관련 액션 */}
        {showReportActions && (
          <>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                보고서 관리
              </Typography>
              <Grid container spacing={1}>
                <Grid item>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleNewReport}
                    disabled={disabled}
                    size="small"
                  >
                    새 보고서
                  </Button>
                </Grid>
                {selectedReport && (
                  <Grid item>
                    <Chip
                      label={`선택됨: ${selectedReport.title}`}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                )}
              </Grid>
            </Box>
            <Divider sx={{ my: 2 }} />
          </>
        )}

        {/* 프로젝트 관련 액션 */}
        {showProjectActions && (
          <Grid container spacing={2}>
            {/* 기본 액션 */}
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  기본 액션
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Tooltip title="프로젝트 편집">
                    <IconButton
                      onClick={handleEditProject}
                      disabled={disabled}
                      color="primary"
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="프로젝트 보기">
                    <IconButton
                      onClick={handleViewProject}
                      disabled={disabled}
                      color="info"
                      size="small"
                    >
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="프로젝트 설정">
                    <IconButton
                      onClick={handleProjectSettings}
                      disabled={disabled}
                      color="default"
                      size="small"
                    >
                      <SettingsIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="프로젝트 공유">
                    <IconButton
                      onClick={handleShareProject}
                      disabled={disabled}
                      color="success"
                      size="small"
                    >
                      <ShareIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="프로젝트 인쇄">
                    <IconButton
                      onClick={handlePrintProject}
                      disabled={disabled}
                      color="default"
                      size="small"
                    >
                      <PrintIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Grid>

            {/* 백업 및 복원 */}
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  백업 및 복원
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Tooltip title="프로젝트 백업">
                    <IconButton
                      onClick={handleBackupProject}
                      disabled={disabled}
                      color="info"
                      size="small"
                    >
                      <BackupIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="백업 복원">
                    <IconButton
                      onClick={handleRestoreProject}
                      disabled={disabled}
                      color="warning"
                      size="small"
                    >
                      <RestoreIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="프로젝트 내보내기">
                    <IconButton
                      onClick={handleExportProject}
                      disabled={disabled}
                      color="success"
                      size="small"
                    >
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="프로젝트 가져오기">
                    <IconButton
                      onClick={handleImportProject}
                      disabled={disabled}
                      color="default"
                      size="small"
                    >
                      <UploadIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Grid>

            {/* 위험한 액션 */}
            <Grid item xs={12}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  위험한 액션
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<DeleteIcon />}
                    onClick={handleDeleteProject}
                    disabled={disabled}
                    size="small"
                    color="error"
                    sx={{ borderColor: 'error.main', color: 'error.main' }}
                  >
                    프로젝트 삭제
                  </Button>
                </Box>
                <Alert severity="warning" sx={{ mt: 1, fontSize: '0.75rem' }}>
                  프로젝트 삭제는 되돌릴 수 없습니다. 신중하게 진행해주세요.
                </Alert>
              </Box>
            </Grid>
          </Grid>
        )}

        {/* 프로젝트 상태 정보 */}
        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            프로젝트 정보
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip
              label={`ID: ${project.id}`}
              size="small"
              variant="outlined"
            />
            <Chip
              label={`상태: ${project.status}`}
              size="small"
              variant="outlined"
              color="primary"
            />
            <Chip
              label={`진행률: ${project.progress}%`}
              size="small"
              variant="outlined"
              color={project.progress >= 80 ? 'success' : project.progress >= 50 ? 'warning' : 'error'}
            />
            {project.reports && (
              <Chip
                label={`보고서: ${project.reports.length}개`}
                size="small"
                variant="outlined"
                color="info"
              />
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ActionsBar;
