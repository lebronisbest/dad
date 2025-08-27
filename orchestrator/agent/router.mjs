import pLimit from 'p-limit';
import { toOpenAITools, sanitizeToolOutput } from '../util/schema_bridge.mjs';
import { listTools, callTool } from '../mcp_client.mjs';
import { logger } from '../util/logger.mjs';

// fill_report 도구 사용 시 데이터 검증 및 보완
function validateAndEnhanceFillReportData(toolName, args) {
  if (toolName === 'fill_report') {
    logger.info('fill_report 도구 데이터 검증 시작', { args });
    
    // args가 빈 객체이거나 null인 경우 기본 검증만 수행
    if (!args || typeof args !== 'object') {
      logger.warning('fill_report 도구에 유효한 데이터가 없음');
      return args;
    }
    
    // 기본적인 데이터 구조 검증만 수행
    const hasBasicStructure = args && (
      (args.site && typeof args.site === 'object') ||
      (args.org && typeof args.org === 'object') ||
      (args.visit && typeof args.visit === 'object')
    );
    
    if (!hasBasicStructure) {
      logger.warning('fill_report 도구에 기본 데이터 구조가 없음');
    }
    
    logger.info('fill_report 도구 데이터 검증 완료', { args });
    return args;
  }
  
  return args;
}

export async function runLoop({ llm, mcp, messages, parallel = 3, maxIterations = 5 }) {
  const limit = pLimit(parallel);
  let currentMessages = [...messages];
  let iteration = 0;
  
  logger.info('오케스트레이터 루프 시작', { 
    messageCount: messages.length, 
    parallel, 
    maxIterations 
  });

  try {
    // MCP 도구 목록 조회
    const tools = await listTools(mcp);
    const llmTools = toOpenAITools(tools);
    
    logger.info(`MCP 도구 변환 완료: ${llmTools.length}개`);

    while (iteration < maxIterations) {
      iteration++;
      logger.info(`루프 반복 ${iteration}/${maxIterations} 시작`);
      
      // LLM에 메시지 전송
      const startTime = Date.now();
      const response = await llm.chat({ 
        messages: currentMessages, 
        tools: llmTools 
      });
      const llmDuration = Date.now() - startTime;
      
      const message = response.choices[0].message;
      logger.success(`LLM 응답 완료 (${llmDuration}ms)`, {
        hasToolCalls: !!message.tool_calls,
        toolCallCount: message.tool_calls?.length || 0
      });

      // 도구 호출이 없으면 완료
      if (!message.tool_calls || message.tool_calls.length === 0) {
        logger.success('도구 호출 없음 - 루프 완료');
        break;
      }

      // 도구 호출 실행
      const toolCalls = message.tool_calls;
      logger.info(`${toolCalls.length}개 도구 호출 시작`);
      
      const toolResults = await Promise.all(
        toolCalls.map(call => 
          limit(async () => {
            const startTime = Date.now();
            try {
              const args = JSON.parse(call.function.arguments || '{}');
              
              // fill_report 도구 사용 시 데이터 검증 및 보완
              const validatedArgs = validateAndEnhanceFillReportData(call.function.name, args);
              
              const result = await callTool(mcp, call.function.name, validatedArgs);
              const duration = Date.now() - startTime;
              
              logger.logToolCall(call.function.name, validatedArgs, true, duration);
              
              return {
                id: call.id,
                name: call.function.name,
                result: sanitizeToolOutput(result),
                duration
              };
            } catch (error) {
              const duration = Date.now() - startTime;
              logger.logToolCall(call.function.name, call.function.arguments, false, duration);
              
              // fill_report 도구 오류 시 특별 처리
              if (call.function.name === 'fill_report') {
                let errorMessage = error.message;
                let suggestion = 'get_template_fields로 템플릿 구조를 확인하고 validate_report_data로 검증하세요.';
                
                // 날짜 형식 오류 특별 처리
                if (error.message.includes('date') || error.message.includes('날짜')) {
                  errorMessage = `날짜 형식 오류: ${error.message}`;
                  suggestion = 'visit.date 필드는 "YY.MM.DD(요일)" 형식이어야 합니다. 예: "25.08.22(목)"';
                }
                
                logger.warning('fill_report 도구 오류 - 데이터 구조 문제', {
                  error: error.message,
                  suggestion: suggestion
                });
                
                return {
                  id: call.id,
                  name: call.function.name,
                  error: `${errorMessage}. ${suggestion}`,
                  duration
                };
              }
              
              return {
                id: call.id,
                name: call.function.name,
                error: error.message,
                duration
              };
            }
          })
        )
      );

      // 도구 결과를 메시지에 추가
      const toolMessages = toolResults.map(result => ({
        role: 'tool',
        tool_call_id: result.id,
        content: result.error ? 
          `오류: ${result.error}` : 
          JSON.stringify(result.result)
      }));

      currentMessages = [
        ...currentMessages,
        message,
        ...toolMessages
      ];

      logger.info(`도구 호출 완료: ${toolResults.length}개`, {
        successCount: toolResults.filter(r => !r.error).length,
        errorCount: toolResults.filter(r => r.error).length
      });

      // 오류가 있으면 사용자에게 알림
      const errors = toolResults.filter(r => r.error);
      if (errors.length > 0) {
        logger.warning(`${errors.length}개 도구 호출 실패`, {
          errors: errors.map(e => ({ name: e.name, error: e.error }))
        });
        
        // fill_report 오류 시 구체적인 해결책 제시
        const fillReportErrors = errors.filter(e => e.name === 'fill_report');
        if (fillReportErrors.length > 0) {
          logger.info('fill_report 도구 오류 해결 방법', {
            solution: 'get_template_fields로 템플릿 구조를 확인하고, validate_report_data로 데이터 유효성을 검증한 후 다시 시도하세요.'
          });
          
          // 날짜 형식 오류가 있는지 확인
          const hasDateError = fillReportErrors.some(e => 
            e.error && (e.error.includes('date') || e.error.includes('날짜'))
          );
          
          if (hasDateError) {
            logger.info('날짜 형식 오류 해결 방법', {
              solution: 'visit.date 필드는 "YY.MM.DD(요일)" 형식이어야 합니다. 예: "25.08.22(목)"'
            });
          }
        }
      }
    }

    if (iteration >= maxIterations) {
      logger.warning('최대 반복 횟수 도달', { maxIterations });
    }

    logger.success('오케스트레이터 루프 완료', { 
      totalIterations: iteration,
      finalMessageCount: currentMessages.length
    });

    return {
      message: currentMessages[currentMessages.length - 1],
      history: currentMessages,
      iterations: iteration,
      tools: llmTools
    };

  } catch (error) {
    logger.error('오케스트레이터 루프 실행 중 오류 발생', error);
    throw error;
  }
}

export async function runSimple({ llm, mcp, prompt, systemPrompt = null }) {
  const messages = [];
  
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  
  messages.push({ role: 'user', content: prompt });
  
  const result = await runLoop({ llm, mcp, messages });
  return result.message.content;
}
