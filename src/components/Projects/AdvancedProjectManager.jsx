import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  Avatar,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Alert,
  Skeleton,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  AlertTitle,
  Snackbar,
  TablePagination,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Business as BusinessIcon,
  Engineering as EngineeringIcon,
  Security as SafetyIcon,
  Assessment as AssessmentIcon,
  Search as SearchIcon,
  Sync as SyncIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  OpenInNew as OpenInNewIcon,
  Info as InfoIcon,
  PriorityHigh as PriorityIcon,
} from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import { motion } from 'framer-motion';
import { apiProjectStorage } from '../../utils/fileStorage';
import { getKoreanDate } from '../../utils/dateUtils';
import {
  getAllProjects,
  deleteProject as deleteProjectFromFS,
  createProjectBackup,
  createSystemBackup
} from '../../utils/fileSystemBrowser';
import { API } from '../../constants/api';

// 프로젝트 타입 설정
const projectTypes = {
  construction: { label: '건설공사', icon: <EngineeringIcon />, color: 'primary' },
  infrastructure: { label: '인프라', icon: <BusinessIcon />, color: 'secondary' },
  maintenance: { label: '정비점검', icon: <AssessmentIcon />, color: 'success' },
  manufacturing: { label: '제조업', icon: <EngineeringIcon />, color: 'warning' },
  energy: { label: '에너지', icon: <SafetyIcon />, color: 'info' },
};

const statusConfig = {
  active: { label: '진행중', color: 'success', icon: <TrendingUpIcon /> },
  completed: { label: '완료', color: 'primary', icon: <CheckCircleIcon /> },
  suspended: { label: '일시중단', color: 'warning', icon: <WarningIcon /> },
  planning: { label: '계획', color: 'info', icon: <ScheduleIcon /> },
};

const priorityConfig = {
  high: { label: '높음', color: 'error' },
  medium: { label: '보통', color: 'warning' },
  low: { label: '낮음', color: 'success' },
};

const riskConfig = {
  high: { label: '높음', color: 'error' },
  medium: { label: '보통', color: 'warning' },
  low: { label: '낮음', color: 'success' },
};

const AnimatedCard = motion(Card);

function AdvancedProjectManager() {
  const theme = useTheme();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [newProject, setNewProject] = useState({
    name: '',
    type: 'construction',
    status: 'planning',
    startDate: getKoreanDate(),  // ✅ 한국 시간대 기준 오늘 날짜
    endDate: getKoreanDate(),    // ✅ 한국 시간대 기준 오늘 날짜
    location: '',
    priority: 'medium',
    budget: '',
    teamSize: 1,
    // ✅ 현장정보 (site)
    site: {
      phone: '',
      email: '',
      management_number: '',
      construction_amount: '',
      responsible_person: ''
    },
    // ✅ 본사정보 (org) - 지도자명, 직책 제거
    org: {
      name: '', // 회사명
      phone: '', // 본사 연락처
      address: '', // 본사 주소
      registration_number: '', // 법인등록번호
      license_number: '' // 면허번호
    }
  });

  // 프로젝트 삭제 관련 상태
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteStep, setDeleteStep] = useState(1);
  const [successMessage, setSuccessMessage] = useState('');
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [backupType, setBackupType] = useState('project');
  const [selectedProjectForBackup, setSelectedProjectForBackup] = useState(null);

  // 프로젝트 데이터 로드
  useEffect(() => {
    loadProjects();
  }, []);

  // 필터링된 프로젝트 목록
  const getFilteredProjects = () => {
    let filtered = projects;

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(project =>
        (project.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.client || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.location || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 상태 필터링
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    // 유형 필터링
    if (typeFilter !== 'all') {
      filtered = filtered.filter(project => project.type === typeFilter);
    }

    return filtered;
  };

  // 필터링된 프로젝트 목록 업데이트
  useEffect(() => {
    const filtered = getFilteredProjects();
    setFilteredProjects(filtered);
    setPage(0); // 페이지 초기화
  }, [projects, searchTerm, statusFilter, typeFilter]);

  // 서버 API에서 프로젝트 데이터 로드
  const loadProjects = async () => {
    try {
      setIsDataLoading(true);
      setError(null);
      
      const response = await fetch(API.PROJECTS);
      const result = await response.json();
      
      // ✅ 백엔드 API 응답 구조에 맞게 수정: { ok: true, data: [...] }
      if (result.ok && result.data) {
        // API 응답을 배열 형태로 변환
        const projectsArray = Array.isArray(result.data) ? result.data : Object.values(result.data);
        setProjects(projectsArray);
      } else {
        setError('프로젝트 데이터를 불러오는데 실패했습니다: ' + (result.message || result.error || '알 수 없는 오류'));
        setProjects([]);
      }
      
    } catch (error) {
      console.error('프로젝트 로드 오류:', error);
      setError('프로젝트 데이터를 불러오는데 실패했습니다.');
      setProjects([]);
    } finally {
      setIsDataLoading(false);
    }
  };



  // 프로젝트 생성 (API를 통해 저장)
  const handleCreateProject = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const project = {
        ...newProject,
        id: Date.now().toString(),
        progress: 0,
        safetyScore: 0,
        reports: 0,
        lastInspection: new Date().toISOString().split('T')[0],
        riskLevel: 'medium',
        compliance: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // API를 통해 프로젝트 생성
      const createdProject = await apiProjectStorage.createProject(project);
      if (!createdProject) {
        throw new Error('프로젝트 생성에 실패했습니다.');
      }

      // 성공 메시지 표시
      setSuccessMessage('프로젝트가 성공적으로 생성되었습니다!');
      
      // 프로젝트 목록 새로고침
      await loadProjects();
      
             // ✅ 폼 초기화 (현장정보/기관정보 포함)
       setNewProject({
         name: '',
         type: 'construction',
         status: 'planning',
         startDate: new Date().toISOString().split('T')[0],
         endDate: new Date().toISOString().split('T')[0],
         location: '',
         priority: 'medium',
         budget: '',
         teamSize: 1,
         site: {
           phone: '',
           email: '',
           management_number: '',
           construction_amount: '',
           responsible_person: ''
         },
         org: {
           name: '',
           phone: '',
           address: '',
           registration_number: '',
           license_number: ''
         }
       });
      setShowCreateDialog(false);
      
    } catch (error) {
      console.error('프로젝트 생성 오류:', error);
      setError('프로젝트 생성에 실패했습니다: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 프로젝트 수정
  const handleEditProject = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 프로젝트 데이터 저장
      const saveResult = await saveProjectData(selectedProject);
      if (!saveResult.success) {
        throw new Error('프로젝트 수정에 실패했습니다: ' + saveResult.error);
      }

      // 성공 메시지 표시
      setSuccessMessage('프로젝트가 성공적으로 수정되었습니다!');
      
      // 프로젝트 목록 새로고침
      await loadProjects();
      
      setShowEditDialog(false);
      setSelectedProject(null);
      
    } catch (error) {
      console.error('프로젝트 수정 오류:', error);
      setError('프로젝트 수정에 실패했습니다: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 프로젝트 삭제
  const handleDeleteProject = async (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setProjectToDelete(project);
      setDeleteDialogOpen(true);
      setDeleteStep(1);
      setDeleteReason('');
      setDeleteConfirmation('');
    }
  };

  // ✅ Project TT 가이드라인: 삭제 실행 (API 서버 호출)
  const executeDelete = async () => {
    if (!projectToDelete) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // API 서버에서 프로젝트 삭제
      const response = await fetch(`${API.PROJECTS}/${projectToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.ok) {
        // 성공 메시지 표시
        setSuccessMessage('프로젝트가 성공적으로 삭제되었습니다!');
        
        // 프로젝트 목록 새로고침
        await loadProjects();
        
        // 다이얼로그 닫기
        setDeleteDialogOpen(false);
        setProjectToDelete(null);
      } else {
        // ✅ Project TT 가이드라인: Schema-first handling
        const errorMessage = result.message || '알 수 없는 오류가 발생했습니다';
        const errorDetails = result.details || '';
        const errorCode = result.code || 'UNKNOWN_ERROR';
        
        throw new Error(`${errorMessage}${errorDetails ? `: ${errorDetails}` : ''}`);
      }
      
    } catch (error) {
      console.error('프로젝트 삭제 오류:', error);
      
      // ✅ Project TT 가이드라인: Actionable copy - 사용자가 다음에 무엇을 해야 하는지 명확히 안내
      let userMessage = '프로젝트 삭제에 실패했습니다.';
      
      if (error.message.includes('네트워크')) {
        userMessage = '네트워크 연결을 확인하고 다시 시도해주세요.';
      } else if (error.message.includes('권한')) {
        userMessage = '프로젝트 삭제 권한이 없습니다. 관리자에게 문의하세요.';
      } else if (error.message.includes('사용 중')) {
        userMessage = '프로젝트가 다른 곳에서 사용 중입니다. 잠시 후 다시 시도해주세요.';
      } else if (error.message.includes('찾을 수 없습니다')) {
        userMessage = '프로젝트를 찾을 수 없습니다. 페이지를 새로고침하고 다시 시도해주세요.';
      }
      
      setError(userMessage);
    } finally {
      // ✅ Project TT 가이드라인: Loading flags end in finally
      setIsLoading(false);
    }
  };

  // 삭제 다이얼로그 닫기
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
    setDeleteReason('');
    setDeleteConfirmation('');
    setDeleteStep(1);
  };

  // 다음 단계로 진행
  const handleNextStep = () => {
    if (deleteStep === 1 && deleteReason.trim()) {
      setDeleteStep(2);
    } else if (deleteStep === 2 && deleteConfirmation === projectToDelete.name) {
      executeDelete();
    }
  };

  // 삭제 가능 여부 확인
  const canProceedToNextStep = () => {
    if (deleteStep === 1) {
      return deleteReason.trim().length > 0;
    } else if (deleteStep === 2) {
      return deleteConfirmation === projectToDelete?.name;
    }
    return false;
  };

  // 데이터 새로고침
  const handleRefreshData = () => {
    loadProjects();
  };

  // ✅ 개발용 프로젝트 데이터 자동 프리필
  const fillDevProjectData = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    setNewProject({
      name: '강남구 신축아파트 공사현장',
      type: 'construction',
      status: 'active',
      startDate: formattedDate,
      endDate: `${year + 1}-${month}-${day}`,
      location: '서울특별시 강남구 테헤란로 123',
      priority: 'high',
      budget: '150억원',
      teamSize: 25,
      // ✅ 현장정보 자동 프리필
      site: {
        phone: '02-1234-5678',
        email: 'safety@construction.co.kr',
        management_number: 'GN-2024-001',
        construction_amount: '150억원',
        responsible_person: '김안전'
      },
      // ✅ 기관정보 자동 프리필
      org: {
        name: 'ABC건설(주)',
        phone: '010-1234-5678',
        address: '서울특별시 강남구 테헤란로 456',
        registration_number: '123-45-67890',
        license_number: '건설업-123456'
      }
    });
    
    console.log('🚀 개발용 프로젝트 데이터 자동 입력 완료!');
  };

  // ✅ Project TT 가이드라인: 보고서 삭제 (API 서버 호출)
  const handleDeleteReport = async (projectId, reportId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`${API.PROJECTS}/${projectId}/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.ok) {
        setSuccessMessage('보고서가 성공적으로 삭제되었습니다.');
        
        // 프로젝트 목록 새로고침
        await loadProjects();
      } else {
        setError('보고서 삭제에 실패했습니다: ' + result.error);
      }
      
    } catch (error) {
      console.error('보고서 삭제 오류:', error);
      setError('보고서 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 백업 생성
  const handleCreateBackup = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let result;
      if (backupType === 'project' && selectedProjectForBackup) {
        result = await createProjectBackup(selectedProjectForBackup.name);
      } else {
        result = await createSystemBackup();
      }
      
      if (result.success) {
        setSuccessMessage(
          backupType === 'project' 
            ? '프로젝트 백업이 성공적으로 생성되었습니다!' 
            : '시스템 백업이 성공적으로 생성되었습니다!'
        );
        setShowBackupDialog(false);
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error('백업 생성 오류:', error);
      setError('백업 생성에 실패했습니다: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getProjectStats = () => {
    if (projects.length === 0) {
      return { total: 0, active: 0, completed: 0, suspended: 0, avgSafetyScore: 0, totalReports: 0 };
    }

    const total = projects.length;
    const active = projects.filter(p => p.status === 'active').length;
    const completed = projects.filter(p => p.status === 'completed').length;
    const suspended = projects.filter(p => p.status === 'suspended').length;
    const avgSafetyScore = projects.reduce((sum, p) => sum + (p.safetyScore || 0), 0) / total;
    const totalReports = projects.reduce((sum, p) => sum + (p.reports || 0), 0);

    return { total, active, completed, suspended, avgSafetyScore, totalReports };
  };

  const stats = getProjectStats();

  // 정렬 함수
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 정렬된 프로젝트 목록
  const getSortedProjects = () => {
    const sorted = [...filteredProjects].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // 숫자 필드 처리
      if (['progress', 'safetyScore', 'totalReports', 'teamSize'].includes(sortField)) {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      }
      
      // 문자열 필드 처리
      if (typeof aValue === 'string') {
        aValue = (aValue || '').toLowerCase();
        bValue = (bValue || '').toLowerCase();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  };

  // 정렬 아이콘 렌더링
  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  // 페이지네이션 함수들
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 페이지네이션된 프로젝트 목록
  const getPaginatedProjects = () => {
    const sorted = getSortedProjects();
    const startIndex = page * rowsPerPage;
    return sorted.slice(startIndex, startIndex + rowsPerPage);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
  };

  // 로딩 중일 때 스켈레톤 UI 표시
  if (isDataLoading) {
    return (
      <Box sx={{ p: 3, minHeight: '100vh', bgcolor: 'background.default' }}>
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" width="60%" height={60} />
          <Skeleton variant="text" width="40%" height={40} />
        </Box>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={12} md={6} lg={3} key={item}>
              <Skeleton variant="rectangular" height={120} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={200} />
      </Box>
    );
  }

  return (
    <Box
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      sx={{ p: 3, minHeight: '100vh', bgcolor: 'background.default' }}
    >
      {/* 에러 알림 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 헤더 */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h3" component="h1" gutterBottom fontWeight="bold" color="primary">
            🚀 고급 프로젝트 관리 시스템
          </Typography>
          <Typography variant="h6" color="text.secondary">
            MCP 통합 프로젝트 관리 및 안전 모니터링
          </Typography>
        </Box>
                 <Box sx={{ display: 'flex', gap: 2 }}>
           <Button
             variant="outlined"
             startIcon={<SyncIcon />}
             onClick={handleRefreshData}
             disabled={isDataLoading}
           >
             새로고침
           </Button>
           <Button
             variant="outlined"
             startIcon={<PriorityIcon />}
             onClick={() => setShowBackupDialog(true)}
             disabled={isLoading}
           >
             백업
           </Button>
                       <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                // ✅ 프로젝트 생성 폼 열 때 기본값으로 초기화
                setNewProject({
                  name: '',
                  type: 'construction',
                  status: 'planning',
                  startDate: new Date().toISOString().split('T')[0],
                  endDate: new Date().toISOString().split('T')[0],
                  location: '',
                  priority: 'medium',
                  budget: '',
                  teamSize: 1,
                  site: {
                    phone: '',
                    email: '',
                    management_number: '',
                    construction_amount: '',
                    responsible_person: ''
                  },
                  org: {
                    name: '',
                    phone: '',
                    address: '',
                    registration_number: '',
                    license_number: ''
                  }
                });
                setShowCreateDialog(true);
              }}
              sx={{ borderRadius: 2 }}
            >
              새 프로젝트
            </Button>
         </Box>
      </Box>

      {/* 통계 테이블 */}
      <AnimatedCard variants={itemVariants} sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" component="h2" gutterBottom>
            📊 프로젝트 통계
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>지표</TableCell>
                  <TableCell>값</TableCell>
                  <TableCell>상태</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BusinessIcon color="primary" />
                      총 프로젝트
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="h6" component="div" fontWeight="bold" color="primary">
                      {stats.total}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label="전체" color="primary" size="small" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUpIcon color="success" />
                      진행중
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="h6" component="div" fontWeight="bold" color="success">
                      {stats.active}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label="진행중" color="success" size="small" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleIcon color="primary" />
                      완료
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="h6" component="div" fontWeight="bold" color="primary">
                      {stats.completed}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label="완료" color="primary" size="small" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AssessmentIcon color="warning" />
                      총 보고서
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="h6" component="div" fontWeight="bold" color="warning">
                      {stats.totalReports}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label="보고서" color="warning" size="small" />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </AnimatedCard>

      {/* 데이터가 없을 때 안내 메시지 */}
      {projects.length === 0 && !isDataLoading && (
        <AnimatedCard variants={itemVariants} sx={{ mb: 3 }}>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              📋 프로젝트가 없습니다
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              첫 번째 프로젝트를 생성하여 안전관리를 시작해보세요.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowCreateDialog(true)}
            >
              프로젝트 생성하기
            </Button>
          </CardContent>
        </AnimatedCard>
      )}

      {/* 필터 및 검색 */}
      {projects.length > 0 && (
        <AnimatedCard variants={itemVariants} sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="프로젝트 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>상태</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    label="상태"
                  >
                    <MenuItem value="all">전체</MenuItem>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <MenuItem key={key} value={key}>
                        {config.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>유형</InputLabel>
                  <Select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    label="유형"
                  >
                    <MenuItem value="all">전체</MenuItem>
                    {Object.entries(projectTypes).map(([key, type]) => (
                      <MenuItem key={key} value={key}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setTypeFilter('all');
                  }}
                >
                  초기화
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </AnimatedCard>
      )}

      {/* 프로젝트 목록 */}
      {projects.length > 0 && (
        <AnimatedCard variants={itemVariants}>
          <CardContent>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" component="h2" gutterBottom>
                📋 프로젝트 목록 ({filteredProjects.length}개)
              </Typography>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell
                      onClick={() => handleSort('name')}
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                    >
                      프로젝트명 {getSortIcon('name')}
                    </TableCell>
                    <TableCell
                      onClick={() => handleSort('client')}
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                    >
                      클라이언트 {getSortIcon('client')}
                    </TableCell>
                    <TableCell
                      onClick={() => handleSort('location')}
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                    >
                      위치 {getSortIcon('location')}
                    </TableCell>
                    <TableCell
                      onClick={() => handleSort('type')}
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                    >
                      유형 {getSortIcon('type')}
                    </TableCell>
                    <TableCell
                      onClick={() => handleSort('status')}
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                    >
                      상태 {getSortIcon('status')}
                    </TableCell>
                    <TableCell
                      onClick={() => handleSort('priority')}
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                    >
                      우선순위 {getSortIcon('priority')}
                    </TableCell>
                    <TableCell
                      onClick={() => handleSort('progress')}
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                    >
                      진행률 {getSortIcon('progress')}
                    </TableCell>
                    <TableCell
                      onClick={() => handleSort('safetyScore')}
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                    >
                      안전점수 {getSortIcon('safetyScore')}
                    </TableCell>
                    <TableCell
                      onClick={() => handleSort('totalReports')}
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                    >
                      보고서 {getSortIcon('totalReports')}
                    </TableCell>
                    <TableCell>작업</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getPaginatedProjects().map((project) => (
                    <TableRow 
                      key={project.id}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                      }}
                      onClick={() => {
                        setSelectedProject(project);
                        setShowViewDialog(true);
                      }}
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {project.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {project.id}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {project.client}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {project.location}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={projectTypes[project.type]?.label}
                          color={projectTypes[project.type]?.color}
                          size="small"
                          icon={projectTypes[project.type]?.icon}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={statusConfig[project.status]?.label}
                          color={statusConfig[project.status]?.color}
                          size="small"
                          icon={statusConfig[project.status]?.icon}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={priorityConfig[project.priority]?.label}
                          color={priorityConfig[project.priority]?.color}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={project.progress || 0}
                            sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {project.progress || 0}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight="bold">
                            {project.safetyScore || 'N/A'}
                          </Typography>
                          {project.safetyScore && (
                            <Chip
                              label={project.safetyScore >= 80 ? '우수' : project.safetyScore >= 60 ? '양호' : '주의'}
                              color={project.safetyScore >= 80 ? 'success' : project.safetyScore >= 60 ? 'warning' : 'error'}
                              size="small"
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">
                            {project.totalReports || 0}개
                          </Typography>
                          {project.totalReports > 0 && (
                            <Chip
                              label={`최근: ${project.lastReportDate || 'N/A'}`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProject(project);
                              setShowViewDialog(true);
                            }}
                            title="상세보기"
                          >
                            <ViewIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProject(project);
                              setShowEditDialog(true);
                            }}
                            title="편집"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project.id);
                            }}
                            title="삭제"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredProjects.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </CardContent>
        </AnimatedCard>
      )}

      {/* 프로젝트 생성 다이얼로그 */}
      <Dialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>새 프로젝트 생성</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="프로젝트명"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>프로젝트 유형</InputLabel>
                <Select
                  value={newProject.type}
                  onChange={(e) => setNewProject({ ...newProject, type: e.target.value })}
                  label="프로젝트 유형"
                >
                  {Object.entries(projectTypes).map(([key, type]) => (
                    <MenuItem key={key} value={key}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="기관명 (일반 기관)"
                value={newProject.org?.name || ''}
                onChange={(e) => setNewProject({ 
                  ...newProject, 
                  org: { ...newProject.org, name: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="위치"
                value={newProject.location}
                onChange={(e) => setNewProject({ ...newProject, location: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="시작일"
                type="date"
                value={newProject.startDate}
                onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="종료일"
                type="date"
                value={newProject.endDate}
                onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>우선순위</InputLabel>
                <Select
                  value={newProject.priority}
                  onChange={(e) => setNewProject({ ...newProject, priority: e.target.value })}
                  label="우선순위"
                >
                  {Object.entries(priorityConfig).map(([key, config]) => (
                    <MenuItem key={key} value={key}>
                      {config.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="예산"
                value={newProject.budget}
                onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="팀 규모"
                value={newProject.teamSize}
                onChange={(e) => setNewProject({ ...newProject, teamSize: parseInt(e.target.value) })}
              />
            </Grid>
            
            {/* ✅ 현장정보 섹션 */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1, color: 'primary.main' }}>
                📍 현장 정보
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="현장 연락처"
                value={newProject.site?.phone || ''}
                onChange={(e) => setNewProject({ 
                  ...newProject, 
                  site: { ...newProject.site, phone: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="현장 이메일"
                type="email"
                value={newProject.site?.email || ''}
                onChange={(e) => setNewProject({ 
                  ...newProject, 
                  site: { ...newProject.site, email: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="관리번호"
                value={newProject.site?.management_number || ''}
                onChange={(e) => setNewProject({ 
                  ...newProject, 
                  site: { ...newProject.site, management_number: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="공사금액"
                value={newProject.site?.construction_amount || ''}
                onChange={(e) => setNewProject({ 
                  ...newProject, 
                  site: { ...newProject.site, construction_amount: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="현장 책임자"
                value={newProject.site?.responsible_person || ''}
                onChange={(e) => setNewProject({ 
                  ...newProject, 
                  site: { ...newProject.site, responsible_person: e.target.value }
                })}
              />
            </Grid>
            
            {/* ✅ 기관정보 섹션 */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1, color: 'primary.main' }}>
                🏢 기관 정보
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="기관명"
                value={newProject.org?.name || ''}
                onChange={(e) => setNewProject({ 
                  ...newProject, 
                  org: { ...newProject.org, name: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="기관 연락처"
                value={newProject.org?.phone || ''}
                onChange={(e) => setNewProject({ 
                  ...newProject, 
                  org: { ...newProject.org, phone: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="기관 주소"
                value={newProject.org?.address || ''}
                onChange={(e) => setNewProject({ 
                  ...newProject, 
                  org: { ...newProject.org, address: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="등록번호"
                value={newProject.org?.registration_number || ''}
                onChange={(e) => setNewProject({ 
                  ...newProject, 
                  org: { ...newProject.org, registration_number: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="면허번호"
                value={newProject.org?.license_number || ''}
                onChange={(e) => setNewProject({ 
                  ...newProject, 
                  org: { ...newProject.org, license_number: e.target.value }
                })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>취소</Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => fillDevProjectData()}
            sx={{ mr: 1 }}
          >
            🚀 개발용 데이터 자동입력
          </Button>
          <Button
            onClick={handleCreateProject}
            variant="contained"
            disabled={isLoading || !newProject.name}
          >
            {isLoading ? <CircularProgress size={20} /> : '생성'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 프로젝트 상세보기 다이얼로그 */}
      <Dialog
        open={showViewDialog}
        onClose={() => setShowViewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          프로젝트 상세정보
          <IconButton
            sx={{ position: 'absolute', right: 8, top: 8 }}
            onClick={() => setShowViewDialog(false)}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedProject && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  기본 정보
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">프로젝트명</Typography>
                  <Typography variant="body1" fontWeight="bold">{selectedProject.name}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">클라이언트</Typography>
                  <Typography variant="body1">{selectedProject.client}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">위치</Typography>
                  <Typography variant="body1">{selectedProject.location}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">안전관리자</Typography>
                  <Typography variant="body1">{selectedProject.safetyManager}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  진행 현황
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">진행률</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={selectedProject.progress || 0}
                      sx={{ flexGrow: 1, height: 8 }}
                    />
                    <Typography variant="body2" fontWeight="bold">
                      {selectedProject.progress || 0}%
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">안전점수</Typography>
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    {selectedProject.safetyScore || 0}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">보고서 수</Typography>
                  <Typography variant="body1">{selectedProject.reports || 0}건</Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  안전 현황
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="primary">
                          {selectedProject.safetyScore || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          안전점수
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="secondary">
                          {selectedProject.reports || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          보고서
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" color="info">
                          {selectedProject.teamSize || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          팀 규모
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowViewDialog(false)}>닫기</Button>
          <Button
            variant="contained"
            onClick={() => {
              setShowViewDialog(false);
              setShowEditDialog(true);
            }}
          >
            수정
          </Button>
        </DialogActions>
      </Dialog>

      {/* 프로젝트 수정 다이얼로그 */}
      <Dialog
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>프로젝트 수정</DialogTitle>
        <DialogContent>
          {selectedProject && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="프로젝트명"
                  value={selectedProject.name}
                  onChange={(e) => setSelectedProject({ ...selectedProject, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>상태</InputLabel>
                  <Select
                    value={selectedProject.status}
                    onChange={(e) => setSelectedProject({ ...selectedProject, status: e.target.value })}
                    label="상태"
                  >
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <MenuItem key={key} value={key}>
                        {config.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="안전점수"
                  type="number"
                  value={selectedProject.safetyScore || 0}
                  onChange={(e) => setSelectedProject({ ...selectedProject, safetyScore: parseInt(e.target.value) })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="진행률"
                  type="number"
                  value={selectedProject.progress || 0}
                  onChange={(e) => setSelectedProject({ ...selectedProject, progress: parseInt(e.target.value) })}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)}>취소</Button>
          <Button
            onClick={handleEditProject}
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={20} /> : '수정'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 프로젝트 삭제 확인 다이얼로그 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          color: 'error.main',
          borderBottom: '2px solid',
          borderColor: 'error.main',
          pb: 2
        }}>
          <WarningIcon color="error" />
          ⚠️ 프로젝트 영구 삭제 확인
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          {/* ✅ Project TT 가이드라인: 에러 발생 시 사용자에게 명확한 정보 제공 */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              <AlertTitle>❌ 프로젝트 삭제 실패</AlertTitle>
              {error}
            </Alert>
          )}
          
          {deleteStep === 1 && !error && (
            <>
              <Alert severity="error" sx={{ mb: 3 }}>
                <AlertTitle>⚠️ 주의!</AlertTitle>
                이 프로젝트는 <strong>영구적으로 삭제</strong>되며 복구할 수 없습니다!
              </Alert>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  삭제할 프로젝트 정보
                </Typography>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'grey.100', 
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'grey.300'
                }}>
                  <Typography variant="body1" fontWeight="bold" color="error.main">
                    {projectToDelete?.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    클라이언트: {projectToDelete?.client}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    위치: {projectToDelete?.location}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    상태: {projectToDelete?.status}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    보고서 수: {projectToDelete?.reports?.length || 0}개
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="body1" gutterBottom>
                삭제 이유를 입력해주세요:
              </Typography>
              <TextField
                fullWidth
                label="삭제 이유 (필수)"
                multiline
                rows={3}
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="예: 프로젝트 취소, 중복 등록, 잘못된 정보 등"
                sx={{ mb: 2 }}
              />
            </>
          )}
          
          {deleteStep === 2 && !error && (
            <>
              <Alert severity="warning" sx={{ mb: 3 }}>
                <AlertTitle>마지막 확인</AlertTitle>
                프로젝트명을 정확히 입력하여 최종 확인해주세요.
              </Alert>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" gutterBottom>
                  삭제 이유: <strong>{deleteReason}</strong>
                </Typography>
                <Typography variant="body1" gutterBottom>
                  프로젝트명: <strong style={{ color: 'red' }}>{projectToDelete?.name}</strong>
                </Typography>
              </Box>
              
              <Typography variant="body1" gutterBottom>
                위 프로젝트명을 정확히 입력하세요:
              </Typography>
              <TextField
                fullWidth
                label="프로젝트명 재입력"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder={projectToDelete?.name}
                sx={{ mb: 2 }}
                error={deleteConfirmation !== '' && deleteConfirmation !== projectToDelete?.name}
                helperText={
                  deleteConfirmation !== '' && deleteConfirmation !== projectToDelete?.name
                    ? '프로젝트명이 일치하지 않습니다.'
                    : ''
                }
              />
            </>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={handleDeleteDialogClose} 
            color="primary"
            variant="outlined"
          >
            취소
          </Button>
          
          {/* ✅ Project TT 가이드라인: Complete fallback UX - 에러 발생 시 복구 액션 제공 */}
          {error && (
            <>
              <Button
                onClick={() => {
                  setError(null);
                  executeDelete();
                }}
                variant="contained"
                color="primary"
                startIcon={<RefreshIcon />}
                sx={{ mr: 1 }}
              >
                재시도
              </Button>
              <Button
                onClick={() => {
                  // 프로젝트를 새 탭에서 HTML로 열기
                  const projectUrl = `${API.PROJECTS}/${projectToDelete?.id}?output=html`;
                  window.open(projectUrl, '_blank');
                }}
                variant="outlined"
                color="info"
                startIcon={<OpenInNewIcon />}
                sx={{ mr: 1 }}
              >
                HTML로 열기
              </Button>
              <Button
                onClick={() => {
                  // 로그 보기 (개발자 도구 콘솔에 표시)
                  console.log('프로젝트 삭제 오류 로그:', {
                    projectId: projectToDelete?.id,
                    projectName: projectToDelete?.name,
                    error: error,
                    timestamp: new Date().toISOString()
                  });
                  alert('로그가 개발자 도구 콘솔에 출력되었습니다. F12를 눌러 확인하세요.');
                }}
                variant="outlined"
                color="secondary"
                startIcon={<InfoIcon />}
                sx={{ mr: 1 }}
              >
                로그 보기
              </Button>
            </>
          )}
          
          {deleteStep === 1 && !error && (
            <Button
              onClick={handleNextStep}
              variant="contained"
              color="warning"
              disabled={!deleteReason.trim()}
              startIcon={<WarningIcon />}
            >
              다음 단계
            </Button>
          )}
          
          {deleteStep === 2 && !error && (
            <Button
              onClick={handleNextStep}
              variant="contained"
              color="error"
              disabled={deleteConfirmation !== projectToDelete?.name}
              startIcon={<DeleteIcon />}
            >
              영구 삭제
            </Button>
          )}
        </DialogActions>
       </Dialog>

       {/* 백업 다이얼로그 */}
       <Dialog
         open={showBackupDialog}
         onClose={() => setShowBackupDialog(false)}
         maxWidth="sm"
         fullWidth
       >
         <DialogTitle sx={{ 
           background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
           color: 'white'
         }}>
           백업 생성
         </DialogTitle>
         <DialogContent sx={{ pt: 3 }}>
           <FormControl fullWidth sx={{ mb: 2 }}>
             <InputLabel>백업 유형</InputLabel>
             <Select
               value={backupType}
               onChange={(e) => setBackupType(e.target.value)}
               label="백업 유형"
             >
               <MenuItem value="project">프로젝트 백업</MenuItem>
               <MenuItem value="system">전체 시스템 백업</MenuItem>
             </Select>
           </FormControl>
           
           {backupType === 'project' && (
             <FormControl fullWidth sx={{ mb: 2 }}>
               <InputLabel>프로젝트 선택</InputLabel>
               <Select
                 value={selectedProjectForBackup || ''}
                 onChange={(e) => setSelectedProjectForBackup(projects.find(p => p.id === e.target.value))}
                 label="프로젝트 선택"
               >
                 {projects.map((project) => (
                   <MenuItem key={project.id} value={project.id}>
                     {project.name}
                   </MenuItem>
                 ))}
               </Select>
             </FormControl>
           )}
           
           <Typography variant="body2" color="text.secondary">
             {backupType === 'project' 
               ? '선택한 프로젝트의 모든 데이터를 백업합니다.'
               : '전체 시스템의 모든 프로젝트와 데이터를 백업합니다.'
             }
           </Typography>
         </DialogContent>
         <DialogActions sx={{ p: 3, pt: 1 }}>
           <Button onClick={() => setShowBackupDialog(false)}>취소</Button>
           <Button
             onClick={handleCreateBackup}
             variant="contained"
             disabled={isLoading || (backupType === 'project' && !selectedProjectForBackup)}
             sx={{
               background: `linear-gradient(45deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
             }}
           >
             {isLoading ? <CircularProgress size={20} /> : '백업 생성'}
           </Button>
         </DialogActions>
       </Dialog>

       {/* 성공 메시지 */}
       <Snackbar
         open={!!successMessage}
         autoHideDuration={6000}
         onClose={() => setSuccessMessage('')}
         anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
       >
         <Alert onClose={() => setSuccessMessage('')} severity="success" sx={{ width: '100%' }}>
           {successMessage}
         </Alert>
       </Snackbar>
     </Box>
   );
 }

export default AdvancedProjectManager;
