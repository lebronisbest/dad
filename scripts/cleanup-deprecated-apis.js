#!/usr/bin/env node

/**
 * Deprecated API 정리 스크립트
 * 
 * 사용법:
 * node scripts/cleanup-deprecated-apis.js [--dry-run] [--force]
 * 
 * 옵션:
 * --dry-run: 실제 삭제하지 않고 확인만
 * --force: 확인 없이 강제 삭제
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 명령행 인수 파싱
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isForce = args.includes('--force');

console.log('🔧 Deprecated API 정리 스크립트 시작');
console.log(`모드: ${isDryRun ? 'DRY RUN (실제 삭제 안함)' : '실제 실행'}`);
console.log(`강제 모드: ${isForce ? 'ON' : 'OFF'}`);
console.log('');

// 정리할 파일/디렉토리 목록
const cleanupTargets = [
  {
    path: 'server/project_api.js',
    reason: '중복된 보고서 생성 API (새로운 통합 API로 대체)',
    action: 'DEPRECATED 처리 (thin-wrapper로 변환)'
  },
  {
    path: 'core/service.report.js',
    reason: '레거시 PDF 서비스 (service.report.new.ts로 대체)',
    action: 'DEPRECATED 처리 (thin-wrapper로 변환)'
  },
  {
    path: 'core/unified_report_service.ts',
    reason: '통합 시도본 서비스 (service.report.new.ts로 대체)',
    action: 'DEPRECATED 처리 (thin-wrapper로 변환)'
  },
  {
    path: 'server/mcp_server.js',
    reason: '중복된 MCP 서버 (adapters/mcp/mcp_server.js로 대체)',
    action: '삭제'
  },
  {
    path: 'routes/project.js',
    reason: '사용되지 않는 프로젝트 라우터',
    action: '삭제'
  }
];

// 파일 존재 여부 확인
async function checkFileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// 파일 내용에서 deprecated 표시 확인
async function checkDeprecatedStatus(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return {
      exists: true,
      isDeprecated: content.includes('🚨 DEPRECATED') || content.includes('@deprecated'),
      size: content.length
    };
  } catch (error) {
    return {
      exists: false,
      isDeprecated: false,
      size: 0,
      error: error.message
    }
  }
}

// 정리 작업 실행
async function cleanup() {
  console.log('📋 정리 대상 파일 확인 중...\n');

  let totalFiles = 0;
  let deprecatedFiles = 0;
  let deletedFiles = 0;
  let errors = [];

  for (const target of cleanupTargets) {
    const fullPath = path.join(__dirname, '..', target.path);
    const status = await checkDeprecatedStatus(fullPath);
    
    console.log(`📁 ${target.path}`);
    console.log(`   이유: ${target.reason}`);
    console.log(`   액션: ${target.action}`);
    console.log(`   상태: ${status.exists ? '존재' : '없음'}`);
    
    if (status.exists) {
      totalFiles++;
      
      if (status.isDeprecated) {
        deprecatedFiles++;
        console.log(`   📝 이미 DEPRECATED 처리됨`);
      } else {
        console.log(`   ⚠️  아직 DEPRECATED 처리 안됨`);
      }
      
      console.log(`   크기: ${status.size} bytes`);
      
      // 삭제 대상인 경우
      if (target.action === '삭제') {
        if (isDryRun) {
          console.log(`   🗑️  DRY RUN: 삭제 예정`);
        } else if (isForce || await confirmDeletion(target.path)) {
          try {
            await fs.unlink(fullPath);
            console.log(`   ✅ 삭제 완료`);
            deletedFiles++;
          } catch (error) {
            const errorMsg = `삭제 실패: ${error.message}`;
            console.log(`   ❌ ${errorMsg}`);
            errors.push(`${target.path}: ${errorMsg}`);
          }
        } else {
          console.log(`   ⏸️  사용자에 의해 건너뜀`);
        }
      }
    } else {
      console.log(`   ❌ 파일이 존재하지 않음`);
    }
    
    console.log('');
  }

  // 요약 출력
  console.log('📊 정리 작업 요약');
  console.log('==================');
  console.log(`총 대상 파일: ${totalFiles}개`);
  console.log(`이미 DEPRECATED: ${deprecatedFiles}개`);
  console.log(`삭제된 파일: ${deletedFiles}개`);
  
  if (errors.length > 0) {
    console.log(`오류 발생: ${errors.length}개`);
    errors.forEach(error => console.log(`  - ${error}`));
  }
  
  console.log('');
  
  if (isDryRun) {
    console.log('🔍 DRY RUN 모드: 실제로는 아무것도 변경되지 않았습니다.');
    console.log('실제 실행하려면 --dry-run 옵션을 제거하세요.');
  } else {
    console.log('✅ 정리 작업이 완료되었습니다.');
  }
}

// 삭제 확인
async function confirmDeletion(filePath) {
  if (isForce) return true;
  
  // 실제로는 사용자 입력을 받아야 하지만, 스크립트에서는 기본값 사용
  console.log(`   🤔 ${filePath} 삭제를 확인하려면 --force 옵션을 사용하세요.`);
  return false;
}

// 메인 실행
async function main() {
  try {
    await cleanup();
  } catch (error) {
    console.error('❌ 정리 작업 중 오류 발생:', error);
    process.exit(1);
  }
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { cleanup, checkDeprecatedStatus };
