import { useState, useEffect, useCallback, useMemo } from 'react';
import { API } from '../../../constants/api.js';

// 이벤트 데이터 타입
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  type: 'safety_inspection' | 'incident_report' | 'training' | 'meeting' | 'deadline' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  projectId?: string;
  projectName?: string;
  assignee?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  color?: string;
}

// 날짜 범위 타입
export interface DateRange {
  start: Date;
  end: Date;
}

// 캘린더 뷰 타입
export type CalendarView = 'month' | 'week' | 'day' | 'agenda';

// 캘린더 상태 타입
export interface CalendarState {
  currentDate: Date;
  selectedDate: Date | null;
  selectedEvent: CalendarEvent | null;
  view: CalendarView;
  events: CalendarEvent[];
  isLoading: boolean;
  error: string | null;
  filters: {
    eventTypes: string[];
    priorities: string[];
    projects: string[];
    assignees: string[];
    statuses: string[];
  };
}

// 초기 상태
const getInitialCalendarState = (): CalendarState => ({
  currentDate: new Date(),
  selectedDate: null,
  selectedEvent: null,
  view: 'month',
  events: [],
  isLoading: false,
  error: null,
  filters: {
    eventTypes: [],
    priorities: [],
    projects: [],
    assignees: [],
    statuses: []
  }
});

export const useCalendar = () => {
  const [calendarState, setCalendarState] = useState<CalendarState>(getInitialCalendarState());

  // 현재 월의 시작일과 종료일 계산
  const currentMonthRange = useMemo(() => {
    const year = calendarState.currentDate.getFullYear();
    const month = calendarState.currentDate.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    return { start, end };
  }, [calendarState.currentDate]);

  // 현재 주의 시작일과 종료일 계산
  const currentWeekRange = useMemo(() => {
    const current = new Date(calendarState.currentDate);
    const start = new Date(current);
    start.setDate(current.getDate() - current.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
  }, [calendarState.currentDate]);

  // 필터링된 이벤트 계산
  const filteredEvents = useMemo(() => {
    let events = calendarState.events;

    // 이벤트 타입 필터
    if (calendarState.filters.eventTypes.length > 0) {
      events = events.filter(event => 
        calendarState.filters.eventTypes.includes(event.type)
      );
    }

    // 우선순위 필터
    if (calendarState.filters.priorities.length > 0) {
      events = events.filter(event => 
        calendarState.filters.priorities.includes(event.priority)
      );
    }

    // 프로젝트 필터
    if (calendarState.filters.projects.length > 0) {
      events = events.filter(event => 
        event.projectId && calendarState.filters.projects.includes(event.projectId)
      );
    }

    // 담당자 필터
    if (calendarState.filters.assignees.length > 0) {
      events = events.filter(event => 
        event.assignee && calendarState.filters.assignees.includes(event.assignee)
      );
    }

    // 상태 필터
    if (calendarState.filters.statuses.length > 0) {
      events = events.filter(event => 
        calendarState.filters.statuses.includes(event.status)
      );
    }

    return events;
  }, [calendarState.events, calendarState.filters]);

  // 현재 뷰에 따른 이벤트 계산
  const viewEvents = useMemo(() => {
    const events = filteredEvents;
    
    switch (calendarState.view) {
      case 'month':
        return events.filter(event => 
          event.startDate >= currentMonthRange.start && 
          event.startDate <= currentMonthRange.end
        );
      case 'week':
        return events.filter(event => 
          event.startDate >= currentWeekRange.start && 
          event.startDate <= currentWeekRange.end
        );
      case 'day':
        if (calendarState.selectedDate) {
          const selectedDay = new Date(calendarState.selectedDate);
          selectedDay.setHours(0, 0, 0, 0);
          const nextDay = new Date(selectedDay);
          nextDay.setDate(selectedDay.getDate() + 1);
          
          return events.filter(event => 
            event.startDate >= selectedDay && event.startDate < nextDay
          );
        }
        return [];
      case 'agenda':
        return events.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
      default:
        return events;
    }
  }, [filteredEvents, calendarState.view, currentMonthRange, currentWeekRange, calendarState.selectedDate]);

  // 이벤트 조회
  const fetchEvents = useCallback(async () => {
    try {
      setCalendarState(prev => ({ ...prev, isLoading: true, error: null }));

              // 실제 프로젝트 데이터에서 이벤트 생성
        try {
          const response = await fetch(API.PROJECTS);
        if (response.ok) {
          const projects = await response.json();
          
          // 프로젝트 데이터를 기반으로 이벤트 생성
          const generatedEvents: CalendarEvent[] = [];
          let eventId = 1;
          
          Object.values(projects).forEach((project: any) => {
            // 프로젝트 시작일을 기준으로 이벤트 생성
            if (project.startDate) {
              const startDate = new Date(project.startDate);
              
              // 안전점검 이벤트 (프로젝트 시작일 + 7일)
              const inspectionDate = new Date(startDate);
              inspectionDate.setDate(startDate.getDate() + 7);
              generatedEvents.push({
                id: `event_${eventId++}`,
                title: `안전점검 - ${project.name}`,
                description: '프로젝트 시작 후 첫 안전점검',
                startDate: inspectionDate,
                endDate: new Date(inspectionDate.getTime() + 8 * 60 * 60 * 1000), // 8시간 후
                type: 'safety_inspection',
                priority: 'high',
                projectId: project.id,
                projectName: project.name,
                assignee: project.safetyManager || '안전관리자',
                status: 'pending',
                color: '#2196f3'
              });
              
              // 안전교육 이벤트 (프로젝트 시작일 + 14일)
              const trainingDate = new Date(startDate);
              trainingDate.setDate(startDate.getDate() + 14);
              generatedEvents.push({
                id: `event_${eventId++}`,
                title: `안전교육 - ${project.name}`,
                description: '신규 작업자 안전교육',
                startDate: trainingDate,
                endDate: new Date(trainingDate.getTime() + 2 * 60 * 60 * 1000), // 2시간 후
                type: 'training',
                priority: 'medium',
                projectId: project.id,
                projectName: project.name,
                assignee: project.safetyManager || '안전관리자',
                status: 'pending',
                color: '#4caf50'
              });
              
              // 월간 보고서 마감일 (매월 말일)
              const reportDate = new Date(startDate);
              reportDate.setDate(1); // 다음 달 1일
              reportDate.setMonth(reportDate.getMonth() + 1);
              reportDate.setDate(0); // 이번 달 마지막 날
              generatedEvents.push({
                id: `event_${eventId++}`,
                title: `월간 보고서 마감 - ${project.name}`,
                description: '월간 안전보고서 제출 마감',
                startDate: reportDate,
                endDate: new Date(reportDate.getTime() + 1 * 60 * 60 * 1000), // 1시간 후
                type: 'deadline',
                priority: 'critical',
                projectId: project.id,
                projectName: project.name,
                assignee: project.safetyManager || '안전관리자',
                status: 'pending',
                color: '#f44336'
              });
            }
          });
          
          setCalendarState(prev => ({
            ...prev,
            events: generatedEvents,
            isLoading: false
          }));
          
          console.log('캘린더 이벤트 로드 완료:', generatedEvents);
          return;
        }
      } catch (apiError) {
        console.warn('API 호출 실패, 기본 데이터 사용:', apiError);
      }

      // API 호출 실패 시 기본 데이터 사용
      const mockEvents: CalendarEvent[] = [
        {
          id: '1',
          title: '안전점검 - 서울역 고가도로',
          description: '월간 안전점검 실시',
          startDate: new Date(2024, 11, 20, 9, 0),
          endDate: new Date(2024, 11, 20, 17, 0),
          type: 'safety_inspection',
          priority: 'high',
          projectId: '1',
          projectName: '서울역 고가도로 건설',
          assignee: '김철수',
          status: 'pending',
          color: '#2196f3'
        },
        {
          id: '2',
          title: '안전교육 - 신규 작업자',
          description: '신규 작업자 안전교육',
          startDate: new Date(2024, 11, 22, 14, 0),
          endDate: new Date(2024, 11, 22, 16, 0),
          type: 'training',
          priority: 'medium',
          projectId: '1',
          projectName: '서울역 고가도로 건설',
          assignee: '이영희',
          status: 'in_progress',
          color: '#4caf50'
        },
        {
          id: '3',
          title: '사고보고 마감일',
          description: '12월 사고보고 제출 마감',
          startDate: new Date(2024, 11, 25, 18, 0),
          endDate: new Date(2024, 11, 25, 18, 0),
          type: 'deadline',
          priority: 'critical',
          projectId: '1',
          projectName: '서울역 고가도로 건설',
          assignee: '박민수',
          status: 'pending',
          color: '#f44336'
        }
      ];

      setCalendarState(prev => ({
        ...prev,
        events: mockEvents,
        isLoading: false
      }));
    } catch (error) {
      setCalendarState(prev => ({
        ...prev,
        error: '이벤트를 불러오는 중 오류가 발생했습니다.',
        isLoading: false
      }));
    }
  }, [currentMonthRange]);

  // 날짜 변경
  const goToDate = useCallback((date: Date) => {
    setCalendarState(prev => ({
      ...prev,
      currentDate: date,
      selectedDate: date
    }));
  }, []);

  // 이전/다음 기간으로 이동
  const navigatePeriod = useCallback((direction: 'prev' | 'next') => {
    setCalendarState(prev => {
      const newDate = new Date(prev.currentDate);
      
      switch (prev.view) {
        case 'month':
          newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
          break;
        case 'week':
          newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
          break;
        case 'day':
          newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
          break;
      }
      
      return { ...prev, currentDate: newDate };
    });
  }, []);

  // 오늘로 이동
  const goToToday = useCallback(() => {
    const today = new Date();
    setCalendarState(prev => ({
      ...prev,
      currentDate: today,
      selectedDate: today
    }));
  }, []);

  // 뷰 변경
  const changeView = useCallback((view: CalendarView) => {
    setCalendarState(prev => ({ ...prev, view }));
  }, []);

  // 날짜 선택
  const selectDate = useCallback((date: Date) => {
    setCalendarState(prev => ({ ...prev, selectedDate: date }));
  }, []);

  // 이벤트 선택
  const selectEvent = useCallback((event: CalendarEvent | null) => {
    setCalendarState(prev => ({ ...prev, selectedEvent: event }));
  }, []);

  // 필터 변경
  const updateFilters = useCallback((filterType: keyof CalendarState['filters'], values: string[]) => {
    setCalendarState(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [filterType]: values
      }
    }));
  }, []);

  // 필터 초기화
  const clearFilters = useCallback(() => {
    setCalendarState(prev => ({
      ...prev,
      filters: {
        eventTypes: [],
        priorities: [],
        projects: [],
        assignees: [],
        statuses: []
      }
    }));
  }, []);

  // 새 이벤트 생성
  const createEvent = useCallback(async (eventData: Omit<CalendarEvent, 'id'>) => {
    try {
      // TODO: 실제 API 호출로 대체
      // const result = await calendarService.createEvent(eventData);

      const newEvent: CalendarEvent = {
        ...eventData,
        id: Date.now().toString()
      };

      setCalendarState(prev => ({
        ...prev,
        events: [...prev.events, newEvent]
      }));

      return { success: true, event: newEvent };
    } catch (error) {
      return { success: false, error: '이벤트 생성 중 오류가 발생했습니다.' };
    }
  }, []);

  // 이벤트 수정
  const updateEvent = useCallback(async (eventId: string, updates: Partial<CalendarEvent>) => {
    try {
      // TODO: 실제 API 호출로 대체
      // const result = await calendarService.updateEvent(eventId, updates);

      setCalendarState(prev => ({
        ...prev,
        events: prev.events.map(event =>
          event.id === eventId ? { ...event, ...updates } : event
        )
      }));

      return { success: true };
    } catch (error) {
      return { success: false, error: '이벤트 수정 중 오류가 발생했습니다.' };
    }
  }, []);

  // 이벤트 삭제
  const deleteEvent = useCallback(async (eventId: string) => {
    try {
      // TODO: 실제 API 호출로 대체
      // const result = await calendarService.deleteEvent(eventId);

      setCalendarState(prev => ({
        ...prev,
        events: prev.events.filter(event => event.id !== eventId),
        selectedEvent: prev.selectedEvent?.id === eventId ? null : prev.selectedEvent
      }));

      return { success: true };
    } catch (error) {
      return { success: false, error: '이벤트 삭제 중 오류가 발생했습니다.' };
    }
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    // 상태
    ...calendarState,
    currentMonthRange,
    currentWeekRange,
    filteredEvents,
    viewEvents,

    // 액션
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
  };
};
