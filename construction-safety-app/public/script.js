// 전역 변수
let currentReportData = null;

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    loadTemplates();
});

// 폼 초기화
function initializeForm() {
    const form = document.getElementById('reportForm');
    const templateSelect = document.getElementById('templateId');
    
    // 템플릿 변경 이벤트
    templateSelect.addEventListener('change', function() {
        const selectedTemplate = this.value;
        toggleDetailedSection(selectedTemplate);
        toggleEmergencySection(selectedTemplate);
    });
    
    // 폼 제출 이벤트
    form.addEventListener('submit', handleFormSubmit);
}

// 템플릿 로드
async function loadTemplates() {
    try {
        const response = await fetch('/api/templates');
        const data = await response.json();
        
        if (data.success) {
            console.log('템플릿 로드 완료:', data.templates);
        }
    } catch (error) {
        console.error('템플릿 로드 오류:', error);
    }
}

// 상세 섹션 토글
function toggleDetailedSection(templateId) {
    const detailedSection = document.getElementById('detailedSection');
    if (templateId === 'template2') {
        detailedSection.style.display = 'block';
    } else {
        detailedSection.style.display = 'none';
    }
}

// 긴급 섹션 토글
function toggleEmergencySection(templateId) {
    const emergencySection = document.getElementById('emergencySection');
    if (templateId === 'template3') {
        emergencySection.style.display = 'block';
    } else {
        emergencySection.style.display = 'none';
    }
}

// 폼 제출 처리
async function handleFormSubmit(event) {
    event.preventDefault();
    
    try {
        // 폼 데이터 수집
        const formData = collectFormData();
        
        // 데이터 유효성 검사
        const validationResult = await validateReportData(formData);
        if (!validationResult.isValid) {
            displayValidationErrors(validationResult.errors);
            return;
        }
        
        // 보고서 생성
        const report = await generateReport(formData);
        
        // 결과 표시
        displayReportResult(report);
        
    } catch (error) {
        console.error('보고서 생성 오류:', error);
        showError('보고서 생성 중 오류가 발생했습니다: ' + error.message);
    }
}

// 폼 데이터 수집
function collectFormData() {
    const form = document.getElementById('reportForm');
    const formData = new FormData(form);
    
    const data = {
        templateId: formData.get('templateId'),
        projectName: formData.get('projectName'),
        projectLocation: formData.get('projectLocation'),
        projectType: formData.get('projectType'),
        contractor: formData.get('contractor'),
        guidanceDate: formData.get('guidanceDate'),
        guidanceType: formData.get('guidanceType'),
        inspector: formData.get('inspector'),
        guidanceDuration: formData.get('guidanceDuration'),
        findings: getArrayValues('findings[]'),
        recommendations: getArrayValues('recommendations[]'),
        responsiblePerson: formData.get('responsiblePerson'),
        emergencyLevel: formData.get('emergencyLevel'),
        immediateActions: getArrayValues('immediateActions[]')
    };
    
    return data;
}

// 배열 값 수집
function getArrayValues(name) {
    const elements = document.querySelectorAll(`[name="${name}"]`);
    const values = [];
    
    elements.forEach(element => {
        if (element.value.trim()) {
            values.push(element.value.trim());
        }
    });
    
    return values;
}

// 데이터 유효성 검사
async function validateReportData(data) {
    try {
        const response = await fetch('/api/report/validate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        return await response.json();
    } catch (error) {
        console.error('유효성 검사 오류:', error);
        return {
            isValid: false,
            errors: ['유효성 검사 중 오류가 발생했습니다']
        };
    }
}

// 유효성 검사 오류 표시
function displayValidationErrors(errors) {
    let errorMessage = '다음 오류를 수정해주세요:\n\n';
    errors.forEach(error => {
        errorMessage += `• ${error.message}\n`;
    });
    
    showError(errorMessage);
}

// 보고서 생성
async function generateReport(data) {
    try {
        const response = await fetch('/api/report/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentReportData = result.report;
            return result.report;
        } else {
            throw new Error(result.message || '보고서 생성에 실패했습니다');
        }
    } catch (error) {
        console.error('보고서 생성 오류:', error);
        throw error;
    }
}

// 보고서 결과 표시
function displayReportResult(report) {
    const resultContainer = document.getElementById('resultContainer');
    const reportResult = document.getElementById('reportResult');
    
    // 결과 HTML 생성
    const resultHTML = `
        <div class="report-summary">
            <h4>📋 보고서 요약</h4>
            <div class="summary-grid">
                <div class="summary-item">
                    <label>프로젝트명:</label>
                    <span>${report.projectName}</span>
                </div>
                <div class="summary-item">
                    <label>위치:</label>
                    <span>${report.projectLocation}</span>
                </div>
                <div class="summary-item">
                    <label>지도자:</label>
                    <span>${report.inspector}</span>
                </div>
                <div class="summary-item">
                    <label>지도일:</label>
                    <span>${report.guidanceDate}</span>
                </div>
            </div>
            <div class="findings-summary">
                <p><strong>발견사항:</strong> ${report.findings?.length || 0}건</p>
                <p><strong>권고사항:</strong> ${report.recommendations?.length || 0}건</p>
            </div>
        </div>
    `;
    
    reportResult.innerHTML = resultHTML;
    resultContainer.style.display = 'block';
    
    // 스크롤 이동
    resultContainer.scrollIntoView({ behavior: 'smooth' });
}

// PDF 다운로드
async function downloadPDF() {
    if (!currentReportData) {
        showError('다운로드할 보고서가 없습니다');
        return;
    }
    
    try {
        const response = await fetch('/api/export/pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                templateName: 'report_v1',
                data: currentReportData,
                quality: 'standard'
            })
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report_${Date.now()}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            throw new Error('PDF 생성에 실패했습니다');
        }
    } catch (error) {
        console.error('PDF 다운로드 오류:', error);
        showError('PDF 다운로드 중 오류가 발생했습니다: ' + error.message);
    }
}

// DOCX 다운로드
async function downloadDOCX() {
    if (!currentReportData) {
        showError('다운로드할 보고서가 없습니다');
        return;
    }
    
    try {
        const response = await fetch('/api/export/docx', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                templateName: 'report_v1',
                data: currentReportData,
                mode: 'fast',
                quality: 'standard'
            })
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report_${Date.now()}.docx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            throw new Error('DOCX 생성에 실패했습니다');
        }
    } catch (error) {
        console.error('DOCX 다운로드 오류:', error);
        showError('DOCX 다운로드 중 오류가 발생했습니다: ' + error.message);
    }
}

// 이미지 업로드
async function uploadImages(files) {
    try {
        const formData = new FormData();
        
        for (let i = 0; i < files.length; i++) {
            formData.append('images', files[i]);
        }
        
        const response = await fetch('/api/upload/images', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess(`${result.summary.success}개 이미지가 성공적으로 업로드되었습니다`);
            return result.results;
        } else {
            throw new Error(result.message || '이미지 업로드에 실패했습니다');
        }
    } catch (error) {
        console.error('이미지 업로드 오류:', error);
        showError('이미지 업로드 중 오류가 발생했습니다: ' + error.message);
        return [];
    }
}

// 발견사항 추가
function addFinding() {
    const container = document.getElementById('findingsContainer');
    const findingItem = document.createElement('div');
    findingItem.className = 'finding-item';
    findingItem.innerHTML = `
        <input type="text" name="findings[]" placeholder="발견사항을 입력하세요">
        <button type="button" class="remove-btn" onclick="removeFinding(this)">삭제</button>
    `;
    container.appendChild(findingItem);
}

// 발견사항 삭제
function removeFinding(button) {
    button.parentElement.remove();
}

// 권고사항 추가
function addRecommendation() {
    const container = document.getElementById('recommendationsContainer');
    const recommendationItem = document.createElement('div');
    recommendationItem.className = 'recommendation-item';
    recommendationItem.innerHTML = `
        <input type="text" name="recommendations[]" placeholder="권고사항을 입력하세요">
        <button type="button" class="remove-btn" onclick="removeRecommendation(this)">삭제</button>
    `;
    container.appendChild(recommendationItem);
}

// 권고사항 삭제
function removeRecommendation(button) {
    button.parentElement.remove();
}

// 즉시조치사항 추가
function addImmediateAction() {
    const container = document.getElementById('immediateActionsContainer');
    const actionItem = document.createElement('div');
    actionItem.className = 'action-item';
    actionItem.innerHTML = `
        <input type="text" name="immediateActions[]" placeholder="즉시조치사항을 입력하세요">
        <button type="button" class="remove-btn" onclick="removeAction(this)">삭제</button>
    `;
    container.appendChild(actionItem);
}

// 즉시조치사항 삭제
function removeAction(button) {
    button.parentElement.remove();
}

// 폼 초기화
function resetForm() {
    document.getElementById('reportForm').reset();
    document.getElementById('resultContainer').style.display = 'none';
    currentReportData = null;
    
    // 동적으로 추가된 항목들 제거
    const findingsContainer = document.getElementById('findingsContainer');
    const recommendationsContainer = document.getElementById('recommendationsContainer');
    const immediateActionsContainer = document.getElementById('immediateActionsContainer');
    
    // 첫 번째 항목만 남기고 나머지 제거
    while (findingsContainer.children.length > 1) {
        findingsContainer.removeChild(findingsContainer.lastChild);
    }
    while (recommendationsContainer.children.length > 1) {
        recommendationsContainer.removeChild(recommendationsContainer.lastChild);
    }
    while (immediateActionsContainer.children.length > 1) {
        immediateActionsContainer.removeChild(immediateActionsContainer.lastChild);
    }
    
    // 상세/긴급 섹션 숨기기
    document.getElementById('detailedSection').style.display = 'none';
    document.getElementById('emergencySection').style.display = 'none';
}

// 성공 메시지 표시
function showSuccess(message) {
    // 간단한 알림 표시 (실제 구현에서는 더 세련된 UI 사용)
    alert('✅ ' + message);
}

// 오류 메시지 표시
function showError(message) {
    // 간단한 알림 표시 (실제 구현에서는 더 세련된 UI 사용)
    alert('❌ ' + message);
}

// 이미지 드래그 앤 드롭 처리
function setupImageDragAndDrop() {
    const dropZone = document.createElement('div');
    dropZone.className = 'image-drop-zone';
    dropZone.innerHTML = `
        <div class="drop-zone-content">
            <p>📸 이미지를 여기에 드래그하여 업로드하세요</p>
            <p>또는 <input type="file" id="imageFileInput" multiple accept="image/*" style="display: none;">를 클릭하세요</p>
        </div>
    `;
    
    // 파일 입력 이벤트
    const fileInput = dropZone.querySelector('#imageFileInput');
    fileInput.addEventListener('change', handleImageFileSelect);
    
    // 드래그 앤 드롭 이벤트
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('drop', handleDrop);
    
    // 폼에 추가
    const form = document.getElementById('reportForm');
    form.appendChild(dropZone);
}

// 이미지 파일 선택 처리
function handleImageFileSelect(event) {
    const files = event.target.files;
    if (files.length > 0) {
        uploadImages(files);
    }
}

// 드래그 오버 처리
function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
}

// 드롭 처리
function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        uploadImages(files);
    }
}

// 페이지 로드 시 이미지 드래그 앤 드롭 설정
document.addEventListener('DOMContentLoaded', function() {
    setupImageDragAndDrop();
});
