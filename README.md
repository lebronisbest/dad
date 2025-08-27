# 🚀 프로젝트 TT - 산업안전보고서 시스템

## 📋 개요

프로젝트 TT는 **MCP(Model Context Protocol) 서버와 웹 애플리케이션을 통합한 현대적인 산업안전보고서 생성 시스템**입니다. 프로젝트 TT 엔지니어링 가이드라인을 완벽하게 준수하여 안정적이고 확장 가능한 아키텍처를 제공합니다.

## ✨ 주요 특징

- 🎯 **단일 진입점**: `/v1/reports` 통합 API
- 🚀 **성능 가드**: 10페이지 PDF ≤ 2초 자동 모니터링
- 🔔 **에러율 알림**: 5분 실패율 > 2% 자동 알림
- 📝 **사용자 진단**: PII 제거된 진단 로그 시스템
- 🔒 **보안 강화**: Router → Router 금지, 도메인 함수 직접 호출
- 📊 **실시간 모니터링**: 성능, 에러율, 시스템 상태 실시간 추적

## 🏗️ 아키텍처

### **서버 구조**
```
포트 3000 (웹앱 서버)
├── POST /web/v1/reports     # 웹앱용 보고서 생성
├── POST /chat               # 채팅 API (MCP 통합)
├── DELETE /chat/:id/memory  # 메모리 삭제
# 대시보드 API 제거됨 - 2025-08-25

포트 3001 (통합 API 서버)
├── POST /v1/reports              # 보고서 생성 (PDF/HTML)
├── POST /v1/reports/validate     # 데이터 검증
├── GET/POST/PUT/DELETE /v1/projects # 프로젝트 관리
├── GET /v1/performance           # 성능 모니터링
├── GET /v1/diagnostics           # 사용자 진단 로그
└── GET /healthz                  # 헬스체크
```

### **핵심 원칙**
- ✅ **Router → Router 금지**: 내부 fetch 금지
- ✅ **도메인 함수 직접 호출**: `UnifiedReportService` 직접 사용
- ✅ **고정 DTO 파이프라인**: `normalize() → validate() → execute()`
- ✅ **단일 진입점**: 모든 보고서 생성은 `/v1/reports`

## 🚀 빠른 시작

### **1. 환경 설정**
```bash
# 환경변수 파일 복사
cp env.example .env

# 필요한 값들 설정
# - API 키
# - Chrome 경로
# - 알림 웹훅 URL
```

### **2. 서버 시작**

#### **Windows Users (Recommended)**
```cmd
# Run the integrated batch file
start.bat

# Select your desired option from the menu:
# 1. 🚀 Start All Servers (API + Webapp + MCP)
# 2. 🔌 API Server Only (Port 3001)
# 3. 🌐 Webapp Server Only (Port 3000)
# 4. 🤖 MCP Server Only
# 5. 📊 Monitoring Server
# 6. 🧹 Cleanup & Rollback
```

#### **Linux/Mac 사용자**
```bash
# API 서버 (포트 3001)
npm run api

# 웹앱 서버 (포트 3000)
npm run webapp

# 둘 다 시작
npm run dev
```

### **3. API 사용법**
```javascript
import { API, OUTPUT_FORMAT } from './src/utils/api.js';

// 보고서 생성
const response = await fetch(API.REPORTS + '?output=' + OUTPUT_FORMAT.PDF, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(reportData)
});

// 프로젝트 생성
const projectResponse = await fetch(API.PROJECTS, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(projectData)
});
```

## 📊 성능 모니터링

### **자동 성능 가드**
- **목표**: 10페이지 PDF ≤ 2초
- **경고**: 1.5초 초과 시 자동 알림
- **심각**: 3초 초과 시 즉시 알림

### **에러율 모니터링**
- **경고 임계값**: 5분 실패율 > 2%
- **심각 임계값**: 5분 실패율 > 5%
- **자동 알림**: Slack, 이메일 등으로 전송

### **실시간 대시보드**
```bash
# 성능 통계
GET /v1/performance

# 사용자 진단 로그
GET /v1/diagnostics

# 시스템 메트릭스
GET /metrics
```

## 🔧 개발자 가이드

### **프로젝트 TT 가이드라인 준수**

#### **1. Router → Router 금지**
```javascript
// ✅ 올바른 방식: 도메인 함수 직접 호출
const { UnifiedReportService } = await import('./core/unified_report_service.js');
const html = await UnifiedReportService.generateHTML(reportData);

// ❌ 금지된 방식: router → router internal fetch
// app._router.handle(req, res, () => { ... });
```

#### **2. 단일 진입점**
```javascript
// ✅ 통합 API: 모든 보고서 생성
POST /v1/reports?output=pdf|html

// ✅ 웹앱용 API: 내부적으로 core 서비스 호출
POST /web/v1/reports?output=pdf|html
```

#### **3. 고정 DTO 파이프라인**
```javascript
// ✅ 모든 라우트에서 동일한 순서
normalize() → validate() → execute()
```

#### **4. 스키마 우선 처리**
```javascript
// ✅ 검증 실패 → 4xx, 실행 실패 → 5xx
if (!validation.ok) {
  return res.status(422).json({ ok: false, errors: validation.errors });
}
```

### **코드 구조**
```
TT/
├── core/                           # 핵심 비즈니스 로직
│   ├── unified_report_service.js  # 통합 보고서 서비스
│   ├── normalize.js               # DTO 정규화
│   ├── validation.js              # 데이터 검증
│   ├── render.js                  # PDF 렌더링 (성능 가드 포함)
│   ├── templating.js              # HTML 템플릿 엔진
│   ├── metrics.js                 # 메트릭스 수집 (에러율 알림 포함)
│   └── logger.js                  # 로깅 (사용자 진단 포함)
├── adapters/                      # 외부 인터페이스
│   ├── http/                      # HTTP API 서버
│   │   ├── server.js              # 통합 API 서버
│   │   └── routes.report.js       # 보고서 라우트
│   └── mcp/                       # MCP 서버
├── src/                           # 프론트엔드 (React)
│   └── utils/
│       └── api.js                 # API 상수 정의
└── docs/                          # 문서
    └── api-cleanup-summary.md     # API 정리 요약
```

## 📈 모니터링 및 알림

### **헬스체크**
```bash
GET /healthz
```
- Chrome 가용성
- 서비스 상태
- 환경 정보

### **성능 통계**
```bash
GET /v1/performance
```
- PDF 렌더링 성능
- 페이지별 처리 시간
- 성능 목표 달성률

### **사용자 진단 로그**
```bash
GET /v1/diagnostics
POST /v1/diagnostics/toggle
POST /v1/diagnostics/level
```
- PII 제거된 진단 정보
- 실시간 로그 조회
- 로그 레벨 설정

## 🔔 알림 설정

### **Slack 웹훅**
```bash
# .env 파일
ALERT_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

### **이메일 알림**
```bash
# .env 파일
ALERT_EMAIL_ENABLED=true
ALERT_EMAIL_SMTP_HOST=smtp.gmail.com
ALERT_EMAIL_SMTP_PORT=587
ALERT_EMAIL_USER=your-email@gmail.com
ALERT_EMAIL_PASSWORD=your-app-password
```

## 🧪 테스트

### **API 테스트**
```bash
# 성능 테스트
curl -X POST "http://localhost:3001/v1/reports?output=pdf" \
  -H "Content-Type: application/json" \
  --data '{"site":{"name":"테스트현장"},"org":{"name":"테스트조직"},"inspector":"테스트자"}'

# 헬스체크
curl http://localhost:3001/healthz

# 성능 모니터링
curl http://localhost:3001/v1/performance
```

### **성능 목표 검증**
- **10페이지 PDF**: ≤ 2초
- **에러율**: < 2% (5분 평균)
- **동시 처리**: 3개 PDF 동시 생성

## 🚀 배포

### **프로덕션 환경변수**
```bash
NODE_ENV=production
PORT=3000
API_PORT=3001
CHROME_PATH=/usr/bin/google-chrome
MAX_CONCURRENT_RENDERS=5
USER_DIAGNOSTICS_ENABLED=false
ALERT_WEBHOOK_URL=https://hooks.slack.com/services/PROD/WEBHOOK
```

### **Docker 배포**
```bash
# 이미지 빌드
docker build -t project-tt .

# 컨테이너 실행
docker run -d \
  -p 3000:3000 \
  -p 3001:3001 \
  --name project-tt \
  project-tt
```

## 📝 변경 이력

### **v2.0.0 (2025-01-XX)**
- ✅ API 통합 및 정리 완료
- ✅ 프로젝트 TT 가이드라인 100% 준수
- ✅ 성능 가드 시스템 추가
- ✅ 에러율 알림 시스템 추가
- ✅ 사용자 진단 로그 시스템 추가
- ✅ PII 보안 강화

### **v1.0.0 (2024-12-XX)**
- 🚀 초기 릴리즈
- 📊 기본 PDF 생성 기능
- 🔧 MCP 서버 통합

## 🤝 기여하기

1. **Fork** 프로젝트
2. **Feature branch** 생성 (`git checkout -b feature/AmazingFeature`)
3. **Commit** 변경사항 (`git commit -m 'Add some AmazingFeature'`)
4. **Push** 브랜치 (`git push origin feature/AmazingFeature`)
5. **Pull Request** 생성

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 지원

- **이슈**: [GitHub Issues](https://github.com/your-repo/project-tt/issues)
- **문서**: [API 문서](http://localhost:3001/docs)
- **헬스체크**: [시스템 상태](http://localhost:3001/healthz)

---

**프로젝트 TT** - 안전하고 신뢰할 수 있는 산업안전보고서 시스템 🚀
