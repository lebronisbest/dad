import UIBridge from './ui-bridge';
import { ToolResult } from './ui-translators';

export interface MCPWrapperConfig {
  enableUIBridge: boolean;
  enableMetrics: boolean;
  enableLogging: boolean;
  maxRetries: number;
  retryDelay: number;
}

export interface WrappedMCPCall {
  tool: string;
  params: any;
  uiSessionId?: string;
  userId?: string;
  timestamp: number;
  retryCount: number;
}

export class MCPWrapper {
  private mcpServer: any;
  private uiBridge: UIBridge;
  private config: MCPWrapperConfig;
  private callHistory: Map<string, WrappedMCPCall> = new Map();
  private metrics: {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    uiBridgeCalls: number;
    averageLatency: number;
    latencyHistory: number[];
  };

  constructor(mcpServer: any, uiBridge: UIBridge, config: MCPWrapperConfig = {
    enableUIBridge: true,
    enableMetrics: true,
    enableLogging: true,
    maxRetries: 3,
    retryDelay: 1000
  }) {
    this.mcpServer = mcpServer;
    this.uiBridge = uiBridge;
    this.config = config;
    this.metrics = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      uiBridgeCalls: 0,
      averageLatency: 0,
      latencyHistory: []
    };

    console.log('🔧 MCP 래퍼 초기화 완료');
  }

  // MCP 함수 호출을 래핑하고 UI 브릿지와 연동
  public async callMCPTool(
    tool: string, 
    params: any, 
    uiSessionId?: string, 
    userId?: string
  ): Promise<any> {
    const startTime = Date.now();
    const callId = this.generateCallId(tool, params);

    try {
      // 호출 기록 저장
      const wrappedCall: WrappedMCPCall = {
        tool,
        params,
        uiSessionId,
        userId,
        timestamp: startTime,
        retryCount: 0
      };
      this.callHistory.set(callId, wrappedCall);

      // 메트릭 업데이트
      this.updateMetrics('start', startTime);

      if (this.config.enableLogging) {
        console.log(`🔧 MCP 툴 호출: ${tool} (세션: ${uiSessionId || 'none'})`);
      }

      // MCP 서버에서 실제 함수 호출
      const result = await this.callMCPServer(tool, params);
      
      // 성공 메트릭 업데이트
      this.updateMetrics('success', startTime);
      this.metrics.successfulCalls++;

      // UI 브릿지 활성화된 경우 결과 전송
      if (this.config.enableUIBridge && uiSessionId) {
        await this.handleUIBridgeResult(tool, result, uiSessionId, userId);
      }

      // 호출 기록 정리
      this.callHistory.delete(callId);

      return result;

    } catch (error) {
      // 실패 메트릭 업데이트
      this.updateMetrics('failure', startTime);
      this.metrics.failedCalls++;

      // 재시도 로직
      const wrappedCall = this.callHistory.get(callId);
      if (wrappedCall && wrappedCall.retryCount < this.config.maxRetries) {
        return await this.retryCall(wrappedCall);
      }

      // UI 브릿지에 오류 전송
      if (this.config.enableUIBridge && uiSessionId) {
        await this.handleUIBridgeError(tool, error, uiSessionId, userId);
      }

      // 호출 기록 정리
      this.callHistory.delete(callId);

      throw error;
    }
  }

  // MCP 서버에서 실제 함수 호출
  private async callMCPServer(tool: string, params: any): Promise<any> {
    // MCP 서버의 메서드 존재 여부 확인
    if (typeof this.mcpServer[tool] !== 'function') {
      throw new Error(`MCP 툴 '${tool}'을 찾을 수 없습니다.`);
    }

    // MCP 서버 메서드 호출
    return await this.mcpServer[tool](params);
  }

  // UI 브릿지 결과 처리
  private async handleUIBridgeResult(
    tool: string, 
    result: any, 
    uiSessionId: string, 
    userId?: string
  ): Promise<void> {
    try {
      // MCP 결과를 UI로 전송
      await this.uiBridge.emitMcpResult(uiSessionId, tool, result);

      // 툴 결과를 UI 액션으로 변환하여 전송
      const toolResult: ToolResult = {
        tool,
        result,
        success: true
      };

      await this.uiBridge.translateAndEmitActions(uiSessionId, toolResult, {
        userId,
        currentFormData: params
      });

      this.metrics.uiBridgeCalls++;

      if (this.config.enableLogging) {
        console.log(`🌉 UI 브릿지 결과 처리 완료: ${tool} -> ${uiSessionId}`);
      }

    } catch (error) {
      console.error(`❌ UI 브릿지 결과 처리 오류: ${error}`);
    }
  }

  // UI 브릿지 오류 처리
  private async handleUIBridgeError(
    tool: string, 
    error: any, 
    uiSessionId: string, 
    userId?: string
  ): Promise<void> {
    try {
      const toolResult: ToolResult = {
        tool,
        result: null,
        success: false,
        error: error.message || '알 수 없는 오류'
      };

      await this.uiBridge.translateAndEmitActions(uiSessionId, toolResult, {
        userId
      });

      if (this.config.enableLogging) {
        console.log(`🌉 UI 브릿지 오류 처리 완료: ${tool} -> ${uiSessionId}`);
      }

    } catch (bridgeError) {
      console.error(`❌ UI 브릿지 오류 처리 실패: ${bridgeError}`);
    }
  }

  // 재시도 로직
  private async retryCall(wrappedCall: WrappedMCPCall): Promise<any> {
    wrappedCall.retryCount++;
    const delay = this.config.retryDelay * Math.pow(2, wrappedCall.retryCount - 1);

    if (this.config.enableLogging) {
      console.log(`🔄 MCP 툴 재시도: ${wrappedCall.tool} (${wrappedCall.retryCount}/${this.config.maxRetries}) - ${delay}ms 후`);
    }

    // 지연 후 재시도
    await new Promise(resolve => setTimeout(resolve, delay));

    return await this.callMCPTool(
      wrappedCall.tool,
      wrappedCall.params,
      wrappedCall.uiSessionId,
      wrappedCall.userId
    );
  }

  // 호출 ID 생성
  private generateCallId(tool: string, params: any): string {
    const paramsHash = JSON.stringify(params);
    return `${tool}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 메트릭 업데이트
  private updateMetrics(type: 'start' | 'success' | 'failure', startTime: number): void {
    if (!this.config.enableMetrics) return;

    this.metrics.totalCalls++;

    if (type === 'success' || type === 'failure') {
      const latency = Date.now() - startTime;
      this.metrics.latencyHistory.push(latency);

      // 최근 100개만 유지
      if (this.metrics.latencyHistory.length > 100) {
        this.metrics.latencyHistory.splice(0, this.metrics.latencyHistory.length - 100);
      }

      // 평균 지연시간 계산
      const totalLatency = this.metrics.latencyHistory.reduce((sum, l) => sum + l, 0);
      this.metrics.averageLatency = totalLatency / this.metrics.latencyHistory.length;
    }
  }

  // 메트릭 조회
  public getMetrics(): any {
    return { ...this.metrics };
  }

  // 메트릭 초기화
  public resetMetrics(): void {
    this.metrics = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      uiBridgeCalls: 0,
      averageLatency: 0,
      latencyHistory: []
    };
  }

  // 설정 업데이트
  public updateConfig(newConfig: Partial<MCPWrapperConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log(`⚙️ MCP 래퍼 설정 업데이트:`, this.config);
  }

  // UI 브릿지 활성화/비활성화
  public setUIBridgeEnabled(enabled: boolean): void {
    this.config.enableUIBridge = enabled;
    console.log(`🌉 MCP 래퍼 UI 브릿지 ${enabled ? '활성화' : '비활성화'}`);
  }

  // 현재 설정 조회
  public getConfig(): MCPWrapperConfig {
    return { ...this.config };
  }

  // 활성 호출 목록 조회
  public getActiveCalls(): WrappedMCPCall[] {
    return Array.from(this.callHistory.values());
  }

  // 특정 호출 취소
  public cancelCall(callId: string): boolean {
    return this.callHistory.delete(callId);
  }

  // 모든 호출 취소
  public cancelAllCalls(): void {
    this.callHistory.clear();
    console.log('🚫 모든 MCP 호출 취소됨');
  }

  // MCP 서버 상태 확인
  public async checkMCPServerHealth(): Promise<boolean> {
    try {
      // 간단한 상태 확인 (예: 버전 정보 조회)
      if (this.mcpServer.getSystemStats) {
        await this.mcpServer.getSystemStats({ random_string: 'health_check' });
        return true;
      }
      return true; // getSystemStats가 없어도 서버는 정상일 수 있음
    } catch (error) {
      console.error(`❌ MCP 서버 상태 확인 실패: ${error}`);
      return false;
    }
  }

  // MCP 서버 재시작 (필요한 경우)
  public async restartMCPServer(): Promise<boolean> {
    try {
      console.log('🔄 MCP 서버 재시작 시도...');
      
      // 현재 서버 상태 확인
      const isHealthy = await this.checkMCPServerHealth();
      if (isHealthy) {
        console.log('✅ MCP 서버가 정상 상태입니다. 재시작이 필요하지 않습니다.');
        return true;
      }

      // 재시작 로직 (구현에 따라 다름)
      console.log('⚠️ MCP 서버 재시작은 수동으로 수행해야 합니다.');
      return false;

    } catch (error) {
      console.error(`❌ MCP 서버 재시작 실패: ${error}`);
      return false;
    }
  }
}

export default MCPWrapper;
