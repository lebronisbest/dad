import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Box,
  Typography
} from '@mui/material';
import { useProjectContext } from '../../../contexts/ProjectContext';

const ProjectSelector = ({ 
  selectedProject, 
  onProjectChange, 
  isLoadingProjects,
  isEmbedded = false 
}) => {
  const { projects } = useProjectContext();

  if (isEmbedded) {
    return null; // 프로젝트 내장 모드에서는 표시하지 않음
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        프로젝트 선택
      </Typography>
      
      <FormControl fullWidth>
        <InputLabel id="project-select-label">프로젝트</InputLabel>
        <Select
          labelId="project-select-label"
          id="project-select"
          value={selectedProject}
          label="프로젝트"
          onChange={(e) => onProjectChange(e.target.value)}
          disabled={isLoadingProjects}
        >
          <MenuItem value="">
            <em>프로젝트를 선택하세요</em>
          </MenuItem>
          {/* ✅ 배열 기반 프로젝트 데이터 처리 */}
          {Array.isArray(projects) && projects.map((project) => (
            <MenuItem key={project.id} value={project.id}>
              {project.name}
              {project.location && ` (${project.location})`}
            </MenuItem>
          ))}
        </Select>
        {isLoadingProjects && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <CircularProgress size={16} sx={{ mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              프로젝트 목록을 불러오는 중...
            </Typography>
          </Box>
        )}
      </FormControl>
    </Box>
  );
};

export default ProjectSelector;
