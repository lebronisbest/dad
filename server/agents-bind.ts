import { Agent } from '@openai/agents';
import MCPWrapper from './mcp-wrapper';
import UIBridge from './ui-bridge';

export interface AgentBindingConfig {
  enableUIBridge: boolean;
  enableMetrics: boolean;
  enableLogging: boolean;
  autoTranslateResults: boolean;
  sessionTimeout: number;
}

export interface BoundAgent {
  agent: Agent;
  mcpWrapper: MCPWrapper;
  uiBridge: UIBridge;
  config: AgentBindingConfig;
  sessions: Map<string, {
    uiSessionId: string;
    userId?: string;
    createdAt: Date;
    lastActivity: Date;
    context: any;
  }>;
}

export class AgentsBinding {
  private agents: Map<string, BoundAgent> = new Map();
  private config: AgentBindingConfig;

  constructor(config: AgentBindingConfig = {
    enableUIBridge: true,
    enableMetrics: true,
    enableLogging: true,
    autoTranslateResults: true,
    sessionTimeout: 30 * 60 * 1000 // 30분
  }) {
    this.config = config;
    console.log('🔗 에이전트 바인딩 초기화 완료');
  }

  // 에이전트에 MCP 래퍼와 UI 브릿지 바인딩
  public bindAgent(
    agentId: string,
    agent: Agent,
    mcpWrapper: MCPWrapper,
    uiBridge: UIBridge
  ): BoundAgent {
    const boundAgent: BoundAgent = {
      agent,
      mcpWrapper,
      uiBridge,
      config: { ...this.config },
      sessions: new Map()
    };

    this.agents.set(agentId, boundAgent);

    if (this.config.enableLogging) {
      console.log(`🔗 에이전트 바인딩 완료: ${agentId}`);
    }

    return boundAgent;
  }

  // 에이전트 실행 (UI 브릿지 연동)
  public async runAgent(
    agentId: string,
    message: string,
    uiSessionId?: string,
    userId?: string,
    context?: any
  ): Promise<any> {
    const boundAgent = this.agents.get(agentId);
    if (!boundAgent) {
      throw new Error(`에이전트를 찾을 수 없습니다: ${agentId}`);
    }

    // 세션 관리
    if (uiSessionId) {
      this.updateSession(agentId, uiSessionId, userId, context);
    }

    try {
      if (this.config.enableLogging) {
        console.log(`🚀 에이전트 실행: ${agentId} (세션: ${uiSessionId || 'none'})`);
      }

      // UI 브릿지 활성화된 경우 시작 알림
      if (this.config.enableUIBridge && uiSessionId) {
        await this.notifyAgentStart(agentId, uiSessionId, message);
      }

      // 에이전트 실행
      const result = await boundAgent.agent.run(message);

      // UI 브릿지 활성화된 경우 결과 처리
      if (this.config.enableUIBridge && uiSessionId) {
        await this.handleAgentResult(agentId, uiSessionId, result, context);
      }

      // 세션 활동 시간 업데이트
      if (uiSessionId) {
        this.updateSessionActivity(agentId, uiSessionId);
      }

      return result;

    } catch (error) {
      // UI 브릿지 활성화된 경우 오류 처리
      if (this.config.enableUIBridge && uiSessionId) {
        await this.handleAgentError(agentId, uiSessionId, error, context);
      }

      throw error;
    }
  }

  // 세션 업데이트
  private updateSession(
    agentId: string,
    uiSessionId: string,
    userId?: string,
    context?: any
  ): void {
    const boundAgent = this.agents.get(agentId);
    if (!boundAgent) return;

    const session = {
      uiSessionId,
      userId,
      createdAt: new Date(),
      lastActivity: new Date(),
      context: context || {}
    };

    boundAgent.sessions.set(uiSessionId, session);

    if (this.config.enableLogging) {
      console.log(`📝 세션 업데이트: ${agentId} -> ${uiSessionId}`);
    }
  }

  // 세션 활동 시간 업데이트
  private updateSessionActivity(agentId: string, uiSessionId: string): void {
    const boundAgent = this.agents.get(agentId);
    if (!boundAgent) return;

    const session = boundAgent.sessions.get(uiSessionId);
    if (session) {
      session.lastActivity = new Date();
    }
  }

  // 에이전트 시작 알림
  private async notifyAgentStart(
    agentId: string,
    uiSessionId: string,
    message: string
  ): Promise<void> {
    try {
      const boundAgent = this.agents.get(agentId);
      if (!boundAgent) return;

      // 시작 토스트 표시
      await boundAgent.uiBridge.emitActions(uiSessionId, [{
        type: 'show_toast',
        payload: {
          message: '에이전트가 요청을 처리하고 있습니다...',
          type: 'info',
          duration: 2000
        },
        timestamp: Date.now(),
        sequence: 0
      }]);

      if (this.config.enableLogging) {
        console.log(`🎬 에이전트 시작 알림: ${agentId} -> ${uiSessionId}`);
      }

    } catch (error) {
      console.error(`❌ 에이전트 시작 알림 오류: ${error}`);
    }
  }

  // 에이전트 결과 처리
  private async handleAgentResult(
    agentId: string,
    uiSessionId: string,
    result: any,
    context?: any
  ): Promise<void> {
    try {
      const boundAgent = this.agents.get(agentId);
      if (!boundAgent) return;

      // 결과 분석 및 UI 액션 생성
      const actions = this.analyzeAgentResult(result, context);

      if (actions.length > 0) {
        await boundAgent.uiBridge.emitActions(uiSessionId, actions);
      }

      // 완료 토스트 표시
      await boundAgent.uiBridge.emitActions(uiSessionId, [{
        type: 'show_toast',
        payload: {
          message: '요청 처리가 완료되었습니다.',
          type: 'success',
          duration: 3000
        },
        timestamp: Date.now(),
        sequence: 0
      }]);

      if (this.config.enableLogging) {
        console.log(`🎬 에이전트 결과 처리: ${agentId} -> ${uiSessionId} -> ${actions.length}개 액션`);
      }

    } catch (error) {
      console.error(`❌ 에이전트 결과 처리 오류: ${error}`);
    }
  }

  // 에이전트 오류 처리
  private async handleAgentError(
    agentId: string,
    uiSessionId: string,
    error: any,
    context?: any
  ): Promise<void> {
    try {
      const boundAgent = this.agents.get(agentId);
      if (!boundAgent) return;

      // 오류 토스트 표시
      await boundAgent.uiBridge.emitActions(uiSessionId, [{
        type: 'show_toast',
        payload: {
          message: `처리 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`,
          type: 'error',
          duration: 5000
        },
        timestamp: Date.now(),
        sequence: 0
      }]);

      if (this.config.enableLogging) {
        console.log(`❌ 에이전트 오류 처리: ${agentId} -> ${uiSessionId}`);
      }

    } catch (bridgeError) {
      console.error(`❌ 에이전트 오류 처리 실패: ${bridgeError}`);
    }
  }

  // 에이전트 결과 분석 및 UI 액션 생성
  private analyzeAgentResult(result: any, context?: any): any[] {
    const actions: any[] = [];

    try {
      // 결과 타입에 따른 액션 생성
      if (result && typeof result === 'object') {
        // MCP 툴 호출 결과가 포함된 경우
        if (result.toolCalls && Array.isArray(result.toolCalls)) {
          result.toolCalls.forEach((toolCall: any) => {
            if (toolCall.tool && toolCall.result) {
              // 툴 결과를 UI 액션으로 변환
              const toolActions = this.convertToolResultToActions(toolCall.tool, toolCall.result, context);
              actions.push(...toolActions);
            }
          });
        }

        // 텍스트 응답이 포함된 경우
        if (result.text && typeof result.text === 'string') {
          // 긴 텍스트는 패널로 표시
          if (result.text.length > 200) {
            actions.push({
              type: 'open_panel',
              payload: {
                panel: 'response',
                title: '에이전트 응답',
                content: result.text
              },
              timestamp: Date.now(),
              sequence: 0
            });
          }
        }
      }

    } catch (error) {
      console.error(`❌ 에이전트 결과 분석 오류: ${error}`);
    }

    return actions;
  }

  // 툴 결과를 UI 액션으로 변환
  private convertToolResultToActions(tool: string, result: any, context?: any): any[] {
    const actions: any[] = [];

    try {
      switch (tool) {
        case 'fill_report':
          if (result.data) {
            actions.push({
              type: 'set_fields',
              payload: {
                fields: result.data,
                source: 'agent_fill_report',
                timestamp: Date.now()
              },
              timestamp: Date.now(),
              sequence: 0
            });
          }
          break;

        case 'validate_report_data':
          if (result.valid === false && result.errors) {
            result.errors.forEach((error: any) => {
              if (error.field) {
                actions.push({
                  type: 'highlight_field',
                  payload: {
                    field: error.field,
                    message: error.message,
                    type: 'error',
                    duration: 5000
                  },
                  timestamp: Date.now(),
                  sequence: 0
                });
              }
            });
          }
          break;

        case 'render_pdf':
          if (result.url) {
            actions.push({
              type: 'end_pdf_render',
              payload: {
                url: result.url,
                filename: result.filename,
                message: 'PDF 생성이 완료되었습니다.',
                downloadUrl: result.url
              },
              timestamp: Date.now(),
              sequence: 0
            });
          }
          break;

        default:
          // 기본 성공 액션
          actions.push({
            type: 'show_toast',
            payload: {
              message: `${tool} 작업이 완료되었습니다.`,
              type: 'success',
              duration: 3000
            },
            timestamp: Date.now(),
            sequence: 0
          });
      }

    } catch (error) {
      console.error(`❌ 툴 결과 변환 오류: ${error}`);
    }

    return actions;
  }

  // 세션 정리 (타임아웃)
  public cleanupExpiredSessions(): void {
    const now = Date.now();
    const timeout = this.config.sessionTimeout;

    for (const [agentId, boundAgent] of this.agents.entries()) {
      const expiredSessions: string[] = [];

      for (const [uiSessionId, session] of boundAgent.sessions.entries()) {
        if (now - session.lastActivity.getTime() > timeout) {
          expiredSessions.push(uiSessionId);
        }
      }

      // 만료된 세션 제거
      expiredSessions.forEach(uiSessionId => {
        boundAgent.sessions.delete(uiSessionId);
        boundAgent.uiBridge.cleanupSession(uiSessionId);
      });

      if (expiredSessions.length > 0 && this.config.enableLogging) {
        console.log(`🧹 만료된 세션 정리: ${agentId} -> ${expiredSessions.length}개`);
      }
    }
  }

  // 에이전트 상태 조회
  public getAgentStatus(agentId: string): any {
    const boundAgent = this.agents.get(agentId);
    if (!boundAgent) return null;

    return {
      agentId,
      config: boundAgent.config,
      activeSessions: boundAgent.sessions.size,
      mcpWrapperMetrics: boundAgent.mcpWrapper.getMetrics(),
      uiBridgeStatus: boundAgent.uiBridge.getStatus()
    };
  }

  // 모든 에이전트 상태 조회
  public getAllAgentsStatus(): any[] {
    return Array.from(this.agents.keys()).map(agentId => 
      this.getAgentStatus(agentId)
    ).filter(Boolean);
  }

  // 에이전트 제거
  public removeAgent(agentId: string): boolean {
    const boundAgent = this.agents.get(agentId);
    if (!boundAgent) return false;

    // 모든 세션 정리
    boundAgent.sessions.forEach((session, uiSessionId) => {
      boundAgent.uiBridge.cleanupSession(uiSessionId);
    });

    // 에이전트 제거
    this.agents.delete(agentId);

    if (this.config.enableLogging) {
      console.log(`🗑️ 에이전트 제거: ${agentId}`);
    }

    return true;
  }

  // 설정 업데이트
  public updateConfig(newConfig: Partial<AgentBindingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log(`⚙️ 에이전트 바인딩 설정 업데이트:`, this.config);
  }

  // UI 브릿지 활성화/비활성화
  public setUIBridgeEnabled(enabled: boolean): void {
    this.config.enableUIBridge = enabled;
    
    // 모든 에이전트의 MCP 래퍼에도 적용
    for (const boundAgent of this.agents.values()) {
      boundAgent.mcpWrapper.setUIBridgeEnabled(enabled);
    }

    console.log(`🌉 에이전트 바인딩 UI 브릿지 ${enabled ? '활성화' : '비활성화'}`);
  }

  // 정기적인 세션 정리 시작
  public startSessionCleanup(interval: number = 5 * 60 * 1000): NodeJS.Timeout {
    return setInterval(() => {
      this.cleanupExpiredSessions();
    }, interval);
  }

  // 정기적인 세션 정리 중지
  public stopSessionCleanup(intervalId: NodeJS.Timeout): void {
    clearInterval(intervalId);
  }
}

export default AgentsBinding;
