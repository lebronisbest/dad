/**
 * 통합 보고서 생성 서비스
 * 모든 보고서 생성 요구사항을 하나의 서비스로 통합
 */

import path from 'path';
import { buildExportDTO, validateExportDTO, cleanExportDTO } from './export_builder.js';
import { normalizeReportDTO } from './normalize.js';
import { renderPDFBuffer } from './render.js';
import { savePDFAndMeta } from './storage.js';
import { FileNameGenerator } from './utils.js';
import { CONFIG } from './config.js';

export class UnifiedReportService {
  /**
   * 통합 보고서 생성
   */
  static async generateReport(input, options) {
    const startTime = Date.now();
    
    try {
      // 0. 입력값 상세 로깅 (한글 인코딩 문제 진단)
      console.log('🔍 generateReport 입력값 상세 분석:');
      console.log('  입력 타입:', typeof input);
      console.log('  입력 키:', Object.keys(input));
      console.log('  site.name:', input.site?.name, '(길이:', input.site?.name?.length, ')');
      console.log('  org.name:', input.org?.name, '(길이:', input.org?.name?.length, ')');
      console.log('  inspector:', input.inspector, '(길이:', input.inspector?.length, ')');
      console.log('  visit.date:', input.visit?.date, '(길이:', input.visit?.date?.length, ')');
      
      // 1. 데이터 검증
      const validation = await this.validateInput(input);
      if (!validation.valid) {
        return {
          success: false,
          error: `데이터 검증 실패: ${validation.errors.join(', ')}`,
          report: null,
          processingTime: Date.now() - startTime
        };
      }

      // 2. 보고서 생성
      let report;
      let filename;

      if (options.type === 'html') {
        report = await this.generateHTML(input);
      } else {
        const pdfResult = await this.generatePDF(input, options);
        if (!pdfResult.success) {
          return {
            success: false,
            error: pdfResult.error,
            report: null,
            processingTime: Date.now() - startTime
          };
        }
        report = pdfResult.buffer;
        filename = pdfResult.filename;
      }

      // 3. 조건부 파일 저장 (immediate와 관계없이 saveFile이 true면 저장)
      let saved = false;
      if (options.saveFile) {
        if (options.type === 'pdf') {
          const savedFile = await savePDFAndMeta(report, {
            dir: options.outputDir || 'downloads',
            basename: options.basename || 'safety_report',
            baseUrl: process.env.HTTP_BASE_URL || CONFIG.BASE_URL
          });
          filename = savedFile.filename;
          saved = true;
        } else if (options.type === 'html') {
          // HTML 파일 저장
          const fs = await import('fs/promises');
          const path = await import('path');
          const htmlDir = options.outputDir || 'downloads';
          
          // 새로운 파일명 생성 로직 적용
          const htmlFilename = FileNameGenerator.generateReportFileName({
            visitRound: input.visit?.round || 1,
            projectName: input.projectName || '미지정프로젝트',
            extension: 'html'
          });
          
          const htmlPath = path.join(process.cwd(), htmlDir, htmlFilename);
          
          // 디렉토리 생성
          await fs.mkdir(htmlDir, { recursive: true });
          
          // HTML 파일 저장
          await fs.writeFile(htmlPath, report, 'utf8');
          
          filename = htmlFilename;
          saved = true;
        }
      }

      // 4. 조건부 프로젝트 연결
      let projectLinked = false;
      let projectInfo = null;
      
      if (options.projectId && options.saveFile) {
        try {
          // 프로젝트 연결 로직은 별도로 구현 필요
          // 현재는 기본 정보만 반환
          projectLinked = true;
          projectInfo = {
            id: `report_${Date.now()}`,
            round: 1,
            status: 'completed'
          };
        } catch (error) {
          console.warn('프로젝트 연결 실패:', error);
          // 프로젝트 연결 실패는 전체 실패로 처리하지 않음
        }
      }

      return {
        success: true,
        report,
        projectLinked,
        saved,
        filename,
        projectInfo,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        report: null,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * HTML 생성
   */
  static async generateHTML(input) {
    try {
      console.log('🔍 HTML 생성 시작 - 입력 데이터:', Object.keys(input));
      
      // layout.html 템플릿 사용하여 HTML 생성
      const templatingEngine = await import('./templating.js');
      const TemplatingEngine = templatingEngine.default;
      const engine = new TemplatingEngine();
      
      // layout.html 템플릿 읽기
      const fs = await import('fs/promises');
      const templatePath = path.join(process.cwd(), 'templates', 'layout.html');
      const templateHtml = await fs.readFile(templatePath, 'utf-8');
      console.log('✅ 템플릿 로드 완료, 크기:', templateHtml.length);
      
      // 데이터 주입
      const exportDTO = buildExportDTO(input);
      console.log('✅ Export DTO 생성 완료:', Object.keys(exportDTO));
      
      const html = engine.injectData(templateHtml, exportDTO);
      console.log('✅ 데이터 주입 완료, HTML 크기:', html.length);
      
      return html;
    } catch (error) {
      console.error('❌ HTML 생성 실패:', error);
      throw error;
    }
  }

  /**
   * PDF 생성
   */
  static async generatePDF(input, options) {
    try {
      // 1. HTML 생성
      const html = await this.generateHTML(input);
      
      // 2. HTML을 PDF로 변환
      const { renderPDFBuffer } = await import('./render.js');
      const pdfResult = await renderPDFBuffer(html, {
        format: 'A4',
        printBackground: true,
        margin: {
          top: '15mm',
          right: '15mm',
          bottom: '15mm',
          left: '15mm'
        }
      });
      
      if (!pdfResult.ok) {
        throw new Error(`PDF 변환 실패: ${pdfResult.error}`);
      }
      
      // 3. 파일 저장
      const { savePDFAndMeta } = await import('./storage.js');
      const savedFile = await savePDFAndMeta(pdfResult.buffer, {
        dir: options.outputDir || 'downloads',
        basename: options.basename || 'safety_report',
        baseUrl: process.env.HTTP_BASE_URL || CONFIG.BASE_URL,
        visitRound: input.visit?.round || 1,
        projectName: input.projectName || '미지정프로젝트'
      });
      
      return {
        success: true,
        buffer: pdfResult.buffer,
        filename: savedFile.filename,
        filePath: savedFile.filePath,
        url: savedFile.url,
        processingTime: pdfResult.processingTime
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - (options.startTime || Date.now())
      };
    }
  }

  /**
   * 입력 데이터 검증
   */
  static async validateInput(input) {
    try {
      const exportDTO = buildExportDTO(input);
      const validation = validateExportDTO(exportDTO);
      return validation;
    } catch (error) {
      return {
        valid: false,
        errors: [error.message]
      };
    }
  }
}
