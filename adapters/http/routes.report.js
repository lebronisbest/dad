import { Router } from "express";
import { generateReportPDF, validateReportData } from "../../core/service.report.js";
import path from "path";

export const router = Router();

// 보고서 데이터 검증
router.post("/v1/reports/validate", async (req, res) => {
  try {
    const result = await validateReportData(req.body);
    
    if (result.ok) {
      res.json({ 
        success: true, 
        message: "데이터 검증 성공",
        data: result.normalizedData 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: "VALIDATION_ERROR",
        message: "데이터 검증 실패",
        details: result.errors 
      });
    }
  } catch (error) {
    console.error('데이터 검증 오류:', error);
    res.status(500).json({ 
      success: false, 
      error: "INTERNAL_ERROR",
      message: "서버 내부 오류" 
    });
  }
});

// 보고서 PDF 생성
router.post("/v1/reports/pdf", async (req, res) => {
  try {
    const result = await generateReportPDF(req.body, {
      templatePath: process.env.TEMPLATE_PATH || path.join(process.cwd(), 'templates', 'layout.html'),
      outputDir: process.env.DOWNLOADS_DIR || path.join(process.cwd(), 'downloads'),
      basename: req.body.basename || "safety_report",
      pdfOptions: req.body.pdf_options || {}
    });
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: "PDF 생성 성공",
        file: result.meta,
        processingTime: result.processingTime
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: result.error,
        message: "PDF 생성 실패",
        details: result.details 
      });
    }
  } catch (error) {
    console.error('PDF 생성 오류:', error);
    res.status(500).json({ 
      success: false, 
      error: "INTERNAL_ERROR",
      message: "서버 내부 오류" 
    });
  }
});

// 보고서 생성 (검증 + PDF 생성)
router.post("/v1/reports", async (req, res) => {
  try {
    // 1. 데이터 검증
    const validation = await validateReportData(req.body);
    if (!validation.ok) {
      return res.status(400).json({ 
        success: false, 
        error: "VALIDATION_ERROR",
        message: "데이터 검증 실패",
        details: validation.errors 
      });
    }
    
    // 2. PDF 생성
    const result = await generateReportPDF(validation.normalizedData, {
      templatePath: process.env.TEMPLATE_PATH || path.join(process.cwd(), 'templates', 'layout.html'),
      outputDir: process.env.DOWNLOADS_DIR || path.join(process.cwd(), 'downloads'),
      basename: req.body.basename || "safety_report",
      pdfOptions: req.body.pdf_options || {}
    });
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: "보고서 생성 완료",
        file: result.meta,
        processingTime: result.processingTime
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: result.error,
        message: "PDF 생성 실패",
        details: result.details 
      });
    }
  } catch (error) {
    console.error('보고서 생성 오류:', error);
    res.status(500).json({ 
      success: false, 
      error: "INTERNAL_ERROR",
      message: "서버 내부 오류" 
    });
  }
});

// 템플릿 정보 조회
router.get("/v1/templates", (req, res) => {
  res.json({
    success: true,
    templates: [
      {
        id: "industrial_safety_v1_kr",
        name: "산업안전보고서 v1.0",
        version: "1.0.0",
        description: "건설현장 안전점검 보고서 템플릿",
        fields: [
          "site", "org", "inspector", "round", "round_total", 
          "visit", "progress", "sections"
        ]
      }
    ]
  });
});
