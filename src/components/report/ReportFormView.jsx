import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Alert
} from '@mui/material';
import ProjectSelector from './sections/ProjectSelector';
import BasicInfoFields from './sections/BasicInfoFields';
import InspectionPlan from './sections/InspectionPlan';
import HazardMatrix from './sections/HazardMatrix';
import WorkStatus from './sections/WorkStatus';
import Attachments from './sections/Attachments';
import SignatureBar from './sections/SignatureBar';
import ErrorModal from './modals/ErrorModal';
import DuplicateModal from './modals/DuplicateModal';

const ReportFormView = ({
  // 상태
  formState,
  selectedProject,
  isLoadingProjects,
  errorModal,
  duplicateModal,
  
  // 액션 핸들러
  updateFormData,
  updateArrayField,
  addArrayItem,
  removeArrayItem,
  handleProjectChange,
  handleSubmit,
  handleGeneratePDF,
  handlePreviewHTML,
  
  // 에러 처리
  closeErrorModal,
  handleRetry,
  handleOpenHTML,
  handleViewLogs,
  
  // 중복 처리
  closeDuplicateModal,
  handleOverwrite,
  
  // 임시 저장 관련
  loadDraftData,
  hasDraftData,
  
  // props
  isEmbedded = false,
  onClose
}) => {
  const { formData, errors, isSubmitting, isPreviewLoading, isPdfLoading, success } = formState;

  // 임시 저장 핸들러 (로컬 스토리지)
  const handleSave = () => {
    localStorage.setItem('reportForm_draft', JSON.stringify(formData));
    // 성공 메시지 표시 (실제로는 토스트나 스낵바 사용 권장)
    alert('임시 저장되었습니다.');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom align="center">
          기술지도결과보고서
        </Typography>
        
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          안전관리 및 기술지도 결과를 체계적으로 기록하고 관리합니다
        </Typography>

        {/* 프로젝트 선택기 */}
        <ProjectSelector
          selectedProject={selectedProject}
          onProjectChange={handleProjectChange}
          isLoadingProjects={isLoadingProjects}
          isEmbedded={isEmbedded}
        />

        {/* 기본 정보 필드 */}
        <BasicInfoFields
          formData={formData}
          errors={errors}
          onFieldChange={updateFormData}
          isEmbedded={isEmbedded}
        />

        {/* 지도 계획 및 이전 지도 사항 */}
        <InspectionPlan
          formData={formData}
          errors={errors}
          onFieldChange={updateFormData}
          onArrayItemAdd={addArrayItem}
          onArrayItemRemove={removeArrayItem}
          isEmbedded={isEmbedded}
        />

        {/* 위험 요소 및 위험성 평가 */}
        <HazardMatrix
          formData={formData}
          errors={errors}
          onFieldChange={updateFormData}
          onArrayItemAdd={addArrayItem}
          onArrayItemRemove={removeArrayItem}
          isEmbedded={isEmbedded}
        />

        {/* 작업 현황 및 계획 */}
        <WorkStatus
          formData={formData}
          errors={errors}
          onFieldChange={updateFormData}
          onArrayItemAdd={addArrayItem}
          onArrayItemRemove={removeArrayItem}
          isEmbedded={isEmbedded}
        />

        {/* 첨부 파일 및 통지 방법 */}
        <Attachments
          formData={formData}
          errors={errors}
          onFieldChange={updateFormData}
          onArrayItemAdd={addArrayItem}
          onArrayItemRemove={removeArrayItem}
          isEmbedded={isEmbedded}
        />

        {/* 서명 및 액션 바 */}
        <SignatureBar
          isSubmitting={isSubmitting}
          isPreviewLoading={isPreviewLoading}
          isPdfLoading={isPdfLoading}
          success={success}
          onSave={handleSave}
          onPreview={handlePreviewHTML}
          onGeneratePDF={handleGeneratePDF}
          onSubmit={handleSubmit}
          loadDraftData={loadDraftData}
          hasDraftData={hasDraftData}
          disabled={isEmbedded}
        />

        {/* 에러 모달 */}
        <ErrorModal
          open={errorModal.open}
          error={errorModal.error}
          showDiagnostics={errorModal.showDiagnostics}
          onClose={closeErrorModal}
          onRetry={handleRetry}
          onOpenHTML={handleOpenHTML}
          onViewLogs={handleViewLogs}
        />

        {/* 중복 확인 모달 */}
        <DuplicateModal
          open={duplicateModal.open}
          fileName={duplicateModal.fileName}
          existingPath={duplicateModal.existingPath}
          message={duplicateModal.message}
          onClose={closeDuplicateModal}
          onOverwrite={handleOverwrite}
          isSubmitting={isSubmitting}
        />
      </Paper>
    </Container>
  );
};

export default ReportFormView;
