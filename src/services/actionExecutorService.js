import logger from '../core/logger.js';

export class ActionExecutorService {
  constructor(config = {}) {
    this.config = {
      enableLogging: true,
      enableMetrics: true,
      defaultDuration: 3000,
      maxRetries: 3,
      ...config
    };
    
    this.metrics = {
      totalExecuted: 0,
      successful: 0,
      failed: 0,
      byType: new Map(),
      averageExecutionTime: 0,
      executionTimes: []
    };
    
    this.actionHandlers = new Map();
    this.isInitialized = false;
    
    this.initializeDefaultHandlers();
    logger.info('ActionExecutor 서비스 초기화 완료');
  }

  // 기본 핸들러 초기화
  initializeDefaultHandlers() {
    // set_field 액션
    this.registerHandler('set_field', async (action) => {
      await this.handleSetField(action);
    });

    // set_fields 액션
    this.registerHandler('set_fields', async (action) => {
      await this.handleSetFields(action);
    });

    // open_panel 액션
    this.registerHandler('open_panel', async (action) => {
      await this.handleOpenPanel(action);
    });

    // highlight_field 액션
    this.registerHandler('highlight_field', async (action) => {
      await this.handleHighlightField(action);
    });

    // show_toast 액션
    this.registerHandler('show_toast', async (action) => {
      await this.handleShowToast(action);
    });

    // start_pdf_render 액션
    this.registerHandler('start_pdf_render', async (action) => {
      await this.handleStartPdfRender(action);
    });

    // update_progress 액션
    this.registerHandler('update_progress', async (action) => {
      await this.handleUpdateProgress(action);
    });

    // end_pdf_render 액션
    this.registerHandler('end_pdf_render', async (action) => {
      await this.handleEndPdfRender(action);
    });

    // insert_law_citation 액션
    this.registerHandler('insert_law_citation', async (action) => {
      await this.handleInsertLawCitation(action);
    });

    // add_issue 액션
    this.registerHandler('add_issue', async (action) => {
      await this.handleAddIssue(action);
    });

    // focus 액션
    this.registerHandler('focus', async (action) => {
      await this.handleFocus(action);
    });
  }

  // 핸들러 등록
  registerHandler(actionType, handler) {
    this.actionHandlers.set(actionType, handler);
    if (this.config.enableLogging) {
      logger.info('액션 핸들러 등록됨', { actionType });
    }
  }

  // 핸들러 제거
  unregisterHandler(actionType) {
    this.actionHandlers.delete(actionType);
    if (this.config.enableLogging) {
      logger.info('액션 핸들러 제거됨', { actionType });
    }
  }

  // 액션 실행
  async executeAction(action) {
    const startTime = Date.now();
    
    try {
      if (this.config.enableLogging) {
        logger.info('액션 실행 시작', { 
          type: action.type, 
          id: action.id,
          payload: action.payload 
        });
      }

      // 핸들러 확인
      const handler = this.actionHandlers.get(action.type);
      if (!handler) {
        throw new Error(`지원하지 않는 액션 타입입니다: ${action.type}`);
      }

      // 액션 실행
      await handler(action);
      
      // 성공 메트릭 업데이트
      this.updateMetrics(action.type, Date.now() - startTime, true);
      
      if (this.config.enableLogging) {
        logger.info('액션 실행 성공', { 
          type: action.type, 
          id: action.id,
          executionTime: Date.now() - startTime 
        });
      }

      return { success: true, executionTime: Date.now() - startTime };
    } catch (error) {
      // 실패 메트릭 업데이트
      this.updateMetrics(action.type, Date.now() - startTime, false);
      
      if (this.config.enableLogging) {
        logger.error('액션 실행 실패', { 
          type: action.type, 
          id: action.id,
          error: error.message,
          executionTime: Date.now() - startTime 
        });
      }

      throw error;
    }
  }

  // 메트릭 업데이트
  updateMetrics(actionType, executionTime, success) {
    if (!this.config.enableMetrics) return;

    this.metrics.totalExecuted++;
    this.metrics.executionTimes.push(executionTime);
    
    if (success) {
      this.metrics.successful++;
    } else {
      this.metrics.failed++;
    }

    // 타입별 카운트 업데이트
    const typeCount = this.metrics.byType.get(actionType) || 0;
    this.metrics.byType.set(actionType, typeCount + 1);

    // 평균 실행 시간 계산
    const totalTime = this.metrics.executionTimes.reduce((sum, time) => sum + time, 0);
    this.metrics.averageExecutionTime = totalTime / this.metrics.executionTimes.length;

    // 실행 시간 배열 크기 제한 (최근 1000개만 유지)
    if (this.metrics.executionTimes.length > 1000) {
      this.metrics.executionTimes = this.metrics.executionTimes.slice(-1000);
    }
  }

  // 메트릭 조회
  getMetrics() {
    return {
      ...this.metrics,
      byType: Object.fromEntries(this.metrics.byType),
      successRate: this.metrics.totalExecuted > 0 
        ? (this.metrics.successful / this.metrics.totalExecuted) * 100 
        : 0
    };
  }

  // 메트릭 초기화
  resetMetrics() {
    this.metrics = {
      totalExecuted: 0,
      successful: 0,
      failed: 0,
      byType: new Map(),
      averageExecutionTime: 0,
      executionTimes: []
    };
    
    if (this.config.enableLogging) {
      logger.info('메트릭 초기화 완료');
    }
  }

  // ===== 기본 액션 핸들러들 =====

  async handleSetField(action) {
    const { field, value } = action.payload || {};
    
    if (!field) {
      throw new Error('set_field 액션에 field가 필요합니다.');
    }

    // 필드 설정 로직 구현
    logger.info('필드 설정', { field, value });
    
    // TODO: 실제 필드 설정 로직 구현
    await this.simulateAction(action.type, action.payload);
  }

  async handleSetFields(action) {
    const { fields } = action.payload || {};
    
    if (!fields || typeof fields !== 'object') {
      throw new Error('set_fields 액션에 fields 객체가 필요합니다.');
    }

    // 여러 필드 설정 로직 구현
    logger.info('여러 필드 설정', { fields });
    
    for (const [field, value] of Object.entries(fields)) {
      await this.simulateAction('set_field', { field, value });
    }
  }

  async handleOpenPanel(action) {
    const { panelId, options = {} } = action.payload || {};
    
    if (!panelId) {
      throw new Error('open_panel 액션에 panelId가 필요합니다.');
    }

    // 패널 열기 로직 구현
    logger.info('패널 열기', { panelId, options });
    
    await this.simulateAction(action.type, action.payload);
  }

  async handleHighlightField(action) {
    const { field, duration = 2000, style = 'glow' } = action.payload || {};
    
    if (!field) {
      throw new Error('highlight_field 액션에 field가 필요합니다.');
    }

    // 필드 하이라이트 로직 구현
    logger.info('필드 하이라이트', { field, duration, style });
    
    await this.simulateAction(action.type, action.payload);
  }

  async handleShowToast(action) {
    const { message, type = 'info', duration = 3000 } = action.payload || {};
    
    if (!message) {
      throw new Error('show_toast 액션에 message가 필요합니다.');
    }

    // 토스트 표시 로직 구현
    logger.info('토스트 표시', { message, type, duration });
    
    await this.simulateAction(action.type, action.payload);
  }

  async handleStartPdfRender(action) {
    const { reportId, options = {} } = action.payload || {};
    
    if (!reportId) {
      throw new Error('start_pdf_render 액션에 reportId가 필요합니다.');
    }

    // PDF 렌더링 시작 로직 구현
    logger.info('PDF 렌더링 시작', { reportId, options });
    
    await this.simulateAction(action.type, action.payload);
  }

  async handleUpdateProgress(action) {
    const { progress, message } = action.payload || {};
    
    if (progress === undefined) {
      throw new Error('update_progress 액션에 progress가 필요합니다.');
    }

    // 진행률 업데이트 로직 구현
    logger.info('진행률 업데이트', { progress, message });
    
    await this.simulateAction(action.type, action.payload);
  }

  async handleEndPdfRender(action) {
    const { reportId, result, error } = action.payload || {};
    
    if (!reportId) {
      throw new Error('end_pdf_render 액션에 reportId가 필요합니다.');
    }

    // PDF 렌더링 종료 로직 구현
    logger.info('PDF 렌더링 종료', { reportId, result, error });
    
    await this.simulateAction(action.type, action.payload);
  }

  async handleInsertLawCitation(action) {
    const { citation, targetField } = action.payload || {};
    
    if (!citation) {
      throw new Error('insert_law_citation 액션에 citation이 필요합니다.');
    }

    // 법령 인용 삽입 로직 구현
    logger.info('법령 인용 삽입', { citation, targetField });
    
    await this.simulateAction(action.type, action.payload);
  }

  async handleAddIssue(action) {
    const { issue, severity = 'medium' } = action.payload || {};
    
    if (!issue) {
      throw new Error('add_issue 액션에 issue가 필요합니다.');
    }

    // 이슈 추가 로직 구현
    logger.info('이슈 추가', { issue, severity });
    
    await this.simulateAction(action.type, action.payload);
  }

  async handleFocus(action) {
    const { elementId, scrollIntoView = true } = action.payload || {};
    
    if (!elementId) {
      throw new Error('focus 액션에 elementId가 필요합니다.');
    }

    // 요소 포커스 로직 구현
    logger.info('요소 포커스', { elementId, scrollIntoView });
    
    await this.simulateAction(action.type, action.payload);
  }

  // 액션 시뮬레이션 (개발용)
  async simulateAction(actionType, payload) {
    const duration = this.config.defaultDuration;
    
    return new Promise((resolve) => {
      setTimeout(() => {
        logger.debug('액션 시뮬레이션 완료', { actionType, payload, duration });
        resolve();
      }, duration);
    });
  }

  // 설정 업데이트
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    if (this.config.enableLogging) {
      logger.info('ActionExecutor 설정 업데이트', { newConfig });
    }
  }

  // 상태 조회
  getStatus() {
    return {
      initialized: this.isInitialized,
      handlersCount: this.actionHandlers.size,
      config: this.config,
      metrics: this.getMetrics()
    };
  }

  // 헬스체크
  async healthCheck() {
    try {
      const status = this.getStatus();
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        ...status
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  // 정리 작업
  async cleanup() {
    try {
      this.actionHandlers.clear();
      this.resetMetrics();
      
      if (this.config.enableLogging) {
        logger.info('ActionExecutor 정리 작업 완료');
      }
    } catch (error) {
      logger.error('ActionExecutor 정리 작업 실패', { error: error.message });
    }
  }
}

export default ActionExecutorService;
