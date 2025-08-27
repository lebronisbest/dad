import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Tabs,
  Tab,
  Paper,
  Alert,
  Skeleton,
  Divider,
  Card,
  CardContent,
  Chip,
  Avatar,
  LinearProgress,
  IconButton,
  Tooltip,
  Badge,
  Stack,
  useTheme,
  Button
} from '@mui/material';
import {
  Info as InfoIcon,
  Description as DescriptionIcon,
  Backup as BackupIcon,
  Settings as SettingsIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Engineering as EngineeringIcon,
  Security as SecurityIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  Group as GroupIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Upload as UploadIcon
} from '@mui/icons-material';

// 컴포넌트들
import ProjectHeader from './components/ProjectHeader';
import ProjectMeta from './components/ProjectMeta';
import ReportTable from './components/ReportTable';
import ActionsBar from './components/ActionsBar';
import BackupPanel from './components/BackupPanel';

// 탭 패널 컴포넌트
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const ProjectDetailView = ({
  // 프로젝트 데이터
  project,
  isLoading = false,
  error = null,
  
  // 편집 상태
  isEditing = false,
  hasUnsavedChanges = false,
  
  // 보고서 데이터
  reports = [],
  isLoadingReports = false,
  reportsError = null,
  selectedReport = null,
  reportFilters = {},
  
  // 백업 데이터
  backups = [],
  isLoadingBackups = false,
  backupsError = null,
  selectedBackup = null,
  isCreatingBackup = false,
  isRestoringBackup = false,
  createBackupError = null,
  restoreBackupError = null,
  
  // 이벤트 핸들러들
  onEdit,
  onSave,
  onCancel,
  onRefresh,
  onReportSelect,
  onReportEdit,
  onReportDelete,
  onReportDownload,
  onReportFiltersChange,
  onReportFiltersClear,
  onBackupCreate,
  onBackupRestore,
  onBackupDelete,
  onBackupDownload,
  onBackupSelect,
  onNewReport,
  onEditProject,
  onDeleteProject,
  onBackupProject,
  onRestoreProject,
  onExportProject,
  onImportProject,
  onShareProject,
  onPrintProject,
  onViewProject,
  onProjectSettings,
  
  disabled = false
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const theme = useTheme();

  // 로딩 상태
  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2, mb: 2 }} />
          <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2 }} />
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            '& .MuiAlert-icon': { fontSize: '2rem' },
            '& .MuiAlert-message': { fontSize: '1.1rem' }
          }}
        >
          <Typography variant="h6" component="div" sx={{ mb: 1 }}>
            프로젝트 정보를 불러올 수 없습니다
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {error}
          </Typography>
        </Alert>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            프로젝트 ID: {project?.id || '알 수 없음'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            잠시 후 다시 시도하거나 관리자에게 문의하세요.
          </Typography>
        </Paper>
      </Container>
    );
  }

  // 프로젝트가 없는 경우
  if (!project) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="h6">
            프로젝트를 찾을 수 없습니다
          </Typography>
        </Alert>
      </Container>
    );
  }

  // 상태별 색상 및 아이콘
  const getStatusConfig = (status) => {
    const configs = {
      active: { color: 'success', icon: <TrendingUpIcon />, label: '진행중' },
      completed: { color: 'primary', icon: <CheckCircleIcon />, label: '완료' },
      suspended: { color: 'warning', icon: <WarningIcon />, label: '일시중단' },
      planning: { color: 'info', icon: <ScheduleIcon />, label: '계획' }
    };
    return configs[status] || configs.planning;
  };

  const getPriorityConfig = (priority) => {
    const configs = {
      high: { color: 'error', label: '높음' },
      medium: { color: 'warning', label: '보통' },
      low: { color: 'success', label: '낮음' }
    };
    return configs[priority] || configs.medium;
  };

  const statusConfig = getStatusConfig(project.status);
  const priorityConfig = getPriorityConfig(project.priority);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* 프로젝트 헤더 섹션 */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 4, 
          mb: 4, 
          background: `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}15 100%)`,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 3
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar 
                sx={{ 
                  bgcolor: theme.palette.primary.main, 
                  mr: 2,
                  width: 56,
                  height: 56
                }}
              >
                <EngineeringIcon sx={{ fontSize: 28 }} />
              </Avatar>
              <Box>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
                  {project.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Chip
                    icon={statusConfig.icon}
                    label={statusConfig.label}
                    color={statusConfig.color}
                    variant="filled"
                    size="medium"
                  />
                  <Chip
                    label={priorityConfig.label}
                    color={priorityConfig.color}
                    variant="outlined"
                    size="medium"
                  />
                  <Chip
                    icon={<EngineeringIcon />}
                    label={project.type === 'construction' ? '건설공사' : project.type}
                    variant="outlined"
                    size="medium"
                  />
                </Box>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                진행률
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={project.progress || 0} 
                  sx={{ 
                    flexGrow: 1, 
                    height: 8, 
                    borderRadius: 4,
                    '& .MuiLinearProgress-bar': { borderRadius: 4 }
                  }}
                />
                <Typography variant="body2" sx={{ minWidth: 40 }}>
                  {project.progress || 0}%
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                안전점수: {project.safetyScore || 0}/100
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* 주요 정보 카드들 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* 기본 정보 */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <InfoIcon color="primary" sx={{ mr: 1, fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  기본 정보
                </Typography>
              </Box>
              
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationIcon color="action" sx={{ mr: 2, fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      위치
                    </Typography>
                    <Typography variant="body1">
                      {project.location || '미지정'}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <BusinessIcon color="action" sx={{ mr: 2, fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      클라이언트
                    </Typography>
                    <Typography variant="body1">
                      {project.client || '미지정'}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon color="action" sx={{ mr: 2, fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      안전관리자
                    </Typography>
                    <Typography variant="body1">
                      {project.safetyManager || '미지정'}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* 일정 정보 */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ height: '100%', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <CalendarIcon color="primary" sx={{ mr: 1, fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  일정 정보
                </Typography>
              </Box>
              
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarIcon color="action" sx={{ mr: 2, fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      시작일
                    </Typography>
                    <Typography variant="body1">
                      {project.startDate || '미지정'}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarIcon color="action" sx={{ mr: 2, fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      종료일
                    </Typography>
                    <Typography variant="body1">
                      {project.endDate || '미지정'}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <GroupIcon color="action" sx={{ mr: 2, fontSize: 20 }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      팀 규모
                    </Typography>
                    <Typography variant="body1">
                      {project.teamSize || 1}명
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 상세 정보 탭 */}
      <Paper elevation={2} sx={{ borderRadius: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              '& .MuiTab-root': {
                minHeight: 64,
                fontSize: '1rem',
                fontWeight: 500,
                textTransform: 'none'
              }
            }}
          >
            <Tab 
              icon={<DescriptionIcon />} 
              label="보고서" 
              iconPosition="start"
            />
            <Tab 
              icon={<BackupIcon />} 
              label="백업" 
              iconPosition="start"
            />
            <Tab 
              icon={<SettingsIcon />} 
              label="설정" 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* 탭 내용 */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                프로젝트 보고서
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip 
                  label={`총 ${reports.length}개`} 
                  color="primary" 
                  variant="outlined"
                />
                {onNewReport && (
                  <Tooltip title="새 보고서 작성">
                    <IconButton 
                      color="primary" 
                      onClick={onNewReport}
                      disabled={disabled}
                    >
                      <DescriptionIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
            
            {reportsError ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {reportsError}
              </Alert>
            ) : reports.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <DescriptionIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  보고서가 없습니다
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  이 프로젝트에 대한 첫 번째 보고서를 작성해보세요.
                </Typography>
              </Paper>
            ) : (
              <ReportTable
                reports={reports}
                isLoading={isLoadingReports}
                selectedReport={selectedReport}
                onSelect={onReportSelect}
                onEdit={onReportEdit}
                onDelete={onReportDelete}
                onDownload={onReportDownload}
                disabled={disabled}
              />
            )}
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              프로젝트 백업
            </Typography>
            <BackupPanel
              backups={backups}
              isLoading={isLoadingBackups}
              selectedBackup={selectedBackup}
              isCreating={isCreatingBackup}
              isRestoring={isRestoringBackup}
              onCreate={onBackupCreate}
              onRestore={onBackupRestore}
              onDelete={onBackupDelete}
              onDownload={onBackupDownload}
              onSelect={onBackupSelect}
              disabled={disabled}
            />
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              프로젝트 설정
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card elevation={1} sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                      프로젝트 관리
                    </Typography>
                    <Stack spacing={2}>
                      {onEditProject && (
                        <Button
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={onEditProject}
                          fullWidth
                          disabled={disabled}
                        >
                          프로젝트 편집
                        </Button>
                      )}
                      {onDeleteProject && (
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={onDeleteProject}
                          fullWidth
                          disabled={disabled}
                        >
                          프로젝트 삭제
                        </Button>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card elevation={1} sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                      데이터 관리
                    </Typography>
                    <Stack spacing={2}>
                      {onExportProject && (
                        <Button
                          variant="outlined"
                          startIcon={<DownloadIcon />}
                          onClick={onExportProject}
                          fullWidth
                          disabled={disabled}
                        >
                          프로젝트 내보내기
                        </Button>
                      )}
                      {onImportProject && (
                        <Button
                          variant="outlined"
                          startIcon={<UploadIcon />}
                          onClick={onImportProject}
                          fullWidth
                          disabled={disabled}
                        >
                          프로젝트 가져오기
                        </Button>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default ProjectDetailView;
