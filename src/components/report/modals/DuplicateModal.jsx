import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Alert,
  Chip
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

const DuplicateModal = ({
  open,
  fileName,
  existingPath,
  message,
  onClose,
  onOverwrite,
  isSubmitting
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="warning" />
        중복된 보고서가 있습니다
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          동일한 방문차수와 프로젝트명의 보고서가 이미 존재합니다.
        </Alert>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            생성하려는 파일명:
          </Typography>
          <Chip 
            label={fileName} 
            color="primary" 
            variant="outlined"
            sx={{ fontFamily: 'monospace' }}
          />
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            기존 파일 경로:
          </Typography>
          <Typography variant="body2" sx={{ 
            fontFamily: 'monospace', 
            backgroundColor: 'grey.100', 
            p: 1, 
            borderRadius: 1,
            wordBreak: 'break-all'
          }}>
            {existingPath}
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button 
          onClick={onClose} 
          disabled={isSubmitting}
          variant="outlined"
        >
          뒤로 가기
        </Button>
        <Button 
          onClick={onOverwrite} 
          disabled={isSubmitting}
          variant="contained" 
          color="warning"
          startIcon={<WarningIcon />}
        >
          {isSubmitting ? '덮어쓰는 중...' : '덮어쓰기'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DuplicateModal;
