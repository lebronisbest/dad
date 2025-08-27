import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Avatar,
  Tooltip,
  Skeleton,
  Divider,
  IconButton,
  Collapse
} from '@mui/material';
import {
  Group as TeamIcon,
  Tag as TagIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import {
  PROJECT_TYPE_LABELS,
  PROJECT_STATUS_LABELS,
  PROJECT_PRIORITY_LABELS,
  PROJECT_RISK_LABELS
} from '../../../config/projectConfig';

const ProjectMeta = ({
  project,
  isLoading = false,
  expanded = false,
  onToggleExpanded,
  showDetails = true
}) => {
  const [isExpanded, setIsExpanded] = React.useState(expanded);

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded);
    onToggleExpanded?.(!isExpanded);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('ko-KR');
    } catch {
      return dateString;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            {[1, 2, 3, 4].map((i) => (
              <Grid item key={i} xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Skeleton variant="text" width="40%" height={20} />
                  <Skeleton variant="text" width="60%" height={24} />
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        {/* 헤더 */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <InfoIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="h3" sx={{ flexGrow: 1 }}>
            프로젝트 상세 정보
          </Typography>
          {showDetails && (
            <Tooltip title={isExpanded ? '상세 정보 축소' : '상세 정보 확장'}>
              <IconButton onClick={handleToggleExpanded} size="small">
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* 기본 메타 정보 */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                프로젝트 ID
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {project.id}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                생성일
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {formatDate(project.created_date)}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                수정일
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {formatDate(project.updated_date)}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                상태
              </Typography>
              <Chip
                label={PROJECT_STATUS_LABELS[project.status] || project.status}
                size="small"
                sx={{
                  backgroundColor: 'primary.main',
                  color: 'white',
                  fontWeight: 500
                }}
              />
            </Box>
          </Grid>
        </Grid>

        {/* 상세 메타 정보 (확장 시 표시) */}
        {showDetails && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Divider />
            
            <Collapse in={isExpanded}>
              <Grid container spacing={3}>
                {/* 프로젝트 타입 및 분류 */}
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                      <TagIcon sx={{ mr: 1, fontSize: 20 }} />
                      프로젝트 분류
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">타입:</Typography>
                        <Chip
                          label={PROJECT_TYPE_LABELS[project.type] || project.type}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">우선순위:</Typography>
                        <Chip
                          label={PROJECT_PRIORITY_LABELS[project.priority] || project.priority}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">위험도:</Typography>
                        <Chip
                          label={PROJECT_RISK_LABELS[project.risk] || project.risk}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  </Box>
                </Grid>

                {/* 일정 정보 */}
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                      일정 정보
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">시작일:</Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {formatDate(project.start_date)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">종료일:</Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {formatDate(project.end_date)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">진행률:</Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {project.progress}%
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>

                {/* 팀 정보 */}
                {project.team_members && project.team_members.length > 0 && (
                  <Grid item xs={12}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                        <TeamIcon sx={{ mr: 1, fontSize: 20 }} />
                        팀 멤버 ({project.team_members.length}명)
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {project.team_members.map((member, index) => (
                          <Chip
                            key={index}
                            avatar={<Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                              {member.charAt(0).toUpperCase()}
                            </Avatar>}
                            label={member}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  </Grid>
                )}

                {/* 태그 정보 */}
                {project.tags && project.tags.length > 0 && (
                  <Grid item xs={12}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                        태그
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {project.tags.map((tag, index) => (
                          <Chip
                            key={index}
                            label={tag}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        ))}
                      </Box>
                    </Box>
                  </Grid>
                )}

                {/* 예산 정보 */}
                {project.budget && (
                  <Grid item xs={12} md={6}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                        예산 정보
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">총 예산:</Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {project.budget.toLocaleString()}원
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}

                {/* 보고서 정보 */}
                {project.reports && project.reports.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                        보고서 정보
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">총 보고서:</Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {project.reports.length}개
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Collapse>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectMeta;
