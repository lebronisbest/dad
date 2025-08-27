import { UIAction } from './socket';

export interface ActionExecutorConfig {
  enableLogging: boolean;
  enableMetrics: boolean;
  defaultDuration: number;
  maxRetries: number;
}

export interface ActionMetrics {
  totalExecuted: number;
  successful: number;
  failed: number;
  byType: Map<string, number>;
  averageExecutionTime: number;
  executionTimes: number[];
}

export class ActionExecutor {
  private config: ActionExecutorConfig;
  private metrics: ActionMetrics;
  private actionHandlers: Map<string, (action: UIAction) => Promise<void>> = new Map();
  private isInitialized: boolean = false;

  constructor(config: ActionExecutorConfig = {
    enableLogging: true,
    enableMetrics: true,
    defaultDuration: 3000,
    maxRetries: 3
  }) {
    this.config = config;
    this.metrics = {
      totalExecuted: 0,
      successful: 0,
      failed: 0,
      byType: new Map(),
      averageExecutionTime: 0,
      executionTimes: []
    };

    this.initializeDefaultHandlers();
    console.log('🎬 액션 실행기 초기화 완료');
  }

  // 기본 핸들러 초기화
  private initializeDefaultHandlers(): void {
    // set_field 액션
    this.registerHandler('set_field', async (action: UIAction) => {
      await this.handleSetField(action);
    });

    // set_fields 액션
    this.registerHandler('set_fields', async (action: UIAction) => {
      await this.handleSetFields(action);
    });

    // open_panel 액션
    this.registerHandler('open_panel', async (action: UIAction) => {
      await this.handleOpenPanel(action);
    });

    // highlight_field 액션
    this.registerHandler('highlight_field', async (action: UIAction) => {
      await this.handleHighlightField(action);
    });

    // show_toast 액션
    this.registerHandler('show_toast', async (action: UIAction) => {
      await this.handleShowToast(action);
    });

    // start_pdf_render 액션
    this.registerHandler('start_pdf_render', async (action: UIAction) => {
      await this.handleStartPdfRender(action);
    });

    // update_progress 액션
    this.registerHandler('update_progress', async (action: UIAction) => {
      await this.handleUpdateProgress(action);
    });

    // end_pdf_render 액션
    this.registerHandler('end_pdf_render', async (action: UIAction) => {
      await this.handleEndPdfRender(action);
    });

    // insert_law_citation 액션
    this.registerHandler('insert_law_citation', async (action: UIAction) => {
      await this.handleInsertLawCitation(action);
    });

    // add_issue 액션
    this.registerHandler('add_issue', async (action: UIAction) => {
      await this.handleAddIssue(action);
    });

    // focus 액션
    this.registerHandler('focus', async (action: UIAction) => {
      await this.handleFocus(action);
    });

    this.isInitialized = true;
  }

  // 액션 핸들러 등록
  public registerHandler(type: string, handler: (action: UIAction) => Promise<void>): void {
    this.actionHandlers.set(type, handler);
    if (this.config.enableLogging) {
      console.log(`📝 액션 핸들러 등록: ${type}`);
    }
  }

  // 액션 핸들러 제거
  public unregisterHandler(type: string): void {
    this.actionHandlers.delete(type);
    if (this.config.enableLogging) {
      console.log(`🗑️ 액션 핸들러 제거: ${type}`);
    }
  }

  // 액션 실행
  public async executeAction(action: UIAction): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      if (this.config.enableLogging) {
        console.log(`🎬 액션 실행: ${action.type} (시퀀스: ${action.sequence})`);
      }

      // 메트릭 업데이트
      this.updateMetrics('start', action.type, startTime);

      // 핸들러 조회
      const handler = this.actionHandlers.get(action.type);
      if (!handler) {
        throw new Error(`알 수 없는 액션 타입: ${action.type}`);
      }

      // 액션 실행
      await handler(action);

      // 성공 메트릭 업데이트
      this.updateMetrics('success', action.type, startTime);
      this.metrics.successful++;

      if (this.config.enableLogging) {
        console.log(`✅ 액션 실행 완료: ${action.type}`);
      }

      return true;

    } catch (error) {
      // 실패 메트릭 업데이트
      this.updateMetrics('failure', action.type, startTime);
      this.metrics.failed++;

      console.error(`❌ 액션 실행 실패: ${action.type}`, error);
      return false;
    }
  }

  // 여러 액션 실행
  public async executeActions(actions: UIAction[]): Promise<{ success: number; failed: number }> {
    const results = await Promise.allSettled(
      actions.map(action => this.executeAction(action))
    );

    const success = results.filter(result => result.status === 'fulfilled' && result.value).length;
    const failed = results.length - success;

    if (this.config.enableLogging) {
      console.log(`🎬 액션 일괄 실행 완료: 성공 ${success}개, 실패 ${failed}개`);
    }

    return { success, failed };
  }

  // set_field 액션 처리
  private async handleSetField(action: UIAction): Promise<void> {
    const { field, value, type, metadata } = action.payload;
    
    // DOM 요소 찾기
    const element = document.querySelector(`[data-field="${field}"]`) || 
                   document.getElementById(field) ||
                   document.querySelector(`[name="${field}"]`);

    if (!element) {
      throw new Error(`필드를 찾을 수 없습니다: ${field}`);
    }

    // 값 설정
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
      element.value = value;
      
      // change 이벤트 발생
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (element instanceof HTMLElement) {
      element.textContent = value;
    }

    if (this.config.enableLogging) {
      console.log(`📝 필드 설정: ${field} = ${value}`);
    }
  }

  // set_fields 액션 처리
  private async handleSetFields(action: UIAction): Promise<void> {
    const { fields, source, timestamp } = action.payload;
    
    if (!fields || typeof fields !== 'object') {
      throw new Error('유효하지 않은 fields 데이터');
    }

    // 각 필드 설정
    for (const [field, value] of Object.entries(fields)) {
      try {
        await this.handleSetField({
          type: 'set_field',
          payload: { field, value },
          timestamp: Date.now(),
          sequence: 0
        });
      } catch (error) {
        console.warn(`필드 설정 실패: ${field}`, error);
      }
    }

    if (this.config.enableLogging) {
      console.log(`📝 여러 필드 설정: ${Object.keys(fields).length}개 (소스: ${source})`);
    }
  }

  // open_panel 액션 처리
  private async handleOpenPanel(action: UIAction): Promise<void> {
    const { panel, title, data, content } = action.payload;
    
    // 패널 생성 또는 열기
    let panelElement = document.getElementById(`panel-${panel}`);
    
    if (!panelElement) {
      panelElement = document.createElement('div');
      panelElement.id = `panel-${panel}`;
      panelElement.className = 'ui-panel';
      panelElement.innerHTML = `
        <div class="panel-header">
          <h3>${title || '패널'}</h3>
          <button class="panel-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
        <div class="panel-content">
          ${content || JSON.stringify(data, null, 2)}
        </div>
      `;
      
      document.body.appendChild(panelElement);
    }

    // 패널 표시
    panelElement.style.display = 'block';
    panelElement.style.position = 'fixed';
    panelElement.style.top = '50%';
    panelElement.style.left = '50%';
    panelElement.style.transform = 'translate(-50%, -50%)';
    panelElement.style.zIndex = '1000';
    panelElement.style.backgroundColor = 'white';
    panelElement.style.border = '1px solid #ccc';
    panelElement.style.borderRadius = '8px';
    panelElement.style.padding = '20px';
    panelElement.style.maxWidth = '80vw';
    panelElement.style.maxHeight = '80vh';
    panelElement.style.overflow = 'auto';

    if (this.config.enableLogging) {
      console.log(`📋 패널 열기: ${panel} - ${title}`);
    }
  }

  // highlight_field 액션 처리
  private async handleHighlightField(action: UIAction): Promise<void> {
    const { field, message, type, duration } = action.payload;
    
    // DOM 요소 찾기
    const element = document.querySelector(`[data-field="${field}"]`) || 
                   document.getElementById(field) ||
                   document.querySelector(`[name="${field}"]`);

    if (!element) {
      throw new Error(`필드를 찾을 수 없습니다: ${field}`);
    }

    // 하이라이트 스타일 적용
    const originalBackground = element.style.backgroundColor;
    const originalBorder = element.style.border;
    
    element.style.backgroundColor = type === 'error' ? '#ffebee' : '#fff3e0';
    element.style.border = type === 'error' ? '2px solid #f44336' : '2px solid #ff9800';
    element.style.transition = 'all 0.3s ease';

    // 메시지 표시
    if (message) {
      const messageElement = document.createElement('div');
      messageElement.className = 'field-message';
      messageElement.textContent = message;
      messageElement.style.color = type === 'error' ? '#d32f2f' : '#f57c00';
      messageElement.style.fontSize = '12px';
      messageElement.style.marginTop = '4px';
      
      element.parentNode?.appendChild(messageElement);
      
      // 일정 시간 후 메시지 제거
      setTimeout(() => {
        messageElement.remove();
      }, duration || this.config.defaultDuration);
    }

    // 일정 시간 후 하이라이트 제거
    setTimeout(() => {
      element.style.backgroundColor = originalBackground;
      element.style.border = originalBorder;
    }, duration || this.config.defaultDuration);

    if (this.config.enableLogging) {
      console.log(`🔍 필드 하이라이트: ${field} - ${message}`);
    }
  }

  // show_toast 액션 처리
  private async handleShowToast(action: UIAction): Promise<void> {
    const { message, type, duration } = action.payload;
    
    // 토스트 요소 생성
    const toast = document.createElement('div');
    toast.className = `toast toast-${type || 'info'}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 4px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      max-width: 300px;
      word-wrap: break-word;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;

    // 타입별 색상 설정
    switch (type) {
      case 'success':
        toast.style.backgroundColor = '#4caf50';
        break;
      case 'error':
        toast.style.backgroundColor = '#f44336';
        break;
      case 'warning':
        toast.style.backgroundColor = '#ff9800';
        break;
      default:
        toast.style.backgroundColor = '#2196f3';
    }

    // DOM에 추가
    document.body.appendChild(toast);

    // 애니메이션
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 100);

    // 자동 제거
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, duration || this.config.defaultDuration);

    if (this.config.enableLogging) {
      console.log(`🍞 토스트 표시: ${type} - ${message}`);
    }
  }

  // start_pdf_render 액션 처리
  private async handleStartPdfRender(action: UIAction): Promise<void> {
    const { message, progress } = action.payload;
    
    // 진행률 표시기 생성 또는 업데이트
    let progressElement = document.getElementById('pdf-progress');
    
    if (!progressElement) {
      progressElement = document.createElement('div');
      progressElement.id = 'pdf-progress';
      progressElement.className = 'pdf-progress';
      progressElement.innerHTML = `
        <div class="progress-header">
          <h4>PDF 생성 중...</h4>
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
          <div class="progress-text">0%</div>
        </div>
      `;
      progressElement.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border: 1px solid #ccc;
        border-radius: 8px;
        padding: 20px;
        z-index: 1000;
        min-width: 300px;
        text-align: center;
      `;
      
      document.body.appendChild(progressElement);
    }

    // 진행률 업데이트
    const progressFill = progressElement.querySelector('.progress-fill') as HTMLElement;
    const progressText = progressElement.querySelector('.progress-text') as HTMLElement;
    
    if (progressFill && progressText) {
      progressFill.style.width = `${progress || 0}%`;
      progressText.textContent = `${progress || 0}%`;
    }

    if (this.config.enableLogging) {
      console.log(`📄 PDF 렌더링 시작: ${message} (${progress}%)`);
    }
  }

  // update_progress 액션 처리
  private async handleUpdateProgress(action: UIAction): Promise<void> {
    const { progress, message } = action.payload;
    
    const progressElement = document.getElementById('pdf-progress');
    if (!progressElement) return;

    const progressFill = progressElement.querySelector('.progress-fill') as HTMLElement;
    const progressText = progressElement.querySelector('.progress-text') as HTMLElement;
    
    if (progressFill && progressText) {
      progressFill.style.width = `${progress}%`;
      progressText.textContent = `${progress}%`;
    }

    if (message) {
      const header = progressElement.querySelector('h4');
      if (header) {
        header.textContent = message;
      }
    }

    if (this.config.enableLogging) {
      console.log(`📊 진행률 업데이트: ${progress}% - ${message}`);
    }
  }

  // end_pdf_render 액션 처리
  private async handleEndPdfRender(action: UIAction): Promise<void> {
    const { url, filename, message, downloadUrl } = action.payload;
    
    // 진행률 표시기 제거
    const progressElement = document.getElementById('pdf-progress');
    if (progressElement) {
      progressElement.remove();
    }

    // 다운로드 링크 생성
    if (downloadUrl) {
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = filename || 'safety_report.pdf';
      downloadLink.textContent = 'PDF 다운로드';
      downloadLink.style.cssText = `
        display: inline-block;
        padding: 10px 20px;
        background: #4caf50;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        margin: 10px;
      `;
      
      // 자동 다운로드
      downloadLink.click();
    }

    if (this.config.enableLogging) {
      console.log(`✅ PDF 렌더링 완료: ${filename}`);
    }
  }

  // insert_law_citation 액션 처리
  private async handleInsertLawCitation(action: UIAction): Promise<void> {
    const { lawName, content, source, article } = action.payload;
    
    // 법령 인용 텍스트 생성
    const citationText = `[${lawName}] ${article}\n${content}\n출처: ${source}`;
    
    // 클립보드에 복사
    try {
      await navigator.clipboard.writeText(citationText);
      
      if (this.config.enableLogging) {
        console.log(`📋 법령 인용 복사: ${lawName}`);
      }
    } catch (error) {
      console.warn('클립보드 복사 실패:', error);
    }
  }

  // add_issue 액션 처리
  private async handleAddIssue(action: UIAction): Promise<void> {
    const { issue, severity, description } = action.payload;
    
    // 이슈 목록에 추가
    let issueList = document.getElementById('issue-list');
    
    if (!issueList) {
      issueList = document.createElement('div');
      issueList.id = 'issue-list';
      issueList.className = 'issue-list';
      issueList.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        background: white;
        border: 1px solid #ccc;
        border-radius: 8px;
        padding: 15px;
        max-width: 300px;
        z-index: 1000;
      `;
      
      document.body.appendChild(issueList);
    }

    const issueElement = document.createElement('div');
    issueElement.className = `issue-item issue-${severity || 'medium'}`;
    issueElement.innerHTML = `
      <strong>${issue}</strong>
      <p>${description || ''}</p>
    `;
    issueElement.style.cssText = `
      margin-bottom: 10px;
      padding: 8px;
      border-left: 4px solid ${severity === 'high' ? '#f44336' : severity === 'medium' ? '#ff9800' : '#4caf50'};
      background: #f5f5f5;
    `;
    
    issueList.appendChild(issueElement);

    if (this.config.enableLogging) {
      console.log(`⚠️ 이슈 추가: ${issue} (심각도: ${severity})`);
    }
  }

  // focus 액션 처리
  private async handleFocus(action: UIAction): Promise<void> {
    const { field, scroll } = action.payload;
    
    // DOM 요소 찾기
    const element = document.querySelector(`[data-field="${field}"]`) || 
                   document.getElementById(field) ||
                   document.querySelector(`[name="${field}"]`);

    if (!element) {
      throw new Error(`필드를 찾을 수 없습니다: ${field}`);
    }

    // 포커스 설정
    if (element instanceof HTMLElement) {
      element.focus();
      
      // 스크롤 옵션이 활성화된 경우
      if (scroll !== false) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    if (this.config.enableLogging) {
      console.log(`🎯 필드 포커스: ${field}`);
    }
  }

  // 메트릭 업데이트
  private updateMetrics(type: 'start' | 'success' | 'failure', actionType: string, startTime: number): void {
    if (!this.config.enableMetrics) return;

    this.metrics.totalExecuted++;

    if (type === 'success' || type === 'failure') {
      const executionTime = Date.now() - startTime;
      this.metrics.executionTimes.push(executionTime);
      
      // 최근 100개만 유지
      if (this.metrics.executionTimes.length > 100) {
        this.metrics.executionTimes.splice(0, this.metrics.executionTimes.length - 100);
      }
      
      // 평균 실행 시간 계산
      const totalTime = this.metrics.executionTimes.reduce((sum, time) => sum + time, 0);
      this.metrics.averageExecutionTime = totalTime / this.metrics.executionTimes.length;
    }

    // 타입별 카운트
    const current = this.metrics.byType.get(actionType) || 0;
    this.metrics.byType.set(actionType, current + 1);
  }

  // 메트릭 조회
  public getMetrics(): ActionMetrics {
    return { ...this.metrics };
  }

  // 메트릭 초기화
  public resetMetrics(): void {
    this.metrics = {
      totalExecuted: 0,
      successful: 0,
      failed: 0,
      byType: new Map(),
      averageExecutionTime: 0,
      executionTimes: []
    };
  }

  // 설정 업데이트
  public updateConfig(newConfig: Partial<ActionExecutorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ 액션 실행기 설정 업데이트:', this.config);
  }

  // 초기화 상태 조회
  public isReady(): boolean {
    return this.isInitialized;
  }
}

// 싱글톤 인스턴스 생성
export const actionExecutor = new ActionExecutor();

export default ActionExecutor;
