import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Refresh as RetryIcon,
  OpenInNew as OpenHTMLIcon,
  BugReport as ViewLogsIcon
} from '@mui/icons-material';

const ErrorModal = ({
  open,
  error,
  showDiagnostics,
  onClose,
  onRetry,
  onOpenHTML,
  onViewLogs
}) => {
  const [showDiagnosticsLocal, setShowDiagnosticsLocal] = useState(showDiagnostics);

  if (!error) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Alert severity="error" sx={{ flex: 1 }}>
            오류가 발생했습니다
          </Alert>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {error.message}
        </Typography>
        
        {error.details && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              상세 정보:
            </Typography>
            <Box
              component="pre"
              sx={{
                p: 2,
                bgcolor: 'grey.100',
                borderRadius: 1,
                fontSize: '0.875rem',
                overflow: 'auto',
                maxHeight: 200
              }}
            >
              {JSON.stringify(error.details, null, 2)}
            </Box>
          </Box>
        )}
        
        {/* 진단 로그 토글 */}
        {error.diagnosticLogs && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">
                진단 로그 보기
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box
                component="pre"
                sx={{
                  p: 2,
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                  fontSize: '0.75rem',
                  overflow: 'auto',
                  maxHeight: 300,
                  fontFamily: 'monospace'
                }}
              >
                {error.diagnosticLogs}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}
        
        <Divider sx={{ my: 2 }} />
        
        {/* 복구 액션 안내 */}
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            문제를 해결하기 위해 다음 중 하나를 시도해보세요:
          </Typography>
        </Alert>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            • <strong>다시 시도</strong>: 동일한 작업을 다시 시도합니다
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • <strong>HTML로 열기</strong>: 보고서를 브라우저에서 확인합니다
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • <strong>로그 보기</strong>: 콘솔에서 자세한 오류 정보를 확인합니다
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onViewLogs}
          startIcon={<ViewLogsIcon />}
          variant="outlined"
        >
          로그 보기
        </Button>
        
        <Button
          onClick={onOpenHTML}
          startIcon={<OpenHTMLIcon />}
          variant="outlined"
        >
          HTML로 열기
        </Button>
        
        <Button
          onClick={onRetry}
          startIcon={<RetryIcon />}
          variant="contained"
          color="primary"
        >
          다시 시도
        </Button>
        
        <Button onClick={onClose} variant="outlined">
          닫기
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ErrorModal;
