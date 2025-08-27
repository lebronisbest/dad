/**
 * PDF 생성 컨트롤러
 * 중복 호출 방지 및 무한로딩 차단
 */

import { Request, Response } from 'express';
import { features } from '../config/features.js';
import { generateReport } from '../core/service.report.new.js';

// 중복 생성 방지 플래그
let inFlight = false;
let lastGenerationTime = 0;
const DEBOUNCE_DELAY = 2000; // 2초 디바운스

/**
 * PDF 생성 핸들러
 * @param req - HTTP 요청
 * @param res - HTTP 응답
 */
export async function handleCreatePdf(req: Request, res: Response) {
  const now = Date.now();
  
  // 1. 중복 생성 방지
  if (inFlight) {
    return res.status(409).json({ 
      error: 'PDF generation in progress',
      message: 'PDF 생성이 이미 진행 중입니다. 잠시 후 다시 시도해주세요.'
    });
  }
  
  // 2. 디바운스 체크
  if (now - lastGenerationTime < DEBOUNCE_DELAY) {
    return res.status(429).json({
      error: 'Too many requests',
      message: '요청이 너무 빠릅니다. 잠시 후 다시 시도해주세요.',
      retryAfter: Math.ceil((DEBOUNCE_DELAY - (now - lastGenerationTime)) / 1000)
    });
  }
  
  // 3. 동시 생성 제한
  if (features.pdf.maxConcurrentGenerations === 1) {
    inFlight = true;
    lastGenerationTime = now;
  }
  
  try {
    console.log('PDF 생성 요청 시작:', {
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
    
    // 4. 요청 데이터 검증
    const reportData = req.body;
    if (!reportData || typeof reportData !== 'object') {
      throw new Error('유효하지 않은 요청 데이터입니다');
    }
    
    // 5. PDF 생성 실행
    const result = await generateReport(reportData, {
      outputDir: process.env.PDF_OUTPUT_DIR || 'downloads',
      basename: `safety_report_${Date.now()}`,
      pdfOptions: {
        format: 'A4',
        printBackground: true,
        margin: {
          top: '18mm',
          right: '18mm',
          bottom: '18mm',
          left: '18mm'
        }
      }
    });
    
    if (!result.success) {
      throw new Error(result.error || 'PDF 생성에 실패했습니다');
    }
    
    // 6. 성공 응답
    res.status(200).json({
      success: true,
      message: 'PDF가 성공적으로 생성되었습니다',
      data: {
        filename: result.filename,
        size: result.buffer?.length || 0,
        processingTime: result.processingTime
      }
    });
    
    console.log('PDF 생성 완료:', {
      filename: result.filename,
      processingTime: result.processingTime,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('PDF 생성 오류:', error);
    
    // 7. 오류 응답
    res.status(500).json({
      success: false,
      error: 'PDF generation failed',
      message: error.message || 'PDF 생성 중 오류가 발생했습니다',
      timestamp: new Date().toISOString()
    });
    
  } finally {
    // 8. 상태 초기화
    if (features.pdf.maxConcurrentGenerations === 1) {
      inFlight = false;
    }
  }
}

/**
 * PDF 생성 상태 확인
 * @param req - HTTP 요청
 * @param res - HTTP 응답
 */
export function handleGetPdfStatus(req: Request, res: Response) {
  const now = Date.now();
  const timeSinceLastGeneration = now - lastGenerationTime;
  
  res.status(200).json({
    inFlight,
    lastGenerationTime: new Date(lastGenerationTime).toISOString(),
    timeSinceLastGeneration: Math.round(timeSinceLastGeneration / 1000),
    debounceDelay: DEBOUNCE_DELAY,
    canGenerate: !inFlight && timeSinceLastGeneration >= DEBOUNCE_DELAY,
    features: {
      lawTool: features.lawTool,
      lawRender: features.lawRender,
      maxConcurrentGenerations: features.pdf.maxConcurrentGenerations
    }
  });
}

/**
 * PDF 생성 강제 취소 (관리자용)
 * @param req - HTTP 요청
 * @param res - HTTP 응답
 */
export function handleCancelPdfGeneration(req: Request, res: Response) {
  // 관리자 권한 확인 (실제 구현 시 JWT 등으로 검증)
  const isAdmin = req.headers['x-admin-key'] === process.env.ADMIN_SECRET_KEY;
  
  if (!isAdmin) {
    return res.status(403).json({
      error: 'Forbidden',
      message: '관리자 권한이 필요합니다'
    });
  }
  
  if (!inFlight) {
    return res.status(200).json({
      message: '현재 진행 중인 PDF 생성이 없습니다'
    });
  }
  
  // 강제 취소
  inFlight = false;
  lastGenerationTime = 0;
  
  res.status(200).json({
    message: 'PDF 생성이 강제 취소되었습니다',
    timestamp: new Date().toISOString()
  });
  
  console.log('PDF 생성 강제 취소됨 (관리자 요청)');
}

/**
 * PDF 생성 통계
 * @param req - HTTP 요청
 * @param res - HTTP 응답
 */
export function handleGetPdfStats(req: Request, res: Response) {
  res.status(200).json({
    currentStatus: {
      inFlight,
      lastGenerationTime: new Date(lastGenerationTime).toISOString(),
      timeSinceLastGeneration: Math.round((Date.now() - lastGenerationTime) / 1000)
    },
    configuration: {
      debounceDelay: DEBOUNCE_DELAY,
      maxConcurrentGenerations: features.pdf.maxConcurrentGenerations,
      lawToolTimeout: features.pdf.lawToolTimeout
    },
    features: {
      lawTool: features.lawTool,
      lawRender: features.lawRender,
      blockExternalResources: features.pdf.blockExternalResources,
      useInlineCSS: features.pdf.useInlineCSS
    }
  });
}
