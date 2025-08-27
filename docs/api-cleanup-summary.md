# API 정리 요약

## 🗑️ 제거된 API

### 대시보드 API (2025-08-25 제거)
- `GET /api/dashboard/stats` - 대시보드 통계 데이터
- **이유**: 대시보드 컴포넌트 제거로 인한 불필요한 API
- **영향**: 프론트엔드에서 대시보드 관련 기능 완전 제거

## 📊 현재 활성 API

### 웹앱용 API (포트 3000)
- `POST /web/v1/reports` - 웹앱용 보고서 생성
- `POST /chat` - 채팅 API (MCP 통합)
- `DELETE /chat/:id/memory` - 메모리 삭제

### 통합 API 서버 (포트 3001)
- `POST /v1/reports` - 보고서 생성 (PDF/HTML)
- `POST /v1/reports/validate` - 데이터 검증
- `GET/POST/PUT/DELETE /v1/projects` - 프로젝트 관리
- `GET /v1/performance` - 성능 모니터링
- `GET /v1/diagnostics` - 사용자 진단 로그
- `GET /healthz` - 헬스체크

## 🔄 변경 사항

### 2025-08-25
- 대시보드 관련 모든 API 및 컴포넌트 제거
- 사이드바 메뉴에서 "고급 대시보드" 제거
- 라우팅에서 `/dashboard` 경로 제거
- API 상수에서 `DASHBOARD` 주석 처리
