# UI 브릿지 (UI Bridge) - 안전보고서 실시간 업데이트

## 개요

UI 브릿지는 MCP 툴 호출 결과를 실시간으로 웹 UI에 반영하는 시스템입니다. 사용자가 채팅으로 요청하면 화면이 즉시 업데이트되어 더욱 직관적이고 반응성 있는 사용자 경험을 제공합니다.

## 주요 기능

### 🚀 실시간 UI 업데이트
- **필드 자동 채우기**: "필드 자동으로 채워줘" → 보고서 폼이 즉시 완성
- **검증 결과 표시**: "검증해줘" → 문제가 있는 필드가 강조되고 수정 가이드 제공
- **PDF 생성 진행률**: "PDF 만들어" → 단계별 진행 상황을 실시간으로 표시

### 🔌 Socket.IO 기반 통신
- **양방향 실시간 통신**: 서버와 클라이언트 간 즉시 데이터 전송
- **세션 격리**: 각 사용자별 독립적인 UI 세션 관리
- **자동 재연결**: 네트워크 오류 시 자동으로 연결 복구

### 🎬 액션 기반 UI 제어
- **화이트리스트 액션**: 보안을 위해 허용된 UI 액션만 실행
- **자동 변환**: MCP 툴 결과를 적절한 UI 액션으로 자동 변환
- **에러 처리**: 실패한 작업에 대한 명확한 피드백 제공

## 아키텍처

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   클라이언트    │    │   UI 브릿지     │    │   MCP 서버      │
│                 │◄──►│                 │◄──►│                 │
│ • Socket.IO     │    │ • SocketManager │    │ • fill_report   │
│ • ActionExecutor│    │ • UIBridge      │    │ • validate_data │
│ • React UI      │    │ • MCPWrapper    │    │ • render_pdf    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 설치 및 설정

### 1. 의존성 설치

```bash
npm install socket.io socket.io-client uuid
npm install --save-dev @types/uuid
```

### 2. 환경 변수 설정

```bash
# .env 파일
UI_BRIDGE_ENABLED=true
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 3. 서버 시작

```bash
npm run webapp
```

## 사용법

### 기본 사용법

1. **웹 페이지 접속**: 브라우저에서 `http://localhost:3000` 접속
2. **자동 연결**: 페이지 로드 시 Socket.IO 연결이 자동으로 설정됨
3. **채팅 요청**: "필드 자동으로 채워줘" 등의 메시지 입력
4. **실시간 반영**: 요청한 작업이 화면에 즉시 반영됨

### API 요청 예시

```javascript
// 채팅 요청 시 uiSessionId 포함
const response = await fetch('/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "필드 자동으로 채워줘",
    conversationId: "conv_123",
    apiKey: "your-openai-api-key",
    uiSessionId: "ui_1234567890_abc123" // 자동 생성됨
  })
});
```

### 지원하는 UI 액션

| 액션 타입 | 설명 | 예시 |
|-----------|------|------|
| `set_field` | 단일 필드 값 설정 | 입력 필드에 값 입력 |
| `set_fields` | 여러 필드 일괄 설정 | 보고서 전체 폼 완성 |
| `highlight_field` | 필드 강조 표시 | 오류 필드 빨간색 강조 |
| `show_toast` | 토스트 메시지 표시 | "작업 완료" 알림 |
| `open_panel` | 패널 열기 | 미리보기 패널 표시 |
| `start_pdf_render` | PDF 생성 시작 | 진행률 표시기 표시 |
| `update_progress` | 진행률 업데이트 | 50% → 75% 업데이트 |
| `end_pdf_render` | PDF 생성 완료 | 다운로드 링크 제공 |

## 개발자 가이드

### 서버 측 구현

#### 1. Socket.IO 서버 설정

```javascript
// server/socket.ts
import { Server as SocketIOServer } from 'socket.io';

const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ["http://localhost:3000"],
    credentials: true
  }
});
```

#### 2. UI 브릿지 초기화

```javascript
// web_server.js
const socketManager = new SocketManager(server);
const uiBridge = new UIBridge(socketManager);
const mcpWrapper = new MCPWrapper(mcp, uiBridge);
```

#### 3. MCP 툴 결과를 UI 액션으로 변환

```javascript
// server/ui-translators.ts
const translator = new UITranslator({ uiSessionId, userId });
const actions = translator.translateToolResult(toolResult);
await uiBridge.emitActions(uiSessionId, actions);
```

### 클라이언트 측 구현

#### 1. 소켓 클라이언트 연결

```javascript
// src/ui/socket.ts
import { uiSocketClient } from './socket';

await uiSocketClient.connect();
const sessionId = uiSocketClient.getUISessionId();
```

#### 2. 액션 실행기 설정

```javascript
// src/ui/action-executor.ts
import { actionExecutor } from './action-executor';

// UI 액션 수신 시 자동 실행
uiSocketClient.onAction('*', async (action) => {
  await actionExecutor.executeAction(action);
});
```

#### 3. 커스텀 액션 핸들러 등록

```javascript
// 커스텀 필드 설정 핸들러
actionExecutor.registerHandler('set_field', async (action) => {
  const { field, value } = action.payload;
  // 사용자 정의 로직
  document.getElementById(field).value = value;
});
```

## 보안 고려사항

### 1. 세션 격리
- 각 `uiSessionId`는 독립적인 룸으로 관리
- 사용자 간 데이터 혼재 방지
- 세션 타임아웃으로 자동 정리

### 2. 액션 화이트리스트
- 허용된 UI 액션만 실행 가능
- 서버에서 생성된 액션만 신뢰
- 클라이언트 임의 액션 생성 차단

### 3. 페이로드 제한
- 최대 1MB 페이로드 크기 제한
- 과도한 데이터 전송 방지
- 악의적인 대용량 데이터 차단

## 모니터링 및 디버깅

### 1. 서버 상태 확인

```bash
# UI 브릿지 상태 조회
GET /api/ui-bridge/status

# 응답 예시
{
  "success": true,
  "data": {
    "uiBridge": {
      "enabled": true,
      "activeSessions": 3,
      "metrics": true
    },
    "mcpWrapper": {
      "enableUIBridge": true,
      "totalCalls": 25,
      "successfulCalls": 23
    }
  }
}
```

### 2. 설정 업데이트

```bash
# UI 브릿지 설정 변경
POST /api/ui-bridge/config
{
  "enabled": true,
  "maxPayloadSize": 1048576,
  "enableMetrics": true
}
```

### 3. 브라우저 콘솔 디버깅

```javascript
// 개발 모드에서 전역 객체로 접근 가능
window.uiBridge.socket.getConnectionStatus();
window.uiBridge.executor.getMetrics();
```

## 성능 최적화

### 1. 연결 관리
- **자동 재연결**: 네트워크 오류 시 지수 백오프로 재시도
- **연결 모니터링**: 30초마다 연결 상태 확인
- **세션 정리**: 비활성 세션 자동 제거

### 2. 메모리 관리
- **액션 히스토리**: 최근 100개 실행 시간만 유지
- **세션 타임아웃**: 30분 비활성 시 자동 정리
- **가비지 컬렉션**: 사용하지 않는 핸들러 자동 정리

### 3. 배치 처리
- **액션 일괄 실행**: 여러 액션을 한 번에 처리
- **비동기 실행**: UI 블로킹 방지
- **에러 격리**: 개별 액션 실패가 전체에 영향 주지 않음

## 문제 해결

### 일반적인 문제들

#### 1. 소켓 연결 실패
```bash
# 확인 사항
- 서버가 실행 중인지 확인
- CORS 설정이 올바른지 확인
- 방화벽에서 WebSocket 포트 차단 여부 확인
```

#### 2. UI 액션이 실행되지 않음
```bash
# 확인 사항
- uiSessionId가 요청에 포함되었는지 확인
- 액션 실행기가 초기화되었는지 확인
- 브라우저 콘솔에 오류 메시지 확인
```

#### 3. 성능 문제
```bash
# 확인 사항
- 페이로드 크기가 1MB 이하인지 확인
- 불필요한 액션이 반복 생성되지 않는지 확인
- 세션 정리가 정상적으로 작동하는지 확인
```

### 로그 분석

```bash
# 서버 로그에서 확인할 수 있는 정보
🔌 Socket.IO 서버 초기화 완료
🎯 UI 세션 조인: ui_1234567890_abc123
📡 MCP 결과 전송: ui_1234567890_abc123 -> fill_report
🎬 UI 액션 브릿지: ui_1234567890_abc123 -> 3개 액션
```

## 확장 및 커스터마이징

### 1. 새로운 UI 액션 추가

```javascript
// 서버 측: 번역기에 새 액션 타입 추가
case 'custom_action':
  return this.translateCustomAction(result);

// 클라이언트 측: 액션 실행기에 핸들러 등록
actionExecutor.registerHandler('custom_action', async (action) => {
  // 사용자 정의 로직
});
```

### 2. 커스텀 번역기 구현

```javascript
// server/custom-translator.ts
export class CustomTranslator extends UITranslator {
  protected translateCustomTool(result: any): UIAction[] {
    // 사용자 정의 변환 로직
    return [{
      type: 'custom_action',
      payload: { data: result },
      timestamp: Date.now(),
      sequence: 0
    }];
  }
}
```

### 3. 메트릭 확장

```javascript
// 사용자 정의 메트릭 추가
class CustomMetrics extends BridgeMetrics {
  customMetric: number = 0;
  
  updateCustomMetric(value: number) {
    this.customMetric = value;
  }
}
```

## 릴리스 노트

### v1.0-ui-bridge (현재 버전)

#### 새로운 기능
- ✅ Socket.IO 기반 실시간 통신
- ✅ MCP 툴 결과 자동 UI 변환
- ✅ 세션 격리 및 보안
- ✅ 자동 재연결 및 모니터링
- ✅ 액션 기반 UI 제어

#### 개선사항
- 🔧 에러 처리 및 복구 로직 강화
- 🔧 성능 최적화 및 메모리 관리
- 🔧 로깅 및 모니터링 개선

#### 알려진 이슈
- ⚠️ 일부 브라우저에서 WebSocket 폴백 필요
- ⚠️ 대용량 데이터 전송 시 성능 저하 가능성

## 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능

## 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 문의 및 지원

- **이슈 리포트**: GitHub Issues 사용
- **기술 문의**: 개발팀에 직접 연락
- **문서 개선**: Pull Request로 제안

---

**참고**: 이 문서는 UI 브릿지 v1.0을 기준으로 작성되었습니다. 최신 정보는 코드베이스를 참조하시기 바랍니다.
