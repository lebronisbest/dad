# TT API v1 마이그레이션 가이드

## 개요

TT 프로젝트의 모든 레거시 API가 제거되고 `/v1/*`로 표준화되었습니다. 이 문서는 기존 코드를 새로운 API로 마이그레이션하는 방법을 설명합니다.

## 🚨 주요 변경사항

### 허용된 경로
- ✅ `/v1/*` - 모든 API 엔드포인트
- ✅ `/health` - 헬스체크
- ✅ `/healthz` - 헬스체크 (별칭)
- ✅ `/metrics` - 시스템 메트릭스

### 차단된 경로 (410 Gone)
- ❌ `/api/*` - 모든 레거시 API
- ❌ `/legacy/*` - 레거시 시스템
- ❌ `/v0/*` - 이전 버전 API
- ❌ `/old/*` - 구식 시스템

## 🔄 마이그레이션 매핑

### 1. 보고서 생성 API

**이전 (제거됨):**
```javascript
// ❌ 더 이상 사용되지 않음
fetch('/api/generate?type=pdf', {
  method: 'POST',
  body: JSON.stringify(data)
});

fetch('/api/generate?type=html', {
  method: 'POST',
  body: JSON.stringify(data)
});
```

**새로운 방식:**
```javascript
// ✅ 새로운 통합 API 사용
import { API } from '../utils/api.js';

// PDF 생성
fetch(`${API.REPORTS}?output=pdf`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

// HTML 미리보기
fetch(`${API.REPORTS}?output=html`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

### 2. 프로젝트 관리 API

**이전 (제거됨):**
```javascript
// ❌ 더 이상 사용되지 않음
fetch('/api/projects', { method: 'GET' });
fetch('/api/projects', { 
  method: 'POST', 
  body: JSON.stringify(projectData) 
});
```

**새로운 방식:**
```javascript
// ✅ 새로운 API 상수 사용
import { API } from '../utils/api.js';

// 프로젝트 목록 조회
fetch(API.PROJECTS, { method: 'GET' });

// 프로젝트 생성
fetch(API.PROJECTS, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(projectData)
});

// 특정 프로젝트 조회
fetch(API.PROJECT(projectId), { method: 'GET' });

// 프로젝트 보고서 목록
fetch(API.PROJECT_REPORTS(projectId), { method: 'GET' });
```

### 3. 보고서 저장소 API

**이전 (제거됨):**
```javascript
// ❌ 더 이상 사용되지 않음
fetch('/api/reports');
fetch('/api/reports/preview');
```

**새로운 방식:**
```javascript
// ✅ 새로운 API 상수 사용
import { API } from '../utils/api.js';

// 보고서 목록
fetch(API.REPORTS_LIST, { method: 'GET' });

// 보고서 파일 다운로드
fetch(API.REPORT_FILE(fileName), { method: 'GET' });

// 보고서 검증
fetch(API.VALIDATE, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(reportData)
});
```

## 📝 코드 수정 예시

### ReportList.jsx 수정

**수정 전:**
```javascript
const htmlResponse = await fetch('/api/generate?type=html', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(enhancedReportData)
});
```

**수정 후:**
```javascript
import { API } from '../utils/api.js';

const htmlResponse = await fetch(`${API.REPORTS}?output=html`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(enhancedReportData)
});
```

### ProjectDetail.jsx 수정

**수정 전:**
```javascript
const htmlResponse = await fetch('/api/generate?type=html', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(reportData)
});
```

**수정 후:**
```javascript
import { API } from '../utils/api.js';

const htmlResponse = await fetch(`${API.REPORTS}?output=html`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(reportData)
});
```

## 🧪 테스트 및 검증

### 1. 레거시 API 참조 검사
```bash
npm run test:legacy
```

### 2. 라우트 스냅샷 테스트
```bash
npm run test:snapshot
```

### 3. 전체 테스트 실행
```bash
npm test
```

## 🔧 문제 해결

### 410 Gone 오류가 발생하는 경우

**오류 메시지:**
```json
{
  "ok": false,
  "code": "LEGACY_ENDPOINT_RETIRED",
  "message": "이 엔드포인트는 더 이상 사용되지 않습니다. /v1/* API를 사용해주세요.",
  "details": {
    "path": "/api/generate",
    "allowed": ["/v1/*", "/health"]
  }
}
```

**해결 방법:**
1. `src/utils/api.js`의 API 상수 사용
2. 하드코딩된 엔드포인트를 `/v1/*`로 변경
3. `output` 쿼리 파라미터 사용 (`type` 대신)

### API 상수가 정의되지 않은 경우

**확인 사항:**
1. `src/utils/api.js` 파일이 존재하는지 확인
2. import 경로가 올바른지 확인
3. ES6 모듈 문법 사용 (`import`/`export`)

## 📚 추가 리소스

### API 문서
- OpenAPI 스펙: `docs/openapi.yaml`
- API 상수 정의: `src/utils/api.js`

### 관련 파일
- 서버 설정: `adapters/http/server.js`
- 라우트 가드: `adapters/http/middleware/routeGuard.js`
- 테스트: `test/routes.snapshot.test.js`

### 마이그레이션 체크리스트

- [ ] `/api/generate?type=` → `/v1/reports?output=` 변경
- [ ] `/api/projects` → `/v1/projects` 변경
- [ ] `/api/reports` → `/v1/reports` 변경
- [ ] 하드코딩된 엔드포인트 제거
- [ ] API 상수 사용으로 변경
- [ ] 테스트 실행 및 통과 확인
- [ ] 410 오류 해결 확인

## 🚀 배포 후 확인사항

1. **헬스체크 확인**
   ```bash
   curl http://localhost:3001/healthz
   ```

2. **새로운 API 테스트**
   ```bash
   curl http://localhost:3001/v1/samples/dto
   ```

3. **레거시 API 차단 확인**
   ```bash
   curl http://localhost:3001/api/generate
   # 410 Gone 응답 확인
   ```

## 📞 지원

마이그레이션 중 문제가 발생하면:
1. 이 문서의 문제 해결 섹션 확인
2. 테스트 실행하여 오류 원인 파악
3. 개발팀에 문의 (engineering@tt-project.com)

---

**마지막 업데이트:** 2025-01-25  
**버전:** v1.0.0  
**상태:** 프로덕션 준비 완료
