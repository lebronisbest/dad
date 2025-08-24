import { LayoutContext } from '../../adapters/composeReportData';
import { logger } from '../logging';
import { Flags } from '../flags';

// V1 PDF 렌더링 파이프라인 (기존 안정적인 방식)
export class PDFRendererV1 {
  private puppeteer: any;
  private isInitialized = false;
  
  constructor() {
    this.initializePuppeteer();
  }
  
  private async initializePuppeteer(): Promise<void> {
    try {
      // 동적 import로 puppeteer 로드
      const puppeteer = await import('puppeteer');
      this.puppeteer = puppeteer;
      this.isInitialized = true;
      logger.info('Puppeteer V1 initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Puppeteer V1', { error: error as Error });
      this.isInitialized = false;
    }
  }
  
  // HTML 템플릿에 데이터 주입
  private injectDataToTemplate(template: string, data: LayoutContext): string {
    let html = template;
    
    // 기본 필드들 주입
    const replacements: Record<string, string> = {
      '{{site.name}}': data.site.name || '',
      '{{site.address}}': data.site.address || '',
      '{{site.management_number}}': data.site.management_number || '',
      '{{site.construction_period}}': data.site.construction_period || '',
      '{{site.construction_amount}}': data.site.construction_amount || '',
      '{{site.responsible_person}}': data.site.responsible_person || '',
      '{{site.phone}}': data.site.phone || '',
      '{{site.email}}': data.site.email || '',
      
      '{{org.name}}': data.org.name || '',
      '{{org.registration_number}}': data.org.registration_number || '',
      '{{org.license_number}}': data.org.license_number || '',
      '{{org.phone}}': data.org.phone || '',
      '{{org.address}}': data.org.address || '',
      
      '{{inspector}}': data.inspector || '',
      
      '{{visit.date}}': data.visit.date || '',
      '{{visit.round}}': String(data.visit.round || ''),
      '{{visit.round_total}}': String(data.visit.round_total || ''),
      
      '{{progress.percent}}': String(data.progress.percent || ''),
      
      '{{guide.org_name}}': data.guide.org_name || '',
      '{{guide.inspector}}': data.guide.inspector || '',
      '{{guide.phone}}': data.guide.phone || '',
      
      '{{work.today_work}}': data.work.today_work || '',
      '{{work.current_work}}': data.work.current_work || '',
      '{{work.additional_notes}}': data.work.additional_notes || '',
      
      '{{date}}': data.date || '',
      '{{hazardous_location}}': data.hazardous_location || '',
      '{{hazardous_factor}}': data.hazardous_factor || '',
      '{{pointed_issue}}': data.pointed_issue || '',
      '{{implementation_result}}': data.implementation_result || '',
      
      '{{caption_main}}': data.caption_main || '',
      '{{caption_sub}}': data.caption_sub || '',
    };
    
    // 템플릿 치환
    Object.entries(replacements).forEach(([placeholder, value]) => {
      html = html.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    });
    
    // 섹션들 동적 생성
    if (data.sections && data.sections.length > 0) {
      const sectionsHtml = data.sections.map((section, index) => `
        <div class="section" data-section="${index + 1}">
          <h3>섹션 ${index + 1}</h3>
          <table class="section-table">
            <tr><td>장소</td><td>${section.place || ''}</td></tr>
            <tr><td>요인</td><td>${section.factor || ''}</td></tr>
            <tr><td>조치</td><td>${section.measure || ''}</td></tr>
            <tr><td>가능성 수준</td><td>${section.possibility_level || ''}</td></tr>
            <tr><td>심각성 수준</td><td>${section.severity_level || ''}</td></tr>
            <tr><td>위험 수준</td><td>${section.risk_level || ''}</td></tr>
            <tr><td>우선순위</td><td>${section.priority || ''}</td></tr>
            <tr><td>공정</td><td>${section.process || ''}</td></tr>
            <tr><td>하위 공정</td><td>${section.sub_process || ''}</td></tr>
            <tr><td>위험 요인</td><td>${section.hazardous_factor || ''}</td></tr>
            <tr><td>예방 조치</td><td>${section.prevention_measure || ''}</td></tr>
            <tr><td>비고</td><td>${section.notes || ''}</td></tr>
          </table>
        </div>
      `).join('');
      
      html = html.replace('{{sections}}', sectionsHtml);
    } else {
      html = html.replace('{{sections}}', '<p>등록된 섹션이 없습니다.</p>');
    }
    
    // 알림 정보 주입
    if (data.notification.other_method) {
      html = html.replace('{{notification.other_method}}', data.notification.other_method);
    }
    
    return html;
  }
  
  // PDF 생성
  async renderPDF(data: LayoutContext, templatePath: string): Promise<Buffer> {
    if (!this.isInitialized) {
      throw new Error('Puppeteer V1 not initialized');
    }
    
    const context = {
      request_id: data._render.request_id,
      operation: 'PDF_RENDER_V1',
      report_version: data._render.version,
    };
    
    const endTimer = logger.time('PDF generation V1', context);
    
    try {
      // 템플릿 파일 읽기
      const fs = await import('fs/promises');
      const template = await fs.readFile(templatePath, 'utf8');
      
      // 데이터 주입
      const html = this.injectDataToTemplate(template, data);
      
      // 브라우저 실행
      const browser = await this.puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
      
      const page = await browser.newPage();
      
      // HTML 설정
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      // PDF 생성 옵션
      const pdfOptions = {
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        },
        displayHeaderFooter: false,
        preferCSSPageSize: true,
      };
      
      // PDF 생성
      const pdfBuffer = await page.pdf(pdfOptions);
      
      await browser.close();
      
      logger.info('PDF generated successfully V1', {
        ...context,
        pdf_size_bytes: pdfBuffer.length,
        template_path: templatePath,
      });
      
      endTimer();
      return pdfBuffer;
      
    } catch (error) {
      logger.error('PDF generation failed V1', { ...context, error: error as Error });
      endTimer();
      throw error;
    }
  }
  
  // HTML 미리보기 생성
  async renderHTML(data: LayoutContext, templatePath: string): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Puppeteer V1 not initialized');
    }
    
    try {
      const fs = await import('fs/promises');
      const template = await fs.readFile(templatePath, 'utf8');
      
      const html = this.injectDataToTemplate(template, data);
      
      logger.info('HTML preview generated successfully V1', {
        request_id: data._render.request_id,
        operation: 'HTML_PREVIEW_V1',
        template_path: templatePath,
      });
      
      return html;
      
    } catch (error) {
      logger.error('HTML preview generation failed V1', {
        request_id: data._render.request_id,
        error: error as Error,
      });
      throw error;
    }
  }
  
  // 헬스 체크
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        return false;
      }
      
      // 간단한 테스트 PDF 생성
      const testData: LayoutContext = {
        site: { name: 'Test Site', address: 'Test Address' },
        org: { name: 'Test Org' },
        inspector: 'Test Inspector',
        visit: { date: '2024-01-01', round: 1, round_total: 1 },
        progress: { percent: 50 },
        guide: { org_name: 'Test Guide' },
        work: { today_work: 'Test Work' },
        sections: [],
        notification: { other_method: '' },
        _render: {
          version: '1.0',
          timestamp: new Date().toISOString(),
          request_id: 'health-check',
          template_version: '1.0',
        },
      };
      
      // 테스트 HTML 생성 (PDF 생성은 시간이 오래 걸리므로 HTML만)
      const testHtml = await this.renderHTML(testData, './templates/layout.html');
      
      return testHtml.length > 0;
      
    } catch (error) {
      logger.error('V1 health check failed', { error: error as Error });
      return false;
    }
  }
  
  // 리소스 정리
  async cleanup(): Promise<void> {
    // V1에서는 특별한 정리가 필요하지 않음
    logger.info('V1 renderer cleanup completed');
  }
}

// 싱글톤 인스턴스
export const pdfRendererV1 = new PDFRendererV1();
