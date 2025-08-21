const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

class PDFGenerator {
    constructor() {
        this.browser = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            if (this.isInitialized) return;

            this.browser = await puppeteer.launch({
                headless: 'new',
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

            this.isInitialized = true;
            console.log('PDF 생성기 초기화 완료');
        } catch (error) {
            console.error('PDF 생성기 초기화 오류:', error);
            throw error;
        }
    }

    async generatePDF(htmlContent, options = {}) {
        try {
            await this.initialize();

            const page = await this.browser.newPage();
            
            // 기본 설정
            await page.setViewport({
                width: 1200,
                height: 800,
                deviceScaleFactor: 2
            });

            // HTML 콘텐츠 설정
            await page.setContent(htmlContent, {
                waitUntil: ['networkidle0', 'domcontentloaded']
            });

            // 폰트 로딩 대기
            await page.evaluateHandle('document.fonts.ready');

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
                    <div style="font-size: 10px; text-align: center; width: 100%; margin: 0 auto;">
                        건설재해예방전문지도기관 기술지도 결과보고서
                    </div>
                `,
                footerTemplate: `
                    <div style="font-size: 10px; text-align: center; width: 100%; margin: 0 auto;">
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

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.isInitialized = false;
        }
    }

    // 품질 설정 프로파일
    getQualityProfile(profile = 'standard') {
        const profiles = {
            fast: {
                format: 'A4',
                printBackground: false,
                margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
                displayHeaderFooter: false
            },
            standard: {
                format: 'A4',
                printBackground: true,
                margin: { top: '2cm', right: '2cm', bottom: '2cm', left: '2cm' },
                displayHeaderFooter: true
            },
            high: {
                format: 'A4',
                printBackground: true,
                margin: { top: '2cm', right: '2cm', bottom: '2cm', left: '2cm' },
                displayHeaderFooter: true,
                deviceScaleFactor: 2
            }
        };
        
        return profiles[profile] || profiles.standard;
    }
}

module.exports = PDFGenerator;
