const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const ExcelJS = require('exceljs');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

class ReportGenerator {
  constructor() {
    this.templates = {
      template1: this.generateBasicReport.bind(this),
      template2: this.generateDetailedReport.bind(this),
      template3: this.generateEmergencyReport.bind(this)
    };
  }

  async generateReport(data) {
    const templateId = data.templateId || 'template1';
    const template = this.templates[templateId];
    
    if (!template) {
      throw new Error('지원하지 않는 템플릿입니다.');
    }

    return await template(data);
  }

  async generateBasicReport(data) {
    const reportId = uuidv4();
    const currentDate = moment().format('YYYY-MM-DD');
    
    const report = {
      id: reportId,
      type: '기본 기술지도 결과보고서',
      generatedAt: currentDate,
      projectInfo: {
        projectName: data.projectName || '미지정',
        projectLocation: data.projectLocation || '미지정',
        projectType: data.projectType || '미지정',
        contractor: data.contractor || '미지정'
      },
      guidanceInfo: {
        guidanceDate: data.guidanceDate || currentDate,
        guidanceType: data.guidanceType || '정기점검',
        inspector: data.inspector || '미지정',
        guidanceDuration: data.guidanceDuration || '2시간'
      },
      findings: data.findings || [],
      recommendations: data.recommendations || [],
      legalRefs: data.legalRefs || [], // 법령 인용 추가
      status: '완료'
    };

    return report;
  }

  async generateDetailedReport(data) {
    const basicReport = await this.generateBasicReport(data);
    
    const detailedReport = {
      ...basicReport,
      type: '상세 기술지도 결과보고서',
      riskAssessment: data.riskAssessment || {
        riskLevel: '중간',
        riskFactors: ['안전장비 미착용', '작업환경 불량'],
        mitigationMeasures: ['안전장비 착용 의무화', '작업환경 개선']
      },
      complianceStatus: data.complianceStatus || {
        isCompliant: false,
        violations: ['안전관리규정 위반', '작업허가서 미발급'],
        requiredActions: ['규정 준수 교육 실시', '허가서 발급 절차 준수']
      },
      followUpActions: data.followUpActions || {
        nextInspectionDate: moment().add(30, 'days').format('YYYY-MM-DD'),
        responsiblePerson: data.responsiblePerson || '미지정',
        actionItems: ['안전교육 실시', '장비 점검', '환경 개선']
      },
      legalRefs: data.legalRefs || [] // 법령 인용 추가
    };

    return detailedReport;
  }

  async generateEmergencyReport(data) {
    const basicReport = await this.generateBasicReport(data);
    
    const emergencyReport = {
      ...basicReport,
      type: '긴급 기술지도 결과보고서',
      emergencyLevel: data.emergencyLevel || '높음',
      immediateActions: data.immediateActions || ['작업 중단', '인원 대피', '현장 봉쇄'],
      safetyMeasures: data.safetyMeasures || ['안전장비 착용', '경고표지 설치', '통행 제한'],
      notificationSent: data.notificationSent || false,
      authoritiesNotified: data.authoritiesNotified || [],
      legalRefs: data.legalRefs || [] // 법령 인용 추가
    };

    return emergencyReport;
  }

  async generatePDFReport(reportData) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 크기
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    const { width, height } = page.getSize();
    const fontSize = 12;
    const lineHeight = fontSize * 1.2;
    let currentY = height - 50;

    // 제목
    page.drawText('건설재해예방전문지도기관 기술지도 결과보고서', {
      x: 50,
      y: currentY,
      size: 18,
      font: font,
      color: rgb(0, 0, 0)
    });

    currentY -= lineHeight * 2;

    // 기본 정보
    page.drawText(`보고서 ID: ${reportData.id}`, {
      x: 50,
      y: currentY,
      size: fontSize,
      font: font
    });

    currentY -= lineHeight;
    page.drawText(`생성일: ${reportData.generatedAt}`, {
      x: 50,
      y: currentY,
      size: fontSize,
      font: font
    });

    currentY -= lineHeight * 2;

    // 프로젝트 정보
    page.drawText('프로젝트 정보', {
      x: 50,
      y: currentY,
      size: 14,
      font: font,
      color: rgb(0, 0, 0)
    });

    currentY -= lineHeight;
    page.drawText(`프로젝트명: ${reportData.projectInfo.projectName}`, {
      x: 50,
      y: currentY,
      size: fontSize,
      font: font
    });

    currentY -= lineHeight;
    page.drawText(`위치: ${reportData.projectInfo.projectLocation}`, {
      x: 50,
      y: currentY,
      size: fontSize,
      font: font
    });

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  }

  async generateExcelReport(reportData) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('기술지도 결과보고서');

    // 제목 행
    worksheet.addRow(['건설재해예방전문지도기관 기술지도 결과보고서']);
    worksheet.mergeCells('A1:D1');
    worksheet.getCell('A1').font = { bold: true, size: 16 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    // 기본 정보
    worksheet.addRow([]);
    worksheet.addRow(['보고서 ID', reportData.id]);
    worksheet.addRow(['생성일', reportData.generatedAt]);
    worksheet.addRow(['보고서 유형', reportData.type]);

    // 프로젝트 정보
    worksheet.addRow([]);
    worksheet.addRow(['프로젝트 정보']);
    worksheet.addRow(['프로젝트명', reportData.projectInfo.projectName]);
    worksheet.addRow(['위치', reportData.projectInfo.projectLocation]);
    worksheet.addRow(['프로젝트 유형', reportData.projectInfo.projectType]);
    worksheet.addRow(['시공사', reportData.projectInfo.contractor]);

    // 기술지도 정보
    worksheet.addRow([]);
    worksheet.addRow(['기술지도 정보']);
    worksheet.addRow(['지도일', reportData.guidanceInfo.guidanceDate]);
    worksheet.addRow(['지도유형', reportData.guidanceInfo.guidanceType]);
    worksheet.addRow(['지도자', reportData.guidanceInfo.inspector]);
    worksheet.addRow(['지도시간', reportData.guidanceInfo.guidanceDuration]);

    // 발견사항
    if (reportData.findings && reportData.findings.length > 0) {
      worksheet.addRow([]);
      worksheet.addRow(['발견사항']);
      reportData.findings.forEach((finding, index) => {
        worksheet.addRow([`${index + 1}.`, finding]);
      });
    }

    // 권고사항
    if (reportData.recommendations && reportData.recommendations.length > 0) {
      worksheet.addRow([]);
      worksheet.addRow(['권고사항']);
      reportData.recommendations.forEach((recommendation, index) => {
        worksheet.addRow([`${index + 1}.`, recommendation]);
      });
    }

    // 컬럼 너비 자동 조정
    worksheet.columns.forEach(column => {
      column.width = 20;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}

module.exports = {
  ReportGenerator,
  generateReport: (data) => {
    const generator = new ReportGenerator();
    return generator.generateReport(data);
  }
};
