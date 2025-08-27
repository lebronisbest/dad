import React from 'react';
import ReportFormView from './ReportFormView';
import { useReportForm } from '../../hooks/useReportForm';

const ReportFormContainer = ({ 
  projectId = null, 
  projectData = null, 
  onClose = () => {}, 
  onSuccess = () => {},
  isEmbedded = false 
}) => {
  const {
    // 상태
    formState,
    selectedProject,
    isLoadingProjects,
    errorModal,
    duplicateModal,
    
    // 액션
    updateFormData,
    updateArrayField,
    addArrayItem,
    removeArrayItem,
    handleSubmit,
    handleGeneratePDF,
    handlePreviewHTML,
    handleProjectChange,
    setSelectedProject,
    
    // 에러 처리
    handleError,
    closeErrorModal,
    handleRetry,
    handleOpenHTML,
    handleViewLogs,
    
    // 중복 처리
    closeDuplicateModal,
    handleOverwrite,
    
    loadDraftData,
    hasDraftData
  } = useReportForm(projectId, projectData);

  // ✅ 닫기 핸들러
  const handleClose = () => {
    if (isEmbedded) {
      onClose();
    } else {
      // 임베디드가 아닌 경우 보고서 목록으로 이동
      window.location.href = '/reports';
    }
  };

  return (
    <ReportFormView
      // 상태
      formState={formState}
      selectedProject={selectedProject}
      isLoadingProjects={isLoadingProjects}
      errorModal={errorModal}
      duplicateModal={duplicateModal}
      
      // 액션 핸들러
      updateFormData={updateFormData}
      updateArrayField={updateArrayField}
      addArrayItem={addArrayItem}
      removeArrayItem={removeArrayItem}
      handleProjectChange={handleProjectChange}
      handleSubmit={handleSubmit}
      handleGeneratePDF={handleGeneratePDF}
      handlePreviewHTML={handlePreviewHTML}
      
      // 에러 처리
      closeErrorModal={closeErrorModal}
      handleRetry={handleRetry}
      handleOpenHTML={handleOpenHTML}
      handleViewLogs={handleViewLogs}
      
      // 중복 처리
      closeDuplicateModal={closeDuplicateModal}
      handleOverwrite={handleOverwrite}
      
      // 임시 저장 관련
      loadDraftData={loadDraftData}
      hasDraftData={hasDraftData}
      
      // props
      isEmbedded={isEmbedded}
      onClose={handleClose}
    />
  );
};

export default ReportFormContainer;
