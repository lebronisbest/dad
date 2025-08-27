import { Router } from "express";
import { validateReportData } from "../../core/validation.js";
import path from "path";
import fs from "fs/promises";
import { renderPDFBuffer } from "../../core/render.js";
import TemplatingEngine from "../../core/templating.js";

/**
 * HTTP API 라우터 - 데이터 검증, PDF 생성, 파일 관리 담당
 * 
 * 역할:
 * - 데이터 유효성 검증
 * - PDF/HTML 생성 및 다운로드
 * - 파일 저장 및 관리
 * 
 * 제외된 기능:
 * - 자연어 처리 (MCP 담당)
 * - 법령 검색 (MCP 담당)
 * - 텍스트 개선 (MCP 담당)
 */

export const router = Router();

// 보고서 데이터 검증
router.post("/validate", async (req, res) => {
  try {
    const result = await validateReportData(req.body);
    
    if (result.ok) {
      res.json({ 
        ok: true, 
        message: "데이터 검증 성공",
        data: result.data,
        requestId: req.id
      });
    } else {
      res.status(422).json({ 
        ok: false, 
        error: "VALIDATION_ERROR",
        message: "데이터 검증 실패",
        details: result.errors,
        requestId: req.id
      });
    }
  } catch (error) {
    console.error('데이터 검증 오류:', error);
    res.status(500).json({ 
      ok: false, 
      error: "INTERNAL_ERROR",
      message: "서버 내부 오류",
      requestId: req.id
    });
  }
});

// 보고서 생성 통합 API (PDF/HTML 모두 지원)
router.post("/", async (req, res) => {
  const startTime = Date.now();
  const { output = 'pdf' } = req.query; // output: 'pdf' | 'html'

  try {
    const input = req.body;

    if (!input || typeof input !== 'object') {
      return res.status(400).json({
        ok: false,
        error: '요청 본문이 객체여야 합니다',
        requestId: req.id
      });
    }

    // 1. 데이터 검증
    const validation = await validateReportData(input);
    if (!validation.ok) {
      return res.status(422).json({
        ok: false,
        errors: validation.errors,
        requestId: req.id
      });
    }

    const reportData = validation.data;

    // 2. HTML 템플릿 로드
    const templatePath = path.join(process.cwd(), 'templates', 'layout.html');
    let templateHtml;

    try {
      templateHtml = await fs.readFile(templatePath, 'utf-8');
    } catch (error) {
      return res.status(500).json({
        ok: false,
        error: '템플릿 파일을 읽을 수 없습니다',
        requestId: req.id
      });
    }

    // 3. 데이터 주입 (core/templating.js 사용)
    const templatingEngine = new TemplatingEngine();
    
    let htmlContent;
    try {
      htmlContent = templatingEngine.injectData(templateHtml, reportData);
    } catch (error) {
      return res.status(500).json({
        ok: false,
        error: `템플릿 데이터 주입 실패: ${error.message}`,
        requestId: req.id
      });
    }

    // 4. 출력 형식에 따른 처리
    if (output === 'html') {
      // HTML 미리보기 응답
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(htmlContent);
    } else {
      // PDF 생성 (기본값)
      try {
        const { ok, buffer, error } = await renderPDFBuffer(htmlContent, {
          format: 'A4',
          margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
        });

        if (!ok || !buffer) {
          return res.status(500).json({ 
            ok: false, 
            error: error || 'PDF 렌더 실패',
            requestId: req.id
          });
        }

        // 파일명 생성
        const timestamp = Date.now();
        const filename = `${reportData.site || '안전보고서'}_${timestamp}.pdf`;

        // 응답 헤더 설정
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        res.setHeader('Content-Length', buffer.length);

        // PDF 버퍼 전송
        res.send(buffer);
      } catch (pdfError) {
        console.error('PDF 생성 오류:', pdfError);
        res.status(500).json({
          ok: false,
          error: 'PDF 생성에 실패했습니다',
          details: pdfError.message,
          requestId: req.id
        });
      }
    }

  } catch (error) {
    console.error('보고서 생성 API 오류:', error);
    res.status(500).json({
      ok: false,
      error: error.message,
      requestId: req.id
    });
  }
});



export default router;
