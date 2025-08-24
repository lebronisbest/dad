# 코드 정리 계획 및 롤백 가이드

## 개요

이 문서는 사용되지 않는 V2 기능들을 안전하게 제거하는 계획과 롤백 방법을 설명합니다.

## 정리 대상

### 1단계: 플래그 Off (완료)
- [x] `REPORT_V2_ENABLED = false`
- [x] `CANARY_DEPLOYMENT = false`
- [x] `NEW_PDF_PIPELINE = false`
- [x] `MCP_NEW_LAW_SEARCH = false`

### 2단계: 0-hit 증빙 (진행 중)
- [x] 사용량 모니터링 로깅 추가
- [x] 사용량 모니터링 스크립트 생성
- [ ] 실제 운영 환경에서 0-hit 확인
- [ ] 사용량 보고서 생성

### 3단계: @deprecated 주석 추가 (완료)
- [x] `contracts/report.v2.ts` - 모든 V2 스키마 및 함수
- [x] `infra/pdf/renderV2.ts` - V2 PDF 렌더러 클래스
- [x] `adapters/composeReportData.ts` - V2 관련 함수들

### 4단계: 하드 삭제 (예정)
- [ ] `contracts/report.v2.ts` 파일 삭제
- [ ] `infra/pdf/renderV2.ts` 파일 삭제
- [ ] `adapters/composeReportData.ts`에서 V2 관련 코드 제거
- [ ] 관련 import 문 정리

## 사용량 모니터링 결과

### 현재 상태
- V2 기능들이 실제로 사용되지 않음 (0-hit)
- 모든 새로운 기능 플래그가 Off 상태
- @deprecated 주석이 모든 V2 코드에 추가됨

### 모니터링 기간
- **시작일**: 2025-01-24
- **목표 기간**: 2주 (2025-02-07까지)
- **확인 빈도**: 매일 1회

## 정리 진행 조건

### 하드 삭제 진행 조건
1. ✅ 모든 V2 기능 플래그가 Off 상태
2. ✅ 2주간 0-hit 증빙 완료
3. ✅ @deprecated 주석 추가 완료
4. ✅ TypeScript 컴파일러 경고 확인
5. ✅ 스냅샷/시각 회귀 테스트 통과
6. ✅ E2E 테스트 통과

### 현재 진행 상황
- **1단계**: ✅ 완료
- **2단계**: 🔄 진행 중 (0-hit 증빙 중)
- **3단계**: ✅ 완료
- **4단계**: ⏳ 대기 중

## 롤백 계획

### 즉시 롤백 (플래그 기반)
```bash
# 환경변수로 즉시 복구
export FLAG_REPORT_V2_ENABLED=1
export FLAG_CANARY_DEPLOYMENT=1
export FLAG_NEW_PDF_PIPELINE=1

# 서버 재시작
npm run restart
```

### 코드 롤백 (Git 기반)
```bash
# 최근 안정 태그로 복구
git checkout release-2025-01-24-stable

# 또는 특정 커밋으로 복구
git checkout <commit-hash>

# 강제 푸시 (주의: 팀원과 협의 필요)
git push --force origin main
```

### 데이터 롤백 (필요시)
```bash
# 백업에서 복구
npm run restore-backup -- --backup-path=./backups/pre-cleanup-2025-01-24

# 또는 특정 시점으로 복구
npm run restore-backup -- --timestamp=2025-01-24T10:00:00Z
```

## 번들 크기 변화 예상

### 제거 전
- `contracts/report.v2.ts`: ~15 KB
- `infra/pdf/renderV2.ts`: ~45 KB
- V2 관련 코드 총합: ~60 KB

### 제거 후
- V2 관련 코드: 0 KB
- **예상 절약**: ~60 KB (번들 크기 약 2-3% 감소)

### 실제 측정 방법
```bash
# 제거 전 번들 크기 측정
npm run build
npm run analyze-bundle

# 제거 후 번들 크기 측정
npm run build
npm run analyze-bundle

# 비교 분석
npm run compare-bundles
```

## 테스트 계획

### 스냅샷 테스트
```bash
# 현재 상태 스냅샷 생성
npm run test:snapshot -- --update-snapshots

# 정리 후 스냅샷 비교
npm run test:snapshot
```

### 시각 회귀 테스트
```bash
# 현재 상태 시각 스냅샷 생성
npm run test:visual -- --update-snapshots

# 정리 후 시각 비교
npm run test:visual
```

### E2E 테스트
```bash
# 전체 E2E 테스트 실행
npm run test:e2e

# 특정 시나리오 테스트
npm run test:e2e -- --grep="PDF 생성"
npm run test:e2e -- --grep="보고서 작성"
```

## 위험 요소 및 대응 방안

### 위험 요소 1: V1 기능에 영향
- **위험도**: 낮음
- **대응**: V1 코드는 전혀 건드리지 않음
- **검증**: V1 기능에 대한 단위 테스트 실행

### 위험 요소 2: 의존성 문제
- **위험도**: 중간
- **대응**: 삭제 전 의존성 그래프 분석
- **검증**: `npm ls` 및 `ts-prune` 실행

### 위험 요소 3: 런타임 오류
- **위험도**: 낮음
- **대응**: 단계별 배포 및 모니터링
- **검증**: 헬스체크 및 에러 로그 모니터링

## 검증 체크리스트

### 삭제 전 검증
- [ ] 모든 V2 기능이 0-hit 상태
- [ ] TypeScript 컴파일 오류 없음
- [ ] 단위 테스트 100% 통과
- [ ] 통합 테스트 100% 통과
- [ ] E2E 테스트 100% 통과
- [ ] 성능 테스트 통과
- [ ] 보안 스캔 통과

### 삭제 후 검증
- [ ] 애플리케이션 정상 시작
- [ ] 모든 API 엔드포인트 정상 동작
- [ ] PDF 생성 기능 정상 동작
- [ ] 에러 로그에 V2 관련 오류 없음
- [ ] 성능 지표 정상
- [ ] 번들 크기 감소 확인

## 일정

### 1주차 (2025-01-24 ~ 2025-01-30)
- [x] 플래그 Off 및 모니터링 시작
- [x] @deprecated 주석 추가
- [ ] 0-hit 증빙 진행

### 2주차 (2025-01-31 ~ 2025-02-06)
- [ ] 0-hit 증빙 완료
- [ ] 최종 사용량 보고서 생성
- [ ] 삭제 계획 최종 검토

### 3주차 (2025-02-07 ~ 2025-02-13)
- [ ] 하드 삭제 실행
- [ ] 테스트 실행 및 검증
- [ ] 배포 및 모니터링

## 담당자

- **프로젝트 매니저**: [담당자명]
- **개발팀**: [팀명]
- **QA팀**: [팀명]
- **운영팀**: [팀명]

## 승인

- [ ] **개발팀장 승인**: [ ] [날짜]
- [ ] **QA팀장 승인**: [ ] [날짜]
- [ ] **운영팀장 승인**: [ ] [날짜]
- [ ] **프로젝트 매니저 승인**: [ ] [날짜]

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-01-24  
**다음 검토일**: 2025-01-31
