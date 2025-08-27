import React from 'react';
import {
  Box,
  Typography,
  Button,
  ButtonGroup,
  IconButton,
  Tooltip,
  Chip,
  Divider
} from '@mui/material';
import {
  Today as TodayIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  ViewModule as MonthIcon,
  ViewWeek as WeekIcon,
  ViewDay as DayIcon,
  ViewList as AgendaIcon
} from '@mui/icons-material';

const CalendarHeader = ({
  currentDate,
  view,
  onNavigatePeriod,
  onGoToToday,
  onChangeView,
  onGoToDate,
  disabled = false
}) => {
  const handlePrevPeriod = () => {
    if (onNavigatePeriod && !disabled) {
      onNavigatePeriod('prev');
    }
  };

  const handleNextPeriod = () => {
    if (onNavigatePeriod && !disabled) {
      onNavigatePeriod('next');
    }
  };

  const handleToday = () => {
    if (onGoToToday && !disabled) {
      onGoToToday();
    }
  };

  const handleViewChange = (newView) => {
    if (onChangeView && !disabled) {
      onChangeView(newView);
    }
  };

  const handleDateClick = (date) => {
    if (onGoToDate && !disabled) {
      onGoToDate(date);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long'
    });
  };

  const formatWeekRange = (start, end) => {
    const startStr = start.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  const formatDay = (date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const getViewTitle = () => {
    switch (view) {
      case 'month':
        return formatDate(currentDate);
      case 'week':
        // 현재 주의 시작일과 종료일 계산
        const start = new Date(currentDate);
        start.setDate(currentDate.getDate() - currentDate.getDay());
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return formatWeekRange(start, end);
      case 'day':
        return formatDay(currentDate);
      case 'agenda':
        return '일정 목록';
      default:
        return formatDate(currentDate);
    }
  };

  const getViewIcon = (viewType) => {
    switch (viewType) {
      case 'month':
        return <MonthIcon />;
      case 'week':
        return <WeekIcon />;
      case 'day':
        return <DayIcon />;
      case 'agenda':
        return <AgendaIcon />;
      default:
        return <MonthIcon />;
    }
  };

  const views = [
    { value: 'month', label: '월', icon: <MonthIcon /> },
    { value: 'week', label: '주', icon: <WeekIcon /> },
    { value: 'day', label: '일', icon: <DayIcon /> },
    { value: 'agenda', label: '목록', icon: <AgendaIcon /> }
  ];

  return (
    <Box sx={{ mb: 3 }}>
      {/* 상단 헤더 */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        {/* 제목 */}
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
            일정 관리
          </Typography>
          <Typography variant="h6" color="text.secondary">
            안전 관련 일정을 체계적으로 관리하세요
          </Typography>
        </Box>

        {/* 액션 버튼들 */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {/* 새 이벤트 버튼 */}
          <Button
            variant="contained"
            color="primary"
            size="large"
            disabled={disabled}
            sx={{ px: 3, py: 1.5 }}
          >
            새 일정
          </Button>
        </Box>
      </Box>

      {/* 캘린더 컨트롤 */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        p: 2,
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}>
        {/* 왼쪽: 네비게이션 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="이전 기간">
            <IconButton
              onClick={handlePrevPeriod}
              disabled={disabled}
              size="large"
            >
              <PrevIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="오늘">
            <IconButton
              onClick={handleToday}
              disabled={disabled}
              size="large"
              color="primary"
            >
              <TodayIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="다음 기간">
            <IconButton
              onClick={handleNextPeriod}
              disabled={disabled}
              size="large"
            >
              <NextIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* 중앙: 현재 기간 표시 */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 1 }}>
            {getViewTitle()}
          </Typography>
          
          {/* 현재 뷰 표시 */}
          <Chip
            label={views.find(v => v.value === view)?.label}
            icon={getViewIcon(view)}
            color="primary"
            variant="outlined"
            size="small"
          />
        </Box>

        {/* 오른쪽: 뷰 변경 */}
        <Box>
          <ButtonGroup variant="outlined" size="small">
            {views.map((viewOption) => (
              <Button
                key={viewOption.value}
                onClick={() => handleViewChange(viewOption.value)}
                disabled={disabled}
                variant={view === viewOption.value ? 'contained' : 'outlined'}
                startIcon={viewOption.icon}
                sx={{ 
                  minWidth: 'auto',
                  px: 2,
                  '&.MuiButton-contained': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText'
                  }
                }}
              >
                {viewOption.label}
              </Button>
            ))}
          </ButtonGroup>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* 빠른 날짜 이동 */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
          빠른 이동:
        </Typography>
        
        {[
          { label: '오늘', date: new Date() },
          { label: '내일', date: new Date(Date.now() + 24 * 60 * 60 * 1000) },
          { label: '다음 주', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
          { label: '다음 달', date: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1) }
        ].map((option) => (
          <Button
            key={option.label}
            variant="outlined"
            size="small"
            onClick={() => handleDateClick(option.date)}
            disabled={disabled}
            sx={{ 
              fontSize: '0.75rem',
              py: 0.5,
              px: 1.5,
              minWidth: 'auto'
            }}
          >
            {option.label}
          </Button>
        ))}
      </Box>
    </Box>
  );
};

export default CalendarHeader;
