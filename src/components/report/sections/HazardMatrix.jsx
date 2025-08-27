import React from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Divider,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const HazardMatrix = ({ 
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

  const handleAddHazard = () => {
    const newHazard = {
      id: Date.now().toString(),
      description: '',
      risk_level: 'medium',
      improvement_method: ''
    };
    onArrayItemAdd('hazards', newHazard);
  };

  const handleRemoveHazard = (index) => {
    onArrayItemRemove('hazards', index);
  };

  const handleHazardChange = (index, field, value) => {
    onArrayItemChange('hazards', index, field, value);
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#757575';
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        위험 요소 및 위험성 평가
      </Typography>
      
      {/* 위험 요소 목록 */}
      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, mb: 1 }}>
        위험 요소 식별
      </Typography>
      
      {formData.hazards && formData.hazards.length > 0 ? (
        <Box sx={{ mb: 2 }}>
          {formData.hazards.map((hazard, index) => (
            <Paper
              key={hazard.id || index}
              elevation={1}
              sx={{
                p: 2,
                mb: 2,
                borderLeft: `4px solid ${getRiskColor(hazard.risk_level)}`
              }}
            >
              <IconButton
                size="small"
                onClick={() => handleRemoveHazard(index)}
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
                    label="위험 요소 설명 *"
                    value={hazard.description || ''}
                    onChange={(e) => handleHazardChange(index, 'description', e.target.value)}
                    multiline
                    rows={2}
                    error={!!errors[`hazards.${index}.description`]}
                    helperText={errors[`hazards.${index}.description`]}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>위험도 *</InputLabel>
                    <Select
                      value={hazard.risk_level || 'medium'}
                      label="위험도 *"
                      onChange={(e) => handleHazardChange(index, 'risk_level', e.target.value)}
                      error={!!errors[`hazards.${index}.risk_level`]}
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
                    label="개선 방법"
                    value={hazard.improvement_method || ''}
                    onChange={(e) => handleHazardChange(index, 'improvement_method', e.target.value)}
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
            </Paper>
          ))}
        </Box>
      ) : (
        <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
          등록된 위험 요소가 없습니다.
        </Box>
      )}
      
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={handleAddHazard}
        sx={{ mt: 1 }}
      >
        위험 요소 추가
      </Button>

      <Divider sx={{ my: 3 }} />

      {/* 위험성 평가 매트릭스 */}
      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, mb: 1 }}>
        위험성 평가 매트릭스
      </Typography>
      
      <Grid container spacing={2}>
        {/* 발생 가능성 */}
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" gutterBottom>
            발생 가능성
          </Typography>
          <TextField
            fullWidth
            label="높음"
            value={formData.risk_assessment.possibility.high || ''}
            onChange={(e) => handleChange('risk_assessment.possibility.high', e.target.value)}
            multiline
            rows={2}
            sx={{ mb: 1 }}
          />
          <TextField
            fullWidth
            label="보통"
            value={formData.risk_assessment.possibility.medium || ''}
            onChange={(e) => handleChange('risk_assessment.possibility.medium', e.target.value)}
            multiline
            rows={2}
            sx={{ mb: 1 }}
          />
          <TextField
            fullWidth
            label="낮음"
            value={formData.risk_assessment.possibility.low || ''}
            onChange={(e) => handleChange('risk_assessment.possibility.low', e.target.value)}
            multiline
            rows={2}
          />
        </Grid>

        {/* 심각성 */}
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" gutterBottom>
            심각성
          </Typography>
          <TextField
            fullWidth
            label="높음"
            value={formData.risk_assessment.severity.high || ''}
            onChange={(e) => handleChange('risk_assessment.severity.high', e.target.value)}
            multiline
            rows={2}
            sx={{ mb: 1 }}
          />
          <TextField
            fullWidth
            label="보통"
            value={formData.risk_assessment.severity.medium || ''}
            onChange={(e) => handleChange('risk_assessment.severity.medium', e.target.value)}
            multiline
            rows={2}
            sx={{ mb: 1 }}
          />
          <TextField
            fullWidth
            label="낮음"
            value={formData.risk_assessment.severity.low || ''}
            onChange={(e) => handleChange('risk_assessment.severity.low', e.target.value)}
            multiline
            rows={2}
          />
        </Grid>

        {/* 개선 방법 */}
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2" gutterBottom>
            개선 방법
          </Typography>
          <TextField
            fullWidth
            label="높음"
            value={formData.risk_assessment.improvement_methods.high || ''}
            onChange={(e) => handleChange('risk_assessment.improvement_methods.high', e.target.value)}
            multiline
            rows={2}
            sx={{ mb: 1 }}
          />
          <TextField
            fullWidth
            label="보통"
            value={formData.risk_assessment.improvement_methods.medium || ''}
            onChange={(e) => handleChange('risk_assessment.improvement_methods.medium', e.target.value)}
            multiline
            rows={2}
            sx={{ mb: 1 }}
          />
          <TextField
            fullWidth
            label="낮음"
            value={formData.risk_assessment.improvement_methods.low || ''}
            onChange={(e) => handleChange('risk_assessment.improvement_methods.low', e.target.value)}
            multiline
            rows={2}
          />
        </Grid>
      </Grid>

      {/* 위험도 매트릭스 테이블 */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          위험도 매트릭스
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>심각성</TableCell>
                <TableCell align="center">높음</TableCell>
                <TableCell align="center">보통</TableCell>
                <TableCell align="center">낮음</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell component="th" scope="row">높음</TableCell>
                <TableCell align="center" sx={{ bgcolor: '#f44336', color: 'white' }}>매우 높음</TableCell>
                <TableCell align="center" sx={{ bgcolor: '#ff9800', color: 'white' }}>높음</TableCell>
                <TableCell align="center" sx={{ bgcolor: '#ffc107' }}>보통</TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row">보통</TableCell>
                <TableCell align="center" sx={{ bgcolor: '#ff9800', color: 'white' }}>높음</TableCell>
                <TableCell align="center" sx={{ bgcolor: '#ffc107' }}>보통</TableCell>
                <TableCell align="center" sx={{ bgcolor: '#4caf50', color: 'white' }}>낮음</TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row">낮음</TableCell>
                <TableCell align="center" sx={{ bgcolor: '#ffc107' }}>보통</TableCell>
                <TableCell align="center" sx={{ bgcolor: '#4caf50', color: 'white' }}>낮음</TableCell>
                <TableCell align="center" sx={{ bgcolor: '#4caf50', color: 'white' }}>매우 낮음</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default HazardMatrix;
