import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Alert,
  Skeleton,
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import {
  ViewModule as MonthIcon,
  ViewWeek as WeekIcon,
  ViewDay as DayIcon,
  ViewList as AgendaIcon
} from '@mui/icons-material';

// 컴포넌트들
import CalendarHeader from './components/CalendarHeader';
import CalendarControls from './components/CalendarControls';
import CalendarGrid from './components/CalendarGrid';

const CalendarView = ({
  // 캘린더 데이터
  currentDate,
  selectedDate,
  selectedEvent,
  view,
  events = [],
  isLoading = false,
  error = null,

  // 필터 상태
  filters = {},

  // 이벤트 핸들러들
  onNavigatePeriod,
  onGoToToday,
  onChangeView,
  onGoToDate,
  onFiltersChange,
  onFiltersClear,
  onSearch,
  onAddEvent,
  onRefresh,
  onToggleListView,
  onDateSelect,
  onEventClick,
  onEventMore,

  disabled = false
}) => {
  const handleViewChange = (event, newView) => {
    if (onChangeView && !disabled) {
      onChangeView(newView);
    }
  };

  const handleTabChange = (event, newValue) => {
    handleViewChange(event, newValue);
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

  const getViewLabel = (viewType) => {
    switch (viewType) {
      case 'month':
        return '월간';
      case 'week':
        return '주간';
      case 'day':
        return '일간';
      case 'agenda':
        return '목록';
      default:
        return '월간';
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Skeleton variant="text" width="60%" height={48} />
          <Skeleton variant="rectangular" height={200} />
          <Skeleton variant="rectangular" height={600} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* 헤더 */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
              캘린더
            </Typography>
            <Typography variant="h6" color="text.secondary">
              안전 관련 일정을 체계적으로 관리하세요
            </Typography>
          </Box>
        </Box>

        {/* 통계 정보 */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 600 }}>
                {events.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                총 일정
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 600 }}>
                {events.filter(e => e.status === 'completed').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                완료된 일정
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="info.main" sx={{ fontWeight: 600 }}>
                {events.filter(e => e.status === 'in_progress').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                진행중인 일정
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main" sx={{ fontWeight: 600 }}>
                {events.filter(e => e.status === 'pending').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                대기중인 일정
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* 에러 표시 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 캘린더 헤더 */}
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onNavigatePeriod={onNavigatePeriod}
        onGoToToday={onGoToToday}
        onChangeView={onChangeView}
        onGoToDate={onGoToDate}
        disabled={disabled}
      />

      {/* 뷰 선택 탭 */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={view}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {['month', 'week', 'day', 'agenda'].map((viewType) => (
            <Tab
              key={viewType}
              value={viewType}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getViewIcon(viewType)}
                  {getViewLabel(viewType)}
                </Box>
              }
              disabled={disabled}
            />
          ))}
        </Tabs>
      </Paper>

      {/* 캘린더 컨트롤 */}
      <CalendarControls
        filters={filters}
        onFiltersChange={onFiltersChange}
        onClearFilters={onFiltersClear}
        onSearch={onSearch}
        onAddEvent={onAddEvent}
        onRefresh={onRefresh}
        onToggleListView={onToggleListView}
        showListView={view === 'agenda'}
        disabled={disabled}
      />

      {/* 캘린더 그리드 */}
      {(view === 'month' || view === 'week') && (
        <CalendarGrid
          view={view}
          currentDate={currentDate}
          events={events}
          selectedDate={selectedDate}
          onDateSelect={onDateSelect}
          onEventClick={onEventClick}
          onAddEvent={onAddEvent}
          onEventMore={onEventMore}
          disabled={disabled}
        />
      )}

      {/* 일간 뷰 */}
      {view === 'day' && (
        <Paper variant="outlined" sx={{ p: 3, minHeight: 400 }}>
          <Typography variant="h6" gutterBottom>
            {selectedDate ? selectedDate.toLocaleDateString('ko-KR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            }) : '날짜를 선택해주세요'}
          </Typography>
          
          {selectedDate && (
            <Box>
              {events.filter(event => {
                const eventDate = new Date(event.startDate);
                return eventDate.toDateString() === selectedDate.toDateString();
              }).map(event => (
                <Box
                  key={event.id}
                  sx={{
                    p: 2,
                    mb: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    bgcolor: 'background.paper',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                  onClick={() => onEventClick?.(event)}
                >
                  <Typography variant="subtitle1" fontWeight={600}>
                    {event.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {event.description}
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="caption" color="primary">
                      {event.startDate.toLocaleTimeString('ko-KR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })} - {event.endDate.toLocaleTimeString('ko-KR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      • {event.assignee}
                    </Typography>
                  </Box>
                </Box>
              ))}
              
              {events.filter(event => {
                const eventDate = new Date(event.startDate);
                return eventDate.toDateString() === selectedDate.toDateString();
              }).length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    이 날에는 일정이 없습니다.
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Paper>
      )}

      {/* 목록 뷰 */}
      {view === 'agenda' && (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            일정 목록
          </Typography>
          
          {events.length > 0 ? (
            <Box>
              {events
                .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                .map(event => (
                  <Box
                    key={event.id}
                    sx={{
                      p: 2,
                      mb: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      bgcolor: 'background.paper',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                    onClick={() => onEventClick?.(event)}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {event.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {event.description}
                        </Typography>
                        <Box sx={{ mt: 1, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                          <Typography variant="caption" color="primary">
                            📅 {event.startDate.toLocaleDateString('ko-KR')} {event.startDate.toLocaleTimeString('ko-KR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            👤 {event.assignee}
                          </Typography>
                          {event.projectName && (
                            <Typography variant="caption" color="text.secondary">
                              🏗️ {event.projectName}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography
                          variant="caption"
                          sx={{
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            bgcolor: event.status === 'completed' ? 'success.light' :
                                    event.status === 'in_progress' ? 'info.light' :
                                    event.status === 'cancelled' ? 'error.light' : 'warning.light',
                            color: event.status === 'completed' ? 'success.dark' :
                                   event.status === 'in_progress' ? 'info.dark' :
                                   event.status === 'cancelled' ? 'error.dark' : 'warning.dark'
                          }}
                        >
                          {event.status === 'completed' ? '완료' :
                           event.status === 'in_progress' ? '진행중' :
                           event.status === 'cancelled' ? '취소됨' : '대기중'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                일정이 없습니다.
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* 빈 상태 안내 */}
      {!isLoading && events.length === 0 && !error && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            📅 일정이 없습니다
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            첫 번째 안전 관련 일정을 추가해보세요!
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              • 안전점검 일정
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • 교육 일정
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • 회의 일정
            </Typography>
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default CalendarView;
