# 🚀 산업안전보고서 MCP 서버
0) 안정화 핫픽스 (D-1)

날짜 형식 단일화: YY.MM.DD(요일)로 통일하고, 입력이 ISO면 내부에서 변환 후 저장.

NPE 가드: 모든 data.* 접근에 ?./getNestedValue() 강제.

Node 런타임 고정: Node ≥18(가급적 20) + engines 명시.

Puppeteer 안정화: waitForNetworkIdle, 폰트 로컬 번들, --font-render-hinting=medium.

샘플/테스트 데이터도 같은 형식으로 교체(거짓 안정성 제거).

완료 기준

같은 입력으로 “유효성 → 렌더 → PDF 저장” 100% 재현.

E2E 10건 통과(빈칸 보정, 숫자/날짜/체크박스 혼합, 1·2·3차 점검).

1) 1–2주: 코어 제품화
1-1. 스키마 v2 (검증 + 표시 분리)

schema.json을 domain_schema.json(데이터 규칙)과 ui_schema.json(표시/포맷)로 분리.

조건부 표시: when, then.required, visibleIf.

계산 필드: computed: = concat(site.name, ' / ', visit.round, '차').

완료 기준: 조건부 필드·계산 필드가 템플릿에 반영되고 검증 일관.

1-2. 템플릿 DSL 업그레이드

반복/조건/계산 지원:

data-repeat="hazards"

data-if="progress.rate < 80"

data-text="=formatDate(visit.date,'YYYY.MM.DD(ddd)')"

페이지 나눔 제어: data-pagebreak="before|after|avoid".

완료 기준: 표/리스트/조건부 섹션이 HTML만으로 구성, 커스텀 JS 불필요.

1-3. MCP 툴 계약 v1(안정)

validate_report, fill_missing, render_pdf, fetch_law, web_fetch.

각 툴의 I/O 스키마를 OpenAPI/JSON Schema로 문서화.

Idempotency-Key 헤더 지원(중복 호출 방지).

완료 기준: 동일 지시를 3회 보내도 결과/파일명이 충돌 없이 안정.

1-4. 테스트/관찰성

Playwright E2E(렌더 후 PDF 텍스트 스냅샷 비교).

Sentry(서버), 로그 표준화(JSON Lines), 요청/응답 코릴레이션 ID.

2) 3–4주: UX & 자동화
2-1. 보고서 위저드(필수 최소 입력만)

스키마 기반 단계 폼 + 실시간 검증 + 자동 저장(draft).

PWA(오프라인 캐시) + 사진 업로드(현장 스냅샷) → 템플릿에 자동 배치.

2-2. 배치 생성 & 데이터 임포트

Excel/CSV 매핑 위저드(열 → 필드 드래그 매핑).

다건 생성 큐(파일 업로드 → N건 PDF 병렬 3~5개 워커).

2-3. 권한/감사

RBAC(작성자/검토자/승인자), 전자서명(서명 이미지/이름+타임스탬프).

변경 이력 Diff 보기(1차↔2차 비교, 변경 필드 하이라이트).

완료 기준: 100건 일괄 생성 5분 내 완료(워커 병렬), 실패 건 재시도 가능.

3) 5–6주: AI/MCP 심화
3-1. 대화형 채움(컨텍스트 메모리)

“지난 번 2차 보고서 불량 항목 유지하고 날짜만 오늘” → 과거 보고서 유사도 검색 후 필드 자동 채움.

규정/법령 요약 삽입: fetch_law + 요약/인용 블록 자동 생성(출처/조항 번호 유지).

3-2. 품질 가드레일

“위험도” 같은 민감 필드는 규칙 기반 세컨더리 검증(룰엔진: JSONLogic).

세이프 모드: 불확실 항목은 비워두고 “검토 필요” 워터마크.

완료 기준: 사람이 1분 검토로 제출 가능 수준(자동 충전율 70%+, 오류 0 크리티컬).

4) 장기 로드맵(8주+)

템플릿 스튜디오: 드래그앤드롭 레이아웃 편집(그리드/표/페이지브레이크).

멀티테넌시: 고객사별 스키마/템플릿/브랜딩 격리.

문서 포맷 확장: DOCX, PDF/A, 전자문서지갑/문서24 제출용 패키저.

시각 회귀 테스트: 픽셀매치로 PDF 레이아웃 변동 탐지.

운영 대시보드: 생성 성공률, 평균 생성시간, 실패 사유 Top N.

개발자에게 바로 줄 “명령 메모”

스키마 v2 분리: domain_schema.json, ui_schema.json 작성. when/visibleIf/computed 구현.

템플릿 DSL 확장: data-repeat, data-if, data-text, data-pagebreak 파서 추가.

MCP I/O 고정: 툴별 JSON Schema/예제 제작, Idempotency-Key 지원.

Puppeteer 풀링: 브라우저 1개 + 페이지 풀(동시 5), 폰트 로컬 번들.

Playwright E2E: 10개 시나리오 + PDF 텍스트 스냅샷 고정.

배치/큐: BullMQ/Redis로 작업 큐, 재시도/지연/동시성 옵션 설정.

임포트 위저드: CSV 샘플 자동 인식 → 매핑 저장/재사용.

RBAC/서명/감사: 역할·권한 미들웨어, 서명 컴포넌트, 변경 Diff 저장/표시.

메모리/검색: 과거 보고서 벡터 인덱스(메타데이터: 현장/차수/날짜).

룰엔진: JSONLogic로 위험도·필수항목 보조검증, 세이프모드 플래그.

성공 지표(팀이 같이 볼 지표)

자동 채움률 70%↑, 제출 전 수동 수정 평균 < 10개 필드.

PDF 생성 성공률 99.5%↑, 평균 생성시간 < 2.5s/건.

E2E 통과율 100%, 회귀 테스트 실패 0.
**48시간 패치 완료! ✅ 토큰 노출 0 · 빈페이지 0 · 인쇄 품질 고정 · 법령 인용 슬롯 준비**

## 🎯 48시간 패치 목표 달성 현황

### ✅ 완료된 항목

1. **템플릿 바인딩 표준화** - 모든 `{{...}}` 토큰을 `data-field` 속성으로 통일
2. **빈 섹션 자동 숨김** - `.section:empty { display:none; }` CSS 규칙 적용
3. **머리말·꼬리말 + 페이지 번호** - PDF 렌더링 시 자동 페이지 번호 표시
4. **표/리스크매트릭스 인쇄 안정화** - 페이지 넘어가도 헤더 반복, 행 쪼개짐 방지
5. **사진 대지 표준** - 3×N 그리드 + 캡션/참조 시스템 구현
6. **법령 인용 박스** - 데이터 기반 자동 렌더링 및 "인용 필요" 경고 배지
7. **폰트/여백 고정** - 본문 10.5pt, 표 9pt, A4 여백 18-20mm 고정
8. **스키마 키(SSOT) 확정** - Zod 스키마와 템플릿 `data-field` 1:1 일치

### 🔄 향후 계획 (1주 내)

- **출고 전 품질 게이트** - Quality Linter 90점↑ 자동 출고
- **Playwright 스냅샷 테스트** - 골든 PDF와 비교 검증
- **촬영 파이프라인** - 1600px 리사이즈 + EXIF 회전 보정

## 🚀 주요 기능

### 📋 표준화된 템플릿 바인딩

```html
<!-- 기존: {{report_number}} -->
<h2 data-field="report.number"></h2>

<!-- 날짜 포맷팅 -->
<span data-field="visit.date" data-format="formatDate"></span>

<!-- 회차 텍스트 변환 -->
<span data-field="visit.round" data-format="roundText"></span>

<!-- 사진 번호 변환 -->
<span data-field="index" data-format="photoNumber"></span>
```

### 🎨 자동 빈 섹션 숨김

```css
.section:empty { 
  display: none; 
}

@media print {
  .page-break { page-break-before: always; }
  .avoid-break { page-break-inside: avoid; }
}
```

### 📊 테이블 인쇄 최적화

```css
table { 
  width: 100%; 
  border-collapse: collapse; 
}

thead { 
  display: table-header-group; /* 페이지 넘어가도 헤더 반복 */
}

tbody tr { 
  page-break-inside: avoid; /* 행 쪼개짐 방지 */
}
```

### 📸 사진 대지 표준 (3×N 그리드)

```html
<div class="photo-grid avoid-break">
  <div data-repeat="photos" class="photo-item">
    <figure>
      <img data-field="url" alt="안전점검 사진">
      <figcaption>사진 <span data-field="index" data-format="photoNumber"></span> — 
        <span data-field="caption"></span>
        (촬영 <span data-field="taken_at" data-format="formatDate"></span>)
      </figcaption>
    </figure>
  </div>
</div>
```

### ⚖️ 법령 인용 박스

```html
<div class="citation-box avoid-break" data-field="findings.citations">
  <div data-repeat="citations" class="citation-item">
    <p><strong>근거:</strong> 「<span data-field="law"></span>」 
       <span data-field="clause"></span>
       (개정 <span data-field="revised_at" data-format="formatDate"></span>) — 
       <span data-field="snippet"></span></p>
  </div>
</div>
```

## 🛠️ 기술 스택

- **Backend**: Node.js, Express
- **PDF Generation**: Puppeteer
- **Template Engine**: Custom TemplatingEngine with data-field binding
- **Validation**: Joi + Custom ValidationEngine
- **Frontend**: React, Material-UI, Vite
- **MCP**: Model Context Protocol SDK

## 📦 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

```bash
cp ops/env.sample .env
# .env 파일에 필요한 환경 변수 설정
```

### 3. 서버 실행

```bash
# MCP 서버 실행
npm start

# 웹 애플리케이션 실행
npm run webapp

# React 개발 서버 실행
npm run react:dev
```

### 4. 테스트 실행

```bash
# 48시간 패치 검증 테스트
node test_patch_validation.js

# 기존 테스트
npm test
```

## 🔧 개발 가이드

### 새로운 템플릿 필드 추가

1. **스키마 업데이트** (`core/schema.json`)
```json
{
  "fields": {
    "new_section": {
      "title": "string",
      "content": "string"
    }
  }
}
```

2. **템플릿에 바인딩 추가**
```html
<div class="section">
  <h3 data-field="new_section.title"></h3>
  <p data-field="new_section.content"></p>
</div>
```

3. **포맷 함수가 필요한 경우**
```html
<span data-field="new_section.date" data-format="formatDate"></span>
```

### 새로운 포맷 함수 추가

1. **스키마에 정의** (`core/schema.json`)
```json
{
  "format_functions": {
    "customFormat": "사용자 정의 포맷 함수 설명"
  }
}
```

2. **템플릿 엔진에 구현** (`core/templating.js`)
```javascript
this.formatFunctions = {
  customFormat: (value) => {
    // 포맷 로직 구현
    return formattedValue;
  }
};
```

## 📊 품질 점수 시스템

### 점수 계산 방식

- **데이터 검증**: 50% (필수 필드, 형식 검증)
- **템플릿 바인딩**: 50% (data-field 매핑, 포맷 함수)

### 등급 체계

- **A+**: 90점 이상
- **A**: 80-89점
- **B+**: 70-79점
- **B**: 60-69점
- **C+**: 50-59점
- **C**: 40-49점
- **D**: 40점 미만

### 자동 출고 기준

- **90점 이상**: 자동 출고 승인
- **80-89점**: 검토 후 출고
- **80점 미만**: 수정 필요

## 🚨 운영 체크

### 실패 코드 표준

- `TEMPLATE_NOT_FOUND`: 템플릿 파일을 찾을 수 없음
- `FONT_MISSING`: 필수 폰트가 누락됨
- `BROWSER_LAUNCH_FAIL`: Puppeteer 브라우저 실행 실패
- `TIMEOUT`: PDF 생성 시간 초과

### 로그 필수 항목

- `reportId`: 보고서 ID
- `templateId`: 템플릿 ID
- `schemaVersion`: 스키마 버전
- `idempotencyKey`: 중복 실행 방지 키

### 진행률 모니터링

`/api/reports/:id/events`로 SSE 진행률 송출:
- `QUEUED` → `RUNNING(%)` → `COMPLETED`/`FAILED`

## 📁 프로젝트 구조

```
├── core/                    # 핵심 엔진
│   ├── templating.js       # 템플릿 엔진 (data-field 바인딩)
│   ├── render.js           # PDF 렌더러 (머리말·꼬리말, 페이지 번호)
│   ├── validation.js       # 검증 엔진 (품질 점수 계산)
│   └── schema.json         # 스키마 정의 (SSOT)
├── templates/               # HTML 템플릿
│   └── layout.html         # 메인 레이아웃 (표준화된 바인딩)
├── src/                     # React 프론트엔드
├── server/                  # MCP 서버
└── test_patch_validation.js # 48시간 패치 검증 테스트
```

## 🤝 기여 가이드

### 코드 스타일

- **한국어 주석**: 모든 주석은 한국어로 작성
- **ES6+**: 최신 JavaScript 문법 사용
- **에러 처리**: 모든 비동기 함수에 try-catch 적용
- **로깅**: 구조화된 로깅으로 디버깅 지원

### 테스트 요구사항

- **새 기능**: 단위 테스트 필수
- **템플릿 변경**: 렌더링 테스트 필수
- **스키마 변경**: 호환성 테스트 필수

## 📄 라이선스

MIT License

## 🆘 지원

- **이슈 리포트**: GitHub Issues
- **문서**: 이 README 및 코드 주석
- **테스트**: `test_patch_validation.js`로 기능 검증

---

**🎉 48시간 패치 완료로 안전보고서 품질이 크게 향상되었습니다!**
