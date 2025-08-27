import React from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  Divider,
  Button,
  IconButton,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const WorkStatus = ({ 
  formData, 
  errors, 
  onFieldChange,
  onArrayItemAdd,
  onArrayItemRemove,
  isEmbedded = false 
}) => {
  const handleChange = (path, value) => {
    onFieldChange(path, value);
  };

  const handleAddFutureWork = () => {
    const newWork = {
      id: Date.now().toString(),
      description: '',
      priority: 'medium',
      deadline: '',
      responsible: '',
      status: 'pending'
    };
    onArrayItemAdd('future_work', newWork);
  };

  const handleRemoveFutureWork = (index) => {
    onArrayItemRemove('future_work', index);
  };

  const handleFutureWorkChange = (index, field, value) => {
    onArrayItemChange('future_work', index, field, value);
  };

  const handleAddSupport = () => {
    const newSupport = {
      id: Date.now().toString(),
      description: '',
      type: 'technical',
      status: 'pending',
      requested_by: '',
      requested_date: ''
    };
    onArrayItemAdd('support', newSupport);
  };

  const handleRemoveSupport = (index) => {
    onArrayItemRemove('support', index);
  };

  const handleSupportChange = (index, field, value) => {
    onArrayItemChange('support', index, field, value);
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        작업 현황 및 계획
      </Typography>
      
      {/* 현재 작업 현황 */}
      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, mb: 1 }}>
        현재 작업 현황
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="작업 상태 (HTML)"
            value={formData.work.status_html || ''}
            onChange={(e) => handleChange('work.status_html', e.target.value)}
            multiline
            rows={3}
            helperText="HTML 태그를 사용하여 서식을 지정할 수 있습니다"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="작업 설명"
            value={formData.work.description || ''}
            onChange={(e) => handleChange('work.description', e.target.value)}
            multiline
            rows={3}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.work.is_working_today}
                onChange={(e) => handleChange('work.is_working_today', e.target.checked)}
              />
            }
            label="오늘 작업 여부"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="오늘 작업 내용"
            value={formData.work.today_work || ''}
            onChange={(e) => handleChange('work.today_work', e.target.value)}
            multiline
            rows={2}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="현재 진행 중인 작업"
            value={formData.work.current_work || ''}
            onChange={(e) => handleChange('work.current_work', e.target.value)}
            multiline
            rows={2}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="추가 참고사항"
            value={formData.work.additional_notes || ''}
            onChange={(e) => handleChange('work.additional_notes', e.target.value)}
            multiline
            rows={2}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* 향후 작업 계획 */}
      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, mb: 1 }}>
        향후 작업 계획
      </Typography>
      
      {formData.future_work && formData.future_work.length > 0 ? (
        <Box sx={{ mb: 2 }}>
          {formData.future_work.map((work, index) => (
            <Paper
              key={work.id || index}
              elevation={1}
              sx={{
                p: 2,
                mb: 2,
                position: 'relative'
              }}
            >
              <IconButton
                size="small"
                onClick={() => handleRemoveFutureWork(index)}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  color: 'error.main'
                }}
              >
                <DeleteIcon />
              </IconButton>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="작업 내용 *"
                    value={work.description || ''}
                    onChange={(e) => handleFutureWorkChange(index, 'description', e.target.value)}
                    multiline
                    rows={2}
                    error={!!errors[`future_work.${index}.description`]}
                    helperText={errors[`future_work.${index}.description`]}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>우선순위 *</InputLabel>
                    <Select
                      value={work.priority || 'medium'}
                      label="우선순위 *"
                      onChange={(e) => handleFutureWorkChange(index, 'priority', e.target.value)}
                      error={!!errors[`future_work.${index}.priority`]}
                    >
                      <MenuItem value="high">높음</MenuItem>
                      <MenuItem value="medium">보통</MenuItem>
                      <MenuItem value="low">낮음</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="완료 기한"
                    type="date"
                    value={work.deadline || ''}
                    onChange={(e) => handleFutureWorkChange(index, 'deadline', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="담당자"
                    value={work.responsible || ''}
                    onChange={(e) => handleFutureWorkChange(index, 'responsible', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>상태</InputLabel>
                    <Select
                      value={work.status || 'pending'}
                      label="상태"
                      onChange={(e) => handleFutureWorkChange(index, 'status', e.target.value)}
                    >
                      <MenuItem value="pending">대기</MenuItem>
                      <MenuItem value="in_progress">진행 중</MenuItem>
                      <MenuItem value="completed">완료</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>
          ))}
        </Box>
      ) : (
        <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
          등록된 향후 작업 계획이 없습니다.
        </Box>
      )}
      
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={handleAddFutureWork}
        sx={{ mt: 1 }}
      >
        향후 작업 추가
      </Button>

      <Divider sx={{ my: 3 }} />

      {/* 지원 요청 사항 */}
      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, mb: 1 }}>
        지원 요청 사항
      </Typography>
      
      {formData.support && formData.support.length > 0 ? (
        <Box sx={{ mb: 2 }}>
          {formData.support.map((support, index) => (
            <Paper
              key={support.id || index}
              elevation={1}
              sx={{
                p: 2,
                mb: 2,
                position: 'relative'
              }}
            >
              <IconButton
                size="small"
                onClick={() => handleRemoveSupport(index)}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  color: 'error.main'
                }}
              >
                <DeleteIcon />
              </IconButton>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="지원 내용 *"
                    value={support.description || ''}
                    onChange={(e) => handleSupportChange(index, 'description', e.target.value)}
                    multiline
                    rows={2}
                    error={!!errors[`support.${index}.description`]}
                    helperText={errors[`support.${index}.description`]}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>지원 유형 *</InputLabel>
                    <Select
                      value={support.type || 'technical'}
                      label="지원 유형 *"
                      onChange={(e) => handleSupportChange(index, 'type', e.target.value)}
                      error={!!errors[`support.${index}.type`]}
                    >
                      <MenuItem value="technical">기술적</MenuItem>
                      <MenuItem value="financial">재정적</MenuItem>
                      <MenuItem value="personnel">인력</MenuItem>
                      <MenuItem value="other">기타</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>상태 *</InputLabel>
                    <Select
                      value={support.status || 'pending'}
                      label="상태 *"
                      onChange={(e) => handleSupportChange(index, 'status', e.target.value)}
                      error={!!errors[`support.${index}.status`]}
                    >
                      <MenuItem value="pending">대기</MenuItem>
                      <MenuItem value="in_progress">진행 중</MenuItem>
                      <MenuItem value="completed">완료</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="요청자"
                    value={support.requested_by || ''}
                    onChange={(e) => handleSupportChange(index, 'requested_by', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="요청일"
                    type="date"
                    value={support.requested_date || ''}
                    onChange={(e) => handleSupportChange(index, 'requested_date', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Paper>
          ))}
        </Box>
      ) : (
        <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
          등록된 지원 요청 사항이 없습니다.
        </Box>
      )}
      
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={handleAddSupport}
        sx={{ mt: 1 }}
      >
        지원 요청 추가
      </Button>
    </Box>
  );
};

export default WorkStatus;
