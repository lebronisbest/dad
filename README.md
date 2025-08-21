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
│   │   └── validator.js             # 데이터 유효성 검사
│   ├── uploads/                      # 파일 업로드 디렉토리
│   ├── index.js                      # Express 서버 메인 파일
│   ├── package.json                  # 프로젝트 의존성
│   └── README.md                     # 앱 설명서
├── construction-safety-mcp-server/    # MCP 서버
│   ├── server.js                     # MCP 서버 메인 파일
│   ├── package.json                  # 프로젝트 의존성
│   └── README.md                     # MCP 서버 설명서
└── README.md                         # 전체 프로젝트 설명서 (현재 파일)
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
  - PDF 다운로드 (구현 예정)
  - Excel 다운로드 (구현 예정)

### 🔌 MCP 서버 (`construction-safety-mcp-server`)
- **보고서 생성**: 3가지 템플릿을 지원하는 기술지도 결과보고서 생성
- **데이터 검증**: 보고서 데이터의 유효성 검사
- **템플릿 관리**: 사용 가능한 보고서 템플릿 목록 조회
- **요약 생성**: 보고서 데이터를 바탕으로 한 요약 정보 생성
- **리소스 제공**: 보고서 템플릿과 가이드라인 정보 제공

## 🚀 빠른 시작

### 1. 웹 애플리케이션 실행

```bash
# 웹 앱 디렉토리로 이동
cd construction-safety-app

# 의존성 설치
npm install

# 개발 모드로 실행
npm run dev

# 브라우저에서 접속
# http://localhost:3000
```

### 2. MCP 서버 실행

```bash
# MCP 서버 디렉토리로 이동
cd construction-safety-mcp-server

# 의존성 설치
npm install

# MCP 서버 실행
npm start
```

## 🔧 시스템 요구사항

### 웹 애플리케이션
- Node.js 16.0.0 이상
- npm 또는 yarn

### MCP 서버
- Node.js 18.0.0 이상 (ES 모듈 지원)
- npm 또는 yarn

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

## 🧪 테스트

### 웹 애플리케이션 테스트
```bash
cd construction-safety-app
npm test
```

### MCP 서버 테스트
```bash
cd construction-safety-mcp-server
npm test
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

- `POST /api/report/generate` - 기술지도 결과보고서 생성
- `POST /api/upload` - 파일 업로드
- `GET /api/templates` - 보고서 템플릿 목록 조회

### MCP 서버 도구

- `create_safety_report` - 안전보고서 생성
- `get_report_templates` - 보고서 템플릿 목록 조회
- `validate_report_data` - 데이터 유효성 검사
- `generate_report_summary` - 보고서 요약 생성

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

- [ ] PDF 및 Excel 다운로드 기능 완성
- [ ] 사용자 인증 및 권한 관리 시스템 추가
- [ ] 데이터베이스 연동으로 보고서 저장 및 관리
- [ ] 모바일 앱 개발
- [ ] AI 기반 안전 위험도 자동 평가 기능
- [ ] 실시간 알림 시스템 구축

---

**건설재해예방전문지도기관 기술지도 결과보고서 시스템**으로 안전한 건설현장을 만들어가세요! 🏗️✨

> 이 시스템은 건설현장의 안전을 위한 기술지도 결과를 체계적으로 관리하고, 
> 효율적인 보고서 생성을 통해 안전사고 예방에 기여합니다.
