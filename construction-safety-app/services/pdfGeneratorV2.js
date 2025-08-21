const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs').promises;

class PDFGeneratorV2 {
  constructor() {
    this.browser = null;
    this.isInitialized = false;
    this.fontsLoaded = false;
  }

  async initialize() {
    try {
      if (this.isInitialized) return;

      // Playwright 브라우저 실행 (Docker 환경 고려)
      this.browser = await chromium.launch({
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
          '--allow-running-insecure-content',
          '--disable-features=VizDisplayCompositor'
        ]
      });

      this.isInitialized = true;
      console.log('Playwright PDF 생성기 초기화 완료');
    } catch (error) {
      console.error('Playwright PDF 생성기 초기화 오류:', error);
      throw error;
    }
  }

  async generatePDF(htmlContent, options = {}) {
    try {
      await this.initialize();

      const page = await this.browser.newPage();
      
      // 기본 뷰포트 설정
      await page.setViewportSize({
        width: 1200,
        height: 800
      });

      // HTML 콘텐츠 설정 및 폰트 로딩 대기
      await page.setContent(htmlContent, {
        waitUntil: ['networkidle', 'domcontentloaded']
      });

      // 폰트 로딩 완료까지 대기
      await page.evaluateHandle('document.fonts.ready');
      
      // 추가 대기 시간 (CSS 애니메이션 등 완료)
      await page.waitForTimeout(1000);

      // PDF 생성 옵션
      const pdfOptions = {
        format: 'A4',
        printBackground: true,
        margin: {
          top: '2cm',
          right: '2cm',
          bottom: '2cm',
          left: '2cm'
        },
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="font-size: 10px; text-align: center; width: 100%; margin: 0 auto; padding: 10px;">
            건설재해예방전문지도기관 기술지도 결과보고서
          </div>
        `,
        footerTemplate: `
          <div style="font-size: 10px; text-align: center; width: 100%; margin: 0 auto; padding: 10px;">
            <span class="pageNumber"></span> / <span class="totalPages"></span>
          </div>
        `,
        ...options
      };

      // PDF 생성
      const pdfBuffer = await page.pdf(pdfOptions);
      
      await page.close();
      
      return pdfBuffer;
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      throw error;
    }
  }

  async generatePDFFromFile(templatePath, data, options = {}) {
    try {
      const htmlContent = await fs.readFile(templatePath, 'utf8');
      return await this.generatePDF(htmlContent, options);
    } catch (error) {
      console.error('파일에서 PDF 생성 오류:', error);
      throw error;
    }
  }

  async generatePDFFromTemplate(templateEngine, templateName, data, options = {}) {
    try {
      const htmlContent = await templateEngine.renderTemplate(templateName, data);
      return await this.generatePDF(htmlContent, options);
    } catch (error) {
      console.error('템플릿에서 PDF 생성 오류:', error);
      throw error;
    }
  }

  // 품질 프로파일별 설정
  getQualityProfile(profile = 'standard') {
    const profiles = {
      fast: {
        margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
        printBackground: false,
        displayHeaderFooter: false
      },
      standard: {
        margin: { top: '2cm', right: '2cm', bottom: '2cm', left: '2cm' },
        printBackground: true,
        displayHeaderFooter: true
      },
      high: {
        margin: { top: '2.5cm', right: '2.5cm', bottom: '2.5cm', left: '2.5cm' },
        printBackground: true,
        displayHeaderFooter: true,
        format: 'A4'
      }
    };

    return profiles[profile] || profiles.standard;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.isInitialized = false;
    }
  }
}

module.exports = PDFGeneratorV2;
