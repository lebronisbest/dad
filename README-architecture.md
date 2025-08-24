# 안전보고서 시스템 아키텍처

## 개요

이 시스템은 MCP(LLM in-the-loop)와 HTTP API(LLM out-of-the-loop)의 경계를 명확히 분리하여 안정적이고 일관된 PDF 생성 서비스를 제공합니다.

## 아키텍처 원칙

### 1. 경계 분리
- **MCP**: 자연어 → 구조화, 추론이 필요한 작업 (DTO 생성, 법령 검색, 요약)
- **HTTP API**: 결정론적 작업 (검증, 렌더링, 저장, 다운로드)

### 2. 단일 책임
- **코어 서비스**: 검증 → 템플릿 주입 → PDF 렌더 → 저장
- **어댑터**: 입출력 포맷 변환만 담당

### 3. 안정성 우선
- Puppeteer 매 요청 newPage() 사용
- 외부 CDN/폰트 차단으로 빈 PDF 방지
- file_uri와 http_url 동시 제공

## 폴더 구조

```
TT/
├── core/                    # 핵심 비즈니스 로직
│   ├── schema.report.js    # DTO 스키마 + 정규화
│   ├── service.report.js   # PDF 생성 오케스트레이션
│   ├── render.js           # Puppeteer 렌더링 (안정화)
│   ├── storage.js          # 파일 저장 + 메타 생성
│   └── templating.js       # HTML 템플릿 주입
├── adapters/               # 외부 인터페이스
│   ├── http/               # HTTP API 어댑터
│   │   ├── server.js       # Express 서버
│   │   └── routes.report.js # API 라우트
│   └── mcp/                # MCP 어댑터
│       └── mcp_server.js   # MCP 툴 정의
├── downloads/               # 생성된 PDF 파일
└── templates/               # HTML 템플릿
```

## 사용법

### 1. 서버 시작

```bash
# HTTP API 서버만
npm run api

# MCP 서버만
npm run mcp

# 둘 다 시작 (새 터미널에서)
npm run dev:full
```

### 2. 플로우 A: 채팅 → 자동완성 → 검증/저장 → PDF

1. **LLM이 MCP 호출**: `report.autofill`로 자연어 → DTO 변환
2. **프론트엔드 검증**: `/v1/reports/validate`로 데이터 검증
3. **보고서 저장**: `/v1/reports`로 검증 + PDF 생성
4. **다운로드 링크**: 응답의 `file.fileUri` 또는 `file.httpUrl` 사용

### 3. 플로우 B: 법령 인용 추가

1. **LLM이 MCP 호출**: `legal.search`로 법령 검색
2. **DTO에 인용 추가**: 검색 결과를 보고서 데이터에 포함
3. **이후 플로우 A와 동일**

## API 엔드포인트

### POST /v1/reports/validate
보고서 데이터 검증

### POST /v1/reports/pdf
PDF 생성 (검증 없이)

### POST /v1/reports
통합 보고서 생성 (검증 + PDF)

### GET /v1/templates
템플릿 정보 조회

### GET /health
서버 상태 확인

## MCP 툴

### report.autofill
자연어 입력을 보고서 DTO로 변환

### legal.search
안전 관련 법령 검색 및 요약

## 환경 변수

```bash
PORT=5058                           # HTTP API 서버 포트
HTTP_BASE_URL=http://localhost:5058 # 기본 URL
DOWNLOADS_DIR=downloads             # PDF 저장 디렉토리
TEMPLATE_PATH=templates/layout.html # HTML 템플릿 경로
CHROME_PATH=                        # Chrome 실행 파일 경로 (선택)
```

## 테스트

```bash
# API 테스트
curl -X POST http://localhost:5058/v1/reports \
  -H "Content-Type: application/json" \
  -d '{"site": {"name": "현장 A"}, "org": {"name": "기관 B", "inspector": "홍길동"}, "round": 1, "round_total": 3, "visit": {"date": "2025-08-24"}}'

# MCP 테스트
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "report.autofill", "arguments": {"free_text": "ABC제조공장 안전점검"}}}' | node server/mcp_server.js
```

## 장점

1. **경계 명확**: MCP는 추론만, API는 실행만
2. **안정성**: Puppeteer 동시성 문제 해결
3. **일관성**: 단일 코어 서비스로 동일 결과 보장
4. **확장성**: 새로운 어댑터 추가 용이
5. **유지보수**: 책임 분리로 코드 이해도 향상

## 문제 해결

### PDF가 비어있거나 열리지 않는 경우
1. Chrome 경로 확인 (`CHROME_PATH` 환경변수)
2. 외부 리소스 차단 설정 확인
3. 로그에서 `RENDER_ERROR` 확인

### 동시 요청 시 충돌
1. 각 요청마다 새로운 Puppeteer 인스턴스 사용
2. 파일명에 타임스탬프 포함으로 중복 방지

### 성능 최적화
1. `deviceScaleFactor: 2`로 고품질 렌더링
2. 외부 폰트/CDN 차단으로 로딩 시간 단축
3. 적절한 `waitUntil` 옵션으로 안정성 확보
