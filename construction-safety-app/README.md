# 🏗️ 건설재해예방전문지도기관 기술지도 결과보고서 앱

건설현장의 안전기술지도 결과를 체계적으로 관리하고 보고서를 생성하는 웹 애플리케이션입니다.

## ✨ 주요 기능

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

## 🚀 설치 및 실행

### 필수 요구사항
- Node.js 16.0.0 이상
- npm 또는 yarn

### 설치 단계

1. **의존성 설치**
   ```bash
   cd construction-safety-app
   npm install
   ```

2. **앱 실행**
   ```bash
   # 개발 모드
   npm run dev
   
   # 프로덕션 모드
   npm start
   ```

3. **브라우저에서 접속**
   ```
   http://localhost:3000
   ```

## 📋 사용법

### 1. 보고서 템플릿 선택
- 기본, 상세, 긴급 중 원하는 템플릿을 선택합니다.

### 2. 프로젝트 정보 입력
- 프로젝트명, 위치, 유형, 시공사 정보를 입력합니다.
- 프로젝트명과 위치는 필수 입력 항목입니다.

### 3. 기술지도 정보 입력
- 지도일, 지도유형, 지도자, 지도시간을 입력합니다.
- 지도자는 필수 입력 항목입니다.

### 4. 발견사항 및 권고사항 입력
- 발견사항과 권고사항을 동적으로 추가/삭제할 수 있습니다.
- 발견사항이 있는 경우 권고사항도 필수로 입력해야 합니다.

### 5. 보고서 생성
- 모든 필수 정보를 입력한 후 "보고서 생성" 버튼을 클릭합니다.
- 생성된 보고서를 확인하고 다운로드할 수 있습니다.

## 🏗️ 프로젝트 구조

```
construction-safety-app/
├── public/                 # 프론트엔드 파일
│   ├── index.html         # 메인 HTML
│   ├── styles.css         # 스타일시트
│   └── script.js          # 클라이언트 JavaScript
├── services/              # 백엔드 서비스
│   ├── reportGenerator.js # 보고서 생성 서비스
│   └── validator.js       # 데이터 유효성 검사
├── uploads/               # 파일 업로드 디렉토리
├── index.js               # Express 서버 메인 파일
├── package.json           # 프로젝트 의존성
└── README.md              # 프로젝트 설명서
```

## 🔧 API 엔드포인트

### POST /api/report/generate
기술지도 결과보고서를 생성합니다.

**요청 본문:**
```json
{
  "templateId": "template1",
  "projectName": "프로젝트명",
  "projectLocation": "프로젝트 위치",
  "inspector": "지도자명",
  "findings": ["발견사항1", "발견사항2"],
  "recommendations": ["권고사항1", "권고사항2"]
}
```

**응답:**
```json
{
  "success": true,
  "report": {
    "id": "보고서ID",
    "type": "보고서유형",
    "generatedAt": "생성일시"
  }
}
```

### POST /api/upload
파일을 업로드합니다.

### GET /api/templates
사용 가능한 보고서 템플릿 목록을 조회합니다.

## 🎨 커스터마이징

### 새로운 템플릿 추가
1. `services/reportGenerator.js`에 새 템플릿 메서드 추가
2. `services/validator.js`에 해당 템플릿의 유효성 검사 규칙 추가
3. 프론트엔드에 템플릿 선택 옵션 추가

### 스타일 수정
- `public/styles.css` 파일을 수정하여 UI 스타일을 변경할 수 있습니다.

## 🧪 테스트

```bash
npm test
```

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

---

**건설재해예방전문지도기관 기술지도 결과보고서 앱**으로 안전한 건설현장을 만들어가세요! 🏗️✨
