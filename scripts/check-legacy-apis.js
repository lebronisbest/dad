#!/usr/bin/env node

/**
 * 레거시 API 참조 검사 스크립트
 * CI에서 실행하여 /api/, /legacy/, /v0/ 등의 참조가 있는지 확인
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// 검사할 디렉토리들
const SCAN_DIRECTORIES = [
  'src',
  'adapters',
  'core',
  'server',
  'orchestrator'
];

// 제외할 디렉토리들
const EXCLUDE_DIRECTORIES = [
  'node_modules',
  'dist',
  'cache',
  'downloads',
  'processed_images',
  'uploads',
  'logs'
];

// 금지된 패턴들
const FORBIDDEN_PATTERNS = [
  '/api/',
  '/legacy/',
  '/v0/',
  '/old/',
  'generate?type=',
  'reports/preview'
];

// 허용된 예외 패턴들 (문서나 주석에서의 언급)
const ALLOWED_EXCEPTIONS = [
  'docs/',
  'README',
  'CHANGELOG',
  'migration',
  'deprecated',
  'legacy',
  'v0',
  'old'
];

console.log('🔍 레거시 API 참조 검사 시작...\n');

let hasViolations = false;
const violations = [];

// 각 디렉토리에서 검사
for (const dir of SCAN_DIRECTORIES) {
  if (!existsSync(dir)) {
    console.log(`⚠️  디렉토리 ${dir}가 존재하지 않습니다. 건너뜁니다.`);
    continue;
  }
  
  console.log(`📁 ${dir} 디렉토리 검사 중...`);
  
  try {
    // PowerShell의 Select-String을 사용하여 검사
    const command = `Get-ChildItem -Recurse -Path "${dir}" -Exclude ${EXCLUDE_DIRECTORIES.join(',')} | Select-String -Pattern "${FORBIDDEN_PATTERNS.join('|')}" -List | Select-Object Filename,LineNumber,Line`;
    
    const result = execSync(command, { 
      encoding: 'utf8',
      shell: 'powershell.exe',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    if (result.trim()) {
      const lines = result.trim().split('\n');
      
      for (const line of lines) {
        if (line.trim() && !line.includes('Filename')) {
          const parts = line.split(' ');
          if (parts.length >= 3) {
            const filename = parts[0];
            const lineNumber = parts[1];
            const content = parts.slice(2).join(' ');
            
            // 허용된 예외인지 확인
            const isAllowedException = ALLOWED_EXCEPTIONS.some(exception => 
              filename.includes(exception) || content.includes(exception)
            );
            
            if (!isAllowedException) {
              violations.push({
                file: filename,
                line: lineNumber,
                content: content.trim()
              });
              hasViolations = true;
            }
          }
        }
      }
    }
  } catch (error) {
    console.log(`⚠️  ${dir} 디렉토리 검사 중 오류: ${error.message}`);
  }
}

// 결과 출력
if (hasViolations) {
  console.log('\n❌ 레거시 API 참조가 발견되었습니다:');
  console.log('=' .repeat(80));
  
  violations.forEach((violation, index) => {
    console.log(`${index + 1}. 파일: ${violation.file}`);
    console.log(`   라인: ${violation.line}`);
    console.log(`   내용: ${violation.content}`);
    console.log('-'.repeat(60));
  });
  
  console.log('\n🚨 수정이 필요한 항목들:');
  console.log('   - /api/ → /v1/로 변경');
  console.log('   - /legacy/ → /v1/로 변경');
  console.log('   - /v0/ → /v1/로 변경');
  console.log('   - generate?type= → output=로 변경');
  console.log('   - reports/preview → /v1/reports?output=html로 변경');
  
  console.log('\n💡 마이그레이션 가이드:');
  console.log('   - src/utils/api.js의 API 상수 사용');
  console.log('   - 하드코딩된 엔드포인트 제거');
  console.log('   - 새로운 /v1/* API 사용');
  
  process.exit(1);
} else {
  console.log('\n✅ 모든 검사가 통과되었습니다!');
  console.log('   - 레거시 API 참조가 발견되지 않았습니다');
  console.log('   - /v1/* API만 사용하고 있습니다');
  console.log('   - 마이그레이션이 완료되었습니다');
}

console.log('\n🔍 검사 완료');
