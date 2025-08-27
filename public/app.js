// 안전보고서 관리 시스템 JavaScript
class SafetyReportSystem {
    constructor() {
        this.conversationId = this.generateConversationId();
        this.chatHistory = [];
        this.reports = [];
        this.currentReportId = 1;
        this.initializeEventListeners();
        this.loadStoredData();
        this.refreshReportsTable();
    }

    // 대화 ID 생성
    generateConversationId() {
        return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // 이벤트 리스너 초기화
    initializeEventListeners() {
        // 폼 제출 이벤트
        const reportForm = document.getElementById('reportForm');
        if (reportForm) {
            reportForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // 챗봇 입력 이벤트
        const chatbotInput = document.getElementById('chatbotInput');
        if (chatbotInput) {
            chatbotInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendChatbotMessage();
                }
            });
        }

        // 페이지 로드 시 자동 저장
        window.addEventListener('beforeunload', () => this.saveData());
    }

    // 폼 제출 처리
    async handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = this.getFormData();
        if (!this.validateFormData(formData)) {
            this.showStatus('모든 필수 항목을 입력해주세요.', 'error');
            return;
        }

        this.showStatus('보고서 생성 중...', 'success');
        
        try {
            // 새 보고서 생성
            const newReport = {
                id: this.currentReportId++,
                ...formData,
                createdAt: new Date().toISOString(),
                status: '생성됨'
            };
            
            this.reports.push(newReport);
            this.saveReports();
            this.refreshReportsTable();
            
            this.showStatus('보고서가 성공적으로 생성되었습니다!', 'success');
            this.clearForm();
            
        } catch (error) {
            console.error('보고서 생성 오류:', error);
            this.showStatus('보고서 생성 중 오류가 발생했습니다.', 'error');
        }
    }

    // 폼 데이터 수집
    getFormData() {
        return {
            siteName: document.getElementById('siteName').value.trim(),
            siteAddress: document.getElementById('siteAddress').value.trim(),
            companyName: document.getElementById('companyName').value.trim(),
            inspectorName: document.getElementById('inspectorName').value.trim(),
            visitDate: document.getElementById('visitDate').value.trim(),
            round: document.getElementById('round').value,
            reportType: document.getElementById('reportType').value,
            description: document.getElementById('description').value.trim()
        };
    }

    // 폼 데이터 검증
    validateFormData(data) {
        return Object.values(data).every(value => value && value.trim() !== '');
    }

    // 폼 초기화
    clearForm() {
        document.getElementById('reportForm').reset();
        this.setCurrentDate();
    }

    // 임시 저장
    saveDraft() {
        const formData = this.getFormData();
        if (Object.values(formData).some(value => value && value.trim() !== '')) {
            localStorage.setItem('safetyReportDraft', JSON.stringify(formData));
            this.showStatus('임시저장되었습니다.', 'success');
        } else {
            this.showStatus('저장할 내용이 없습니다.', 'error');
        }
    }

    // 임시 저장된 데이터 로드
    loadDraft() {
        const draft = localStorage.getItem('safetyReportDraft');
        if (draft) {
            const formData = JSON.parse(draft);
            Object.keys(formData).forEach(key => {
                const element = document.getElementById(key);
                if (element && formData[key]) {
                    element.value = formData[key];
                }
            });
            this.showStatus('임시저장된 데이터를 불러왔습니다.', 'success');
        }
    }

    // 보고서 목록 새로고침
    refreshReportsTable() {
        const tbody = document.getElementById('reportsTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        
        if (this.reports.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: #7f8c8d;">등록된 보고서가 없습니다.</td></tr>';
            return;
        }

        this.reports.forEach(report => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${report.id}</td>
                <td>${report.siteName}</td>
                <td>${report.companyName}</td>
                <td>${report.visitDate}</td>
                <td>${report.round}차</td>
                <td>${this.getReportTypeName(report.reportType)}</td>
                <td><span class="status-badge ${report.status === '생성됨' ? 'success' : 'pending'}">${report.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn action-btn btn-success" onclick="safetyReportSystem.viewReport(${report.id})">👁️ 보기</button>
                        <button class="btn action-btn btn-warning" onclick="safetyReportSystem.editReport(${report.id})">✏️ 편집</button>
                        <button class="btn action-btn btn-danger" onclick="safetyReportSystem.deleteReport(${report.id})">🗑️ 삭제</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // 보고서 유형 이름 가져오기
    getReportTypeName(type) {
        const types = {
            'safety_inspection': '안전점검보고서',
            'incident_report': '사고보고서',
            'risk_assessment': '위험성평가보고서',
            'training_report': '안전교육보고서'
        };
        return types[type] || type;
    }

    // 보고서 보기
    viewReport(id) {
        const report = this.reports.find(r => r.id === id);
        if (report) {
            alert(`보고서 상세 정보:\n\n현장명: ${report.siteName}\n업체명: ${report.companyName}\n점검자: ${report.inspectorName}\n점검일자: ${report.visitDate}\n점검차수: ${report.round}차\n보고서 유형: ${this.getReportTypeName(report.reportType)}\n\n상세 설명:\n${report.description}`);
        }
    }

    // 보고서 편집
    editReport(id) {
        const report = this.reports.find(r => r.id === id);
        if (report) {
            document.getElementById('siteName').value = report.siteName;
            document.getElementById('siteAddress').value = report.siteAddress;
            document.getElementById('companyName').value = report.companyName;
            document.getElementById('inspectorName').value = report.inspectorName;
            document.getElementById('visitDate').value = report.visitDate;
            document.getElementById('round').value = report.round;
            document.getElementById('reportType').value = report.reportType;
            document.getElementById('description').value = report.description;
            
            this.showStatus('보고서를 편집 모드로 불러왔습니다.', 'success');
        }
    }

    // 보고서 삭제
    deleteReport(id) {
        if (confirm('정말로 이 보고서를 삭제하시겠습니까?')) {
            this.reports = this.reports.filter(r => r.id !== id);
            this.saveReports();
            this.refreshReportsTable();
            this.showStatus('보고서가 삭제되었습니다.', 'success');
        }
    }

    // 샘플 보고서 생성
    generateSampleReports() {
        const sampleReports = [
            {
                id: this.currentReportId++,
                siteName: '강남구 신축아파트',
                siteAddress: '서울시 강남구 테헤란로 123',
                companyName: 'ABC건설(주)',
                inspectorName: '김안전',
                visitDate: '24.12.19(목)',
                round: '1',
                reportType: 'safety_inspection',
                description: '1차 안전점검 완료. 전반적으로 안전관리가 잘 되고 있음.',
                createdAt: new Date().toISOString(),
                status: '생성됨'
            },
            {
                id: this.currentReportId++,
                siteName: '송파구 상업시설',
                siteAddress: '서울시 송파구 올림픽로 456',
                companyName: 'XYZ건설(주)',
                inspectorName: '이안전',
                visitDate: '24.12.18(수)',
                round: '2',
                reportType: 'incident_report',
                description: '작업 중 경미한 사고 발생. 안전교육 강화 필요.',
                createdAt: new Date().toISOString(),
                status: '생성됨'
            }
        ];
        
        this.reports.push(...sampleReports);
        this.saveReports();
        this.refreshReportsTable();
        this.showStatus('샘플 보고서가 생성되었습니다.', 'success');
    }

    // 챗봇 메시지 전송
    async sendChatbotMessage() {
        const input = document.getElementById('chatbotInput');
        const message = input.value.trim();
        
        if (!message) return;

        // 사용자 메시지 추가
        this.addChatbotMessage(message, 'user');
        input.value = '';

        try {
            // AI 응답 요청
            const response = await this.callChatAPI(message);
            this.addChatbotMessage(response, 'assistant');
            
        } catch (error) {
            console.error('채팅 API 오류:', error);
            this.addChatbotMessage('죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해주세요.', 'assistant');
        }
    }

    // 챗봇 메시지 추가
    addChatbotMessage(content, type) {
        const messages = document.getElementById('chatbotMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = content;
        
        messages.appendChild(messageDiv);
        messages.scrollTop = messages.scrollHeight;
        
        // 채팅 히스토리에 저장
        this.chatHistory.push({ content, type, timestamp: new Date().toISOString() });
    }

    // 채팅 API 호출
    async callChatAPI(message) {
        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    conversationId: this.conversationId,
                    message: message
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                return data.response;
            } else {
                throw new Error(data.error || '알 수 없는 오류가 발생했습니다.');
            }
            
        } catch (error) {
            console.error('API 호출 오류:', error);
            
            // 오프라인 모드: 간단한 응답 생성
            if (message.includes('보고서') || message.includes('생성')) {
                return this.generateOfflineResponse(message);
            } else {
                return '현재 서버에 연결할 수 없습니다. 오프라인 모드로 작동 중입니다.';
            }
        }
    }

    // 오프라인 응답 생성
    generateOfflineResponse(message) {
        const responses = [
            '오프라인 모드에서는 기본적인 안전보고서 템플릿만 제공할 수 있습니다.',
            '서버 연결이 복구되면 AI 기능을 정상적으로 사용할 수 있습니다.',
            '현재 입력된 정보를 바탕으로 기본 보고서를 생성할 수 있습니다.'
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    // 상태 메시지 표시
    showStatus(message, type = 'success') {
        const statusDiv = document.getElementById('status');
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        statusDiv.style.display = 'block';
        
        // 3초 후 자동 숨김
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }

    // 데이터 저장
    saveData() {
        const data = {
            conversationId: this.conversationId,
            chatHistory: this.chatHistory,
            reports: this.reports,
            currentReportId: this.currentReportId
        };
        
        localStorage.setItem('safetyReportData', JSON.stringify(data));
    }

    // 저장된 데이터 로드
    loadStoredData() {
        try {
            const stored = localStorage.getItem('safetyReportData');
            if (stored) {
                const data = JSON.parse(stored);
                
                if (data.conversationId) {
                    this.conversationId = data.conversationId;
                }
                
                if (data.chatHistory && data.chatHistory.length > 0) {
                    this.chatHistory = data.chatHistory;
                }
                
                if (data.reports && data.reports.length > 0) {
                    this.reports = data.reports;
                }
                
                if (data.currentReportId) {
                    this.currentReportId = data.currentReportId;
                }
            }
        } catch (error) {
            console.error('저장된 데이터 로드 오류:', error);
        }
    }

    // 보고서 저장
    saveReports() {
        localStorage.setItem('safetyReports', JSON.stringify(this.reports));
    }

    // 보고서 로드
    loadReports() {
        try {
            const stored = localStorage.getItem('safetyReports');
            if (stored) {
                this.reports = JSON.parse(stored);
            }
        } catch (error) {
            console.error('보고서 로드 오류:', error);
        }
    }

    // 현재 날짜 자동 입력
    setCurrentDate() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        
        const formattedDate = `${year}-${month}-${day}`;
        document.getElementById('visitDate').value = formattedDate;
    }
}

// 전역 함수들
function clearForm() {
    safetyReportSystem.clearForm();
}

function saveDraft() {
    safetyReportSystem.saveDraft();
}

function generateSampleReports() {
    safetyReportSystem.generateSampleReports();
}

function refreshReports() {
    safetyReportSystem.refreshReportsTable();
}

function toggleChatbot() {
    const popup = document.getElementById('chatbotPopup');
    const toggle = document.querySelector('.chatbot-toggle');
    
    if (popup.style.display === 'none' || !popup.style.display) {
        popup.style.display = 'flex';
        toggle.style.display = 'none';
    } else {
        popup.style.display = 'none';
        toggle.style.display = 'block';
    }
}

function sendChatbotMessage() {
    safetyReportSystem.sendChatbotMessage();
}

// 페이지 로드 시 시스템 초기화
let safetyReportSystem;

document.addEventListener('DOMContentLoaded', () => {
    safetyReportSystem = new SafetyReportSystem();
    
    // 현재 날짜 자동 입력
    safetyReportSystem.setCurrentDate();
    
    console.log('🏗️ 안전보고서 관리 시스템이 초기화되었습니다.');
});

// 키보드 단축키
document.addEventListener('keydown', (e) => {
    // Ctrl + Enter: 보고서 생성
    if (e.ctrlKey && e.key === 'Enter') {
        document.getElementById('reportForm').dispatchEvent(new Event('submit'));
    }
    
    // Ctrl + S: 임시저장
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        safetyReportSystem.saveDraft();
    }
    
    // Ctrl + L: 임시저장 데이터 로드
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        safetyReportSystem.loadDraft();
    }
});
