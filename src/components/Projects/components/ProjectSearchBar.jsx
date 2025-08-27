import React from 'react';
import { 
  Box, 
  TextField, 
  InputAdornment, 
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Clear as ClearIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';

const ProjectSearchBar = ({ 
  searchQuery, 
  onSearchChange, 
  onClearSearch, 
  onShowFilters,
  hasActiveFilters = false,
  placeholder = "프로젝트 검색...",
  disabled = false
}) => {
  const handleSearchChange = (event) => {
    onSearchChange(event.target.value);
  };

  const handleClearSearch = () => {
    onClearSearch();
  };

  const handleShowFilters = () => {
    onShowFilters();
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: '100%' }}>
      <TextField
        fullWidth
        size="small"
        placeholder={placeholder}
        value={searchQuery}
        onChange={handleSearchChange}
        disabled={disabled}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: searchQuery && (
            <InputAdornment position="end">
              <Tooltip title="검색어 지우기">
                <IconButton
                  size="small"
                  onClick={handleClearSearch}
                  disabled={disabled}
                >
                  <ClearIcon />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          )
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main',
              },
            },
          },
        }}
      />
      
      <Tooltip title="필터 설정">
        <IconButton
          onClick={handleShowFilters}
          disabled={disabled}
          color={hasActiveFilters ? 'primary' : 'default'}
          sx={{
            border: hasActiveFilters ? 2 : 1,
            borderColor: hasActiveFilters ? 'primary.main' : 'divider',
            borderRadius: 2,
            minWidth: 40,
            height: 40,
          }}
        >
          <FilterIcon />
        </IconButton>
      </Tooltip>
      
      {hasActiveFilters && (
        <Chip
          label="필터 적용됨"
          size="small"
          color="primary"
          variant="outlined"
          sx={{ 
            fontSize: '0.75rem',
            height: 24,
            '& .MuiChip-label': {
              px: 1,
            }
          }}
        />
      )}
    </Box>
  );
};

export default ProjectSearchBar;
