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
  Divider
} from '@mui/material';

const BasicInfoFields = ({ 
  formData, 
  errors, 
  onFieldChange,
  isEmbedded = false 
}) => {
  const handleChange = (path, value) => {
    onFieldChange(path, value);
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        기본 정보
      </Typography>
      
      {/* 현장 정보 */}
      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, mb: 1 }}>
        현장 정보
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="현장명 *"
            value={formData.site.name}
            onChange={(e) => handleChange('site.name', e.target.value)}
            error={!!errors['site.name']}
            helperText={errors['site.name']}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="주소 *"
            value={formData.site.address}
            onChange={(e) => handleChange('site.address', e.target.value)}
            error={!!errors['site.address']}
            helperText={errors['site.address']}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="전화번호"
            value={formData.site.phone}
            onChange={(e) => handleChange('site.phone', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="이메일"
            type="email"
            value={formData.site.email}
            onChange={(e) => handleChange('site.email', e.target.value)}
            error={!!errors['site.email']}
            helperText={errors['site.email']}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="관리번호"
            value={formData.site.management_number}
            onChange={(e) => handleChange('site.management_number', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="공사기간"
            value={formData.site.construction_period}
            onChange={(e) => handleChange('site.construction_period', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="공사금액"
            value={formData.site.construction_amount}
            onChange={(e) => handleChange('site.construction_amount', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="책임자"
            value={formData.site.responsible_person}
            onChange={(e) => handleChange('site.responsible_person', e.target.value)}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* 기관 정보 */}
      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, mb: 1 }}>
        기관 정보
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="기관명 *"
            value={formData.org.name}
            onChange={(e) => handleChange('org.name', e.target.value)}
            error={!!errors['org.name']}
            helperText={errors['org.name']}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="전화번호"
            value={formData.org.phone}
            onChange={(e) => handleChange('org.phone', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="등록번호"
            value={formData.org.registration_number}
            onChange={(e) => handleChange('org.registration_number', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="면허번호"
            value={formData.org.license_number}
            onChange={(e) => handleChange('org.license_number', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="주소"
            value={formData.org.address}
            onChange={(e) => handleChange('org.address', e.target.value)}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* 방문 정보 */}
      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, mb: 1 }}>
        방문 정보
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="방문일 *"
            type="date"
            value={formData.visit.date}
            onChange={(e) => handleChange('visit.date', e.target.value)}
            error={!!errors['visit.date']}
            helperText={errors['visit.date']}
            required
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            label="방문차수 *"
            type="number"
            value={formData.visit.round}
            onChange={(e) => handleChange('visit.round', parseInt(e.target.value) || 1)}
            error={!!errors['visit.round']}
            helperText={errors['visit.round']}
            required
            inputProps={{ min: 1 }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            label="총 방문차수 *"
            type="number"
            value={formData.visit.round_total}
            onChange={(e) => handleChange('visit.round_total', parseInt(e.target.value) || 1)}
            error={!!errors['visit.round_total']}
            helperText={errors['visit.round_total']}
            required
            inputProps={{ min: 1 }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="방문 목적"
            value={formData.visit.purpose}
            onChange={(e) => handleChange('visit.purpose', e.target.value)}
            multiline
            rows={2}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* 진행률 및 카테고리 */}
      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, mb: 1 }}>
        진행률 및 카테고리
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="진행률 (%)"
            type="number"
            value={formData.progress.percent}
            onChange={(e) => handleChange('progress.percent', parseInt(e.target.value) || 0)}
            error={!!errors['progress.percent']}
            helperText={errors['progress.percent']}
            inputProps={{ min: 0, max: 100 }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>카테고리 타입</InputLabel>
            <Select
              value={formData.category.type}
              label="카테고리 타입"
              onChange={(e) => handleChange('category.type', e.target.value)}
              error={!!errors['category.type']}
            >
              <MenuItem value="건설">건설</MenuItem>
              <MenuItem value="제조">제조</MenuItem>
              <MenuItem value="유지보수">유지보수</MenuItem>
              <MenuItem value="기타">기타</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="카테고리 서브타입"
            value={formData.category.subtype}
            onChange={(e) => handleChange('category.subtype', e.target.value)}
            error={!!errors['category.subtype']}
            helperText={errors['category.subtype']}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', height: '100%' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.category.is_construction}
                  onChange={(e) => handleChange('category.is_construction', e.target.checked)}
                />
              }
              label="건설업"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.category.is_electrical}
                  onChange={(e) => handleChange('category.is_electrical', e.target.checked)}
                />
              }
              label="전기공사업"
            />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BasicInfoFields;
