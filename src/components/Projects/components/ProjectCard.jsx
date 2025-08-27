import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Avatar,
  Divider
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Backup as BackupIcon,
  MoreVert as MoreIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import {
  PROJECT_TYPE_LABELS,
  PROJECT_STATUS_LABELS,
  PROJECT_PRIORITY_LABELS,
  PROJECT_RISK_LABELS,
  PROJECT_TYPE_COLORS,
  PROJECT_STATUS_COLORS,
  PROJECT_PRIORITY_COLORS,
  PROJECT_RISK_COLORS
} from '../../config/projectConfig';

const ProjectCard = ({
  project,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  onBackup,
  onMoreActions,
  disabled = false,
  showActions = true
}) => {
  const handleSelect = () => {
    if (onSelect && !disabled) {
      onSelect(project.id);
    }
  };

  const handleEdit = (event) => {
    event.stopPropagation();
    if (onEdit && !disabled) {
      onEdit(project);
    }
  };

  const handleDelete = (event) => {
    event.stopPropagation();
    if (onDelete && !disabled) {
      onDelete(project.id);
    }
  };

  const handleBackup = (event) => {
    event.stopPropagation();
    if (onBackup && !disabled) {
      onBackup(project.id);
    }
  };

  const handleMoreActions = (event) => {
    event.stopPropagation();
    if (onMoreActions && !disabled) {
      onMoreActions(project, event);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('ko-KR');
    } catch {
      return dateString;
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'success';
    if (progress >= 50) return 'warning';
    return 'error';
  };

  const getPriorityColor = (priority) => {
    return PROJECT_PRIORITY_COLORS[priority] || 'default';
  };

  const getRiskColor = (risk) => {
    return PROJECT_RISK_COLORS[risk] || 'default';
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: disabled ? 'default' : 'pointer',
        border: isSelected ? 2 : 1,
        borderColor: isSelected ? 'primary.main' : 'divider',
        transition: 'all 0.2s ease-in-out',
        '&:hover': disabled ? {} : {
          boxShadow: 4,
          transform: 'translateY(-2px)',
          borderColor: 'primary.main'
        },
        opacity: disabled ? 0.6 : 1
      }}
      onClick={handleSelect}
    >
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        {/* 헤더 */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              component="h3"
              sx={{
                fontWeight: 600,
                mb: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {project.name}
            </Typography>
            
            {project.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  lineHeight: 1.4
                }}
              >
                {project.description}
              </Typography>
            )}
          </Box>
          
          {showActions && (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="편집">
                <IconButton
                  size="small"
                  onClick={handleEdit}
                  disabled={disabled}
                  sx={{ color: 'primary.main' }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="백업">
                <IconButton
                  size="small"
                  onClick={handleBackup}
                  disabled={disabled}
                  sx={{ color: 'info.main' }}
                >
                  <BackupIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="더보기">
                <IconButton
                  size="small"
                  onClick={handleMoreActions}
                  disabled={disabled}
                >
                  <MoreIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>

        {/* 태그들 */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
          <Chip
            label={PROJECT_TYPE_LABELS[project.type] || project.type}
            size="small"
            sx={{
              backgroundColor: PROJECT_TYPE_COLORS[project.type] || 'default',
              color: 'white',
              fontWeight: 500
            }}
          />
          
          <Chip
            label={PROJECT_STATUS_LABELS[project.status] || project.status}
            size="small"
            sx={{
              backgroundColor: PROJECT_STATUS_COLORS[project.status] || 'default',
              color: 'white',
              fontWeight: 500
            }}
          />
          
          <Chip
            label={PROJECT_PRIORITY_LABELS[project.priority] || project.priority}
            size="small"
            variant="outlined"
            sx={{
              borderColor: getPriorityColor(project.priority),
              color: getPriorityColor(project.priority),
              fontWeight: 500
            }}
          />
          
          <Chip
            label={PROJECT_RISK_LABELS[project.risk] || project.risk}
            size="small"
            variant="outlined"
            sx={{
              borderColor: getRiskColor(project.risk),
              color: getRiskColor(project.risk),
              fontWeight: 500
            }}
          />
        </Box>

        {/* 진행률 */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              진행률
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {project.progress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={project.progress}
            color={getProgressColor(project.progress)}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>

        {/* 메타 정보 */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {project.location && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {project.location}
              </Typography>
            </Box>
          )}
          
          {project.client && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {project.client}
              </Typography>
            </Box>
          )}
          
          {project.manager && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {project.manager}
              </Typography>
            </Box>
          )}
          
          {project.start_date && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                시작: {formatDate(project.start_date)}
              </Typography>
            </Box>
          )}
          
          {project.end_date && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                종료: {formatDate(project.end_date)}
              </Typography>
            </Box>
          )}
        </Box>

        {/* 팀 멤버 */}
        {project.team_members && project.team_members.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              팀 멤버 ({project.team_members.length}명)
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {project.team_members.slice(0, 3).map((member, index) => (
                <Avatar
                  key={index}
                  sx={{ width: 28, height: 28, fontSize: '0.75rem' }}
                >
                  {member.charAt(0).toUpperCase()}
                </Avatar>
              ))}
              {project.team_members.length > 3 && (
                <Avatar
                  sx={{ 
                    width: 28, 
                    height: 28, 
                    fontSize: '0.75rem',
                    backgroundColor: 'grey.300',
                    color: 'grey.600'
                  }}
                >
                  +{project.team_members.length - 3}
                </Avatar>
              )}
            </Box>
          </Box>
        )}
      </CardContent>

      {/* 액션 버튼들 */}
      {showActions && (
        <>
          <Divider />
          <CardActions sx={{ p: 1, justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="편집">
                <IconButton
                  size="small"
                  onClick={handleEdit}
                  disabled={disabled}
                  sx={{ color: 'primary.main' }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="백업">
                <IconButton
                  size="small"
                  onClick={handleBackup}
                  disabled={disabled}
                  sx={{ color: 'info.main' }}
                >
                  <BackupIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            
            <Tooltip title="삭제">
              <IconButton
                size="small"
                onClick={handleDelete}
                disabled={disabled}
                sx={{ color: 'error.main' }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </CardActions>
        </>
      )}
    </Card>
  );
};

export default ProjectCard;
