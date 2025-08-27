import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Add as AddIcon,
  Folder as FolderIcon,
  Description as DescriptionIcon,
  Backup as BackupIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const RepositoryHome = ({
  recentProjects = [],
  recentReports = [],
  statistics = {},
  onNewProject,
  onViewAllProjects,
  onViewAllReports,
  disabled = false
}) => {
  const navigate = useNavigate();

  const handleNewProject = () => {
    if (onNewProject && !disabled) {
      onNewProject();
    }
  };

  const handleViewAllProjects = () => {
    if (onViewAllProjects && !disabled) {
      onViewAllProjects();
    } else {
      navigate('/projects');
    }
  };

  const handleViewAllReports = () => {
    if (onViewAllReports && !disabled) {
      onViewAllReports();
    } else {
      navigate('/reports');
    }
  };

  const handleProjectClick = (projectId) => {
    navigate(`/projects/${projectId}`);
  };

  const handleReportClick = (reportId) => {
    navigate(`/reports/${reportId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('ko-KR');
    } catch {
      return dateString;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* 헤더 */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" sx={{ fontWeight: 600, mb: 2 }}>
          프로젝트 저장소
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          모든 프로젝트와 보고서를 한 곳에서 관리하세요
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={handleNewProject}
          disabled={disabled}
          sx={{ px: 4, py: 1.5 }}
        >
          새 프로젝트 생성
        </Button>
      </Box>

      {/* 통계 카드 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <FolderIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" component="div" sx={{ fontWeight: 600, mb: 1 }}>
                {statistics.totalProjects || 0}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                총 프로젝트
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <DescriptionIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
              <Typography variant="h4" component="div" sx={{ fontWeight: 600, mb: 1 }}>
                {statistics.totalReports || 0}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                총 보고서
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <TrendingUpIcon sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
              <Typography variant="h4" component="div" sx={{ fontWeight: 600, mb: 1 }}>
                {statistics.activeProjects || 0}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                진행중인 프로젝트
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <BackupIcon sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
              <Typography variant="h4" component="div" sx={{ fontWeight: 600, mb: 1 }}>
                {statistics.totalBackups || 0}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                총 백업
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* 최근 프로젝트 */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                  최근 프로젝트
                </Typography>
                <Button
                  endIcon={<ArrowForwardIcon />}
                  onClick={handleViewAllProjects}
                  disabled={disabled}
                  size="small"
                >
                  모두 보기
                </Button>
              </Box>
              
              {recentProjects.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <FolderIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    최근 프로젝트가 없습니다
                  </Typography>
                </Box>
              ) : (
                <List>
                  {recentProjects.map((project, index) => (
                    <React.Fragment key={project.id}>
                      <ListItem
                        button
                        onClick={() => handleProjectClick(project.id)}
                        disabled={disabled}
                        sx={{ borderRadius: 1, mb: 1 }}
                      >
                        <ListItemIcon>
                          <FolderIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1" fontWeight={500}>
                                {project.name}
                              </Typography>
                              <Chip
                                label={project.status}
                                size="small"
                                color={project.status === 'active' ? 'success' : 'default'}
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <PersonIcon fontSize="small" color="action" />
                                <Typography variant="caption" color="text.secondary">
                                  {project.manager || '매니저 없음'}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CalendarIcon fontSize="small" color="action" />
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(project.updated_date)}
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Typography variant="body2" color="primary" fontWeight={500}>
                            {project.progress}%
                          </Typography>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < recentProjects.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* 최근 보고서 */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                  최근 보고서
                </Typography>
                <Button
                  endIcon={<ArrowForwardIcon />}
                  onClick={handleViewAllReports}
                  disabled={disabled}
                  size="small"
                >
                  모두 보기
                </Button>
              </Box>
              
              {recentReports.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <DescriptionIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    최근 보고서가 없습니다
                  </Typography>
                </Box>
              ) : (
                <List>
                  {recentReports.map((report, index) => (
                    <React.Fragment key={report.id}>
                      <ListItem
                        button
                        onClick={() => handleReportClick(report.id)}
                        disabled={disabled}
                        sx={{ borderRadius: 1, mb: 1 }}
                      >
                        <ListItemIcon>
                          <DescriptionIcon color="success" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1" fontWeight={500}>
                                {report.title}
                              </Typography>
                              <Chip
                                label={report.type}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <BusinessIcon fontSize="small" color="action" />
                                <Typography variant="caption" color="text.secondary">
                                  {report.project_name || '프로젝트 없음'}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <ScheduleIcon fontSize="small" color="action" />
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(report.created_date)}
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Chip
                            label={report.status}
                            size="small"
                            color={report.status === 'completed' ? 'success' : 'default'}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < recentReports.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 빠른 액션 */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 3 }}>
          빠른 액션
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <AddIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" component="h3" sx={{ mb: 1 }}>
                  새 프로젝트
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  새로운 프로젝트를 생성합니다
                </Typography>
                <Button
                  variant="outlined"
                  onClick={handleNewProject}
                  disabled={disabled}
                  fullWidth
                >
                  생성하기
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <DescriptionIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" component="h3" sx={{ mb: 1 }}>
                  새 보고서
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  새로운 보고서를 작성합니다
                </Typography>
                <Button
                  variant="outlined"
                  color="success"
                  onClick={() => navigate('/reports/new')}
                  disabled={disabled}
                  fullWidth
                >
                  작성하기
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <BackupIcon sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
                <Typography variant="h6" component="h3" sx={{ mb: 1 }}>
                  백업 관리
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  프로젝트 백업을 관리합니다
                </Typography>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={() => navigate('/backups')}
                  disabled={disabled}
                  fullWidth
                >
                  관리하기
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <TrendingUpIcon sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
                <Typography variant="h6" component="h3" sx={{ mb: 1 }}>
                  통계 보기
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  프로젝트 통계를 확인합니다
                </Typography>
                <Button
                  variant="outlined"
                  color="info"
                  onClick={() => navigate('/statistics')}
                  disabled={disabled}
                  fullWidth
                >
                  확인하기
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default RepositoryHome;
