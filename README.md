# 🏗️ 건설재해예방전문지도기관 기술지도 결과보고서 시스템

건설현장의 안전기술지도 결과를 체계적으로 관리하고 보고서를 생성하는 통합 시스템입니다.

## 📁 프로젝트 구조

```
dad/
├── construction-safety-app/           # 웹 애플리케이션
│   ├── public/                       # 프론트엔드 파일
│   │   ├── index.html               # 메인 HTML
│   │   ├── styles.css               # 스타일시트
│   │   └── script.js                # 클라이언트 JavaScript
│   ├── services/                     # 백엔드 서비스
│   │   ├── reportGenerator.js       # 보고서 생성 서비스
│   │   ├── pdfGenerator.js          # Puppeteer 기반 PDF 생성
│   │   ├── pdfGeneratorV2.js        # Playwright 기반 PDF 생성
│   │   ├── excelGenerator.js        # Excel 생성 서비스
│   │   ├── docxGenerator.js         # DOCX 생성 서비스
│   │   ├── validator.js             # 데이터 유효성 검사
│   │   ├── database.js              # 데이터베이스 서비스
│   │   └── auth.js                  # 인증 및 권한 관리
│   ├── prisma/                       # 데이터베이스 스키마
│   │   └── schema.prisma            # Prisma 스키마 정의
│   ├── uploads/                      # 파일 업로드 디렉토리
│   ├── index.js                      # Express 서버 메인 파일
│   ├── package.json                  # 프로젝트 의존성
│   └── README.md                     # 앱 설명서
├── construction-safety-mcp-server/    # MCP 서버
│   ├── server.js                     # MCP 서버 메인 파일
│   ├── package.json                  # 프로젝트 의존성
│   └── README.md                     # MCP 서버 설명서
├── packages/                          # 공통 패키지
│   └── shared/                       # 공통 DTO 및 스키마
│       ├── schemas.js                # Zod 기반 스키마 정의
│       └── package.json              # 패키지 설정
├── .github/                           # GitHub Actions
│   └── workflows/                    # CI/CD 파이프라인
├── docker-compose.yml                 # Docker Compose 설정
├── package.json                       # 워크스페이스 설정
├── .eslintrc.js                       # ESLint 설정
├── .prettierrc                        # Prettier 설정
├── .editorconfig                      # EditorConfig 설정
├── DEVELOPER_CHECKLIST.md             # 개발자 체크리스트
└── README.md                          # 전체 프로젝트 설명서 (현재 파일)
```

## ✨ 주요 기능

### 🌐 웹 애플리케이션 (`construction-safety-app`)
- **3가지 보고서 템플릿 지원**
  - 기본 기술지도 결과보고서
  - 상세 기술지도 결과보고서 (위험도 평가, 준수상태 포함)
  - 긴급 기술지도 결과보고서 (즉시조치사항 포함)
- **직관적인 사용자 인터페이스**
  - 반응형 웹 디자인
  - 실시간 폼 유효성 검사
  - 동적 필드 추가/삭제
- **다양한 출력 형식**
  - HTML 보고서 미리보기
  - PDF 다운로드 (Puppeteer + Playwright 지원)
  - Excel 다운로드 (ExcelJS 기반)
  - DOCX 다운로드 (HTML-to-DOCX)
- **데이터베이스 연동**
  - PostgreSQL + Prisma ORM
  - 사용자 인증 및 권한 관리
  - 감사 로그 및 이력 관리
- **파일 관리**
  - 이미지 업로드 및 처리
  - S3 호환 스토리지 (MinIO)
  - 썸네일 자동 생성

### 🔌 MCP 서버 (`construction-safety-mcp-server`)
- **보고서 생성**: 3가지 템플릿을 지원하는 기술지도 결과보고서 생성
- **데이터 검증**: 보고서 데이터의 유효성 검사 및 법규 준수성 확인
- **템플릿 관리**: 사용 가능한 보고서 템플릿 목록 조회
- **법령 참조**: 건설안전 관련 법령 및 가이드라인 정보 제공
- **데이터 검증**: Zod 기반 스키마 검증 및 오류 가이드 제공
- **리소스 제공**: 보고서 템플릿과 가이드라인 정보 제공

## 🚀 빠른 시작

### 1. 워크스페이스 설정

```bash
# 루트 디렉토리에서
npm install

# 개발 도구 설정
npm run prepare
```

### 2. 데이터베이스 시작

```bash
# PostgreSQL, Redis, MinIO 시작
docker-compose up db redis minio -d

# 데이터베이스 마이그레이션
cd construction-safety-app
npx prisma migrate dev
```

### 3. 애플리케이션 실행

```bash
# 웹 애플리케이션 (새 터미널)
npm run dev

# MCP 서버 (새 터미널)
npm run dev:mcp

# 브라우저에서 접속
# http://localhost:3001
```

### 4. 전체 시스템 실행 (Docker)

```bash
# 모든 서비스 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

## 🔧 시스템 요구사항

### 개발 환경
- Node.js 18.0.0 이상 (20.x 권장)
- npm 9.0.0 이상
- Docker & Docker Compose
- Git 2.30.0 이상

### 프로덕션 환경
- PostgreSQL 15.0 이상
- Redis 7.0 이상
- MinIO (S3 호환 스토리지)
- Nginx (리버스 프록시)

### 권장 사양
- CPU: 4코어 이상
- RAM: 8GB 이상
- Storage: 50GB 이상 (SSD 권장)
- Network: 100Mbps 이상

## 📋 사용법

### 웹 애플리케이션 사용법

1. **보고서 템플릿 선택**
   - 기본, 상세, 긴급 중 원하는 템플릿을 선택합니다.

2. **프로젝트 정보 입력**
   - 프로젝트명, 위치, 유형, 시공사 정보를 입력합니다.
   - 프로젝트명과 위치는 필수 입력 항목입니다.

3. **기술지도 정보 입력**
   - 지도일, 지도유형, 지도자, 지도시간을 입력합니다.
   - 지도자는 필수 입력 항목입니다.

4. **발견사항 및 권고사항 입력**
   - 발견사항과 권고사항을 동적으로 추가/삭제할 수 있습니다.
   - 발견사항이 있는 경우 권고사항도 필수로 입력해야 합니다.

5. **보고서 생성**
   - 모든 필수 정보를 입력한 후 "보고서 생성" 버튼을 클릭합니다.
   - 생성된 보고서를 확인하고 다운로드할 수 있습니다.

### MCP 서버 사용법

#### 기본 보고서 생성
```bash
create_safety_report({
  "templateId": "template1",
  "projectName": "프로젝트명",
  "projectLocation": "프로젝트 위치",
  "inspector": "지도자명"
})
```

#### 상세 보고서 생성
```bash
create_safety_report({
  "templateId": "template2",
  "projectName": "프로젝트명",
  "projectLocation": "프로젝트 위치",
  "inspector": "지도자명",
  "responsiblePerson": "책임자명",
  "findings": ["발견사항1", "발견사항2"],
  "recommendations": ["권고사항1", "권고사항2"]
})
```

#### 긴급 보고서 생성
```bash
create_safety_report({
  "templateId": "template3",
  "projectName": "프로젝트명",
  "projectLocation": "프로젝트 위치",
  "inspector": "지도자명",
  "emergencyLevel": "높음",
  "immediateActions": ["작업 중단", "인원 대피"]
})
```

## 🔌 MCP 클라이언트 연결

### 클라이언트 설정 예시
```json
{
  "mcpServers": {
    "construction-safety": {
      "command": "node",
      "args": ["/path/to/construction-safety-mcp-server/server.js"],
      "env": {}
    }
  }
}
```

## 🚀 새로운 기능 (v1.0.0)

### ✨ 주요 개선사항
- **Playwright 기반 PDF 생성**: 더 안정적이고 빠른 PDF 생성
- **Excel 내보내기**: 전문적인 Excel 보고서 생성
- **데이터베이스 연동**: PostgreSQL + Prisma로 데이터 영속성 확보
- **사용자 인증**: JWT 기반 인증 및 역할 기반 권한 관리
- **MCP 도구 확장**: 법령 참조, 데이터 검증 등 새로운 도구들
- **CI/CD 파이프라인**: GitHub Actions로 자동화된 배포

### 🔧 기술적 개선
- **워크스페이스 설정**: npm workspaces로 모노레포 관리
- **코드 품질**: ESLint + Prettier + Husky로 코드 표준화
- **컨테이너화**: Docker Compose로 전체 시스템 실행
- **자동 릴리즈**: release-please로 버전 관리 자동화

## 🧪 테스트

```bash
# 전체 테스트 실행
npm test

# 특정 워크스페이스 테스트
npm test --workspace=construction-safety-app
npm test --workspace=construction-safety-mcp-server

# 코드 품질 검사
npm run lint
npm run format
```

## 🎨 커스터마이징

### 새로운 템플릿 추가
1. `construction-safety-app/services/reportGenerator.js`에 새 템플릿 메서드 추가
2. `construction-safety-app/services/validator.js`에 해당 템플릿의 유효성 검사 규칙 추가
3. 프론트엔드에 템플릿 선택 옵션 추가
4. MCP 서버의 `server.js`에 해당 템플릿 지원 추가

### 스타일 수정
- `construction-safety-app/public/styles.css` 파일을 수정하여 UI 스타일을 변경할 수 있습니다.

## 📊 API 엔드포인트

### 웹 애플리케이션 API

#### 보고서 관리
- `POST /api/report/generate` - 기술지도 결과보고서 생성
- `GET /api/reports` - 보고서 목록 조회
- `GET /api/reports/:id` - 특정 보고서 조회
- `PUT /api/reports/:id` - 보고서 수정
- `DELETE /api/reports/:id` - 보고서 삭제

#### 내보내기
- `POST /api/export/pdf` - PDF 내보내기 (Puppeteer)
- `POST /api/export/pdf-v2` - PDF 내보내기 (Playwright)
- `POST /api/export/excel` - Excel 내보내기
- `POST /api/export/docx` - DOCX 내보내기

#### 파일 관리
- `POST /api/upload` - 파일 업로드
- `GET /api/attachments/:reportId` - 첨부파일 목록

#### 사용자 관리
- `POST /api/auth/register` - 사용자 등록
- `POST /api/auth/login` - 사용자 로그인
- `POST /api/auth/logout` - 사용자 로그아웃

#### 시스템
- `GET /health` - 헬스체크
- `GET /api/templates` - 보고서 템플릿 목록 조회

### MCP 서버 도구

#### 보고서 관리
- `create_safety_report` - 안전보고서 생성
- `get_report_templates` - 보고서 템플릿 목록 조회
- `validate_report_data` - 데이터 유효성 검사

#### 법령 및 참조
- `get_legal_refs` - 법령 참조 정보 조회
- `law_search` - 법령 검색
- `law_get_article` - 법령 조문 조회

#### 기타
- `sample_report_skeleton` - 샘플 보고서 스켈레톤 생성
- `export_bundle` - 보고서 번들 내보내기

## 🔍 디버깅

### 웹 애플리케이션
- 브라우저 개발자 도구의 콘솔에서 오류 확인
- 서버 로그에서 백엔드 오류 확인

### MCP 서버
- stderr를 통해 로그 출력
- 서버 시작 시 사용 가능한 도구와 리소스 목록 표시

## 📝 라이선스

MIT License

## 🤝 기여하기

1. 이 저장소를 포크합니다
2. 새로운 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해 주세요.

## 🚀 향후 계획

### 단기 목표 (1-2개월) ✅
- [x] PDF 및 Excel 다운로드 기능 완성
- [x] 사용자 인증 및 권한 관리 시스템 추가
- [x] 데이터베이스 연동으로 보고서 저장 및 관리
- [ ] 모바일 반응형 디자인 개선
- [ ] 사용자 인터페이스 개선

### 중기 목표 (3-6개월)
- [ ] PWA (Progressive Web App) 구현
- [ ] 오프라인 모드 지원
- [ ] 실시간 협업 기능
- [ ] 알림 시스템 (카카오/Slack)
- [ ] 법령 레퍼런스 자동주석

### 장기 목표 (6개월 이상)
- [ ] AI 기반 안전 위험도 자동 평가 기능
- [ ] 머신러닝을 통한 패턴 분석
- [ ] 대시보드 및 분석 기능
- [ ] 클라우드 네이티브 아키텍처
- [ ] 마이크로서비스 분리

---

**건설재해예방전문지도기관 기술지도 결과보고서 시스템**으로 안전한 건설현장을 만들어가세요! 🏗️✨

> 이 시스템은 건설현장의 안전을 위한 기술지도 결과를 체계적으로 관리하고, 
> 효율적인 보고서 생성을 통해 안전사고 예방에 기여합니다.
