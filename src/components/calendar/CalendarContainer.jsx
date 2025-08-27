import React from 'react';
import { useCalendar } from './hooks/useCalendar';
import CalendarView from './CalendarView';

const CalendarContainer = () => {
  // useCalendar 훅을 사용하여 상태와 로직 관리
  const {
    // 상태
    currentDate,
    selectedDate,
    selectedEvent,
    view,
    events,
    isLoading,
    error,
    filters,

    // 액션 함수들
    fetchEvents,
    goToDate,
    navigatePeriod,
    goToToday,
    changeView,
    selectDate,
    selectEvent,
    updateFilters,
    clearFilters,
    createEvent,
    updateEvent,
    deleteEvent
  } = useCalendar();

  // 이벤트 핸들러들
  const handleNavigatePeriod = (direction) => {
    navigatePeriod(direction);
  };

  const handleGoToToday = () => {
    goToToday();
  };

  const handleChangeView = (newView) => {
    changeView(newView);
  };

  const handleGoToDate = (date) => {
    goToDate(date);
  };

  const handleFiltersChange = (newFilters) => {
    updateFilters(newFilters);
  };

  const handleFiltersClear = () => {
    clearFilters();
  };

  const handleSearch = (searchTerm) => {
    // 검색어를 필터에 추가하거나 별도 처리
    if (searchTerm) {
      // TODO: 검색 로직 구현
      console.log('검색:', searchTerm);
    }
  };

  const handleAddEvent = () => {
    // TODO: 새 일정 추가 모달 열기
    console.log('새 일정 추가');
  };

  const handleRefresh = () => {
    fetchEvents();
  };

  const handleToggleListView = () => {
    // 리스트 뷰와 그리드 뷰 전환
    if (view === 'agenda') {
      changeView('month');
    } else {
      changeView('agenda');
    }
  };

  const handleDateSelect = (date) => {
    selectDate(date);
  };

  const handleEventClick = (event) => {
    selectEvent(event);
    // TODO: 이벤트 상세 모달 열기
    console.log('이벤트 클릭:', event);
  };

  const handleEventMore = (event) => {
    // TODO: 이벤트 추가 액션 메뉴 열기
    console.log('이벤트 추가 액션:', event);
  };

  return (
    <CalendarView
      // 캘린더 데이터
      currentDate={currentDate}
      selectedDate={selectedDate}
      selectedEvent={selectedEvent}
      view={view}
      events={events}
      isLoading={isLoading}
      error={error}

      // 필터 상태
      filters={filters}

      // 이벤트 핸들러들
      onNavigatePeriod={handleNavigatePeriod}
      onGoToToday={handleGoToToday}
      onChangeView={handleChangeView}
      onGoToDate={handleGoToDate}
      onFiltersChange={handleFiltersChange}
      onFiltersClear={handleFiltersClear}
      onSearch={handleSearch}
      onAddEvent={handleAddEvent}
      onRefresh={handleRefresh}
      onToggleListView={handleToggleListView}
      onDateSelect={handleDateSelect}
      onEventClick={handleEventClick}
      onEventMore={handleEventMore}

      disabled={isLoading}
    />
  );
};

export default CalendarContainer;
