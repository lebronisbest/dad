import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Divider
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  OpenInNew as OpenInNewIcon,
  BugReport as BugReportIcon
} from '@mui/icons-material';

/**
 * Project TT 가이드라인: 3가지 복구 액션을 제공하는 에러 모달
 * - 다시 시도 / HTML로 열기 / 로그 보기
 */
function ErrorModal({ 
  open, 
  error, 
  onClose, 
  onRetry, 
  onOpenHTML, 
  onViewLogs,
  showDiagnostics = false,
  onToggleDiagnostics 
}) {
  if (!error) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ color: 'error.main' }}>
        🚨 오류가 발생했습니다
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" gutterBottom>
            {error.message || '알 수 없는 오류가 발생했습니다.'}
          </Typography>
          
          {error.details && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {error.details}
            </Typography>
          )}
        </Box>

        {/* Project TT 가이드라인: 사용자 진단 로그 토글 */}
        {error.diagnosticLogs && (
          <Box sx={{ mb: 2 }}>
            <Button
              variant="text"
              size="small"
              onClick={onToggleDiagnostics}
              startIcon={<BugReportIcon />}
            >
              {showDiagnostics ? '진단 로그 숨기기' : '진단 로그 보기'}
            </Button>
            
            {showDiagnostics && (
              <Box sx={{ mt: 1, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="caption" component="pre" sx={{ 
                  whiteSpace: 'pre-wrap', 
                  fontFamily: 'monospace',
                  fontSize: '0.75rem'
                }}>
                  {error.diagnosticLogs}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        <Divider sx={{ my: 2 }} />
        
        {/* Project TT 가이드라인: 다음 액션 안내 */}
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            아래 옵션 중 하나를 선택하여 문제를 해결해보세요:
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        {/* Project TT 가이드라인: 3가지 기본 복구 액션 */}
        <Button
          onClick={onRetry}
          variant="contained"
          startIcon={<RefreshIcon />}
          color="primary"
        >
          다시 시도
        </Button>
        
        <Button
          onClick={onOpenHTML}
          variant="outlined"
          startIcon={<OpenInNewIcon />}
          color="secondary"
        >
          HTML로 열기
        </Button>
        
        <Button
          onClick={onViewLogs}
          variant="outlined"
          startIcon={<BugReportIcon />}
          color="info"
        >
          로그 보기
        </Button>
        
        <Button onClick={onClose} color="inherit">
          닫기
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ErrorModal;
