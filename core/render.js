import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import logger, { logRenderStage, logPerformance, logError } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 환경변수 기반 Chrome 경로 설정 (안정성 향상)
const chromePath = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH;

// 동시성 제한을 위한 세마포어 (간단한 구현)
let activeRenders = 0;
const MAX_CONCURRENT_RENDERS = Math.max(1, Number(process.env.MAX_CONCURRENT_RENDERS) || 3);

// ✅ 성능 가드 설정 (프로젝트 TT 가이드라인: 10페이지 ≤ 2초)
const PERFORMANCE_TARGETS = {
  PDF_10_PAGES: 2000, // 2초 (밀리초)
  WARNING_THRESHOLD: 1500, // 1.5초 (경고 임계값)
  CRITICAL_THRESHOLD: 3000, // 3초 (심각한 성능 저하)
};

// ✅ 성능 모니터링 데이터
const performanceHistory = {
  recentRenders: [],
  maxHistorySize: 100,
  performanceWarnings: 0,
  criticalPerformanceIssues: 0,
};

async function waitForRenderSlot() {
  while (activeRenders >= MAX_CONCURRENT_RENDERS) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  activeRenders++;
}

function releaseRenderSlot() {
  activeRenders = Math.max(0, activeRenders - 1);
}

// ✅ 성능 가드 함수
function checkPerformanceGuard(processingTime, pageCount = 1) {
  const isMultiPage = pageCount > 1;
  const targetTime = isMultiPage ? PERFORMANCE_TARGETS.PDF_10_PAGES : PERFORMANCE_TARGETS.PDF_10_PAGES;
  
  if (processingTime > PERFORMANCE_TARGETS.CRITICAL_THRESHOLD) {
    performanceHistory.criticalPerformanceIssues++;
    logger.error(`🚨 심각한 성능 저하: ${processingTime}ms (목표: ${targetTime}ms, 페이지: ${pageCount})`);
    return { level: 'critical', message: '성능이 심각하게 저하되었습니다' };
  }
  
  if (processingTime > PERFORMANCE_TARGETS.WARNING_THRESHOLD) {
    performanceHistory.performanceWarnings++;
    logger.warn(`⚠️ 성능 경고: ${processingTime}ms (목표: ${targetTime}ms, 페이지: ${pageCount})`);
    return { level: 'warning', message: '성능이 목표치를 초과했습니다' };
  }
  
  if (processingTime <= targetTime) {
    logger.info(`✅ 성능 목표 달성: ${processingTime}ms (목표: ${targetTime}ms, 페이지: ${pageCount})`);
    return { level: 'success', message: '성능 목표를 달성했습니다' };
  }
  
  return { level: 'info', message: '정상적인 성능입니다' };
}

// ✅ 페이지 수 추정 함수
function estimatePageCount(html) {
  try {
    // 간단한 페이지 수 추정 (A4 기준)
    const contentLength = html.length;
    const estimatedPages = Math.ceil(contentLength / 5000); // 5000자당 1페이지 추정
    return Math.max(1, estimatedPages);
  } catch (error) {
    return 1; // 기본값
  }
}

export async function renderPDFBuffer(html, pdfOptions = {}) {
  let browser, page;
  const startTime = Date.now();

  try {
    logRenderStage('시작', { htmlLength: html.length });
    
    // 동시성 제한 대기
    await waitForRenderSlot();

    // Chrome 경로 검증 및 설정
    const launchOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows'
      ]
    };

    if (chromePath) {
      launchOptions.executablePath = chromePath;
    }

    browser = await puppeteer.launch(launchOptions);
    page = await browser.newPage();

    // 메모리 및 성능 최적화
    await page.setViewport({
      width: 1300,
      height: 900,
      deviceScaleFactor: 2
    });

    // 외부 리소스 차단으로 안정성 향상 (계획된 대로)
    await page.setRequestInterception(true);
    page.on("request", req => {
      const u = req.url();
      // 외부 CDN/폰트 대기 차단 → 빈 PDF 방지
      if (u.includes("fonts.googleapis.com") ||
          u.includes("fonts.gstatic.com") ||
          u.includes("cdn.tailwindcss.com") ||
          u.includes("unpkg.com") ||
          u.includes("jsdelivr.net")) {
        return req.abort();
      }
      req.continue();
    });

    // 로컬 Tailwind CSS 주입 (import.meta.url 기반 절대경로)
    const templateDir = path.join(__dirname, '..', 'templates');
    const tailwindPath = path.join(templateDir, 'print.tailwind.css');
    await page.addStyleTag({path: tailwindPath});
    
    logRenderStage('Tailwind CSS 주입 완료', { tailwindPath });
    
    // 리소스 로딩 안정화 (타임아웃 가드 추가)
    const SETCONTENT_TIMEOUT = 15000;
    try {
      await Promise.race([
        page.setContent(html, { waitUntil: 'networkidle0' }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('setContent timeout')), SETCONTENT_TIMEOUT))
      ]);
    } catch (timeoutError) {
      // 타임아웃 시 빠른 로딩으로 폴백
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      logRenderStage('setContent 타임아웃, domcontentloaded로 폴백');
    }

    // ✅ 페이지 수 추정 및 성능 가드 적용
    const estimatedPages = estimatePageCount(html);
    const isMultiPage = estimatedPages > 1;
    
    if (isMultiPage) {
      logger.info(`📄 다중 페이지 감지: 예상 ${estimatedPages}페이지`);
    }

    // PDF 옵션 설정
    const defaultPdfOptions = {
      format: "A4",
      printBackground: true,
      displayHeaderFooter: false,
      preferCSSPageSize: false, // 직접 크기 지정
      width: "210mm",
      height: "297mm",
      margin: {
        top: "15mm",
        right: "15mm",
        bottom: "15mm",
        left: "15mm"
      },
      // 추가 옵션들
      landscape: false,
      pageRanges: undefined,
      scale: 1
    };

    logRenderStage('PDF 생성 시작');
    
    const buffer = await page.pdf({
      ...defaultPdfOptions,
      ...pdfOptions,
    });

    const processingTime = Date.now() - startTime;
    
    // ✅ 성능 가드 적용
    const performanceResult = checkPerformanceGuard(processingTime, estimatedPages);
    
    // ✅ 성능 히스토리 기록
    performanceHistory.recentRenders.push({
      timestamp: new Date().toISOString(),
      processingTime,
      estimatedPages,
      htmlLength: html.length,
      performanceLevel: performanceResult.level,
      bufferSize: buffer.length
    });
    
    // 최근 기록만 유지
    if (performanceHistory.recentRenders.length > performanceHistory.maxHistorySize) {
      performanceHistory.recentRenders = performanceHistory.recentRenders.slice(-performanceHistory.maxHistorySize);
    }
    
    logPerformance('PDF 렌더링', startTime, { 
      bufferSize: buffer.length,
      estimatedPages,
      performanceResult,
      pdfOptions: { ...defaultPdfOptions, ...pdfOptions }
    });

    return {
      ok: true,
      buffer,
      processingTime,
      estimatedPages,
      performanceResult,
      renderLog: {
        timestamp: new Date().toISOString(),
        viewport: { width: 1300, height: 900, deviceScaleFactor: 2 },
        chromePath: chromePath || 'system-default',
        concurrentRenders: activeRenders,
        estimatedPages,
        performanceResult,
        pdfOptions: { ...defaultPdfOptions, ...pdfOptions }
      }
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    logError(error, { 
      processingTime,
      chromePath: chromePath || 'system-default'
    });

    return {
      ok: false,
      error: error.message || String(error),
      processingTime,
      estimatedPages: 0,
      performanceResult: { level: 'error', message: '렌더링 실패' },
      renderLog: {
        timestamp: new Date().toISOString(),
        chromePath: chromePath || 'system-default',
        error: error.message,
        stack: error.stack
      }
    };

  } finally {
    // 동시성 제한 해제
    releaseRenderSlot();

    // 리소스 정리 (안전하게)
    try {
      if (page) await page.close().catch(() => {});
      if (browser) await browser.close().catch(() => {});
    } catch (cleanupError) {
      logger.warn('PDF 렌더링 리소스 정리 중 오류:', cleanupError.message);
    }
  }
}

// ✅ 성능 통계 조회 함수
export function getPerformanceStats() {
  const recentRenders = performanceHistory.recentRenders;
  
  if (recentRenders.length === 0) {
    return {
      totalRenders: 0,
      averageTime: 0,
      performanceWarnings: performanceHistory.performanceWarnings,
      criticalIssues: performanceHistory.criticalPerformanceIssues,
      recentPerformance: []
    };
  }
  
  const totalTime = recentRenders.reduce((sum, render) => sum + render.processingTime, 0);
  const averageTime = totalTime / recentRenders.length;
  
  return {
    totalRenders: recentRenders.length,
    averageTime: Math.round(averageTime),
    performanceWarnings: performanceHistory.performanceWarnings,
    criticalIssues: performanceHistory.criticalPerformanceIssues,
    recentPerformance: recentRenders.slice(-10).map(render => ({
      timestamp: render.timestamp,
      processingTime: render.processingTime,
      estimatedPages: render.estimatedPages,
      performanceLevel: render.performanceLevel
    }))
  };
}

/**
 * 헬스체크용 Chrome 경로 검증 함수
 * @returns {boolean} Chrome 경로 사용 가능 여부
 */
export function isChromeAvailable() {
  return !!chromePath;
}

/**
 * 현재 렌더링 상태 조회
 * @returns {Object} 렌더링 상태 정보
 */
export function getRenderStatus() {
  return {
    activeRenders,
    maxConcurrentRenders: MAX_CONCURRENT_RENDERS,
    chromePath: chromePath || 'system-default',
    performanceStats: getPerformanceStats()
  };
}
