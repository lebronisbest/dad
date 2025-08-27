/**
 * 법령 도구 안전 호출 모듈
 * PDF 렌더링과 무관하게 법령 정보를 가져오는 모듈
 */

import { features } from '../config/features.js';
import { LawCitation, WorkContext } from './types.js';

/**
 * 타임아웃 래퍼 함수
 * @param promise - 실행할 Promise
 * @param timeoutMs - 타임아웃 시간 (밀리초)
 * @returns Promise 결과 또는 타임아웃
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => 
      setTimeout(() => resolve(null), timeoutMs)
    )
  ]);
}

/**
 * 안전한 법령 검색 (타임아웃 포함)
 * @param topic - 검색할 주제
 * @param limit - 최대 결과 수
 * @returns 법령 인용 배열 또는 빈 배열
 */
export async function getLawCitationsSafe(
  topic: string, 
  limit: number = 5
): Promise<LawCitation[]> {
  if (!features.lawTool) {
    console.log('법령 도구가 비활성화되어 있습니다');
    return [];
  }
  
  if (!topic || typeof topic !== 'string') {
    console.warn('법령 검색 주제가 유효하지 않습니다');
    return [];
  }
  
  try {
    console.log(`법령 검색 시작: ${topic} (제한: ${limit})`);
    const startTime = Date.now();
    
    // 실제 법령 검색 함수 호출 (여기서는 MCP 서버 호출)
    const searchPromise = searchLawsFromMCPServer(topic, limit);
    
    // 타임아웃 설정
    const timeoutMs = features.pdf.lawToolTimeout || 3000;
    const result = await withTimeout(searchPromise, timeoutMs);
    
    const duration = Date.now() - startTime;
    
    if (result === null) {
      console.warn(`법령 검색 타임아웃 (${timeoutMs}ms): ${topic}`);
      return [];
    }
    
    if (Array.isArray(result)) {
      console.log(`법령 검색 완료: ${result.length}개 결과 (${duration}ms)`);
      return result;
    } else {
      console.warn('법령 검색 결과가 배열이 아닙니다:', typeof result);
      return [];
    }
    
  } catch (error) {
    console.error('법령 검색 중 오류 발생:', error);
    return [];
  }
}

/**
 * MCP 서버에서 법령 검색 (실제 구현)
 * @param topic - 검색 주제
 * @param limit - 최대 결과 수
 * @returns 법령 검색 결과
 */
async function searchLawsFromMCPServer(topic: string, limit: number): Promise<LawCitation[]> {
  try {
    // 여기서 실제 MCP 서버 호출을 구현합니다
    // 현재는 더미 데이터를 반환합니다
    
    // 실제 구현 시:
    // const response = await mcpClient.call('search_law', { topic, limit });
    // return response.laws || [];
    
    // 더미 데이터 (테스트용)
    await new Promise(resolve => setTimeout(resolve, 100)); // 가짜 지연
    
    return [
      {
        lawName: '산업안전보건법',
        article: '제15조',
        content: '사업주는 근로자에게 안전보건교육을 실시해야 한다',
        source: '산업안전보건법 제15조',
        relevance: 0.9
      },
      {
        lawName: '건설업법',
        article: '제28조',
        content: '건설업자는 안전관리계획을 수립하고 시행해야 한다',
        source: '건설업법 제28조',
        relevance: 0.8
      }
    ].slice(0, limit);
    
  } catch (error) {
    console.error('MCP 서버 법령 검색 오류:', error);
    return [];
  }
}

/**
 * 작업 컨텍스트에 법령 정보 추가
 * @param context - 작업 컨텍스트
 * @param topic - 검색할 주제
 * @returns 법령 정보가 추가된 컨텍스트
 */
export async function enrichWorkContextWithLaws(
  context: WorkContext, 
  topic: string
): Promise<WorkContext> {
  if (!features.lawTool) {
    return context;
  }
  
  try {
    const laws = await getLawCitationsSafe(topic);
    
    return {
      ...context,
      laws: laws.length > 0 ? laws : undefined
    };
    
  } catch (error) {
    console.error('작업 컨텍스트 법령 정보 추가 실패:', error);
    return context;
  }
}

/**
 * 법령 정보를 UI용으로 변환 (PDF와 무관)
 * @param laws - 법령 인용 배열
 * @returns UI 표시용 데이터
 */
export function formatLawsForUI(laws: LawCitation[]): any[] {
  if (!Array.isArray(laws) || laws.length === 0) {
    return [];
  }
  
  return laws.map(law => ({
    id: `${law.lawName}_${law.article}`,
    title: `${law.lawName} ${law.article}`,
    content: law.content,
    source: law.source,
    relevance: law.relevance || 0,
    relevanceText: getRelevanceText(law.relevance || 0)
  }));
}

/**
 * 관련성 점수를 텍스트로 변환
 * @param relevance - 관련성 점수 (0-1)
 * @returns 관련성 텍스트
 */
function getRelevanceText(relevance: number): string {
  if (relevance >= 0.8) return '매우 높음';
  if (relevance >= 0.6) return '높음';
  if (relevance >= 0.4) return '보통';
  if (relevance >= 0.2) return '낮음';
  return '매우 낮음';
}

/**
 * 법령 도구 상태 확인
 * @returns 법령 도구 상태 정보
 */
export function getLawToolStatus(): {
  enabled: boolean;
  timeout: number;
  lastCall: Date | null;
  errorCount: number;
} {
  return {
    enabled: features.lawTool,
    timeout: features.pdf.lawToolTimeout || 3000,
    lastCall: null, // 실제 구현 시 마지막 호출 시간 추적
    errorCount: 0   // 실제 구현 시 오류 횟수 추적
  };
}

/**
 * 법령 검색 성능 모니터링
 * @param topic - 검색 주제
 * @param duration - 소요 시간
 * @param success - 성공 여부
 */
export function trackLawSearchPerformance(topic: string, duration: number, success: boolean): void {
  if (!features.lawTool) return;
  
  console.log(`법령 검색 성능: ${topic} - ${duration}ms (${success ? '성공' : '실패'})`);
  
  // 실제 구현 시 메트릭 수집
  // metrics.increment('law_search.total');
  // metrics.timing('law_search.duration', duration);
  // if (!success) metrics.increment('law_search.errors');
}
