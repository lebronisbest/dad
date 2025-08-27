import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';

const CalendarGrid = ({
  view,
  currentDate,
  events = [],
  selectedDate,
  onDateSelect,
  onEventClick,
  onAddEvent,
  onEventMore,
  disabled = false
}) => {
  // 월간 뷰를 위한 날짜 그리드 생성
  const generateMonthGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // 해당 월의 첫 번째 날과 마지막 날
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 첫 번째 날의 요일 (0: 일요일, 1: 월요일, ...)
    const firstDayOfWeek = firstDay.getDay();
    
    // 이전 달의 마지막 날들
    const prevMonthDays = [];
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      prevMonthDays.push(new Date(year, month - 1, prevMonth.getDate() - i));
    }
    
    // 현재 달의 날들
    const currentMonthDays = [];
    for (let day = 1; day <= lastDay.getDate(); day++) {
      currentMonthDays.push(new Date(year, month, day));
    }
    
    // 다음 달의 첫 번째 날들
    const nextMonthDays = [];
    const remainingCells = 42 - (prevMonthDays.length + currentMonthDays.length);
    for (let day = 1; day <= remainingCells; day++) {
      nextMonthDays.push(new Date(year, month + 1, day));
    }
    
    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  };

  // 주간 뷰를 위한 날짜 그리드 생성
  const generateWeekGrid = () => {
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() - currentDate.getDay());
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      weekDays.push(day);
    }
    
    return weekDays;
  };

  // 특정 날짜의 이벤트들 가져오기
  const getEventsForDate = (date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return eventStart <= endOfDay && eventEnd >= startOfDay;
    });
  };

  // 날짜가 오늘인지 확인
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // 날짜가 현재 월/주에 속하는지 확인
  const isCurrentPeriod = (date) => {
    if (view === 'month') {
      return date.getMonth() === currentDate.getMonth();
    } else if (view === 'week') {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return date >= weekStart && date <= weekEnd;
    }
    return true;
  };

  // 날짜가 선택된 날짜인지 확인
  const isSelected = (date) => {
    if (!selectedDate) return false;
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };

  // 이벤트 타입에 따른 색상 반환
  const getEventColor = (event) => {
    return event.color || '#2196f3';
  };

  // 이벤트 우선순위에 따른 스타일 반환
  const getEventStyle = (event) => {
    const baseStyle = {
      backgroundColor: getEventColor(event),
      color: 'white',
      fontSize: '0.75rem',
      padding: '2px 6px',
      margin: '1px 0',
      borderRadius: '4px',
      cursor: 'pointer',
      '&:hover': {
        opacity: 0.8
      }
    };

    if (event.priority === 'critical') {
      baseStyle.border = '2px solid #f44336';
    } else if (event.priority === 'high') {
      baseStyle.border = '1px solid #ff9800';
    }

    return baseStyle;
  };

  const handleDateClick = (date) => {
    if (onDateSelect && !disabled) {
      onDateSelect(date);
    }
  };

  const handleEventClick = (event, e) => {
    e.stopPropagation();
    if (onEventClick && !disabled) {
      onEventClick(event);
    }
  };

  const handleAddEvent = (date, e) => {
    e.stopPropagation();
    if (onAddEvent && !disabled) {
      onAddEvent(date);
    }
  };

  const handleEventMore = (event, e) => {
    e.stopPropagation();
    if (onEventMore && !disabled) {
      onEventMore(event);
    }
  };

  const renderDateCell = (date, index) => {
    const dayEvents = getEventsForDate(date);
    const isCurrent = isCurrentPeriod(date);
    const isTodayDate = isToday(date);
    const isSelectedDate = isSelected(date);

    return (
      <Box
        key={index}
        sx={{
          minHeight: view === 'month' ? 120 : 80,
          p: 1,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: isTodayDate ? 'primary.light' : 
                  isSelectedDate ? 'primary.main' : 
                  isCurrent ? 'background.paper' : 'grey.50',
          color: isTodayDate || isSelectedDate ? 'primary.contrastText' : 'text.primary',
          cursor: 'pointer',
          position: 'relative',
          '&:hover': {
            bgcolor: isTodayDate ? 'primary.main' : 
                    isSelectedDate ? 'primary.dark' : 
                    'action.hover'
          }
        }}
        onClick={() => handleDateClick(date)}
      >
        {/* 날짜 헤더 */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 1
        }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: isTodayDate || isSelectedDate ? 700 : 500,
              fontSize: view === 'month' ? '0.875rem' : '0.75rem'
            }}
          >
            {date.getDate()}
          </Typography>
          
          {/* 새 이벤트 추가 버튼 */}
          <Tooltip title="새 일정 추가">
            <IconButton
              size="small"
              onClick={(e) => handleAddEvent(date, e)}
              disabled={disabled}
              sx={{
                color: 'inherit',
                opacity: 0.7,
                '&:hover': { opacity: 1 },
                width: 20,
                height: 20
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* 이벤트들 */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {dayEvents.slice(0, view === 'month' ? 3 : 2).map((event) => (
            <Box
              key={event.id}
              sx={getEventStyle(event)}
              onClick={(e) => handleEventClick(event, e)}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                gap: 0.5
              }}>
                <Typography
                  variant="caption"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1
                  }}
                >
                  {event.title}
                </Typography>
                
                <IconButton
                  size="small"
                  onClick={(e) => handleEventMore(event, e)}
                  disabled={disabled}
                  sx={{
                    color: 'inherit',
                    opacity: 0.7,
                    '&:hover': { opacity: 1 },
                    width: 16,
                    height: 16,
                    p: 0
                  }}
                >
                  <MoreIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          ))}
          
          {/* 더 많은 이벤트가 있는 경우 표시 */}
          {dayEvents.length > (view === 'month' ? 3 : 2) && (
            <Chip
              label={`+${dayEvents.length - (view === 'month' ? 3 : 2)}개 더`}
              size="small"
              variant="outlined"
              sx={{
                fontSize: '0.7rem',
                height: 20,
                cursor: 'pointer'
              }}
              onClick={() => handleDateClick(date)}
            />
          )}
        </Box>
      </Box>
    );
  };

  const renderGrid = () => {
    if (view === 'month') {
      const monthGrid = generateMonthGrid();
      return (
        <Grid container spacing={0}>
          {/* 요일 헤더 */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex' }}>
              {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                <Box
                  key={day}
                  sx={{
                    flex: 1,
                    p: 2,
                    textAlign: 'center',
                    bgcolor: 'grey.100',
                    border: '1px solid',
                    borderColor: 'divider',
                    fontWeight: 600,
                    color: index === 0 ? 'error.main' : 'text.primary'
                  }}
                >
                  {day}
                </Box>
              ))}
            </Box>
          </Grid>
          
          {/* 날짜 그리드 */}
          {monthGrid.map((date, index) => (
            <Grid item xs={12/7} key={index}>
              {renderDateCell(date, index)}
            </Grid>
          ))}
        </Grid>
      );
    } else if (view === 'week') {
      const weekGrid = generateWeekGrid();
      return (
        <Grid container spacing={0}>
          {/* 요일 헤더 */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex' }}>
              {weekGrid.map((date, index) => (
                <Box
                  key={index}
                  sx={{
                    flex: 1,
                    p: 2,
                    textAlign: 'center',
                    bgcolor: 'grey.100',
                    border: '1px solid',
                    borderColor: 'divider',
                    fontWeight: 600,
                    color: index === 0 ? 'error.main' : 'text.primary'
                  }}
                >
                  <Box>
                    {date.toLocaleDateString('ko-KR', { weekday: 'short' })}
                  </Box>
                  <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                    {date.getDate()}
                  </Box>
                </Box>
              ))}
            </Box>
          </Grid>
          
          {/* 날짜 그리드 */}
          {weekGrid.map((date, index) => (
            <Grid item xs={12/7} key={index}>
              {renderDateCell(date, index)}
            </Grid>
          ))}
        </Grid>
      );
    }
    
    return null;
  };

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      {renderGrid()}
    </Paper>
  );
};

export default CalendarGrid;
