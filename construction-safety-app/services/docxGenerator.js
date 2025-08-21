const HTMLtoDOCX = require('html-to-docx');
const juice = require('juice');
const path = require('path');
const fs = require('fs').promises;

class DOCXGenerator {
    constructor() {
        this.fastMode = true;
        this.nativeMode = false;
    }

    // FAST 모드: html-to-docx + juice 파이프라인
    async generateFastDOCX(htmlContent, options = {}) {
        try {
            // CSS를 인라인으로 변환
            const inlinedHTML = juice(htmlContent, {
                removeStyleTags: true,
                preserveMediaQueries: true,
                preserveFontFaces: true
            });

            // DOCX 생성 옵션
            const docxOptions = {
                margin: {
                    top: 1440, // 1인치 = 1440 twips
                    right: 1440,
                    bottom: 1440,
                    left: 1440
                },
                header: true,
                footer: true,
                pageNumber: true,
                font: 'Noto Sans KR',
                fontSize: 11,
                table: {
                    row: {
                        cantSplit: true
                    }
                },
                ...options
            };

            const docxBuffer = await HTMLtoDOCX(inlinedHTML, null, docxOptions);
            return docxBuffer;
        } catch (error) {
            console.error('FAST 모드 DOCX 생성 오류:', error);
            throw error;
        }
    }

    // NATIVE 모드: docx 빌더 (향후 구현)
    async generateNativeDOCX(templateData, options = {}) {
        try {
            // TODO: docx 빌더로 표/머리글/바닥글/페이지 나눔 규칙 코드화
            // 현재는 FAST 모드로 대체
            console.log('NATIVE 모드 DOCX 생성 (FAST 모드로 대체)');
            return await this.generateFastDOCX(templateData, options);
        } catch (error) {
            console.error('NATIVE 모드 DOCX 생성 오류:', error);
            throw error;
        }
    }

    // 통합 DOCX 생성 (모드 선택)
    async generateDOCX(htmlContent, mode = 'fast', options = {}) {
        try {
            switch (mode.toLowerCase()) {
                case 'fast':
                    return await this.generateFastDOCX(htmlContent, options);
                case 'native':
                    return await this.generateNativeDOCX(htmlContent, options);
                default:
                    console.log(`알 수 없는 모드: ${mode}, FAST 모드로 진행`);
                    return await this.generateFastDOCX(htmlContent, options);
            }
        } catch (error) {
            console.error('DOCX 생성 오류:', error);
            throw error;
        }
    }

    // 템플릿에서 DOCX 생성
    async generateDOCXFromTemplate(templateEngine, templateName, data, mode = 'fast', options = {}) {
        try {
            const htmlContent = await templateEngine.renderTemplate(templateName, data);
            return await this.generateDOCX(htmlContent, mode, options);
        } catch (error) {
            console.error('템플릿에서 DOCX 생성 오류:', error);
            throw error;
        }
    }

    // 품질 설정 프로파일
    getQualityProfile(profile = 'standard') {
        const profiles = {
            fast: {
                margin: { top: 720, right: 720, bottom: 720, left: 720 }, // 0.5인치
                fontSize: 10,
                header: false,
                footer: false
            },
            standard: {
                margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }, // 1인치
                fontSize: 11,
                header: true,
                footer: true
            },
            high: {
                margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
                fontSize: 12,
                header: true,
                footer: true,
                pageNumber: true
            }
        };
        
        return profiles[profile] || profiles.standard;
    }

    // 표 설정 최적화
    getTableOptions() {
        return {
            table: {
                row: {
                    cantSplit: true // 행 분할 방지
                },
                cell: {
                    verticalAlign: 'center',
                    margin: {
                        top: 100,
                        right: 100,
                        bottom: 100,
                        left: 100
                    }
                }
            }
        };
    }
}

module.exports = DOCXGenerator;
