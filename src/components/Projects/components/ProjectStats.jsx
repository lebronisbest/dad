import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Tooltip,
  IconButton,
  Collapse
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import {
  PROJECT_TYPES,
  PROJECT_STATUS,
  PROJECT_PRIORITY,
  PROJECT_RISK,
  PROJECT_TYPE_LABELS,
  PROJECT_STATUS_LABELS,
  PROJECT_PRIORITY_LABELS,
  PROJECT_RISK_LABELS,
  PROJECT_TYPE_COLORS,
  PROJECT_STATUS_COLORS,
  PROJECT_PRIORITY_COLORS,
  PROJECT_RISK_COLORS
} from '../../config/projectConfig';

const ProjectStats = ({
  projects = [],
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

  // 기본 통계 계산
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === PROJECT_STATUS.ACTIVE).length;
  const completedProjects = projects.filter(p => p.status === PROJECT_STATUS.COMPLETED).length;
  const suspendedProjects = projects.filter(p => p.status === PROJECT_STATUS.SUSPENDED).length;
  
  // 진행률 통계
  const avgProgress = totalProjects > 0 
    ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / totalProjects)
    : 0;
  
  // 우선순위별 통계
  const priorityStats = Object.values(PROJECT_PRIORITY).reduce((acc, priority) => {
    acc[priority] = projects.filter(p => p.priority === priority).length;
    return acc;
  }, {});
  
  // 위험도별 통계
  const riskStats = Object.values(PROJECT_RISK).reduce((acc, risk) => {
    acc[risk] = projects.filter(p => p.risk === risk).length;
    return acc;
  }, {});
  
  // 타입별 통계
  const typeStats = Object.values(PROJECT_TYPES).reduce((acc, type) => {
    acc[type] = projects.filter(p => p.priority === type).length;
    return acc;
  }, {});

  // 진행률별 분포
  const progressRanges = [
    { label: '0-20%', range: [0, 20], color: 'error' },
    { label: '21-40%', range: [21, 40], color: 'warning' },
    { label: '41-60%', range: [41, 60], color: 'info' },
    { label: '61-80%', range: [61, 80], color: 'primary' },
    { label: '81-100%', range: [81, 100], color: 'success' }
  ];

  const progressDistribution = progressRanges.map(range => ({
    ...range,
    count: projects.filter(p => p.progress >= range.range[0] && p.progress <= range.range[1]).length,
    percentage: totalProjects > 0 ? Math.round((projects.filter(p => p.progress >= range.range[0] && p.progress <= range.range[1]).length / totalProjects) * 100) : 0
  }));

  const renderStatCard = (title, value, subtitle, icon, color = 'primary', trend = null) => (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
          {icon && React.cloneElement(icon, { 
            sx: { fontSize: 32, color: `${color}.main` } 
          })}
        </Box>
        <Typography variant="h4" component="div" sx={{ fontWeight: 600, mb: 0.5 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
            <TrendingUpIcon fontSize="small" color={trend > 0 ? 'success' : 'error'} />
            <Typography 
              variant="caption" 
              color={trend > 0 ? 'success.main' : 'error.main'}
              sx={{ ml: 0.5 }}
            >
              {trend > 0 ? '+' : ''}{trend}%
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderProgressDistribution = () => (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2 }}>
        <Typography variant="h6" component="h3" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <ScheduleIcon sx={{ mr: 1, color: 'primary.main' }} />
          진행률 분포
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {progressDistribution.map((range) => (
            <Box key={range.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ minWidth: 60 }}>
                <Typography variant="body2" color="text.secondary">
                  {range.label}
                </Typography>
              </Box>
              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={range.percentage}
                  color={range.color}
                  sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" sx={{ minWidth: 30, textAlign: 'right' }}>
                  {range.count}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );

  const renderPriorityRiskStats = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%' }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="h6" component="h3" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <WarningIcon sx={{ mr: 1, color: 'warning.main' }} />
              우선순위별 분포
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {Object.entries(priorityStats).map(([priority, count]) => (
                <Box key={priority} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Chip
                    label={PROJECT_PRIORITY_LABELS[priority] || priority}
                    size="small"
                    sx={{
                      backgroundColor: PROJECT_PRIORITY_COLORS[priority] || 'default',
                      color: 'white',
                      fontWeight: 500
                    }}
                  />
                  <Typography variant="body2" fontWeight={500}>
                    {count}개
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%' }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="h6" component="h3" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <WarningIcon sx={{ mr: 1, color: 'error.main' }} />
              위험도별 분포
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {Object.entries(riskStats).map(([risk, count]) => (
                <Box key={risk} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Chip
                    label={PROJECT_RISK_LABELS[risk] || risk}
                    size="small"
                    sx={{
                      backgroundColor: PROJECT_RISK_COLORS[risk] || 'default',
                      color: 'white',
                      fontWeight: 500
                    }}
                  />
                  <Typography variant="body2" fontWeight={500}>
                    {count}개
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  if (isLoading) {
    return (
      <Box>
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item key={i} xs={12} sm={6} md={3}>
              <Card sx={{ height: 120 }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ width: '60%', height: 20, bgcolor: 'grey.200', borderRadius: 1 }} />
                    <Box sx={{ width: '40%', height: 30, bgcolor: 'grey.200', borderRadius: 1 }} />
                    <Box sx={{ width: '80%', height: 16, bgcolor: 'grey.200', borderRadius: 1 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {/* 기본 통계 카드 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          {renderStatCard(
            '전체 프로젝트',
            totalProjects,
            '총 프로젝트 수',
            <AssignmentIcon />,
            'primary'
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {renderStatCard(
            '진행중',
            activeProjects,
            `${totalProjects > 0 ? Math.round((activeProjects / totalProjects) * 100) : 0}%`,
            <TrendingUpIcon />,
            'success'
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {renderStatCard(
            '완료',
            completedProjects,
            `${totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0}%`,
            <CheckCircleIcon />,
            'info'
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {renderStatCard(
            '평균 진행률',
            `${avgProgress}%`,
            '전체 프로젝트 평균',
            <ScheduleIcon />,
            'warning'
          )}
        </Grid>
      </Grid>

      {/* 상세 통계 */}
      {showDetails && (
        <Collapse in={isExpanded}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              {renderProgressDistribution()}
            </Grid>
            <Grid item xs={12} md={6}>
              {renderPriorityRiskStats()}
            </Grid>
          </Grid>
        </Collapse>
      )}

      {/* 확장/축소 버튼 */}
      {showDetails && (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Tooltip title={isExpanded ? '상세 통계 축소' : '상세 통계 확장'}>
            <IconButton onClick={handleToggleExpanded} size="large">
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
};

export default ProjectStats;
