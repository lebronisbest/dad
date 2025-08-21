# 템플릿 변경 이력

## report_v1.hbs

### v1.0.0 (2024-01-01)
- 초기 버전 생성
- 기본 보고서 구조 정의
- Handlebars 템플릿 엔진 적용
- 부분 템플릿 분리 (header, overview, risk_table, photo_sheet)
- 헬퍼 함수 5종 구현 (dateFmt, moneyKRW, checkbox, join, nl2br)

### 계획된 변경사항
- v1.1.0: 법정 참조 필드 추가
- v1.2.0: 평가지표 확장
- v2.0.0: 상세 보고서 템플릿
- v3.0.0: 긴급 보고서 템플릿

## 부분 템플릿

### header.hbs
- 기관 로고 및 제목
- 보고서 번호 및 템플릿 정보

### overview.hbs
- 프로젝트 기본 정보 그리드 레이아웃
- 8개 주요 필드 표시

### risk_table.hbs
- 위험도 평가표
- 페이지 끊김 방지 (.avoid-break)

### photo_sheet.hbs
- 현장 사진 그리드
- 사진 메타데이터 표시

## 스타일

### print.css
- A4 페이지 설정
- 페이지 끊김 제어
- 인쇄 최적화 스타일
- 폰트 폴백 설정
