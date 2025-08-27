import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Skeleton,
  Divider,
  Grid,
  LinearProgress
} from '@mui/material';
import {
  Backup as BackupIcon,
  RestorePage as RestoreIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

const BackupPanel = ({
  backups = [],
  isLoading = false,
  error = null,
  selectedBackup = null,
  isCreatingBackup = false,
  isRestoringBackup = false,
  createBackupError = null,
  restoreBackupError = null,
  onBackupCreate,
  onBackupRestore,
  onBackupDelete,
  onBackupDownload,
  onBackupSelect,
  disabled = false
}) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [backupDescription, setBackupDescription] = useState('');
  const [backupToDelete, setBackupToDelete] = useState(null);
  const [backupToRestore, setBackupToRestore] = useState(null);

  const handleCreateBackup = () => {
    if (onBackupCreate && !disabled) {
      onBackupCreate(backupDescription);
      setBackupDescription('');
      setIsCreateDialogOpen(false);
    }
  };

  const handleRestoreBackup = () => {
    if (onBackupRestore && backupToRestore && !disabled) {
      onBackupRestore(backupToRestore.id);
      setBackupToRestore(null);
      setIsRestoreDialogOpen(false);
    }
  };

  const handleDeleteBackup = () => {
    if (onBackupDelete && backupToDelete && !disabled) {
      onBackupDelete(backupToDelete.id);
      setBackupToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleBackupSelect = (backup) => {
    if (onBackupSelect && !disabled) {
      onBackupSelect(backup);
    }
  };

  const handleBackupDownload = (backup) => {
    if (onBackupDownload && !disabled) {
      onBackupDownload(backup);
    }
  };

  const openCreateDialog = () => {
    setIsCreateDialogOpen(true);
  };

  const openRestoreDialog = (backup) => {
    setBackupToRestore(backup);
    setIsRestoreDialogOpen(true);
  };

  const openDeleteDialog = (backup) => {
    setBackupToDelete(backup);
    setIsDeleteDialogOpen(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
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

  const getBackupStatusColor = (backup) => {
    // 백업이 최신이면 success, 오래된 백업이면 warning
    const backupDate = new Date(backup.backup_date);
    const now = new Date();
    const daysDiff = (now - backupDate) / (1000 * 60 * 60 * 24);
    
    if (daysDiff <= 1) return 'success';
    if (daysDiff <= 7) return 'warning';
    return 'default';
  };

  if (isLoading) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Skeleton variant="text" width="40%" height={32} />
            <Skeleton variant="rectangular" height={200} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          {/* 헤더 */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <BackupIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" component="h3" sx={{ flexGrow: 1 }}>
              백업 및 복원
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreateDialog}
              disabled={disabled || isCreatingBackup}
              size="small"
            >
              새 백업
            </Button>
          </Box>

          {/* 에러 표시 */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {createBackupError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              백업 생성 오류: {createBackupError}
            </Alert>
          )}

          {restoreBackupError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              백업 복원 오류: {restoreBackupError}
            </Alert>
          )}

          {/* 백업 진행 상태 */}
          {isCreatingBackup && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ScheduleIcon sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="body2" color="text.secondary">
                  백업 생성 중...
                </Typography>
              </Box>
              <LinearProgress color="info" />
            </Box>
          )}

          {isRestoringBackup && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ScheduleIcon sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="body2" color="text.secondary">
                  백업 복원 중... (잠시만 기다려주세요)
                </Typography>
              </Box>
              <LinearProgress color="warning" />
            </Box>
          )}

          {/* 백업 목록 */}
          {backups.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <InfoIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                백업이 없습니다
              </Typography>
              <Typography variant="body2" color="text.secondary">
                첫 번째 백업을 생성해보세요.
              </Typography>
            </Box>
          ) : (
            <List>
              {backups.map((backup, index) => (
                <React.Fragment key={backup.id}>
                  <ListItem
                    button
                    selected={selectedBackup?.id === backup.id}
                    onClick={() => handleBackupSelect(backup)}
                    disabled={disabled}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" fontWeight={500}>
                            {backup.filename}
                          </Typography>
                          <Chip
                            label={getBackupStatusColor(backup) === 'success' ? '최신' : 
                                   getBackupStatusColor(backup) === 'warning' ? '보통' : '오래됨'}
                            size="small"
                            color={getBackupStatusColor(backup)}
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {backup.description || '설명 없음'}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(backup.backup_date)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatFileSize(backup.size)}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="복원">
                          <IconButton
                            edge="end"
                            onClick={() => openRestoreDialog(backup)}
                            disabled={disabled || isRestoringBackup}
                            color="warning"
                            size="small"
                          >
                            <RestoreIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="다운로드">
                          <IconButton
                            edge="end"
                            onClick={() => handleBackupDownload(backup)}
                            disabled={disabled}
                            color="info"
                            size="small"
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="삭제">
                          <IconButton
                            edge="end"
                            onClick={() => openDeleteDialog(backup)}
                            disabled={disabled}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < backups.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}

          {/* 백업 통계 */}
          {backups.length > 0 && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                백업 통계
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box>
                    <Typography variant="h6" color="primary">
                      {backups.length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      총 백업 수
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box>
                    <Typography variant="h6" color="success.main">
                      {backups.filter(b => getBackupStatusColor(b) === 'success').length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      최신 백업
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box>
                    <Typography variant="h6" color="warning.main">
                      {backups.filter(b => getBackupStatusColor(b) === 'warning').length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      보통 백업
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box>
                    <Typography variant="h6" color="text.secondary">
                      {formatFileSize(backups.reduce((sum, b) => sum + b.size, 0))}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      총 용량
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 백업 생성 다이얼로그 */}
      <Dialog open={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>새 백업 생성</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="백업 설명 (선택사항)"
            fullWidth
            variant="outlined"
            value={backupDescription}
            onChange={(e) => setBackupDescription(e.target.value)}
            placeholder="예: 일일 백업, 주요 변경사항 백업 등"
            disabled={disabled}
          />
          <Alert severity="info" sx={{ mt: 2 }}>
            백업에는 프로젝트의 모든 데이터와 설정이 포함됩니다.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreateDialogOpen(false)} disabled={disabled}>
            취소
          </Button>
          <Button 
            onClick={handleCreateBackup} 
            variant="contained" 
            disabled={disabled || isCreatingBackup}
            startIcon={<BackupIcon />}
          >
            백업 생성
          </Button>
        </DialogActions>
      </Dialog>

      {/* 백업 복원 다이얼로그 */}
      <Dialog open={isRestoreDialogOpen} onClose={() => setIsRestoreDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>백업 복원</DialogTitle>
        <DialogContent>
          {backupToRestore && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                다음 백업을 복원하시겠습니까?
              </Typography>
              <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {backupToRestore.filename}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {backupToRestore.description || '설명 없음'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(backupToRestore.backup_date)} • {formatFileSize(backupToRestore.size)}
                </Typography>
              </Box>
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>주의:</strong> 현재 프로젝트 데이터가 백업 데이터로 완전히 교체됩니다.
                  이 작업은 되돌릴 수 없습니다.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsRestoreDialogOpen(false)} disabled={disabled}>
            취소
          </Button>
          <Button 
            onClick={handleRestoreBackup} 
            variant="contained" 
            color="warning"
            disabled={disabled || isRestoringBackup}
            startIcon={<RestoreIcon />}
          >
            백업 복원
          </Button>
        </DialogActions>
      </Dialog>

      {/* 백업 삭제 다이얼로그 */}
      <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>백업 삭제</DialogTitle>
        <DialogContent>
          {backupToDelete && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                다음 백업을 삭제하시겠습니까?
              </Typography>
              <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {backupToDelete.filename}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {backupToDelete.description || '설명 없음'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(backupToDelete.backup_date)} • {formatFileSize(backupToDelete.size)}
                </Typography>
              </Box>
              <Alert severity="error" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>경고:</strong> 이 백업은 영구적으로 삭제되며 복구할 수 없습니다.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)} disabled={disabled}>
            취소
          </Button>
          <Button 
            onClick={handleDeleteBackup} 
            variant="contained" 
            color="error"
            disabled={disabled}
            startIcon={<DeleteIcon />}
          >
            백업 삭제
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BackupPanel;
