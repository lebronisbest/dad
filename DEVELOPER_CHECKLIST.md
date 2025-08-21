# 🚀 건설안전 시스템 개발자 체크리스트

## 📋 6주 로드맵 실행 체크리스트

### 주 1: 리포 위생 & 공통 기반 ✅

- [x] 워크스페이스 설정 (npm workspaces)
- [x] ESLint + Prettier + EditorConfig 설정
- [x] Husky + lint-staged 설정
- [x] 공통 DTO 스키마 (packages/shared)
- [x] 환경변수 표준화 (.env.example)

**다음 단계:**
- [ ] Playwright 설치 및 테스트
- [ ] 공통 스키마 통합 테스트

### 주 2: PDF/엑셀 "진짜로" 완성 ✅

- [x] Playwright 기반 PDF 생성기 (PDFGeneratorV2)
- [x] Excel 생성기 (ExcelGenerator)
- [x] 새로운 API 엔드포인트 추가
  - [x] `/api/export/pdf-v2` (Playwright)
  - [x] `/api/export/excel`

**테스트 필요:**
- [ ] PDF 생성 테스트 (Docker 환경)
- [ ] Excel 생성 테스트
- [ ] 폰트 및 한글 지원 확인

**버그 포인트 체크:**
- [ ] 파일 경로 권한 문제
- [ ] Docker 내 폰트 설치
- [ ] tmp 디렉토리 마운트
- [ ] 예외 로깅 확인

### 주 3: 입력 유효성 + 스키마 정의 ✅

- [x] Zod 기반 공통 스키마 정의
- [x] 템플릿 3종 스키마
- [x] 검증 함수 구현
- [x] 기존 validator와 통합

**테스트 필요:**
- [ ] 스키마 유닛 테스트
- [ ] 필수/선택 필드 규칙 테스트
- [ ] 발견사항↔권고사항 동시성 테스트

### 주 4: 저장/조회 기능(베타) ✅

- [x] Prisma 스키마 정의
- [x] 데이터베이스 서비스 (DatabaseService)
- [x] 테이블 구조 설계
  - [x] projects, reports, findings, recommendations
  - [x] attachments, users, sessions, audit_logs

**다음 단계:**
- [ ] 데이터베이스 마이그레이션 실행
- [ ] API 엔드포인트에 DB 연동
- [ ] 파일 업로드 S3 연동

### 주 5: 인증/권한 & 감사로그 ✅

- [x] JWT 기반 인증 시스템
- [x] 역할 기반 권한 관리 (RBAC)
- [x] 보고서/프로젝트 단위 ACL
- [x] 감사 로그 시스템

**테스트 필요:**
- [ ] 인증 플로우 테스트
- [ ] 권한 체크 테스트
- [ ] 감사 로그 기록 테스트

### 주 6: MCP 심화 + 배포 자동화 ✅

- [x] MCP 도구 확장
  - [x] `create_safety_report`
  - [x] `get_report_templates`
  - [x] `get_legal_refs`
  - [x] `validate_report_data`
- [x] GitHub Actions CI/CD
- [x] Docker Compose 설정
- [x] 자동 릴리즈 워크플로우

**배포 준비:**
- [ ] 환경별 설정 파일
- [ ] 모니터링 및 로깅 설정
- [ ] 백업 전략 수립

## 🧪 테스트 체크리스트

### 단위 테스트
- [ ] 공통 스키마 검증 테스트
- [ ] PDF/Excel 생성기 테스트
- [ ] 데이터베이스 서비스 테스트
- [ ] 인증 서비스 테스트

### 통합 테스트
- [ ] API 엔드포인트 테스트
- [ ] MCP 도구 통합 테스트
- [ ] 데이터베이스 연동 테스트

### E2E 테스트
- [ ] 보고서 생성 플로우
- [ ] PDF/Excel 내보내기
- [ ] 사용자 인증 플로우

## 🔒 보안 체크리스트

- [ ] JWT 시크릿 키 환경변수화
- [ ] SQL 인젝션 방지 (Prisma 사용)
- [ ] XSS 방지
- [ ] CSRF 토큰 구현
- [ ] 파일 업로드 보안 검증
- [ ] API 레이트 리미팅

## 📊 성능 체크리스트

- [ ] PDF 생성 성능 최적화
- [ ] 데이터베이스 쿼리 최적화
- [ ] 이미지 처리 최적화
- [ ] 캐싱 전략 구현
- [ ] 로드 밸런싱 설정

## 🚨 알려진 이슈

### PDF 생성 관련
- [ ] Docker 환경에서 폰트 문제
- [ ] 한글 파일명 처리
- [ ] 메모리 사용량 최적화

### 데이터베이스 관련
- [ ] 마이그레이션 스크립트
- [ ] 백업 및 복구 전략
- [ ] 성능 모니터링

### 보안 관련
- [ ] 환경변수 관리
- [ ] SSL 인증서 설정
- [ ] 방화벽 설정

## 🎯 다음 분기 목표

### 빠른 가치 기능
- [ ] 현장 오프라인 작성 (PWA)
- [ ] 동기화 큐 시스템
- [ ] 알림 시스템 (카카오/Slack)
- [ ] 법령 레퍼런스 자동주석
- [ ] 대시보드 및 분석 기능

### 기술적 개선
- [ ] TypeScript 마이그레이션
- [ ] GraphQL API 도입
- [ ] 마이크로서비스 아키텍처
- [ ] Kubernetes 배포

## 📝 개발 환경 설정

### 필수 도구
- [ ] Node.js 18+ / 20+
- [ ] Docker & Docker Compose
- [ ] PostgreSQL 15+
- [ ] Redis 7+
- [ ] MinIO

### 개발 도구
- [ ] VS Code + 확장 프로그램
- [ ] Postman / Insomnia
- [ ] pgAdmin / DBeaver
- [ ] Git

### 환경 설정
```bash
# 1. 의존성 설치
npm install

# 2. 데이터베이스 시작
docker-compose up db redis minio -d

# 3. Prisma 마이그레이션
cd construction-safety-app
npx prisma migrate dev

# 4. 애플리케이션 시작
npm run dev
npm run dev:mcp
```

## 🔍 디버깅 가이드

### PDF 생성 문제
1. Playwright 브라우저 설치 확인
2. Docker 권한 문제 체크
3. 폰트 설치 상태 확인
4. 메모리 사용량 모니터링

### 데이터베이스 연결 문제
1. PostgreSQL 서비스 상태 확인
2. 연결 문자열 검증
3. 방화벽 설정 확인
4. 로그 분석

### MCP 서버 문제
1. API 베이스 URL 설정 확인
2. 네트워크 연결 상태 확인
3. 도구 핸들러 로그 확인

## 📞 지원 및 문의

- **기술 문서**: README.md
- **API 문서**: Swagger/OpenAPI
- **이슈 트래커**: GitHub Issues
- **코드 리뷰**: GitHub Pull Requests

---

**마지막 업데이트**: 2025-01-21  
**담당자**: 개발팀  
**버전**: 1.0.0
