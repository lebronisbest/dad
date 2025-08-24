import { LayoutContext } from '../../adapters/composeReportData';
import { logger } from '../logging';
import { Flags } from '../flags';

/**
 * @deprecated V2 PDF 렌더러는 현재 사용되지 않습니다. PDFRendererV1을 계속 사용하세요.
 * 향후 V2 기능이 필요할 때까지 이 클래스는 제거 예정입니다.
 */
export class PDFRendererV2 {
  private puppeteer: any;
  private isInitialized = false;
  private browserPool: any[] = [];
  private maxPoolSize = 3;
  
  constructor() {
    this.initializePuppeteer();
  }
  
  private async initializePuppeteer(): Promise<void> {
    try {
      // 동적 import로 puppeteer 로드
      const puppeteer = await import('puppeteer');
      this.puppeteer = puppeteer;
      this.isInitialized = true;
      logger.info('Puppeteer V2 initialized successfully');
      
      // 브라우저 풀 초기화
      await this.initializeBrowserPool();
    } catch (error) {
      logger.error('Failed to initialize Puppeteer V2', { error: error as Error });
      this.isInitialized = false;
    }
  }
  
  // 브라우저 풀 초기화
  private async initializeBrowserPool(): Promise<void> {
    try {
      for (let i = 0; i < this.maxPoolSize; i++) {
        const browser = await this.puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
          ]
        });
        
        this.browserPool.push(browser);
      }
      
      logger.info(`Browser pool initialized with ${this.browserPool.length} browsers`);
    } catch (error) {
      logger.error('Failed to initialize browser pool', { error: error as Error });
    }
  }
  
  // 브라우저 풀에서 브라우저 가져오기
  private async getBrowser(): Promise<any> {
    if (this.browserPool.length === 0) {
      // 풀이 비어있으면 새로 생성
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
      return browser;
    }
    
    return this.browserPool.pop()!;
  }
  
  // 브라우저를 풀로 반환
  private returnBrowser(browser: any): void {
    if (this.browserPool.length < this.maxPoolSize) {
      this.browserPool.push(browser);
    } else {
      // 풀이 가득 찬 경우 브라우저 종료
      browser.close().catch((error: any) => {
        logger.warn('Failed to close browser', { error });
      });
    }
  }
  
  // HTML 템플릿에 데이터 주입 (V2 향상된 버전)
  private injectDataToTemplate(template: string, data: LayoutContext): string {
    let html = template;
    
    // 기본 필드들 주입 (V1과 동일)
    const replacements: Record<string, string> = {
      '{{site.name}}': data.site.name || '',
      '{{site.address}}': data.site.address || '',
      '{{site.management_number}}': data.site.management_number || '',
      '{{site.construction_period}}': data.site.construction_period || '',
      '{{site.construction_amount}}': data.site.construction_amount || '',
      '{{site.responsible_person}}': data.site.responsible_person || '',
      '{{site.phone}}': data.site.phone || '',
      '{{site.email}}': data.site.email || '',
      '{{site.safety_manager}}': data.site.safety_manager || '',
      '{{site.emergency_contact}}': data.site.emergency_contact || '',
      '{{site.site_type}}': data.site.site_type || '',
      
      '{{org.name}}': data.org.name || '',
      '{{org.registration_number}}': data.org.registration_number || '',
      '{{org.license_number}}': data.org.license_number || '',
      '{{org.phone}}': data.org.phone || '',
      '{{org.address}}': data.org.address || '',
      '{{org.safety_certification}}': data.org.safety_certification || '',
      
      '{{inspector}}': data.inspector || '',
      
      '{{visit.date}}': data.visit.date || '',
      '{{visit.round}}': String(data.visit.round || ''),
      '{{visit.round_total}}': String(data.visit.round_total || ''),
      '{{visit.weather}}': data.visit.weather || '',
      '{{visit.temperature}}': data.visit.temperature ? String(data.visit.temperature) : '',
      '{{visit.humidity}}': data.visit.humidity ? String(data.visit.humidity) : '',
      
      '{{progress.percent}}': String(data.progress.percent || ''),
      '{{progress.milestone}}': data.progress.milestone || '',
      '{{progress.completion_date}}': data.progress.completion_date || '',
      
      '{{guide.org_name}}': data.guide.org_name || '',
      '{{guide.inspector}}': data.guide.inspector || '',
      '{{guide.phone}}': data.guide.phone || '',
      '{{guide.email}}': data.guide.email || '',
      '{{guide.department}}': data.guide.department || '',
      
      '{{work.today_work}}': data.work.today_work || '',
      '{{work.current_work}}': data.work.current_work || '',
      '{{work.additional_notes}}': data.work.additional_notes || '',
      '{{work.personnel_count}}': data.work.personnel_count ? String(data.work.personnel_count) : '',
      
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
    
    // V2 전용 필드들 주입
    if (data.metadata) {
      html = html.replace('{{metadata.version}}', data.metadata.version);
      html = html.replace('{{metadata.created_at}}', data.metadata.created_at);
      html = html.replace('{{metadata.updated_at}}', data.metadata.updated_at);
      html = html.replace('{{metadata.created_by}}', data.metadata.created_by);
      html = html.replace('{{metadata.template_version}}', data.metadata.template_version);
    }
    
    if (data.safety_summary) {
      html = html.replace('{{safety_summary.total_risks}}', String(data.safety_summary.total_risks || 0));
      html = html.replace('{{safety_summary.high_risk_count}}', String(data.safety_summary.high_risk_count || 0));
      html = html.replace('{{safety_summary.medium_risk_count}}', String(data.safety_summary.medium_risk_count || 0));
      html = html.replace('{{safety_summary.low_risk_count}}', String(data.safety_summary.low_risk_count || 0));
      html = html.replace('{{safety_summary.overall_safety_score}}', String(data.safety_summary.overall_safety_score || 100));
    }
    
    if (data.compliance) {
      html = html.replace('{{compliance.compliance_status}}', data.compliance.compliance_status || 'unknown');
      const laws = data.compliance.applicable_laws?.join(', ') || '';
      html = html.replace('{{compliance.applicable_laws}}', laws);
    }
    
    // 향상된 섹션 렌더링 (V2)
    if (data.sections && data.sections.length > 0) {
      const sectionsHtml = data.sections.map((section, index) => `
        <div class="section v2-section" data-section="${index + 1}" data-risk-score="${section.risk_score || 0}">
          <h3>섹션 ${index + 1}</h3>
          <div class="section-header">
            <span class="risk-score">위험도: ${section.risk_score || 'N/A'}</span>
            <span class="status ${section.status || 'open'}">${section.status || 'open'}</span>
          </div>
          <table class="section-table v2-table">
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
            ${section.responsible_person ? `<tr><td>담당자</td><td>${section.responsible_person}</td></tr>` : ''}
            ${section.deadline ? `<tr><td>마감일</td><td>${section.deadline}</td></tr>` : ''}
            ${section.mitigation_cost ? `<tr><td>조치 비용</td><td>${section.mitigation_cost}</td></tr>` : ''}
          </table>
        </div>
      `).join('');
      
      html = html.replace('{{sections}}', sectionsHtml);
    } else {
      html = html.replace('{{sections}}', '<p>등록된 섹션이 없습니다.</p>');
    }
    
    // 향상된 알림 정보
    if (data.notification) {
      html = html.replace('{{notification.other_method}}', data.notification.other_method || '');
      html = html.replace('{{notification.urgency_level}}', data.notification.urgency_level || 'low');
      html = html.replace('{{notification.notification_sent}}', data.notification.notification_sent ? '예' : '아니오');
      html = html.replace('{{notification.sent_at}}', data.notification.sent_at || '');
    }
    
    // 안전 조치 및 장비 정보 (V2 전용)
    if (data.work.safety_measures && data.work.safety_measures.length > 0) {
      const safetyMeasuresHtml = data.work.safety_measures.map(measure => `<li>${measure}</li>`).join('');
      html = html.replace('{{work.safety_measures}}', `<ul>${safetyMeasuresHtml}</ul>`);
    }
    
    if (data.work.equipment_used && data.work.equipment_used.length > 0) {
      const equipmentHtml = data.work.equipment_used.map(equipment => `<li>${equipment}</li>`).join('');
      html = html.replace('{{work.equipment_used}}', `<ul>${equipmentHtml}</ul>`);
    }
    
    return html;
  }
  
  // PDF 생성 (V2 향상된 버전)
  async renderPDF(data: LayoutContext, templatePath: string): Promise<Buffer> {
    if (!this.isInitialized) {
      throw new Error('Puppeteer V2 not initialized');
    }
    
    const context = {
      request_id: data._render.request_id,
      operation: 'PDF_RENDER_V2',
      report_version: data._render.version,
    };
    
    const endTimer = logger.time('PDF generation V2', context);
    
    try {
      // 템플릿 파일 읽기
      const fs = await import('fs/promises');
      const template = await fs.readFile(templatePath, 'utf8');
      
      // 데이터 주입
      const html = this.injectDataToTemplate(template, data);
      
      // 브라우저 풀에서 브라우저 가져오기
      const browser = await this.getBrowser();
      
      try {
        const page = await browser.newPage();
        
        // 향상된 페이지 설정
        await page.setViewport({ width: 1200, height: 800 });
        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        // V2 전용 CSS 주입 (향상된 스타일링)
        await page.addStyleTag({
          content: `
            .v2-section { border: 2px solid #e0e0e0; margin: 10px 0; padding: 15px; border-radius: 8px; }
            .v2-table { width: 100%; border-collapse: collapse; }
            .v2-table td { padding: 8px; border: 1px solid #ddd; }
            .risk-score { background: #f0f8ff; padding: 4px 8px; border-radius: 4px; font-weight: bold; }
            .status { padding: 4px 8px; border-radius: 4px; color: white; }
            .status.open { background: #ff9800; }
            .status.in_progress { background: #2196f3; }
            .status.completed { background: #4caf50; }
            .status.closed { background: #9e9e9e; }
          `
        });
        
        // PDF 생성 옵션 (V2 향상된 설정)
        const pdfOptions = {
          format: 'A4',
          printBackground: true,
          margin: {
            top: '15mm',
            right: '15mm',
            bottom: '15mm',
            left: '15mm'
          },
          displayHeaderFooter: true,
          headerTemplate: `
            <div style="font-size: 10px; text-align: center; width: 100%; padding: 5px;">
              ${data.org.name} - ${data.site.name} | ${data._render.version}
            </div>
          `,
          footerTemplate: `
            <div style="font-size: 10px; text-align: center; width: 100%; padding: 5px;">
              생성일: ${new Date().toLocaleDateString('ko-KR')} | 요청ID: ${data._render.request_id}
            </div>
          `,
          preferCSSPageSize: true,
        };
        
        // PDF 생성
        const pdfBuffer = await page.pdf(pdfOptions);
        
        await page.close();
        
        logger.info('PDF generated successfully V2', {
          ...context,
          pdf_size_bytes: pdfBuffer.length,
          template_path: templatePath,
          browser_pool_size: this.browserPool.length,
        });
        
        endTimer();
        return pdfBuffer;
        
      } finally {
        // 브라우저를 풀로 반환
        this.returnBrowser(browser);
      }
      
    } catch (error) {
      logger.error('PDF generation failed V2', { ...context, error: error as Error });
      endTimer();
      throw error;
    }
  }
  
  // HTML 미리보기 생성 (V2)
  async renderHTML(data: LayoutContext, templatePath: string): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Puppeteer V2 not initialized');
    }
    
    try {
      const fs = await import('fs/promises');
      const template = await fs.readFile(templatePath, 'utf8');
      
      const html = this.injectDataToTemplate(template, data);
      
      logger.info('HTML preview generated successfully V2', {
        request_id: data._render.request_id,
        operation: 'HTML_PREVIEW_V2',
        template_path: templatePath,
      });
      
      return html;
      
    } catch (error) {
      logger.error('HTML preview generation failed V2', {
        request_id: data._render.request_id,
        error: error as Error,
      });
      throw error;
    }
  }
  
  // 헬스 체크 (V2)
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isInitialized || this.browserPool.length === 0) {
        return false;
      }
      
      // 간단한 테스트 HTML 생성
      const testData: LayoutContext = {
        site: { name: 'Test Site V2', address: 'Test Address' },
        org: { name: 'Test Org V2' },
        inspector: 'Test Inspector V2',
        visit: { date: '2024-01-01', round: 1, round_total: 1 },
        progress: { percent: 50 },
        guide: { org_name: 'Test Guide V2' },
        work: { today_work: 'Test Work V2' },
        sections: [],
        notification: { other_method: '' },
        metadata: {
          version: '2.0',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 'Test User',
          template_version: '2.0',
        },
        _render: {
          version: '2.0',
          timestamp: new Date().toISOString(),
          request_id: 'health-check-v2',
          template_version: '2.0',
        },
      };
      
      const testHtml = await this.renderHTML(testData, './templates/layout.html');
      
      return testHtml.length > 0;
      
    } catch (error) {
      logger.error('V2 health check failed', { error: error as Error });
      return false;
    }
  }
  
  // 리소스 정리 (V2)
  async cleanup(): Promise<void> {
    try {
      // 브라우저 풀의 모든 브라우저 종료
      const closePromises = this.browserPool.map(browser => 
        browser.close().catch((error: any) => {
          logger.warn('Failed to close browser', { error });
        })
      );
      
      await Promise.all(closePromises);
      this.browserPool = [];
      
      logger.info('V2 renderer cleanup completed');
    } catch (error) {
      logger.error('V2 renderer cleanup failed', { error: error as Error });
    }
  }
}

/**
 * @deprecated V2 PDF 렌더러 인스턴스는 현재 사용되지 않습니다. pdfRendererV1을 계속 사용하세요.
 */
export const pdfRendererV2 = new PDFRendererV2();
