# 🏗️ 건설재해예방전문지도기관 기술지도 결과보고서 MCP 서버

Model Context Protocol (MCP)을 통해 건설현장의 안전기술지도 결과보고서를 생성하고 관리할 수 있는 서버입니다.

## ✨ 주요 기능

- **보고서 생성**: 3가지 템플릿을 지원하는 기술지도 결과보고서 생성
- **데이터 검증**: 보고서 데이터의 유효성 검사
- **템플릿 관리**: 사용 가능한 보고서 템플릿 목록 조회
- **요약 생성**: 보고서 데이터를 바탕으로 한 요약 정보 생성
- **리소스 제공**: 보고서 템플릿과 가이드라인 정보 제공

## 🚀 설치 및 실행

### 필수 요구사항
- Node.js 18.0.0 이상 (ES 모듈 지원)
- npm 또는 yarn

### 설치 단계

1. **의존성 설치**
   ```bash
   cd construction-safety-mcp-server
   npm install
   ```

2. **MCP 서버 실행**
   ```bash
   npm start
   ```

## 🔧 MCP 도구

### 1. create_safety_report
건설재해예방전문지도기관 기술지도 결과보고서를 생성합니다.

**매개변수:**
- `templateId` (필수): 보고서 템플릿 ID
- `projectName` (필수): 프로젝트명
- `projectLocation` (필수): 프로젝트 위치
- `inspector` (필수): 지도자명
- `projectType`: 프로젝트 유형
- `contractor`: 시공사명
- `guidanceDate`: 기술지도 날짜
- `guidanceType`: 기술지도 유형
- `guidanceDuration`: 지도 시간
- `findings`: 발견사항 목록
- `recommendations`: 권고사항 목록
- `responsiblePerson`: 책임자 (상세보고서용)
- `emergencyLevel`: 긴급도 (긴급보고서용)
- `immediateActions`: 즉시조치사항 목록 (긴급보고서용)

**사용 예시:**
```json
{
  "templateId": "template1",
  "projectName": "서울시 강남구 아파트 신축공사",
  "projectLocation": "서울시 강남구 테헤란로 123",
  "inspector": "김안전",
  "projectType": "주거시설",
  "guidanceType": "정기점검",
  "findings": ["안전장비 미착용", "작업환경 불량"],
  "recommendations": ["안전장비 착용 의무화", "작업환경 개선"]
}
```

### 2. get_report_templates
사용 가능한 보고서 템플릿 목록을 조회합니다.

**매개변수:** 없음

**응답:**
- 기본 기술지도 결과보고서
- 상세 기술지도 결과보고서
- 긴급 기술지도 결과보고서

### 3. validate_report_data
보고서 데이터의 유효성을 검사합니다.

**매개변수:**
- `data`: 검사할 보고서 데이터

**검사 항목:**
- 필수 필드 존재 여부
- 비즈니스 로직 검사
- 데이터 형식 검사

### 4. generate_report_summary
보고서 데이터를 바탕으로 요약 정보를 생성합니다.

**매개변수:**
- `reportData`: 요약할 보고서 데이터

**생성 정보:**
- 프로젝트 기본 정보
- 발견사항 및 권고사항 개수
- 위험도 및 긴급도

## 📚 MCP 리소스

### construction-safety://templates
보고서 템플릿 정보를 제공합니다.

**포함 내용:**
- 템플릿 ID 및 이름
- 템플릿 설명
- 포함 항목 목록

### construction-safety://guidelines
기술지도 가이드라인 정보를 제공합니다.

**포함 내용:**
- 안전기술지도 기본 원칙
- 긴급상황 대응 절차

## 🏗️ 프로젝트 구조

```
construction-safety-mcp-server/
├── server.js          # MCP 서버 메인 파일
├── package.json       # 프로젝트 의존성
└── README.md          # 프로젝트 설명서
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

## 🎯 사용 시나리오

### 1. 기본 보고서 생성
```bash
# MCP 클라이언트에서
create_safety_report({
  "templateId": "template1",
  "projectName": "프로젝트명",
  "projectLocation": "프로젝트 위치",
  "inspector": "지도자명"
})
```

### 2. 상세 보고서 생성
```bash
# MCP 클라이언트에서
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

### 3. 긴급 보고서 생성
```bash
# MCP 클라이언트에서
create_safety_report({
  "templateId": "template3",
  "projectName": "프로젝트명",
  "projectLocation": "프로젝트 위치",
  "inspector": "지도자명",
  "emergencyLevel": "높음",
  "immediateActions": ["작업 중단", "인원 대피"]
})
```

## 🧪 테스트

```bash
npm test
```

## 🔍 디버깅

MCP 서버는 stderr를 통해 로그를 출력합니다:

```bash
# 서버 시작 시 출력되는 정보
🏗️ 건설재해예방전문지도기관 기술지도 결과보고서 MCP 서버가 시작되었습니다.
📋 사용 가능한 도구:
  • create_safety_report: 건설재해예방전문지도기관 기술지도 결과보고서를 생성합니다.
  • get_report_templates: 사용 가능한 보고서 템플릿 목록을 조회합니다.
  • validate_report_data: 보고서 데이터의 유효성을 검사합니다.
  • generate_report_summary: 보고서 데이터를 바탕으로 요약 정보를 생성합니다.
📚 사용 가능한 리소스:
  • 보고서 템플릿: 건설재해예방전문지도기관 기술지도 결과보고서 템플릿
  • 기술지도 가이드라인: 건설현장 안전기술지도 가이드라인 및 표준
```

## 📝 라이선스

MIT License

## 🤝 기여하기

1. 이 저장소를 포크합니다
2. 새로운 기능 브랜치를 생성합니다
3. 변경사항을 커밋합니다
4. Pull Request를 생성합니다

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해 주세요.

---

**건설재해예방전문지도기관 기술지도 결과보고서 MCP 서버**로 안전한 건설현장을 만들어가세요! 🏗️✨
