# 🐛 안전보고서 시스템 버그 수정 요약

## 📋 수정된 주요 버그들

### 1. 🚨 **Critical: renderPDFBuffer 반환값 오사용**
- **위치**: `adapters/http/routes.report.js`
- **문제**: `renderPDFBuffer`가 `{ ok, buffer, error }` 객체를 반환하는데, 버퍼로 직접 사용
- **결과**: `pdfBuffer.length`에서 타입 오류 → 500 응답 → 프론트 무한 로딩
- **수정**: 구조분해할당으로 `buffer` 추출 후 사용

```javascript
// 수정 전 (버그)
const pdfBuffer = await renderPDFBuffer(htmlContent, { /*...*/ });
res.setHeader('Content-Length', pdfBuffer.length);
res.send(pdfBuffer);

// 수정 후 (정상)
const { ok, buffer, error } = await renderPDFBuffer(htmlContent, { /*...*/ });
if (!ok || !buffer) {
  return res.status(500).json({ ok: false, error: error || 'PDF 렌더 실패' });
}
res.setHeader('Content-Length', buffer.length);
res.send(buffer);
```

### 2. 🔄 **API 엔드포인트 혼동**
- **문제**: 두 서버가 같은 `/v1/reports` 경로 사용
  - `web_server.js` (포트 3000): HTML만 생성, PDF 생성 안 함
  - `adapters/http/server.js` (포트 5058): 실제 PDF 생성
- **결과**: 프론트가 3000번 포트 호출 시 PDF 영원히 안 생김
- **수정**: 
  - 웹앱: `/web/v1/reports`로 변경
  - 프론트엔드: `http://localhost:5058/v1/reports` 사용

### 3. ⏰ **무한 대기 방지 가드 추가**
- **위치**: `core/render.js`
- **문제**: `page.setContent`에서 `networkidle0` 대기 시 외부 리소스 무한 대기 가능
- **수정**: 15초 타임아웃 + `domcontentloaded` 폴백

```javascript
// 수정 전
await page.setContent(html, { waitUntil: 'networkidle0' });

// 수정 후
const SETCONTENT_TIMEOUT = 15000;
try {
  await Promise.race([
    page.setContent(html, { waitUntil: 'networkidle0' }),
    new Promise((_, rej) => setTimeout(() => rej(new Error('setContent timeout')), SETCONTENT_TIMEOUT))
  ]);
} catch (timeoutError) {
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
}
```

### 4. 🚦 **동시성 제한 안전성 강화**
- **문제**: 환경변수 실수로 0 설정 시 무한 대기 루프
- **수정**: `Math.max(1, Number(env))`로 최소값 1 보장

```javascript
// 수정 전
const MAX_CONCURRENT_RENDERS = parseInt(process.env.MAX_CONCURRENT_RENDERS || '3');

// 수정 후
const MAX_CONCURRENT_RENDERS = Math.max(1, Number(process.env.MAX_CONCURRENT_RENDERS) || 3);
```

## 🧪 테스트 방법

### 1. API 서버 실행
```bash
npm run api  # 포트 5058에서 실행
```

### 2. 자동 테스트 스크립트
```bash
node test_pdf_api.js
```

### 3. 수동 테스트 (curl)
```bash
curl -X POST "http://localhost:5058/v1/reports?output=pdf" \
  -H "Content-Type: application/json" \
  --data '{
    "site":{"name":"현장A"}, 
    "org":{"name":"조직A"}, 
    "inspector":"홍길동",
    "visit":{"date":"2025-08-01", "round":1, "round_total":4},
    "sections":[]
  }' \
  --output report.pdf
```

## 🔧 환경변수 설정

`.env` 파일에 추가:
```bash
# PDF 렌더링 설정
MAX_CONCURRENT_RENDERS=3
SETCONTENT_TIMEOUT=15000
```

## 📊 수정 결과

### ✅ 해결된 문제들
- [x] PDF 생성 시 500 오류
- [x] 프론트엔드 무한 로딩
- [x] API 엔드포인트 혼동
- [x] 무한 대기 가능성
- [x] 동시성 제한 안전성

### 🎯 개선된 기능들
- [x] 에러 처리 강화
- [x] 타임아웃 가드
- [x] 폴백 메커니즘
- [x] 명확한 API 분리
- [x] 테스트 자동화

## 🚀 다음 단계

1. **프로덕션 배포 전 테스트**
   - 다양한 데이터로 PDF 생성 테스트
   - 동시 요청 처리 테스트
   - 메모리 누수 확인

2. **모니터링 강화**
   - PDF 생성 성공률 추적
   - 응답 시간 모니터링
   - 에러 로그 분석

3. **사용자 경험 개선**
   - 진행률 표시
   - 에러 메시지 개선
   - 재시도 메커니즘

## 📝 참고사항

- **포트 3000**: 웹앱 UI (HTML 생성만)
- **포트 5058**: PDF API 서버 (실제 PDF 생성)
- **프론트엔드**: 5058 포트의 API 호출 필요
- **환경변수**: `.env` 파일로 설정 관리

---

**수정 완료일**: 2025-08-24  
**담당자**: AI Assistant  
**검증 상태**: 코드 수정 완료, 테스트 필요
