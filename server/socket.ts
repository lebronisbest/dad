import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { v4 as uuidv4 } from 'uuid';

export interface UISession {
  id: string;
  userId?: string;
  createdAt: Date;
  lastActivity: Date;
  room: string;
}

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

class SocketManager {
  private io: SocketIOServer;
  private sessions: Map<string, UISession> = new Map();
  private sequenceCounters: Map<string, number> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ["http://localhost:3000", "http://localhost:5173"],
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    console.log('🔌 Socket.IO 서버 초기화 완료');
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 클라이언트 연결: ${socket.id}`);

      // UI 세션 조인
      socket.on('ui:join', (data: { uiSessionId: string; userId?: string }) => {
        this.handleUIJoin(socket, data);
      });

      // UI 세션 이탈
      socket.on('ui:leave', (data: { uiSessionId: string }) => {
        this.handleUILeave(socket, data);
      });

      // 연결 해제
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // 핑/퐁 (연결 상태 확인)
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });
    });
  }

  private handleUIJoin(socket: any, data: { uiSessionId: string; userId?: string }) {
    const { uiSessionId, userId } = data;
    
    // 세션 생성 또는 업데이트
    const session: UISession = {
      id: uiSessionId,
      userId,
      createdAt: new Date(),
      lastActivity: new Date(),
      room: `ui_${uiSessionId}`
    };

    this.sessions.set(uiSessionId, session);
    this.sequenceCounters.set(uiSessionId, 0);

    // 룸에 조인
    socket.join(session.room);
    
    console.log(`🎯 UI 세션 조인: ${uiSessionId} (사용자: ${userId || 'anonymous'})`);
    
    // 조인 확인 응답
    socket.emit('ui:joined', {
      uiSessionId,
      room: session.room,
      timestamp: Date.now()
    });
  }

  private handleUILeave(socket: any, data: { uiSessionId: string }) {
    const { uiSessionId } = data;
    
    // 룸에서 이탈
    socket.leave(`ui_${uiSessionId}`);
    
    // 세션 정리
    this.sessions.delete(uiSessionId);
    this.sequenceCounters.delete(uiSessionId);
    
    console.log(`🚪 UI 세션 이탈: ${uiSessionId}`);
  }

  private handleDisconnect(socket: any) {
    console.log(`🔌 클라이언트 연결 해제: ${socket.id}`);
    
    // 해당 소켓이 속한 모든 세션에서 제거
    for (const [sessionId, session] of this.sessions.entries()) {
      if (socket.rooms.has(session.room)) {
        this.sessions.delete(sessionId);
        this.sequenceCounters.delete(sessionId);
        console.log(`🧹 세션 정리: ${sessionId}`);
      }
    }
  }

  // MCP 결과를 해당 UI 세션으로 전송
  public emitMcpResult(uiSessionId: string, tool: string, result: any): boolean {
    const session = this.sessions.get(uiSessionId);
    if (!session) {
      console.warn(`⚠️ UI 세션을 찾을 수 없음: ${uiSessionId}`);
      return false;
    }

    const sequence = this.getNextSequence(uiSessionId);
    const mcpResult: McpResult = {
      tool,
      result,
      timestamp: Date.now(),
      sequence
    };

    this.io.to(session.room).emit('mcp:result', mcpResult);
    
    // 세션 활동 시간 업데이트
    session.lastActivity = new Date();
    
    console.log(`📡 MCP 결과 전송: ${uiSessionId} -> ${tool} (시퀀스: ${sequence})`);
    return true;
  }

  // UI 액션을 해당 세션으로 전송
  public emitActions(uiSessionId: string, actions: UIAction[]): boolean {
    const session = this.sessions.get(uiSessionId);
    if (!session) {
      console.warn(`⚠️ UI 세션을 찾을 수 없음: ${uiSessionId}`);
      return false;
    }

    // 각 액션에 시퀀스 번호 할당
    const sequencedActions = actions.map(action => ({
      ...action,
      sequence: this.getNextSequence(uiSessionId),
      timestamp: Date.now()
    }));

    this.io.to(session.room).emit('ui:actions', sequencedActions);
    
    // 세션 활동 시간 업데이트
    session.lastActivity = new Date();
    
    console.log(`🎬 UI 액션 전송: ${uiSessionId} -> ${actions.length}개 액션`);
    return true;
  }

  // 시퀀스 번호 생성
  private getNextSequence(uiSessionId: string): number {
    const current = this.sequenceCounters.get(uiSessionId) || 0;
    const next = current + 1;
    this.sequenceCounters.set(uiSessionId, next);
    return next;
  }

  // 세션 상태 조회
  public getSessionStats() {
    return {
      totalSessions: this.sessions.size,
      activeSessions: Array.from(this.sessions.values()).filter(s => 
        Date.now() - s.lastActivity.getTime() < 30 * 60 * 1000 // 30분 이내 활동
      ).length,
      sessions: Array.from(this.sessions.values()).map(s => ({
        id: s.id,
        userId: s.userId,
        createdAt: s.createdAt,
        lastActivity: s.lastActivity,
        room: s.room
      }))
    };
  }

  // 특정 세션 조회
  public getSession(uiSessionId: string): UISession | undefined {
    return this.sessions.get(uiSessionId);
  }

  // 서버 인스턴스 반환
  public getIO(): SocketIOServer {
    return this.io;
  }
}

export default SocketManager;
