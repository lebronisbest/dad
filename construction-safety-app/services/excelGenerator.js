const ExcelJS = require('exceljs');
const path = require('path');

class ExcelGenerator {
  constructor() {
    this.workbook = null;
    this.worksheet = null;
  }

  async createWorkbook() {
    this.workbook = new ExcelJS.Workbook();
    this.workbook.creator = '건설재해예방전문지도기관';
    this.workbook.lastModifiedBy = '기술지도 시스템';
    this.workbook.created = new Date();
    this.workbook.modified = new Date();
    
    return this.workbook;
  }

  async generateExcel(reportData, templateType = 'template1') {
    try {
      await this.createWorkbook();
      
      switch (templateType) {
        case 'template1':
          return await this.generateTemplate1(reportData);
        case 'template2':
          return await this.generateTemplate2(reportData);
        case 'template3':
          return await this.generateTemplate3(reportData);
        default:
          throw new Error(`지원하지 않는 템플릿: ${templateType}`);
      }
    } catch (error) {
      console.error('Excel 생성 오류:', error);
      throw error;
    }
  }

  async generateTemplate1(reportData) {
    const worksheet = this.workbook.addWorksheet('기술지도결과보고서');
    
    // 제목 행
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = '건설재해예방전문지도기관 기술지도 결과보고서';
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    
    // 기본 정보 테이블
    this.addBasicInfoTable(worksheet, reportData, 'A3');
    
    // 발견사항 테이블
    this.addFindingsTable(worksheet, reportData.findings, 'A8');
    
    // 권고사항 테이블
    this.addRecommendationsTable(worksheet, reportData.recommendations, 'A15');
    
    // 위험도 평가
    this.addRiskAssessment(worksheet, reportData.riskAssessment, 'A22');
    
    // 열 너비 자동 조정
    worksheet.columns.forEach(column => {
      column.width = Math.max(
        column.width || 0,
        Math.max(...column.values.map(v => v ? v.toString().length : 0))
      );
    });

    // 시트 보호 설정
    worksheet.protect('password123', {
      selectLockedCells: true,
      selectUnlockedCells: true,
      formatCells: false,
      formatColumns: false,
      formatRows: false,
      insertColumns: false,
      insertRows: false,
      insertHyperlinks: false,
      deleteColumns: false,
      deleteRows: false,
      sort: false,
      autoFilter: false,
      pivotTables: false
    });

    return await this.workbook.xlsx.writeBuffer();
  }

  async generateTemplate2(reportData) {
    const worksheet = this.workbook.addWorksheet('특별기술지도결과보고서');
    
    // 제목 행
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = '건설재해예방전문지도기관 특별기술지도 결과보고서';
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    
    // 기본 정보 테이블
    this.addBasicInfoTable(worksheet, reportData, 'A3');
    
    // 특별점검 정보
    this.addSpecialInspectionInfo(worksheet, reportData, 'A8');
    
    // 발견사항 테이블
    this.addFindingsTable(worksheet, reportData.findings, 'A13');
    
    // 권고사항 테이블
    this.addRecommendationsTable(worksheet, reportData.recommendations, 'A20');
    
    // 긴급조치사항
    if (reportData.emergencyMeasures && reportData.emergencyMeasures.length > 0) {
      this.addEmergencyMeasures(worksheet, reportData.emergencyMeasures, 'A27');
    }
    
    // 후속조치사항
    if (reportData.followUpActions && reportData.followUpActions.length > 0) {
      this.addFollowUpActions(worksheet, reportData.followUpActions, 'A32');
    }

    return await this.workbook.xlsx.writeBuffer();
  }

  async generateTemplate3(reportData) {
    const worksheet = this.workbook.addWorksheet('정기기술지도결과보고서');
    
    // 제목 행
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = '건설재해예방전문지도기관 정기기술지도 결과보고서';
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    
    // 기본 정보 테이블
    this.addBasicInfoTable(worksheet, reportData, 'A3');
    
    // 점검 기간 및 범위
    this.addInspectionPeriodAndScope(worksheet, reportData, 'A8');
    
    // 발견사항 테이블
    this.addFindingsTable(worksheet, reportData.findings, 'A13');
    
    // 권고사항 테이블
    this.addRecommendationsTable(worksheet, reportData.recommendations, 'A20');
    
    // 준수상태
    this.addComplianceStatus(worksheet, reportData.complianceStatus, 'A27');
    
    // 다음 점검 예정일
    if (reportData.nextInspectionDate) {
      worksheet.getCell('A34').value = '다음 점검 예정일:';
      worksheet.getCell('B34').value = reportData.nextInspectionDate;
    }

    return await this.workbook.xlsx.writeBuffer();
  }

  addBasicInfoTable(worksheet, reportData, startCell) {
    const startRow = parseInt(startCell.match(/\d+/)[0]);
    const startCol = startCell.match(/[A-Z]+/)[0];
    
    const basicInfo = [
      ['프로젝트명', reportData.projectName],
      ['현장위치', reportData.projectLocation],
      ['시공업체', reportData.contractor],
      ['점검일자', reportData.inspectionDate],
      ['지도자명', reportData.inspector],
      ['보고서번호', reportData.reportNumber || ''],
      ['날씨', reportData.weather || ''],
      ['기온', reportData.temperature || '']
    ];

    basicInfo.forEach(([label, value], index) => {
      const row = startRow + index;
      
      // 라벨 셀
      const labelCell = worksheet.getCell(`${startCol}${row}`);
      labelCell.value = label;
      labelCell.font = { bold: true };
      labelCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6E6' }
      };
      
      // 값 셀
      const valueCell = worksheet.getCell(`${String.fromCharCode(startCol.charCodeAt(0) + 1)}${row}`);
      valueCell.value = value;
    });
  }

  addFindingsTable(worksheet, findings, startCell) {
    const startRow = parseInt(startCell.match(/\d+/)[0]);
    const startCol = startCell.match(/[A-Z]+/)[0];
    
    // 헤더
    const headers = ['구분', '발견사항', '위험도', '법적근거', '위치', '사진'];
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(`${String.fromCharCode(startCol.charCodeAt(0) + index)}${startRow}`);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9E1F2' }
      };
    });
    
    // 데이터
    findings.forEach((finding, index) => {
      const row = startRow + 1 + index;
      worksheet.getCell(`${startCol}${row}`).value = finding.category;
      worksheet.getCell(`${String.fromCharCode(startCol.charCodeAt(0) + 1)}${row}`).value = finding.description;
      worksheet.getCell(`${String.fromCharCode(startCol.charCodeAt(0) + 2)}${row}`).value = finding.severity;
      worksheet.getCell(`${String.fromCharCode(startCol.charCodeAt(0) + 3)}${row}`).value = finding.lawReference || '';
      worksheet.getCell(`${String.fromCharCode(startCol.charCodeAt(0) + 4)}${row}`).value = finding.location || '';
      worksheet.getCell(`${String.fromCharCode(startCol.charCodeAt(0) + 5)}${row}`).value = finding.photoUrls ? '있음' : '없음';
    });
  }

  addRecommendationsTable(worksheet, recommendations, startCell) {
    const startRow = parseInt(startCell.match(/\d+/)[0]);
    const startCol = startCell.match(/[A-Z]+/)[0];
    
    // 헤더
    const headers = ['권고사항', '우선순위', '담당자', '완료예정일', '상태'];
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(`${String.fromCharCode(startCol.charCodeAt(0) + index)}${startRow}`);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9E1F2' }
      };
    });
    
    // 데이터
    recommendations.forEach((rec, index) => {
      const row = startRow + 1 + index;
      worksheet.getCell(`${startCol}${row}`).value = rec.description;
      worksheet.getCell(`${String.fromCharCode(startCol.charCodeAt(0) + 1)}${row}`).value = rec.priority;
      worksheet.getCell(`${String.fromCharCode(startCol.charCodeAt(0) + 2)}${row}`).value = rec.responsible || '';
      worksheet.getCell(`${String.fromCharCode(startCol.charCodeAt(0) + 3)}${row}`).value = rec.dueDate || '';
      worksheet.getCell(`${String.fromCharCode(startCol.charCodeAt(0) + 4)}${row}`).value = rec.status;
    });
  }

  addRiskAssessment(worksheet, riskAssessment, startCell) {
    const startRow = parseInt(startCell.match(/\d+/)[0]);
    const startCol = startCell.match(/[A-Z]+/)[0];
    
    worksheet.getCell(`${startCol}${startRow}`).value = '전체 위험도:';
    worksheet.getCell(`${startCol}${startRow}`).font = { bold: true };
    worksheet.getCell(`${String.fromCharCode(startCol.charCodeAt(0) + 1)}${startRow}`).value = riskAssessment.overallRisk;
    
    if (riskAssessment.riskFactors && riskAssessment.riskFactors.length > 0) {
      worksheet.getCell(`${startCol}${startRow + 1}`).value = '주요 위험요인:';
      worksheet.getCell(`${startCol}${startRow + 1}`).font = { bold: true };
      worksheet.getCell(`${String.fromCharCode(startCol.charCodeAt(0) + 1)}${startRow + 1}`).value = riskAssessment.riskFactors.join(', ');
    }
    
    if (riskAssessment.improvementPlan) {
      worksheet.getCell(`${startCol}${startRow + 2}`).value = '개선계획:';
      worksheet.getCell(`${startCol}${startRow + 2}`).font = { bold: true };
      worksheet.getCell(`${String.fromCharCode(startCol.charCodeAt(0) + 1)}${startRow + 2}`).value = riskAssessment.improvementPlan;
    }
  }

  addSpecialInspectionInfo(worksheet, reportData, startCell) {
    const startRow = parseInt(startCell.match(/\d+/)[0]);
    const startCol = startCell.match(/[A-Z]+/)[0];
    
    worksheet.getCell(`${startCol}${startRow}`).value = '특별점검 유형:';
    worksheet.getCell(`${startCol}${startRow}`).font = { bold: true };
    worksheet.getCell(`${String.fromCharCode(startCol.charCodeAt(0) + 1)}${startRow}`).value = reportData.specialInspectionType;
    
    if (reportData.accidentDetails) {
      worksheet.getCell(`${startCol}${startRow + 1}`).value = '사고상세:';
      worksheet.getCell(`${startCol}${startRow + 1}`).font = { bold: true };
      worksheet.getCell(`${String.fromCharCode(startCol.charCodeAt(0) + 1)}${startRow + 1}`).value = 
        `${reportData.accidentDetails.type || ''} (${reportData.accidentDetails.date || ''})`;
    }
  }

  addInspectionPeriodAndScope(worksheet, reportData, startCell) {
    const startRow = parseInt(startCell.match(/\d+/)[0]);
    const startCol = startCell.match(/[A-Z]+/)[0];
    
    worksheet.getCell(`${startCol}${startRow}`).value = '점검기간:';
    worksheet.getCell(`${startCol}${startRow}`).font = { bold: true };
    worksheet.getCell(`${String.fromCharCode(startCol.charCodeAt(0) + 1)}${startRow}`).value = 
      `${reportData.inspectionPeriod.startDate} ~ ${reportData.inspectionPeriod.endDate}`;
    
    worksheet.getCell(`${startCol}${startRow + 1}`).value = '점검범위:';
    worksheet.getCell(`${startCol}${startRow + 1}`).font = { bold: true };
    worksheet.getCell(`${String.fromCharCode(startCol.charCodeAt(0) + 1)}${startRow + 1}`).value = 
      reportData.inspectionScope.join(', ');
  }

  addComplianceStatus(worksheet, complianceStatus, startCell) {
    const startRow = parseInt(startCell.match(/\d+/)[0]);
    const startCol = startCell.match(/[A-Z]+/)[0];
    
    worksheet.getCell(`${startCol}${startRow}`).value = '전체 준수상태:';
    worksheet.getCell(`${startCol}${startRow}`).font = { bold: true };
    worksheet.getCell(`${String.fromCharCode(startCol.charCodeAt(0) + 1)}${startRow}`).value = complianceStatus.overall;
    
    if (complianceStatus.details && complianceStatus.details.length > 0) {
      worksheet.getCell(`${startCol}${startRow + 1}`).value = '세부 준수상태:';
      worksheet.getCell(`${startCol}${startRow + 1}`).font = { bold: true };
      
      complianceStatus.details.forEach((detail, index) => {
        const row = startRow + 2 + index;
        worksheet.getCell(`${startCol}${row}`).value = detail.category;
        worksheet.getCell(`${String.fromCharCode(startCol.charCodeAt(0) + 1)}${row}`).value = detail.status;
        if (detail.notes) {
          worksheet.getCell(`${String.fromCharCode(startCol.charCodeAt(0) + 2)}${row}`).value = detail.notes;
        }
      });
    }
  }

  addEmergencyMeasures(worksheet, measures, startCell) {
    const startRow = parseInt(startCell.match(/\d+/)[0]);
    const startCol = startCell.match(/[A-Z]+/)[0];
    
    worksheet.getCell(`${startCol}${startRow}`).value = '긴급조치사항:';
    worksheet.getCell(`${startCol}${startRow}`).font = { bold: true };
    worksheet.getCell(`${startCol}${startRow}`).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFCCCC' }
    };
    
    measures.forEach((measure, index) => {
      const row = startRow + 1 + index;
      worksheet.getCell(`${startCol}${row}`).value = `${index + 1}. ${measure}`;
    });
  }

  addFollowUpActions(worksheet, actions, startCell) {
    const startRow = parseInt(startCell.match(/\d+/)[0]);
    const startCol = startCell.match(/[A-Z]+/)[0];
    
    worksheet.getCell(`${startCol}${startRow}`).value = '후속조치사항:';
    worksheet.getCell(`${startCol}${startRow}`).font = { bold: true };
    
    actions.forEach((action, index) => {
      const row = startRow + 1 + index;
      worksheet.getCell(`${startCol}${row}`).value = `${index + 1}. ${action}`;
    });
  }
}

module.exports = ExcelGenerator;
