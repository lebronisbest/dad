import React from 'react';
import {
  TableRow,
  TableCell,
  Checkbox,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Box,
  Avatar,
  Collapse
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';

const ReportRow = ({
  report,
  isSelected = false,
  onSelect,
  onView,
  onEdit,
  onDelete,
  onDownload,
  onStatusChange,
  disabled = false,
  showActions = true
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleSelect = () => {
    if (onSelect && !disabled) {
      onSelect(report.id);
    }
  };

  const handleView = () => {
    if (onView && !disabled) {
      onView(report);
    }
  };

  const handleEdit = () => {
    if (onEdit && !disabled) {
      onEdit(report);
    }
  };

  const handleDelete = () => {
    if (onDelete && !disabled) {
      onDelete(report.id);
    }
  };

  const handleDownload = () => {
    if (onDownload && !disabled) {
      onDownload(report);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('ko-KR');
    } catch {
      return dateString;
    }
  };

  const getReportTypeLabel = (type) => {
    const typeLabels = {
      'safety_inspection': '안전점검',
      'incident_report': '사고보고',
      'risk_assessment': '위험성평가',
      'training_report': '교육보고',
      'audit_report': '감사보고',
      'compliance_report': '준수보고'
    };
    return typeLabels[type] || type;
  };

  const getReportStatusLabel = (status) => {
    const statusLabels = {
      'draft': '초안',
      'completed': '완료',
      'submitted': '제출됨',
      'approved': '승인됨',
      'rejected': '반려됨'
    };
    return statusLabels[status] || status;
  };

  const getReportStatusColor = (status) => {
    const statusColors = {
      'draft': 'default',
      'completed': 'success',
      'submitted': 'info',
      'approved': 'success',
      'rejected': 'error'
    };
    return statusColors[status] || 'default';
  };

  const getPriorityColor = (priority) => {
    const priorityColors = {
      'low': 'success',
      'medium': 'warning',
      'high': 'error',
      'critical': 'error'
    };
    return priorityColors[priority] || 'default';
  };

  const getPriorityLabel = (priority) => {
    const priorityLabels = {
      'low': '낮음',
      'medium': '보통',
      'high': '높음',
      'critical': '긴급'
    };
    return priorityLabels[priority] || priority;
  };

  return (
    <>
      <TableRow
        hover
        selected={isSelected}
        sx={{ cursor: 'pointer' }}
        onClick={handleView}
      >
        {/* 선택 체크박스 */}
        <TableCell padding="checkbox">
          <Checkbox
            checked={isSelected}
            onChange={handleSelect}
            disabled={disabled}
            onClick={(e) => e.stopPropagation()}
          />
        </TableCell>

        {/* 제목 */}
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded();
              }}
              disabled={disabled}
            >
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
            <Box>
              <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5 }}>
                {report.title}
              </Typography>
              {report.tags && report.tags.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {report.tags.slice(0, 2).map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      size="small"
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  ))}
                  {report.tags.length > 2 && (
                    <Chip
                      label={`+${report.tags.length - 2}`}
                      size="small"
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                </Box>
              )}
            </Box>
          </Box>
        </TableCell>

        {/* 타입 */}
        <TableCell>
          <Chip
            label={getReportTypeLabel(report.type)}
            size="small"
            variant="outlined"
            color="primary"
          />
        </TableCell>

        {/* 프로젝트 */}
        <TableCell>
          <Typography variant="body2" color="text.secondary">
            {report.project_name}
          </Typography>
        </TableCell>

        {/* 상태 */}
        <TableCell>
          <Chip
            label={getReportStatusLabel(report.status)}
            size="small"
            color={getReportStatusColor(report.status)}
          />
        </TableCell>

        {/* 우선순위 */}
        <TableCell>
          <Chip
            label={getPriorityLabel(report.priority)}
            size="small"
            variant="outlined"
            color={getPriorityColor(report.priority)}
          />
        </TableCell>

        {/* 작성자 */}
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
              {report.author.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="body2" fontSize="0.8rem">
              {report.author}
            </Typography>
          </Box>
        </TableCell>

        {/* 생성일 */}
        <TableCell>
          <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
            {formatDate(report.created_date)}
          </Typography>
        </TableCell>

        {/* 액션 */}
        {showActions && (
          <TableCell align="center">
            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
              <Tooltip title="보기">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleView();
                  }}
                  disabled={disabled}
                  sx={{ color: 'primary.main' }}
                >
                  <ViewIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="편집">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit();
                  }}
                  disabled={disabled}
                  sx={{ color: 'warning.main' }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="다운로드">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload();
                  }}
                  disabled={disabled}
                  sx={{ color: 'info.main' }}
                >
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="삭제">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  disabled={disabled}
                  sx={{ color: 'error.main' }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </TableCell>
        )}
      </TableRow>

      {/* 확장된 상세 정보 */}
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={showActions ? 9 : 8}>
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                상세 정보
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">수정일</Typography>
                  <Typography variant="body2">{formatDate(report.updated_date)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">보고서 ID</Typography>
                  <Typography variant="body2">{report.id}</Typography>
                </Box>
                {report.tags && report.tags.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">태그</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {report.tags.map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

export default ReportRow;
