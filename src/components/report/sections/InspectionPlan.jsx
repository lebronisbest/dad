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
  IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const InspectionPlan = ({ 
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

  const handleAddGuidance = () => {
    const newGuidance = {
      id: Date.now().toString(),
      content: '',
      priority: 'medium',
      deadline: '',
      isCompleted: false
    };
    onArrayItemAdd('previous_guidance', newGuidance);
  };

  const handleRemoveGuidance = (index) => {
    onArrayItemRemove('previous_guidance', index);
  };

  const handleGuidanceChange = (index, field, value) => {
    onArrayItemChange('previous_guidance', index, field, value);
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        지도 계획 및 이전 지도 사항
      </Typography>
      
      {/* 지도 정보 */}
      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, mb: 1 }}>
        지도 기관 정보
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="지도 기관명"
            value={formData.myorg.name}
            onChange={(e) => handleChange('myorg.name', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="지도자명"
            value={formData.myorg.inspector}
            onChange={(e) => handleChange('myorg.inspector', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="연락처"
            value={formData.myorg.phone}
            onChange={(e) => handleChange('myorg.phone', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', height: '100%' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.guide.previous_completed}
                  onChange={(e) => handleChange('guide.previous_completed', e.target.checked)}
                />
              }
              label="이전 지도 완료"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.guide.previous_incomplete}
                  onChange={(e) => handleChange('guide.previous_incomplete', e.target.checked)}
                />
              }
              label="이전 지도 미완료"
            />
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* 이전 지도 사항 */}
      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, mb: 1 }}>
        이전 지도 사항
      </Typography>
      
      {formData.previous_guidance && formData.previous_guidance.length > 0 ? (
        <Box sx={{ mb: 2 }}>
          {formData.previous_guidance.map((guidance, index) => (
            <Box
              key={guidance.id || index}
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                mb: 2,
                position: 'relative'
              }}
            >
              <IconButton
                size="small"
                onClick={() => handleRemoveGuidance(index)}
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
                    label="지도 내용"
                    value={guidance.content || ''}
                    onChange={(e) => handleGuidanceChange(index, 'content', e.target.value)}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>우선순위</InputLabel>
                    <Select
                      value={guidance.priority || 'medium'}
                      label="우선순위"
                      onChange={(e) => handleGuidanceChange(index, 'priority', e.target.value)}
                    >
                      <MenuItem value="high">높음</MenuItem>
                      <MenuItem value="medium">보통</MenuItem>
                      <MenuItem value="low">낮음</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="완료 기한"
                    type="date"
                    value={guidance.deadline || ''}
                    onChange={(e) => handleGuidanceChange(index, 'deadline', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={guidance.isCompleted || false}
                        onChange={(e) => handleGuidanceChange(index, 'isCompleted', e.target.checked)}
                      />
                    }
                    label="완료 여부"
                  />
                </Grid>
              </Grid>
            </Box>
          ))}
        </Box>
      ) : (
        <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
          등록된 이전 지도 사항이 없습니다.
        </Box>
      )}
      
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={handleAddGuidance}
        sx={{ mt: 1 }}
      >
        지도 사항 추가
      </Button>
    </Box>
  );
};

export default InspectionPlan;
