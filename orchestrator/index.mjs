#!/usr/bin/env node

import { cfg } from './config.mjs';
import { createMCP } from './mcp_client.mjs';
import { makeProvider } from './llm/provider.mjs';
import { runLoop, runSimple } from './agent/router.mjs';
import { getPromptForTask, getFillReportPrompt } from './agent/planner.mjs';
import { logger } from './util/logger.mjs';

async function main() {
  try {
    logger.info('🚀 안전보고서 오케스트레이터 시작');
    logger.info('설정 정보', cfg);

    // MCP 클라이언트 생성
    const mcp = await createMCP();
    
    // LLM 프로바이더 생성
    const llm = await makeProvider({ 
      provider: cfg.provider, 
      model: cfg.model,
      temperature: cfg.temperature,
      timeout: cfg.timeoutMs
    });

    logger.success('초기화 완료');

    // 명령행 인수 처리
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      // 대화형 모드
      await interactiveMode(llm, mcp);
    } else {
      // 직접 실행 모드
      const prompt = args.join(' ');
      await executePrompt(llm, mcp, prompt);
    }

  } catch (error) {
    logger.error('오케스트레이터 실행 중 치명적 오류 발생', error);
    process.exit(1);
  }
}

async function interactiveMode(llm, mcp) {
  const readline = await import('readline');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('\n🎯 안전보고서 오케스트레이터 대화형 모드');
  console.log('사용 예시:');
  console.log('- "강남구 신축아파트 안전점검 보고서 PDF 초안 만들어줘"');
  console.log('- "ABC제조공장 화재사고 분석 보고서 작성해줘"');
  console.log('- "터널공사 안전점검 실시하고 개선방안 제시해줘"');
  console.log('- "fill_report 도구로 ABC제조공장 안전보고서 생성해줘"');
  console.log('- "기존 템플릿으로 안전보고서 PDF 생성해줘"');
  console.log('- "종료하려면 \'quit\' 또는 \'exit\' 입력\n');

  const askQuestion = () => {
    rl.question('💬 무엇을 도와드릴까요? ', async (input) => {
      if (input.toLowerCase() === 'quit' || input.toLowerCase() === 'exit') {
        console.log('👋 안전보고서 오케스트레이터를 종료합니다.');
        rl.close();
        process.exit(0);
      }

      if (input.trim() === '') {
        askQuestion();
        return;
      }

      try {
        console.log('\n🔄 처리 중...\n');
        await executePrompt(llm, mcp, input);
        console.log('\n' + '='.repeat(50) + '\n');
      } catch (error) {
        logger.error('프롬프트 실행 중 오류 발생', error);
        console.log('❌ 오류가 발생했습니다. 다시 시도해주세요.\n');
      }

      askQuestion();
    });
  };

  askQuestion();
}

async function executePrompt(llm, mcp, prompt) {
  const startTime = Date.now();
  
  try {
    logger.info('프롬프트 실행 시작', { prompt: prompt.substring(0, 100) + '...' });

    // fill_report 도구 사용 시 특별한 프롬프트 적용
    let systemPrompt = null;
    let enhancedPrompt = prompt;
    
    if (prompt.includes('fill_report') || prompt.includes('보고서 생성')) {
      // fill_report 도구 사용 시 동적 프롬프트 적용
      systemPrompt = getFillReportPrompt();
      enhancedPrompt = `${prompt}\n\n중요: fill_report 도구 사용 시 먼저 get_template_fields로 템플릿 구조를 확인하고, validate_report_data로 데이터 유효성을 검증한 후 진행하세요.`;
      
      logger.info('fill_report 도구 사용 감지 - 동적 프롬프트 적용');
    } else {
      // 일반적인 작업 유형 감지
      if (prompt.includes('안전점검') || prompt.includes('점검')) {
        systemPrompt = getPromptForTask('SAFETY_INSPECTION').system;
      } else if (prompt.includes('사고') || prompt.includes('재해') || prompt.includes('화재')) {
        systemPrompt = getPromptForTask('INCIDENT_ANALYSIS').system;
      } else if (prompt.includes('준수') || prompt.includes('감사') || prompt.includes('규정')) {
        systemPrompt = getPromptForTask('COMPLIANCE_REPORT').system;
      } else {
        systemPrompt = getPromptForTask('SAFETY_REPORT').system;
      }
    }

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: enhancedPrompt });

    // 오케스트레이터 루프 실행
    const result = await runLoop({ 
      llm, 
      mcp, 
      messages, 
      parallel: cfg.parallel,
      maxIterations: 5
    });

    const duration = Date.now() - startTime;
    
    // 결과 출력
    console.log('\n📋 실행 결과:');
    console.log(`⏱️  총 소요시간: ${duration}ms`);
    console.log(`🔄 반복 횟수: ${result.iterations}회`);
    console.log(`🔧 사용된 도구: ${result.tools.length}개`);
    
    if (result.message.content) {
      console.log('\n💬 최종 응답:');
      console.log(result.message.content);
    }

    // fill_report 도구 사용 시 추가 안내
    if (prompt.includes('fill_report') || prompt.includes('보고서 생성')) {
      console.log('\n💡 fill_report 도구 사용 팁:');
      console.log('- 먼저 get_template_fields로 템플릿 구조를 확인하세요');
      console.log('- validate_report_data로 데이터 유효성을 검증하세요');
      console.log('- 필수 필드들을 확인하고 완전한 데이터를 제공하세요');
      console.log('- ⚠️  중요: visit.date는 "YY.MM.DD(요일)" 형식이어야 합니다 (예: 25.08.22(목))');
    }

    logger.success('프롬프트 실행 완료', { 
      duration, 
      iterations: result.iterations,
      toolCount: result.tools.length
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('프롬프트 실행 실패', error);
    
    console.log('\n❌ 실행 중 오류가 발생했습니다:');
    console.log(error.message);
    
    if (error.status === 429) {
      console.log('💡 API 호출 한도 초과. 잠시 후 다시 시도해주세요.');
    } else if (error.status >= 500) {
      console.log('💡 서버 오류. 잠시 후 다시 시도해주세요.');
    } else if (error.message.includes('visit')) {
      console.log('💡 fill_report 도구 오류: 데이터 구조가 올바르지 않습니다.');
      console.log('💡 해결방법: get_template_fields로 템플릿 구조를 확인하고 validate_report_data로 검증한 후 다시 시도해주세요.');
    } else if (error.message.includes('date') || error.message.includes('날짜')) {
      console.log('💡 날짜 형식 오류: visit.date 필드 형식이 잘못되었습니다.');
      console.log('💡 해결방법: "YY.MM.DD(요일)" 형식으로 입력하세요. 예: "25.08.22(목)"');
    }
  }
}

// 프로세스 종료 처리
process.on('SIGINT', () => {
  console.log('\n\n👋 안전보고서 오케스트레이터를 종료합니다.');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 안전보고서 오케스트레이터를 종료합니다.');
  process.exit(0);
});

// 메인 함수 실행
if (import.meta.url.includes(process.argv[1]) || import.meta.url.includes('index.mjs')) {
  main().catch(error => {
    console.error('❌ 예상치 못한 오류 발생:', error);
    logger.error('예상치 못한 오류 발생', error);
    process.exit(1);
  });
}
