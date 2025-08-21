const Handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const moment = require('moment');

class TemplateEngine {
    constructor() {
        this.handlebars = Handlebars.create();
        this.setupHelpers();
        this.templates = new Map();
        this.partials = new Map();
    }

    setupHelpers() {
        // 날짜 포맷 헬퍼
        this.handlebars.registerHelper('dateFmt', function(date, format) {
            if (!date) return '';
            return moment(date).format(format);
        });

        // 한국어 통화 헬퍼
        this.handlebars.registerHelper('moneyKRW', function(amount) {
            if (!amount) return '0원';
            return new Intl.NumberFormat('ko-KR', {
                style: 'currency',
                currency: 'KRW'
            }).format(amount);
        });

        // 체크박스 헬퍼
        this.handlebars.registerHelper('checkbox', function(checked) {
            return checked ? '☑' : '☐';
        });

        // 리스트 조인 헬퍼
        this.handlebars.registerHelper('join', function(list, separator) {
            if (!Array.isArray(list)) return '';
            return list.join(separator || ', ');
        });

        // 줄바꿈 변환 헬퍼
        this.handlebars.registerHelper('nl2br', function(text) {
            if (!text) return '';
            return text.replace(/\n/g, '<br>');
        });

        // 현재 연도 헬퍼
        this.handlebars.registerHelper('currentYear', function() {
            return new Date().getFullYear();
        });

        // 법령 인용 헬퍼
        this.handlebars.registerHelper('legalRef', function(legalRefs, index) {
            if (!legalRefs || !Array.isArray(legalRefs) || !legalRefs[index]) {
                return '';
            }
            const ref = legalRefs[index];
            return `${ref.title} ${ref.jo}조${ref.hang ? ref.hang + '항' : ''}${ref.mok ? ref.mok + '목' : ''}`;
        });

        // 법령 인용 각주 헬퍼
        this.handlebars.registerHelper('legalFootnotes', function(legalRefs) {
            if (!legalRefs || !Array.isArray(legalRefs) || legalRefs.length === 0) {
                return '';
            }
            
            let footnotes = '<div class="legal-footnotes">';
            footnotes += '<h4>📋 법령 인용</h4>';
            
            legalRefs.forEach((ref, index) => {
                footnotes += `<div class="legal-ref-item">`;
                footnotes += `<span class="ref-number">[${index + 1}]</span>`;
                footnotes += `<span class="ref-title">${ref.title}</span>`;
                footnotes += `<span class="ref-article">${ref.jo}조`;
                if (ref.hang) footnotes += `${ref.hang}항`;
                if (ref.mok) footnotes += `${ref.mok}목`;
                footnotes += '</span>';
                if (ref.text) footnotes += `<div class="ref-text">${ref.text}</div>`;
                if (ref.link) footnotes += `<div class="ref-link"><a href="${ref.link}" target="_blank">원문 보기</a></div>`;
                footnotes += '</div>';
            });
            
            footnotes += '</div>';
            return footnotes;
        });

        // 위험도 색상 헬퍼
        this.handlebars.registerHelper('riskColor', function(level) {
            const colors = {
                '높음': '#dc3545',
                '중간': '#ffc107',
                '낮음': '#28a745'
            };
            return colors[level] || '#6c757d';
        });

        // 상태 아이콘 헬퍼
        this.handlebars.registerHelper('statusIcon', function(status) {
            const icons = {
                '완료': '✅',
                '진행중': '🔄',
                '대기': '⏳',
                '지연': '⚠️',
                '취소': '❌'
            };
            return icons[status] || '❓';
        });
    }

    async loadTemplates() {
        try {
            // 메인 템플릿 로드
            const mainTemplatePath = path.join(__dirname, '../templates/report_v1.hbs');
            const mainTemplateContent = await fs.readFile(mainTemplatePath, 'utf8');
            this.templates.set('report_v1', mainTemplateContent);

            // 부분 템플릿 로드
            const partialsDir = path.join(__dirname, '../templates/partials');
            const partialFiles = await fs.readdir(partialsDir);
            
            for (const file of partialFiles) {
                if (file.endsWith('.hbs')) {
                    const partialName = path.basename(file, '.hbs');
                    const partialPath = path.join(partialsDir, file);
                    const partialContent = await fs.readFile(partialPath, 'utf8');
                    
                    this.handlebars.registerPartial(partialName, partialContent);
                    this.partials.set(partialName, partialContent);
                }
            }

            console.log('템플릿 로드 완료:', this.templates.size, '개 메인,', this.partials.size, '개 부분');
        } catch (error) {
            console.error('템플릿 로드 오류:', error);
            throw error;
        }
    }

    async renderTemplate(templateName, data) {
        try {
            if (!this.templates.has(templateName)) {
                throw new Error(`템플릿을 찾을 수 없습니다: ${templateName}`);
            }

            const templateContent = this.templates.get(templateName);
            const template = this.handlebars.compile(templateContent);
            
            // 기본 데이터 설정
            const templateData = {
                ...data,
                createdAt: data.createdAt || new Date(),
                currentYear: new Date().getFullYear(),
                reportNumber: data.reportNumber || `RPT-${Date.now()}`,
                templateName: this.getTemplateDisplayName(templateName),
                isDetailedReport: templateName === 'report_v1' && data.templateId === 'template2',
                isEmergencyReport: templateName === 'report_v1' && data.templateId === 'template3'
            };

            return template(templateData);
        } catch (error) {
            console.error('템플릿 렌더링 오류:', error);
            throw error;
        }
    }

    getTemplateDisplayName(templateName) {
        const templateNames = {
            'report_v1': '기본 기술지도 결과보고서',
            'report_v2': '상세 기술지도 결과보고서',
            'report_v3': '긴급 기술지도 결과보고서'
        };
        return templateNames[templateName] || templateName;
    }

    // 템플릿 버전 관리
    getTemplateVersion(templateName) {
        const versions = {
            'report_v1': '1.0.0',
            'report_v2': '2.0.0',
            'report_v3': '3.0.0'
        };
        return versions[templateName] || '1.0.0';
    }

    // 템플릿 변경 이력
    getTemplateChangelog() {
        return {
            'report_v1': {
                version: '1.0.0',
                date: '2024-01-01',
                changes: [
                    '초기 버전 생성',
                    '기본 보고서 구조 정의',
                    'Handlebars 템플릿 엔진 적용'
                ]
            }
        };
    }
}

module.exports = TemplateEngine;
