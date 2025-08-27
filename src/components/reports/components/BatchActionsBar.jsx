import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Divider,
  Grid,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Share as ShareIcon,
  Print as PrintIcon,
  Archive as ArchiveIcon,
  RestorePage as RestoreIcon,
  Clear as ClearIcon
} from '@mui/icons-material';

const BatchActionsBar = ({
  selectedReports = [],
  totalReports = 0,
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = React.useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = React.useState(false);
  const [newStatus, setNewStatus] = React.useState('');
  const [archiveReason, setArchiveReason] = React.useState('');

  const handleBatchDownload = () => {
    if (onBatchDownload && !disabled) {
      onBatchDownload(selectedReports);
    }
  };

  const handleBatchDelete = () => {
    if (onBatchDelete && !disabled) {
      onBatchDelete(selectedReports);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleBatchStatusChange = () => {
    if (onBatchStatusChange && newStatus && !disabled) {
      onBatchStatusChange(selectedReports, newStatus);
      setIsStatusDialogOpen(false);
      setNewStatus('');
    }
  };

  const handleBatchArchive = () => {
    if (onBatchArchive && archiveReason && !disabled) {
      onBatchArchive(selectedReports, archiveReason);
      setIsArchiveDialogOpen(false);
      setArchiveReason('');
    }
  };

  const handleBatchRestore = () => {
    if (onBatchRestore && !disabled) {
      onBatchRestore(selectedReports);
    }
  };

  const handleBatchShare = () => {
    if (onBatchShare && !disabled) {
      onBatchShare(selectedReports);
    }
  };

  const handleBatchPrint = () => {
    if (onBatchPrint && !disabled) {
      onBatchPrint(selectedReports);
    }
  };

  const handleClearSelection = () => {
    if (onClearSelection && !disabled) {
      onClearSelection();
    }
  };

  const openDeleteDialog = () => {
    setIsDeleteDialogOpen(true);
  };

  const openStatusDialog = () => {
    setIsStatusDialogOpen(true);
  };

  const openArchiveDialog = () => {
    setIsArchiveDialogOpen(true);
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      'draft': '초안',
      'completed': '완료',
      'submitted': '제출됨',
      'approved': '승인됨',
      'rejected': '반려됨',
      'archived': '보관됨'
    };
    return statusLabels[status] || status;
  };

  // 선택된 보고서가 없으면 렌더링하지 않음
  if (selectedReports.length === 0) {
    return null;
  }

  return (
    <>
      <Card sx={{ mb: 3, border: '2px solid', borderColor: 'primary.main' }}>
        <CardContent>
          {/* 헤더 */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6" component="h3" color="primary" sx={{ fontWeight: 600 }}>
                일괄 액션
              </Typography>
              <Chip
                label={`${selectedReports.length}개 선택됨`}
                color="primary"
                variant="outlined"
                size="small"
              />
              <Typography variant="body2" color="text.secondary">
                (전체 {totalReports}개 중)
              </Typography>
            </Box>
            <Tooltip title="선택 해제">
              <IconButton
                onClick={handleClearSelection}
                disabled={disabled}
                color="primary"
                size="small"
              >
                <ClearIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* 경고 메시지 */}
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              선택된 {selectedReports.length}개의 보고서에 대해 일괄 작업을 수행할 수 있습니다.
            </Typography>
          </Alert>

          {/* 액션 버튼들 */}
          <Grid container spacing={2}>
            {/* 기본 액션 */}
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  기본 액션
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Tooltip title="일괄 다운로드">
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={handleBatchDownload}
                      disabled={disabled}
                      size="small"
                      color="info"
                    >
                      다운로드
                    </Button>
                  </Tooltip>

                  <Tooltip title="일괄 보기">
                    <Button
                      variant="outlined"
                      startIcon={<ViewIcon />}
                      onClick={() => console.log('일괄 보기')}
                      disabled={disabled}
                      size="small"
                      color="primary"
                    >
                      보기
                    </Button>
                  </Tooltip>

                  <Tooltip title="일괄 공유">
                    <Button
                      variant="outlined"
                      startIcon={<ShareIcon />}
                      onClick={handleBatchShare}
                      disabled={disabled}
                      size="small"
                      color="success"
                    >
                      공유
                    </Button>
                  </Tooltip>

                  <Tooltip title="일괄 인쇄">
                    <Button
                      variant="outlined"
                      startIcon={<PrintIcon />}
                      onClick={handleBatchPrint}
                      disabled={disabled}
                      size="small"
                      color="default"
                    >
                      인쇄
                    </Button>
                  </Tooltip>
                </Box>
              </Box>
            </Grid>

            {/* 관리 액션 */}
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  관리 액션
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Tooltip title="상태 변경">
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={openStatusDialog}
                      disabled={disabled}
                      size="small"
                      color="warning"
                    >
                      상태 변경
                    </Button>
                  </Tooltip>

                  <Tooltip title="보관">
                    <Button
                      variant="outlined"
                      startIcon={<ArchiveIcon />}
                      onClick={openArchiveDialog}
                      disabled={disabled}
                      size="small"
                      color="default"
                    >
                      보관
                    </Button>
                  </Tooltip>

                  <Tooltip title="복원">
                    <Button
                      variant="outlined"
                      startIcon={<RestoreIcon />}
                      onClick={handleBatchRestore}
                      disabled={disabled}
                      size="small"
                      color="info"
                    >
                      복원
                    </Button>
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
                    onClick={openDeleteDialog}
                    disabled={disabled}
                    size="small"
                    color="error"
                    sx={{ borderColor: 'error.main', color: 'error.main' }}
                  >
                    일괄 삭제
                  </Button>
                </Box>
                <Alert severity="warning" sx={{ mt: 1, fontSize: '0.75rem' }}>
                  일괄 삭제는 되돌릴 수 없습니다. 신중하게 진행해주세요.
                </Alert>
              </Box>
            </Grid>
          </Grid>

          {/* 선택된 보고서 요약 */}
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              선택된 보고서 요약
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {selectedReports.slice(0, 5).map((report, index) => (
                <Chip
                  key={index}
                  label={report.title.length > 20 ? `${report.title.substring(0, 20)}...` : report.title}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              ))}
              {selectedReports.length > 5 && (
                <Chip
                  label={`+${selectedReports.length - 5}개 더`}
                  size="small"
                  variant="outlined"
                  color="default"
                />
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>일괄 삭제 확인</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            선택된 {selectedReports.length}개의 보고서를 삭제하시겠습니까?
          </Typography>
          <Alert severity="error">
            <Typography variant="body2">
              <strong>경고:</strong> 이 작업은 되돌릴 수 없으며, 모든 관련 데이터가 영구적으로 삭제됩니다.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)} disabled={disabled}>
            취소
          </Button>
          <Button
            onClick={handleBatchDelete}
            variant="contained"
            color="error"
            disabled={disabled}
            startIcon={<DeleteIcon />}
          >
            삭제
          </Button>
        </DialogActions>
      </Dialog>

      {/* 상태 변경 다이얼로그 */}
      <Dialog open={isStatusDialogOpen} onClose={() => setIsStatusDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>상태 일괄 변경</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            선택된 {selectedReports.length}개 보고서의 상태를 변경합니다.
          </Typography>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>새로운 상태</InputLabel>
            <Select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              disabled={disabled}
            >
              <MenuItem value="draft">초안</MenuItem>
              <MenuItem value="completed">완료</MenuItem>
              <MenuItem value="submitted">제출됨</MenuItem>
              <MenuItem value="approved">승인됨</MenuItem>
              <MenuItem value="rejected">반려됨</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsStatusDialogOpen(false)} disabled={disabled}>
            취소
          </Button>
          <Button
            onClick={handleBatchStatusChange}
            variant="contained"
            disabled={disabled || !newStatus}
            startIcon={<EditIcon />}
          >
            상태 변경
          </Button>
        </DialogActions>
      </Dialog>

      {/* 보관 다이얼로그 */}
      <Dialog open={isArchiveDialogOpen} onClose={() => setIsArchiveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>보고서 보관</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            선택된 {selectedReports.length}개 보고서를 보관합니다.
          </Typography>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>보관 사유</InputLabel>
            <Select
              value={archiveReason}
              onChange={(e) => setArchiveReason(e.target.value)}
              disabled={disabled}
            >
              <MenuItem value="completed">완료된 프로젝트</MenuItem>
              <MenuItem value="old">오래된 보고서</MenuItem>
              <MenuItem value="reference">참고용 보관</MenuItem>
              <MenuItem value="other">기타</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsArchiveDialogOpen(false)} disabled={disabled}>
            취소
          </Button>
          <Button
            onClick={handleBatchArchive}
            variant="contained"
            disabled={disabled || !archiveReason}
            startIcon={<ArchiveIcon />}
          >
            보관
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BatchActionsBar;
