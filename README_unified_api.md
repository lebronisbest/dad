# 🚀 통합 보고서 API 사용법

## 📋 개요

기존의 3개 보고서 생성 API를 하나의 통합된 API로 통합했습니다.

### 🔄 변경 사항

| 기존 API | 새로운 API | 상태 |
|-----------|------------|------|
| `POST /api/generate` | `POST /api/reports` | ✅ 통합됨 (deprecated 경고) |
| `POST /api/reports/create` | `POST /api/reports` | ✅ 통합됨 |
| `POST /api/reports/project/:projectId` | `POST /api/reports` | ✅ 통합됨 |

## 🎯 새로운 통합 API

### **엔드포인트**
```
POST /api/reports
```

### **요청 파라미터**

```javascript
{
  type: 'pdf' | 'html',           // 출력 형식 (필수)
  projectId?: string,              // 프로젝트 연결 (선택)
  saveFile?: boolean,              // 파일 저장 여부 (기본값: true)
  immediate?: boolean,             // 즉시 응답 (기본값: false)
  // ... 보고서 데이터
}
```

### **응답 형식**

#### **성공 응답**
```javascript
{
  "success": true,
  "message": "PDF 보고서가 성공적으로 생성되었습니다.",
  "data": {
    "type": "pdf",
    "projectLinked": true,
    "saved": true,
    "filename": "safety_report_2024-12-19T10-30-00-000Z.pdf",
    "projectInfo": {
      "id": "report_1734589800000",
      "round": 1,
      "status": "completed"
    },
    "processingTime": 1250
  }
}
```

#### **오류 응답**
```javascript
{
  "success": false,
  "error": "데이터 검증 실패: 현장명은 필수입니다",
  "timestamp": "2024-12-19T01:30:00.000Z"
}
```

## 📝 사용 예시

### **1. PDF + 프로젝트 연결 + 파일 저장**

```javascript
const createReport = async (reportData) => {
  const response = await fetch('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'pdf',
      projectId: 'project_123',
      saveFile: true,
      immediate: false,
      ...reportData
    })
  });
  
  return await response.json();
};

// 사용 예시
const result = await createReport({
  site: { name: '현장명' },
  org: { name: '조직명' },
  inspector: '점검자명',
  // ... 기타 데이터
});
```

### **2. HTML + 즉시 응답 (저장 없음)**

```javascript
const response = await fetch('/api/reports', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'html',
    immediate: true,
    saveFile: false,
    ...reportData
  })
});

// HTML 응답
const html = await response.text();
```

### **3. PDF + 즉시 응답 (저장 없음)**

```javascript
const response = await fetch('/api/reports', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'pdf',
    immediate: true,
    saveFile: false,
    ...reportData
  })
});

const result = await response.json();
// result.report에 PDF 버퍼 포함
```

## 🔍 "3.이전 기술지도 사항 이행여부" 데이터

### **데이터 구조**

```javascript
{
  // ... 기타 데이터
  previous_guidance: [
    {
      date: '2024-12-15',                    // 지도일/확인일
      hazardous_location: '1층 기초공사 현장', // 유해·위험장소
      hazardous_factor: '안전모 미착용',       // 유해·위험요인
      pointed_issue: '안전모 착용 의무화',     // 지적사항
      implementation_result: '완료'           // 이행결과
    },
    // ... 더 많은 이전 지도 사항들
  ]
}
```

### **템플릿 자동 처리**

- `data-repeat="previous_guidance"` 속성으로 자동 반복
- 각 필드가 자동으로 테이블에 삽입
- 빈 배열인 경우 해당 섹션 자동 숨김

## 🔄 마이그레이션 가이드

### **1단계: 기존 코드 확인**

```javascript
// 기존 코드
fetch('/api/generate', {
  method: 'POST',
  body: JSON.stringify({ type: 'pdf', ...data })
});

// 새로운 코드
fetch('/api/reports', {
  method: 'POST',
  body: JSON.stringify({ type: 'pdf', ...data })
});
```

### **2단계: 파라미터 추가 (필요시)**

```javascript
// 기존
{ type: 'pdf', ...data }

// 새로운 (기본값 사용)
{ type: 'pdf', ...data }

// 새로운 (명시적 설정)
{ 
  type: 'pdf', 
  projectId: 'project_123',
  saveFile: true,
  immediate: false,
  ...data 
}
```

### **3단계: 응답 처리 업데이트**

```javascript
// 기존 응답 처리
const result = await response.json();
if (result.success) {
  console.log('PDF 생성 완료');
}

// 새로운 응답 처리
const result = await response.json();
if (result.success) {
  console.log(`PDF 생성 완료: ${result.data.filename}`);
  console.log(`프로젝트 연결: ${result.data.projectLinked}`);
  console.log(`파일 저장: ${result.data.saved}`);
  console.log(`처리 시간: ${result.data.processingTime}ms`);
}
```

## ⚠️ 주의사항

### **Deprecated 경고**

기존 `/api/generate` API는 여전히 작동하지만 deprecated 경고가 표시됩니다:

```
⚠️ /api/generate는 deprecated되었습니다. /api/reports를 사용하세요.
```

### **하위 호환성**

- 기존 API는 계속 작동
- 새로운 기능은 통합 API에서만 사용 가능
- 점진적 마이그레이션 권장

## 🧪 테스트

### **테스트 실행**

```bash
node test_unified_api.js
```

### **테스트 시나리오**

1. **PDF + 프로젝트 연결 + 파일 저장**
2. **HTML + 즉시 응답 (저장 없음)**
3. **PDF + 즉시 응답 (저장 없음)**
4. **기존 API 호환성 (deprecated 경고 확인)**
5. **데이터 검증 테스트**

## 📊 성능 개선

### **이전 구조의 문제점**
- 3개 API에 중복된 로직
- 일관성 없는 검증/처리
- 유지보수 복잡성

### **새로운 구조의 장점**
- ✅ **단일 진입점**: 하나의 API로 모든 요구사항 해결
- ✅ **일관된 로직**: 동일한 검증, 생성, 저장 프로세스
- ✅ **유지보수성**: 코드 중복 제거, 버그 수정 한 번에
- ✅ **확장성**: 새로운 기능 추가 시 한 곳만 수정
- ✅ **테스트 용이성**: 단일 API에 대한 종합적 테스트

## 🚀 향후 계획

### **1주차**: 통합 서비스 및 새로운 API 구현 ✅
### **2주차**: 기존 API들을 통합 서비스 사용하도록 수정 ✅
### **3주차**: 클라이언트 테스트 및 마이그레이션
### **4주차**: 기존 API 제거 (선택적)

## 📞 지원

마이그레이션 중 문제가 발생하면:

1. **로그 확인**: 서버 콘솔에서 오류 메시지 확인
2. **테스트 실행**: `test_unified_api.js`로 기능 검증
3. **문서 참조**: 이 README 및 코드 주석 확인
4. **이슈 리포트**: 문제 상황과 오류 메시지 공유

---

**🎉 통합 API로 더 나은 개발 경험을 제공합니다!**
