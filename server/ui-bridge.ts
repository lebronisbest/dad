import SocketManager, { UIAction, McpResult } from './socket';
import UITranslator, { ToolResult, TranslationContext } from './ui-translators';

export interface BridgeConfig {
  enabled: boolean;
  maxPayloadSize: number;
  enableMetrics: boolean;
  enableLogging: boolean;
}

export interface BridgeMetrics {
  mcpToolLatency: Map<string, number[]>;
  socketEmitCount: Map<string, number>;
  uiActionCount: Map<string, number>;
  actionDropCount: number;
  pdfRenderTime: number[];
}

export class UIBridge {
  private socketManager: SocketManager;
  private config: BridgeConfig;
  private metrics: BridgeMetrics;
  private translators: Map<string, UITranslator> = new Map();

  constructor(socketManager: SocketManager, config: BridgeConfig = {
    enabled: true,
    maxPayloadSize: 1024 * 1024, // 1MB
    enableMetrics: true,
    enableLogging: true
  }) {
    this.socketManager = socketManager;
    this.config = config;
    this.metrics = {
      mcpToolLatency: new Map(),
      socketEmitCount: new Map(),
      uiActionCount: new Map(),
      actionDropCount: 0,
      pdfRenderTime: []
    };

    console.log('🌉 UI 브릿지 초기화 완료');
  }

  // MCP 결과를 UI로 전송
  public async emitMcpResult(uiSessionId: string, tool: string, result: any): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    const startTime = Date.now();

    try {
      // 페이로드 크기 검사
      const payloadSize = JSON.stringify(result).length;
      if (payloadSize > this.config.maxPayloadSize) {
        console.warn(`⚠️ 페이로드 크기 초과: ${payloadSize} > ${this.config.maxPayloadSize}`);
        this.metrics.actionDropCount++;
        return false;
      }

      // MCP 결과 전송
      const success = this.socketManager.emitMcpResult(uiSessionId, tool, result);
      
      if (success) {
        // 메트릭 업데이트
        this.updateMetrics('mcp:result', tool, startTime);
        
        if (this.config.enableLogging) {
          console.log(`📡 MCP 결과 브릿지: ${uiSessionId} -> ${tool}`);
        }
      }

      return success;
    } catch (error) {
      console.error(`❌ MCP 결과 브릿지 오류: ${error}`);
      this.metrics.actionDropCount++;
      return false;
    }
  }

  // UI 액션 전송
  public async emitActions(uiSessionId: string, actions: UIAction[]): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    try {
      // 액션 필터링 및 검증
      const validActions = this.filterAndValidateActions(actions);
      
      if (validActions.length === 0) {
        console.warn(`⚠️ 유효한 UI 액션이 없음: ${uiSessionId}`);
        return false;
      }

      // 페이로드 크기 검사
      const payloadSize = JSON.stringify(validActions).length;
      if (payloadSize > this.config.maxPayloadSize) {
        console.warn(`⚠️ UI 액션 페이로드 크기 초과: ${payloadSize} > ${this.config.maxPayloadSize}`);
        this.metrics.actionDropCount++;
        return false;
      }

      // UI 액션 전송
      const success = this.socketManager.emitActions(uiSessionId, validActions);
      
      if (success) {
        // 메트릭 업데이트
        this.updateMetrics('ui:actions', 'actions', Date.now());
        
        // 액션별 카운트 업데이트
        validActions.forEach(action => {
          const current = this.metrics.uiActionCount.get(action.type) || 0;
          this.metrics.uiActionCount.set(action.type, current + 1);
        });

        if (this.config.enableLogging) {
          console.log(`🎬 UI 액션 브릿지: ${uiSessionId} -> ${validActions.length}개 액션`);
        }
      }

      return success;
    } catch (error) {
      console.error(`❌ UI 액션 브릿지 오류: ${error}`);
      this.metrics.actionDropCount++;
      return false;
    }
  }

  // MCP 툴 결과를 UI 액션으로 변환하여 전송
  public async translateAndEmitActions(
    uiSessionId: string, 
    toolResult: ToolResult, 
    context?: Partial<TranslationContext>
  ): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    try {
      // 번역기 생성 또는 업데이트
      let translator = this.translators.get(uiSessionId);
      if (!translator) {
        const defaultContext: TranslationContext = {
          uiSessionId,
          userId: context?.userId,
          currentFormData: context?.currentFormData,
          previousActions: []
        };
        translator = new UITranslator(defaultContext);
        this.translators.set(uiSessionId, translator);
      }

      // 컨텍스트 업데이트
      if (context) {
        translator.updateContext(context);
      }

      // 툴 결과를 UI 액션으로 변환
      const actions = translator.translateToolResult(toolResult);
      
      if (actions.length === 0) {
        console.warn(`⚠️ 변환된 UI 액션이 없음: ${uiSessionId} -> ${toolResult.tool}`);
        return false;
      }

      // UI 액션 전송
      const success = await this.emitActions(uiSessionId, actions);
      
      if (success) {
        // 이전 액션 업데이트
        translator.updateContext({ previousActions: actions });
        
        if (this.config.enableLogging) {
          console.log(`🔄 툴→액션 변환 완료: ${uiSessionId} -> ${toolResult.tool} -> ${actions.length}개 액션`);
        }
      }

      return success;
    } catch (error) {
      console.error(`❌ 툴→액션 변환 오류: ${error}`);
      this.metrics.actionDropCount++;
      return false;
    }
  }

  // 액션 필터링 및 검증
  private filterAndValidateActions(actions: UIAction[]): UIAction[] {
    const validActions: UIAction[] = [];
    const allowedTypes = new Set([
      'set_field', 'set_fields', 'open_panel', 'highlight_field', 
      'show_toast', 'start_pdf_render', 'update_progress', 
      'end_pdf_render', 'insert_law_citation', 'add_issue', 'focus'
    ]);

    for (const action of actions) {
      // 타입 검증
      if (!allowedTypes.has(action.type)) {
        console.warn(`⚠️ 허용되지 않은 액션 타입: ${action.type}`);
        this.metrics.actionDropCount++;
        continue;
      }

      // 페이로드 검증
      if (!this.validateActionPayload(action)) {
        console.warn(`⚠️ 액션 페이로드 검증 실패: ${action.type}`);
        this.metrics.actionDropCount++;
        continue;
      }

      validActions.push(action);
    }

    return validActions;
  }

  // 액션 페이로드 검증
  private validateActionPayload(action: UIAction): boolean {
    try {
      // 기본 필드 검증
      if (!action.type || !action.payload || typeof action.timestamp !== 'number') {
        return false;
      }

      // 타입별 페이로드 검증
      switch (action.type) {
        case 'set_field':
          return this.validateSetFieldPayload(action.payload);
        case 'set_fields':
          return this.validateSetFieldsPayload(action.payload);
        case 'show_toast':
          return this.validateShowToastPayload(action.payload);
        case 'highlight_field':
          return this.validateHighlightFieldPayload(action.payload);
        default:
          return true; // 기본적으로 허용
      }
    } catch (error) {
      console.error(`❌ 액션 페이로드 검증 오류: ${error}`);
      return false;
    }
  }

  // set_field 페이로드 검증
  private validateSetFieldPayload(payload: any): boolean {
    return payload && 
           typeof payload.field === 'string' && 
           payload.value !== undefined;
  }

  // set_fields 페이로드 검증
  private validateSetFieldsPayload(payload: any): boolean {
    return payload && 
           payload.fields && 
           typeof payload.fields === 'object';
  }

  // show_toast 페이로드 검증
  private validateShowToastPayload(payload: any): boolean {
    return payload && 
           typeof payload.message === 'string' && 
           ['success', 'error', 'warning', 'info'].includes(payload.type);
  }

  // highlight_field 페이로드 검증
  private validateHighlightFieldPayload(payload: any): boolean {
    return payload && 
           typeof payload.field === 'string' && 
           typeof payload.message === 'string';
  }

  // 메트릭 업데이트
  private updateMetrics(eventType: string, tool: string, startTime: number) {
    if (!this.config.enableMetrics) return;

    const latency = Date.now() - startTime;

    // MCP 툴 지연시간
    if (eventType === 'mcp:result') {
      const latencies = this.metrics.mcpToolLatency.get(tool) || [];
      latencies.push(latency);
      // 최근 100개만 유지
      if (latencies.length > 100) {
        latencies.splice(0, latencies.length - 100);
      }
      this.metrics.mcpToolLatency.set(tool, latencies);
    }

    // 소켓 이벤트 카운트
    const current = this.metrics.socketEmitCount.get(eventType) || 0;
    this.metrics.socketEmitCount.set(eventType, current + 1);
  }

  // 메트릭 조회
  public getMetrics(): BridgeMetrics {
    return { ...this.metrics };
  }

  // 메트릭 초기화
  public resetMetrics(): void {
    this.metrics = {
      mcpToolLatency: new Map(),
      socketEmitCount: new Map(),
      uiActionCount: new Map(),
      actionDropCount: 0,
      pdfRenderTime: []
    };
  }

  // 설정 업데이트
  public updateConfig(newConfig: Partial<BridgeConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log(`⚙️ UI 브릿지 설정 업데이트:`, this.config);
  }

  // 브릿지 활성화/비활성화
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    console.log(`🌉 UI 브릿지 ${enabled ? '활성화' : '비활성화'}`);
  }

  // 브릿지 상태 조회
  public getStatus(): { enabled: boolean; activeSessions: number; metrics: boolean } {
    return {
      enabled: this.config.enabled,
      activeSessions: this.socketManager.getSessionStats().activeSessions,
      metrics: this.config.enableMetrics
    };
  }

  // 세션별 번역기 정리
  public cleanupSession(uiSessionId: string): void {
    this.translators.delete(uiSessionId);
    console.log(`🧹 세션 번역기 정리: ${uiSessionId}`);
  }

  // 모든 세션 정리
  public cleanupAllSessions(): void {
    this.translators.clear();
    console.log('🧹 모든 세션 번역기 정리 완료');
  }
}

export default UIBridge;
