import React from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  Divider,
  Grid
} from '@mui/material';
import {
  Save as SaveIcon,
  PictureAsPdf as PdfIcon,
  Visibility as PreviewIcon,
  Send as SubmitIcon
} from '@mui/icons-material';

const SignatureBar = ({
  isSubmitting,
  isPreviewLoading,
  isPdfLoading,
  success,
  onSave,
  onPreview,
  onGeneratePDF,
  onSubmit,
  loadDraftData,
  hasDraftData,
  disabled = false
}) => {
  return (
    <Box sx={{ mt: 4, p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
      <Typography variant="h6" gutterBottom>
        서명 및 제출
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      {/* 성공 메시지 */}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      {/* 액션 버튼들 */}
      <Grid container spacing={2} justifyContent="flex-end">
        <Grid item>
          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={onSave}
            disabled={disabled || isSubmitting}
          >
            임시 저장
          </Button>
        </Grid>
        
        {hasDraftData && (
          <Grid item>
            <Button
              variant="outlined"
              color="secondary"
              onClick={loadDraftData}
              disabled={disabled || isSubmitting}
            >
              임시저장 불러오기
            </Button>
          </Grid>
        )}
        
        <Grid item>
          <Button
            variant="outlined"
            startIcon={<PreviewIcon />}
            onClick={onPreview}
            disabled={disabled || isPreviewLoading || isSubmitting}
          >
            {isPreviewLoading ? '미리보기 생성 중...' : 'HTML 미리보기'}
          </Button>
        </Grid>
        
        <Grid item>
          <Button
            variant="outlined"
            startIcon={<PdfIcon />}
            onClick={onGeneratePDF}
            disabled={disabled || isPdfLoading || isSubmitting}
          >
            {isPdfLoading ? 'PDF 생성 중...' : 'PDF 다운로드'}
          </Button>
        </Grid>
        
        <Grid item>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SubmitIcon />}
            onClick={onSubmit}
            disabled={disabled || isSubmitting}
            sx={{ minWidth: 120 }}
          >
            {isSubmitting ? '제출 중...' : '보고서 제출'}
          </Button>
        </Grid>
      </Grid>
      
      {/* 안내 메시지 */}
      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          • 임시 저장: 작성 중인 내용을 로컬에 저장합니다.<br/>
          • HTML 미리보기: 브라우저에서 보고서를 미리 확인할 수 있습니다.<br/>
          • PDF 다운로드: 최종 보고서를 PDF 형식으로 다운로드합니다.<br/>
          • 보고서 제출: 완성된 보고서를 시스템에 제출합니다.
        </Typography>
      </Box>
    </Box>
  );
};

export default SignatureBar;
