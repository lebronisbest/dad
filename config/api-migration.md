# API 마이그레이션 가이드

## 🚨 중복 API 정리 완료

### 변경 사항 요약

#### 1. HTTP API 통합
- **기존**: 6개 엔드포인트 (중복/변형)
- **신규**: 2개 엔드포인트 (통합)

| 기존 엔드포인트 | 상태 | 새로운 엔드포인트 |
|----------------|------|------------------|
| `POST /api/generate` | 🚨 DEPRECATED | `POST /v1/reports?output=pdf` |
| `POST /api/reports/generate` | 🚨 DEPRECATED | `POST /v1/reports?output=pdf` |
| `POST /api/reports/generate-pdf` | 🚨 DEPRECATED | `POST /v1/reports?output=pdf` |
| `POST /api/reports/preview-html` | 🚨 DEPRECATED | `POST /v1/reports?output=html` |
| `POST /v1/reports/validate` | ✅ 유지 | `POST /v1/reports/validate` |
| `POST /v1/reports` | ✅ 통합 | `POST /v1/reports?output=pdf\|html` |

#### 2. 서비스 레이어 정리
- **기존**: 3개 서비스 (중복)
- **신규**: 1개 서비스 + thin-wrapper

| 서비스 파일 | 상태 | 역할 |
|-------------|------|------|
| `core/service.report.new.ts` | ✅ 본선 | 실제 PDF 생성 로직 |
| `core/service.report.js` | 🚨 DEPRECATED | thin-wrapper (하위 호환성) |
| `core/unified_report_service.ts` | 🚨 DEPRECATED | thin-wrapper (하위 호환성) |

#### 3. 템플릿 엔진 단일화
- **기존**: 2개 엔진 (중복)
- **신규**: 1개 엔진

| 엔진 | 상태 | 역할 |
|------|------|------|
| `core/templating.js` | ✅ 공식 | 표준 템플릿 주입 엔진 |
| `server/project_api.js` 내부 | 🚨 DEPRECATED | 호환성 래퍼 |

#### 4. MCP 서버 정리
- **기존**: 2개 서버 (철학 다름)
- **신규**: 1개 서버

| MCP 서버 | 상태 | 역할 |
|----------|------|------|
| `adapters/mcp/mcp_server.js` | ✅ 유지 | API 위임 (권장 아키텍처) |
| `server/mcp_server.js` | ❌ 삭제 | 직접 PDF 생성 (제거됨) |

#### 5. 라우터 구조 정리
- **기존**: 중복 구현
- **신규**: 분리된 구조

| 파일 | 상태 | 역할 |
|------|------|------|
| `adapters/http/server.js` | ✅ 유지 | 공통 미들웨어/부팅 |
| `adapters/http/routes.report.js` | ✅ 유지 | 라우팅 전담 |

### 마이그레이션 방법

#### 클라이언트 코드 업데이트

```javascript
// 🚨 기존 (Deprecated)
const response = await fetch('/api/generate', {
  method: 'POST',
  body: JSON.stringify(reportData)
});

// ✅ 신규 (권장)
const response = await fetch('/v1/reports?output=pdf', {
  method: 'POST',
  body: JSON.stringify(reportData)
});

// HTML 미리보기
const htmlResponse = await fetch('/v1/reports?output=html', {
  method: 'POST',
  body: JSON.stringify(reportData)
});
```

#### 서비스 코드 업데이트

```typescript
// 🚨 기존 (Deprecated)
import { generateReportPDF } from './core/service.report.js';
import { UnifiedReportService } from './core/unified_report_service.ts';

// ✅ 신규 (권장)
import { generateReport } from './core/service.report.new.js';

// 사용
const result = await generateReport(inputData, options);
```

### 하위 호환성

- 모든 deprecated 엔드포인트는 301 응답과 함께 새로운 API 정보 제공
- 2주 후 완전 제거 예정
- 콘솔에 경고 로그 출력

### 테스트 방법

```bash
# 1. 새로운 통합 API 테스트
curl -X POST "http://localhost:3001/v1/reports?output=pdf" \
  -H "Content-Type: application/json" \
  -d @test-data.json

# 2. HTML 미리보기 테스트
curl -X POST "http://localhost:3001/v1/reports?output=html" \
  -H "Content-Type: application/json" \
  -d @test-data.json

# 3. 데이터 검증 테스트
curl -X POST "http://localhost:3001/v1/reports/validate" \
  -H "Content-Type: application/json" \
  -d @test-data.json

# 4. Deprecated API 테스트 (301 응답 확인)
curl -X POST "http://localhost:3000/api/generate" \
  -H "Content-Type: application/json" \
  -d @test-data.json
```

### 롤백 계획

문제 발생 시 즉시 롤백:

```bash
# 1. 이전 태그로 복원
git checkout release-20250124-1200

# 2. 서비스 재시작
npm run start:api
npm run start:web
```

### 성능 개선

- 템플릿 캐싱 유지
- 브라우저 인스턴스 풀링 유지
- 새로운 통합 API로 응답 시간 단축

### 모니터링

- Deprecated API 사용량 추적
- 새로운 API 성능 메트릭
- 오류율 및 응답 시간 모니터링
