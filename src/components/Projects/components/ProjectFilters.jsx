import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Button,
  Grid,
  Divider,
  Collapse,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import {
  PROJECT_TYPES,
  PROJECT_STATUS,
  PROJECT_PRIORITY,
  PROJECT_RISK,
  PROJECT_TYPE_LABELS,
  PROJECT_STATUS_LABELS,
  PROJECT_PRIORITY_LABELS,
  PROJECT_RISK_LABELS
} from '../../config/projectConfig';

const ProjectFilters = ({
  filters,
  onFiltersChange,
  onResetFilters,
  onClose,
  open = false,
  disabled = false
}) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (field, value) => {
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    onClose?.();
  };

  const handleResetFilters = () => {
    const resetFilters = {};
    setLocalFilters(resetFilters);
    onResetFilters();
    onClose?.();
  };

  const handleClearField = (field) => {
    const newFilters = { ...localFilters };
    delete newFilters[field];
    setLocalFilters(newFilters);
  };

  const hasActiveFilters = Object.keys(filters).length > 0;
  const hasLocalChanges = JSON.stringify(localFilters) !== JSON.stringify(filters);

  const renderFilterChips = () => {
    const chips = [];
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        let label = '';
        let color = 'default';
        
        switch (key) {
          case 'type':
            label = `타입: ${PROJECT_TYPE_LABELS[value] || value}`;
            color = 'primary';
            break;
          case 'status':
            label = `상태: ${PROJECT_STATUS_LABELS[value] || value}`;
            color = 'secondary';
            break;
          case 'priority':
            label = `우선순위: ${PROJECT_PRIORITY_LABELS[value] || value}`;
            color = 'warning';
            break;
          case 'risk':
            label = `위험도: ${PROJECT_RISK_LABELS[value] || value}`;
            color = 'error';
            break;
          case 'location':
            label = `위치: ${value}`;
            color = 'info';
            break;
          case 'client':
            label = `클라이언트: ${value}`;
            color = 'success';
            break;
          case 'manager':
            label = `매니저: ${value}`;
            color = 'default';
            break;
          default:
            label = `${key}: ${value}`;
            color = 'default';
        }
        
        chips.push(
          <Chip
            key={key}
            label={label}
            color={color}
            variant="outlined"
            size="small"
            onDelete={() => handleClearField(key)}
            sx={{ m: 0.5 }}
          />
        );
      }
    });
    
    return chips;
  };

  return (
    <Collapse in={open}>
      <Card sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FilterIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" component="h3" sx={{ flexGrow: 1 }}>
              프로젝트 필터
            </Typography>
            <Tooltip title={isExpanded ? '필터 축소' : '필터 확장'}>
              <IconButton
                size="small"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Tooltip>
          </Box>

          {hasActiveFilters && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                적용된 필터:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {renderFilterChips()}
              </Box>
            </Box>
          )}

          <Collapse in={isExpanded}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>프로젝트 타입</InputLabel>
                  <Select
                    value={localFilters.type || ''}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    disabled={disabled}
                  >
                    <MenuItem value="">전체</MenuItem>
                    {Object.entries(PROJECT_TYPES).map(([key, value]) => (
                      <MenuItem key={value} value={value}>
                        {PROJECT_TYPE_LABELS[value]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>프로젝트 상태</InputLabel>
                  <Select
                    value={localFilters.status || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    disabled={disabled}
                  >
                    <MenuItem value="">전체</MenuItem>
                    {Object.entries(PROJECT_STATUS).map(([key, value]) => (
                      <MenuItem key={value} value={value}>
                        {PROJECT_STATUS_LABELS[value]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>우선순위</InputLabel>
                  <Select
                    value={localFilters.priority || ''}
                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                    disabled={disabled}
                  >
                    <MenuItem value="">전체</MenuItem>
                    {Object.entries(PROJECT_PRIORITY).map(([key, value]) => (
                      <MenuItem key={value} value={value}>
                        {PROJECT_PRIORITY_LABELS[value]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>위험도</InputLabel>
                  <Select
                    value={localFilters.risk || ''}
                    onChange={(e) => handleFilterChange('risk', e.target.value)}
                    disabled={disabled}
                  >
                    <MenuItem value="">전체</MenuItem>
                    {Object.entries(PROJECT_RISK).map(([key, value]) => (
                      <MenuItem key={value} value={value}>
                        {PROJECT_RISK_LABELS[value]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="위치"
                  value={localFilters.location || ''}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  disabled={disabled}
                  placeholder="프로젝트 위치"
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="클라이언트"
                  value={localFilters.client || ''}
                  onChange={(e) => handleFilterChange('client', e.target.value)}
                  disabled={disabled}
                  placeholder="클라이언트명"
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="매니저"
                  value={localFilters.manager || ''}
                  onChange={(e) => handleFilterChange('manager', e.target.value)}
                  disabled={disabled}
                  placeholder="프로젝트 매니저"
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="시작일 (부터)"
                  type="date"
                  value={localFilters.start_date_from || ''}
                  onChange={(e) => handleFilterChange('start_date_from', e.target.value)}
                  disabled={disabled}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="시작일 (까지)"
                  type="date"
                  value={localFilters.start_date_to || ''}
                  onChange={(e) => handleFilterChange('start_date_to', e.target.value)}
                  disabled={disabled}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Collapse>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={handleResetFilters}
              disabled={disabled || !hasActiveFilters}
              startIcon={<ClearIcon />}
            >
              필터 초기화
            </Button>
            <Button
              variant="contained"
              onClick={handleApplyFilters}
              disabled={disabled || !hasLocalChanges}
            >
              필터 적용
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Collapse>
  );
};

export default ProjectFilters;
