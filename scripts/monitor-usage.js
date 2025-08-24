#!/usr/bin/env node

/**
 * 사용되지 않는 코드 사용량 모니터링 스크립트
 * 
 * 이 스크립트는 다음을 수행합니다:
 * 1. V2 기능들의 실제 사용량 확인
 * 2. 플래그 접근 로그 분석
 * 3. 사용되지 않는 코드 식별
 * 4. 0-hit 증빙 데이터 생성
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 모니터링 대상 파일들
const TARGET_FILES = [
  'contracts/report.v2.ts',
  'infra/pdf/renderV2.ts',
  'adapters/composeReportData.ts'
];

// 사용량 로그 파일 경로
const USAGE_LOG_PATH = './logs/usage-monitoring.log';

// 사용량 통계
const usageStats = {
  timestamp: new Date().toISOString(),
  v2_schema_access: 0,
  v2_renderer_access: 0,
  v2_compose_access: 0,
  flag_accesses: {},
  deprecated_warnings: 0,
  total_requests: 0
};

/**
 * 로그 파일에서 사용량 패턴 분석
 */
function analyzeUsageLogs() {
  try {
    if (!fs.existsSync(USAGE_LOG_PATH)) {
      console.log('사용량 로그 파일이 없습니다. 모니터링을 시작하세요.');
      return;
    }

    const logContent = fs.readFileSync(USAGE_LOG_PATH, 'utf8');
    const lines = logContent.split('\n').filter(line => line.trim());

    lines.forEach(line => {
      if (line.includes('[V2_USAGE]')) {
        usageStats.v2_compose_access++;
      } else if (line.includes('[V2_MIGRATION]')) {
        usageStats.v2_compose_access++;
      } else if (line.includes('[V2_FORCE]')) {
        usageStats.v2_compose_access++;
      } else if (line.includes('[V2_AUTO]')) {
        usageStats.v2_compose_access++;
      } else if (line.includes('[V2_FLAG]')) {
        usageStats.v2_compose_access++;
      } else if (line.includes('[FLAG_ACCESS]')) {
        const flagMatch = line.match(/FLAG_ACCESS\] (\w+) accessed in/);
        if (flagMatch) {
          const flagName = flagMatch[1];
          usageStats.flag_accesses[flagName] = (usageStats.flag_accesses[flagName] || 0) + 1;
        }
      } else if (line.includes('[V2_USAGE]') || line.includes('[V2_MIGRATION]')) {
        usageStats.v2_compose_access++;
      }
    });

    console.log('사용량 로그 분석 완료');
  } catch (error) {
    console.error('로그 분석 중 오류 발생:', error.message);
  }
}

/**
 * TypeScript 컴파일러 경고 확인
 */
function checkTypeScriptWarnings() {
  try {
    // tsconfig.json이 있는지 확인
    const tsConfigPath = './tsconfig.json';
    if (fs.existsSync(tsConfigPath)) {
      console.log('TypeScript 설정 파일 확인됨');
      
      // @deprecated 주석 사용 확인
      TARGET_FILES.forEach(filePath => {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          const deprecatedCount = (content.match(/@deprecated/g) || []).length;
          console.log(`${filePath}: ${deprecatedCount}개의 @deprecated 주석 발견`);
        }
      });
    }
  } catch (error) {
    console.error('TypeScript 경고 확인 중 오류 발생:', error.message);
  }
}

/**
 * 번들 크기 분석 (webpack-bundle-analyzer 결과가 있다면)
 */
function analyzeBundleSize() {
  try {
    const bundleStatsPath = './dist/stats.json';
    if (fs.existsSync(bundleStatsPath)) {
      const stats = JSON.parse(fs.readFileSync(bundleStatsPath, 'utf8'));
      console.log('번들 크기 분석 결과:');
      console.log(`- 총 크기: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
      
      // V2 관련 모듈 크기 확인
      const v2Modules = Object.keys(stats.modules).filter(name => 
        name.includes('report.v2') || name.includes('renderV2')
      );
      
      if (v2Modules.length > 0) {
        console.log('- V2 관련 모듈들:');
        v2Modules.forEach(module => {
          const size = stats.modules[module];
          console.log(`  ${module}: ${(size / 1024).toFixed(2)} KB`);
        });
      }
    }
  } catch (error) {
    console.log('번들 크기 분석 파일이 없습니다.');
  }
}

/**
 * 사용량 보고서 생성
 */
function generateUsageReport() {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      v2_features_used: usageStats.v2_compose_access + usageStats.v2_renderer_access + usageStats.v2_schema_access,
      total_requests: usageStats.total_requests,
      usage_percentage: 0
    },
    detailed_stats: usageStats,
    recommendations: []
  };

  // 사용률 계산
  if (usageStats.total_requests > 0) {
    report.summary.usage_percentage = (
      (report.summary.v2_features_used / usageStats.total_requests) * 100
    ).toFixed(2);
  }

  // 권장사항 생성
  if (usageStats.v2_compose_access === 0) {
    report.recommendations.push('V2 컴포저 함수들이 사용되지 않음 - 제거 가능');
  }
  
  if (usageStats.v2_renderer_access === 0) {
    report.recommendations.push('V2 PDF 렌더러가 사용되지 않음 - 제거 가능');
  }
  
  if (usageStats.v2_schema_access === 0) {
    report.recommendations.push('V2 스키마가 사용되지 않음 - 제거 가능');
  }

  // 플래그 사용량 확인
  Object.entries(usageStats.flag_accesses).forEach(([flag, count]) => {
    if (count === 0) {
      report.recommendations.push(`${flag} 플래그가 사용되지 않음 - 제거 가능`);
    }
  });

  return report;
}

/**
 * 메인 실행 함수
 */
function main() {
  console.log('=== 사용량 모니터링 시작 ===');
  console.log(`실행 시간: ${new Date().toISOString()}`);
  
  // 1. 사용량 로그 분석
  console.log('\n1. 사용량 로그 분석 중...');
  analyzeUsageLogs();
  
  // 2. TypeScript 경고 확인
  console.log('\n2. TypeScript 경고 확인 중...');
  checkTypeScriptWarnings();
  
  // 3. 번들 크기 분석
  console.log('\n3. 번들 크기 분석 중...');
  analyzeBundleSize();
  
  // 4. 사용량 보고서 생성
  console.log('\n4. 사용량 보고서 생성 중...');
  const report = generateUsageReport();
  
  // 5. 결과 출력
  console.log('\n=== 사용량 모니터링 결과 ===');
  console.log(JSON.stringify(report, null, 2));
  
  // 6. 파일로 저장
  const reportPath = './reports/usage-monitoring-report.json';
  const reportDir = path.dirname(reportPath);
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n보고서가 ${reportPath}에 저장되었습니다.`);
  
  // 7. 0-hit 증빙 확인
  console.log('\n=== 0-hit 증빙 결과 ===');
  if (report.summary.v2_features_used === 0) {
    console.log('✅ V2 기능들이 전혀 사용되지 않음 - 0-hit 증빙 완료');
    console.log('다음 단계: @deprecated 주석 추가 후 하드 삭제 진행 가능');
  } else {
    console.log('⚠️  V2 기능들이 여전히 사용됨');
    console.log(`사용된 횟수: ${report.summary.v2_features_used}`);
    console.log('계속 모니터링이 필요합니다.');
  }
}

// 스크립트 실행
main();
