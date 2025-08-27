/**
 * 새로운 PDF 생성 서비스
 * 작업 컨텍스트와 내보내기 DTO를 분리하여 무한로딩 방지
 */

import path from 'path';
import { features } from '../config/features.js';
import { InputDTO, ExportReportDTO, WorkContext, PDFGenerationResult } from './types.js';
import { buildExportDTO, validateExportDTO, cleanExportDTO } from './export_builder.js';
import { enrichWorkContextWithLaws } from './law_tool_safe.js';
import { normalizeReportDTO } from './normalize.js';
import { renderPDFBuffer } from './render.js';
import { savePDFAndMeta } from './storage.js';

/**
 * PDF 생성 메인 함수
 * @param input - 사용자 입력 데이터
 * @param opts - 옵션
 * @returns PDF 생성 결과
 */
export async function generateReport(input: InputDTO, opts = {}): Promise<PDFGenerationResult> {
  const startTime = Date.now();
  
  try {
    console.log('PDF 생성 시작:', { 
      lawTool: features.lawTool, 
      lawRender: features.lawRender 
    });
    
    // 1. 내부 작업 컨텍스트 생성 (PDF와 무관)
    const ctx: WorkContext = await buildWorkContext(input);
    
    // 2. PDF용 내보내기 DTO 생성/검증
    const exportDTO = await buildExportDTOForPDF(input);
    
    // 3. PDF 렌더링 (레이아웃만, 네트워크 의존 X)
    const pdfResult = await renderPDF(exportDTO, opts);
    
    // 4. 파일 저장 및 메타 생성
    const meta = await savePDFAndMeta(pdfResult.buffer, {
      dir: opts.outputDir || path.join(process.cwd(), 'downloads'),
      basename: opts.basename || "safety_report",
      baseUrl: process.env.HTTP_BASE_URL || `http://localhost:${process.env.PORT || 5058}`,
      visitRound: input.visit?.round || 1,
      projectName: input.projectName || '미지정프로젝트'
    });
    
    const processingTime = Date.now() - startTime;
    
    console.log(`PDF 생성 완료: ${meta.filename} (${processingTime}ms)`);
    console.log(`파일 크기: ${meta.size} bytes, SHA256: ${meta.sha256}`);
    
    // 5. 작업 컨텍스트 로깅 (법령 정보 등)
    if (ctx.laws && ctx.laws.length > 0) {
      console.log(`법령 정보 ${ctx.laws.length}개 수집됨 (UI용, PDF 미반영)`);
    }
    
    return { 
      success: true, 
      buffer: pdfResult.buffer,
      filename: meta.filename,
      processingTime,
      renderLog: pdfResult.renderLog
    };
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('PDF 생성 중 오류:', error);
    
    return { 
      success: false, 
      error: error.message,
      processingTime
    };
  }
}

/**
 * 작업 컨텍스트 생성 (PDF와 무관한 내부 정보)
 * @param input - 입력 데이터
 * @returns 작업 컨텍스트
 */
async function buildWorkContext(input: InputDTO): Promise<WorkContext> {
  const ctx: WorkContext = {};
  
  try {
    // 법령 도구가 활성화된 경우에만 법령 정보 수집
    if (features.lawTool) {
      const topic = extractTopicFromInput(input);
      if (topic) {
        console.log('작업 컨텍스트에 법령 정보 추가 중...');
        const enrichedCtx = await enrichWorkContextWithLaws(ctx, topic);
        Object.assign(ctx, enrichedCtx);
      }
    }
    
    // 향후 확장 가능한 컨텍스트 정보들
    // ctx.weather = await getWeatherInfo(input.site?.address);
    // ctx.geocode = await getGeocodeInfo(input.site?.address);
    
  } catch (error) {
    console.warn('작업 컨텍스트 생성 중 오류 (PDF 생성에 영향 없음):', error);
  }
  
  return ctx;
}

/**
 * 입력에서 주제 추출 (법령 검색용)
 * @param input - 입력 데이터
 * @returns 검색할 주제
 */
function extractTopicFromInput(input: InputDTO): string | null {
  // 현장 유형이나 주요 작업 내용에서 주제 추출
  const topics = [
    input.site?.name,
    input.category?.type,
    input.work?.current_work,
    input.work?.today_work
  ].filter(Boolean);
  
  if (topics.length === 0) return null;
  
  // 가장 구체적인 주제 선택
  return topics[0] || '건설현장 안전관리';
}

/**
 * PDF용 내보내기 DTO 생성
 * @param input - 입력 데이터
 * @returns 내보내기용 DTO
 */
async function buildExportDTOForPDF(input: InputDTO): Promise<ExportReportDTO> {
  try {
    // 1. 기본 DTO 빌드
    const exportDTO = buildExportDTO(input);
    
    // 2. DTO 검증
    const validation = validateExportDTO(exportDTO);
    if (!validation.valid) {
      throw new Error(`DTO 검증 실패: ${validation.errors.join(', ')}`);
    }
    
    // 3. DTO 정리 (불필요한 필드 제거)
    const cleanedDTO = cleanExportDTO(exportDTO);
    
    // 4. 최종 검증
    const finalValidation = validateExportDTO(cleanedDTO);
    if (!finalValidation.valid) {
      throw new Error(`최종 DTO 검증 실패: ${finalValidation.errors.join(', ')}`);
    }
    
    console.log('내보내기 DTO 생성 완료:', {
      site: cleanedDTO.site?.name,
      org: cleanedDTO.org?.name,
      inspector: cleanedDTO.inspector,
      photos: cleanedDTO.photos?.length || 0
    });
    
    return cleanedDTO;
    
  } catch (error) {
    console.error('내보내기 DTO 생성 실패:', error);
    throw new Error(`DTO 생성 실패: ${error.message}`);
  }
}

/**
 * PDF 렌더링 (레이아웃만, 네트워크 의존 X)
 * @param exportDTO - 내보내기용 DTO
 * @param opts - 렌더링 옵션
 * @returns PDF 버퍼
 */
async function renderPDF(exportDTO: ExportReportDTO, opts: any) {
  try {
    const templatePath = opts.templatePath || path.join(process.cwd(), 'templates', 'layout.html');
    
    // 템플릿 읽기
    const fs = await import('fs/promises');
    const templateHtml = await fs.readFile(templatePath, 'utf-8');
    
    // 데이터 주입
    const templatingEngine = await import('./templating.js');
    const TemplatingEngine = templatingEngine.default;
    const engine = new TemplatingEngine();
    const html = engine.injectData(templateHtml, exportDTO);
    
    // PDF 렌더링
    const pdfResult = await renderPDFBuffer(html, opts.pdfOptions);
    if (!pdfResult.ok) {
      throw new Error(`PDF 렌더링 실패: ${pdfResult.error}`);
    }
    
    return pdfResult;
    
  } catch (error) {
    console.error('PDF 렌더링 실패:', error);
    throw new Error(`렌더링 실패: ${error.message}`);
  }
}

/**
 * 기존 함수와의 호환성을 위한 래퍼
 * @param input - 입력 데이터
 * @param opts - 옵션
 * @returns 기존 형식의 결과
 */
export async function generateReportPDF(input: any, opts = {}) {
  const result = await generateReport(input, opts);
  
  if (result.success) {
    return {
      success: true,
      meta: {
        filename: result.filename,
        size: result.buffer?.length || 0
      },
      renderLog: result.renderLog,
      processingTime: result.processingTime
    };
  } else {
    return {
      success: false,
      error: result.error,
      processingTime: result.processingTime
    };
  }
}

/**
 * 보고서 데이터 검증 (기존 호환성)
 * @param input - 검증할 데이터
 * @returns 검증 결과
 */
export async function validateReportData(input: any) {
  try {
    const exportDTO = buildExportDTO(input);
    const validation = validateExportDTO(exportDTO);
    
    return {
      ok: validation.valid,
      errors: validation.errors,
      normalizedData: exportDTO
    };
  } catch (error) {
    return {
      ok: false,
      errors: [error.message],
      normalizedData: null
    };
  }
}
