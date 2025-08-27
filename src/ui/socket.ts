import { io, Socket } from 'socket.io-client';

export interface UIAction {
  type: 'set_field' | 'set_fields' | 'open_panel' | 'highlight_field' | 'show_toast' | 'start_pdf_render' | 'update_progress' | 'end_pdf_render' | 'insert_law_citation' | 'add_issue' | 'focus';
  payload: any;
  timestamp: number;
  sequence: number;
}

export interface McpResult {
  tool: string;
  result: any;
  timestamp: number;
  sequence: number;
}

export interface SocketConfig {
  url: string;
  autoConnect: boolean;
  reconnection: boolean;
  reconnectionDelay: number;
  maxReconnectionAttempts: number;
}

export class UISocketClient {
  private socket: Socket | null = null;
  private config: SocketConfig;
  private uiSessionId: string | null = null;
  private userId: string | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private actionHandlers: Map<string, (action: UIAction) => void> = new Map();
  private mcpResultHandlers: Map<string, (result: McpResult) => void> = new Map();

  constructor(config: SocketConfig = {
    url: window.location.origin,
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    maxReconnectionAttempts: 5
  }) {
    this.config = config;
    this.generateUISessionId();
  }

  // UI 세션 ID 생성
  private generateUISessionId(): void {
    this.uiSessionId = `ui_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🎯 UI 세션 ID 생성: ${this.uiSessionId}`);
  }

  // 소켓 연결
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (this.socket && this.socket.connected) {
          console.log('🔌 이미 연결된 소켓이 있습니다.');
          resolve();
          return;
        }

        console.log(`🔌 소켓 연결 시도: ${this.config.url}`);
        
        this.socket = io(this.config.url, {
          transports: ['websocket', 'polling'],
          autoConnect: this.config.autoConnect,
          reconnection: this.config.reconnection,
          reconnectionDelay: this.config.reconnectionDelay,
          maxReconnectionAttempts: this.config.maxReconnectionAttempts
        });

        this.setupEventHandlers();
        
        if (this.config.autoConnect) {
          this.socket.connect();
        }

        // 연결 성공 시 resolve
        this.socket.on('connect', () => {
          console.log('🔌 소켓 연결 성공');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // UI 세션 조인
          if (this.uiSessionId) {
            this.joinUISession();
          }
          
          resolve();
        });

        // 연결 실패 시 reject
        this.socket.on('connect_error', (error) => {
          console.error('❌ 소켓 연결 실패:', error);
          this.isConnected = false;
          reject(error);
        });

        // 연결 해제 시
        this.socket.on('disconnect', (reason) => {
          console.log(`🔌 소켓 연결 해제: ${reason}`);
          this.isConnected = false;
          
          if (reason === 'io server disconnect') {
            // 서버에서 연결을 끊은 경우
            console.log('🔄 서버에서 연결을 끊었습니다. 재연결을 시도합니다...');
            this.socket?.connect();
          }
        });

        // 재연결 시도 시
        this.socket.on('reconnect', (attemptNumber) => {
          console.log(`🔄 소켓 재연결 성공 (시도: ${attemptNumber})`);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // UI 세션 재조인
          if (this.uiSessionId) {
            this.joinUISession();
          }
        });

        // 재연결 실패 시
        this.socket.on('reconnect_failed', () => {
          console.error('❌ 소켓 재연결 실패');
          this.isConnected = false;
        });

      } catch (error) {
        console.error('❌ 소켓 연결 오류:', error);
        reject(error);
      }
    });
  }

  // 이벤트 핸들러 설정
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // UI 세션 조인 응답
    this.socket.on('ui:joined', (data: any) => {
      console.log('🎯 UI 세션 조인 완료:', data);
    });

    // UI 액션 수신
    this.socket.on('ui:actions', (actions: UIAction[]) => {
      console.log(`🎬 UI 액션 수신: ${actions.length}개`);
      this.handleUIActions(actions);
    });

    // MCP 결과 수신
    this.socket.on('mcp:result', (result: McpResult) => {
      console.log(`📡 MCP 결과 수신: ${result.tool}`);
      this.handleMcpResult(result);
    });

    // 핑/퐁 응답
    this.socket.on('pong', (data: any) => {
      console.log('🏓 퐁 수신:', data);
    });
  }

  // UI 세션 조인
  private joinUISession(): void {
    if (!this.socket || !this.uiSessionId) return;

    console.log(`🎯 UI 세션 조인: ${this.uiSessionId}`);
    this.socket.emit('ui:join', {
      uiSessionId: this.uiSessionId,
      userId: this.userId
    });
  }

  // UI 액션 처리
  private handleUIActions(actions: UIAction[]): void {
    actions.forEach(action => {
      // 전역 핸들러 호출
      const globalHandler = this.actionHandlers.get('*');
      if (globalHandler) {
        globalHandler(action);
      }

      // 타입별 핸들러 호출
      const typeHandler = this.actionHandlers.get(action.type);
      if (typeHandler) {
        typeHandler(action);
      }
    });
  }

  // MCP 결과 처리
  private handleMcpResult(result: McpResult): void {
    // 전역 핸들러 호출
    const globalHandler = this.mcpResultHandlers.get('*');
    if (globalHandler) {
      globalHandler(result);
    }

    // 툴별 핸들러 호출
    const toolHandler = this.mcpResultHandlers.get(result.tool);
    if (toolHandler) {
      toolHandler(result);
    }
  }

  // UI 액션 핸들러 등록
  public onAction(type: string, handler: (action: UIAction) => void): void {
    this.actionHandlers.set(type, handler);
  }

  // MCP 결과 핸들러 등록
  public onMcpResult(tool: string, handler: (result: McpResult) => void): void {
    this.mcpResultHandlers.set(tool, handler);
  }

  // 핸들러 제거
  public offAction(type: string): void {
    this.actionHandlers.delete(type);
  }

  public offMcpResult(tool: string): void {
    this.mcpResultHandlers.delete(tool);
  }

  // UI 세션 ID 조회
  public getUISessionId(): string | null {
    return this.uiSessionId;
  }

  // 사용자 ID 설정
  public setUserId(userId: string): void {
    this.userId = userId;
    console.log(`👤 사용자 ID 설정: ${userId}`);
  }

  // 연결 상태 조회
  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // 핑 전송 (연결 상태 확인)
  public ping(): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('ping');
    }
  }

  // UI 세션 이탈
  public leaveUISession(): void {
    if (!this.socket || !this.uiSessionId) return;

    console.log(`🚪 UI 세션 이탈: ${this.uiSessionId}`);
    this.socket.emit('ui:leave', { uiSessionId: this.uiSessionId });
  }

  // 소켓 연결 해제
  public disconnect(): void {
    if (this.socket) {
      console.log('🔌 소켓 연결 해제');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // 소켓 인스턴스 조회
  public getSocket(): Socket | null {
    return this.socket;
  }

  // 설정 업데이트
  public updateConfig(newConfig: Partial<SocketConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ 소켓 설정 업데이트:', this.config);
  }

  // 재연결 시도
  public reconnect(): void {
    if (this.socket) {
      console.log('🔄 수동 재연결 시도');
      this.socket.connect();
    }
  }

  // 연결 상태 모니터링 시작
  public startConnectionMonitoring(interval: number = 30000): NodeJS.Timeout {
    return setInterval(() => {
      if (!this.isConnected) {
        console.log('⚠️ 소켓 연결이 끊어졌습니다. 재연결을 시도합니다...');
        this.reconnect();
      } else {
        // 연결 상태 확인을 위한 핑 전송
        this.ping();
      }
    }, interval);
  }

  // 연결 상태 모니터링 중지
  public stopConnectionMonitoring(intervalId: NodeJS.Timeout): void {
    clearInterval(intervalId);
  }
}

// 싱글톤 인스턴스 생성
export const uiSocketClient = new UISocketClient();

export default UISocketClient;
