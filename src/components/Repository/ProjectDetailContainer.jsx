import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectDetail } from './hooks/useProjectDetail';
import ProjectDetailView from './ProjectDetailView';

const ProjectDetailContainer = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  // useProjectDetail 훅을 사용하여 상태와 로직 관리
  const {
    // 프로젝트 상세 상태
    project,
    isLoading,
    error,
    isEditing,
    hasUnsavedChanges,
    
    // 보고서 상태
    reports,
    isLoadingReports,
    reportsError,
    selectedReport,
    reportFilters,
    
    // 백업 상태
    backups,
    isLoadingBackups,
    backupsError,
    selectedBackup,
    isCreatingBackup,
    isRestoringBackup,
    createBackupError,
    restoreBackupError,
    
    // 액션 함수들
    fetchProjectDetail,
    fetchReports,
    fetchBackups,
    toggleEditMode,
    updateProjectInfo,
    updateReportFilters,
    selectReport,
    createBackup,
    restoreBackup,
    selectBackup,
    deleteProject,
    saveChanges,
    cancelChanges
  } = useProjectDetail(projectId);

  // 이벤트 핸들러들
  const handleEdit = () => {
    toggleEditMode();
  };

  const handleSave = async () => {
    const result = await saveChanges();
    if (result.success) {
      // 성공 시 프로젝트 정보 새로고침
      await fetchProjectDetail();
    }
  };

  const handleCancel = () => {
    cancelChanges();
  };

  const handleRefresh = () => {
    fetchProjectDetail();
    fetchReports();
    fetchBackups();
  };

  // 보고서 관련 핸들러
  const handleReportSelect = (report) => {
    selectReport(report);
  };

  const handleReportEdit = (report) => {
    // TODO: 보고서 편집 페이지로 이동
    console.log('보고서 편집:', report);
  };

  const handleReportDelete = async (reportId) => {
    // TODO: 보고서 삭제 확인 다이얼로그 및 삭제 로직
    console.log('보고서 삭제:', reportId);
  };

  const handleReportDownload = (report) => {
    // TODO: 보고서 다운로드 로직
    console.log('보고서 다운로드:', report);
  };

  const handleReportFiltersChange = (newFilters) => {
    updateReportFilters(newFilters);
    // 필터 변경 시 보고서 목록 새로고침
    fetchReports();
  };

  const handleReportFiltersClear = () => {
    updateReportFilters({});
    // 필터 초기화 시 보고서 목록 새로고침
    fetchReports();
  };

  // 백업 관련 핸들러
  const handleBackupCreate = async (description) => {
    const result = await createBackup(description);
    if (result.success) {
      // 성공 시 백업 목록 새로고침
      await fetchBackups();
    }
  };

  const handleBackupRestore = async (backupId) => {
    const result = await restoreBackup(backupId);
    if (result.success) {
      // 성공 시 프로젝트 정보 새로고침
      await fetchProjectDetail();
    }
  };

  const handleBackupDelete = async (backupId) => {
    // TODO: 백업 삭제 확인 다이얼로그 및 삭제 로직
    console.log('백업 삭제:', backupId);
  };

  const handleBackupDownload = (backup) => {
    // TODO: 백업 다운로드 로직
    console.log('백업 다운로드:', backup);
  };

  const handleBackupSelect = (backup) => {
    selectBackup(backup);
  };

  // 프로젝트 관련 핸들러
  const handleNewReport = () => {
    // ✅ 새 보고서 생성 페이지로 이동
    navigate('/reports/new');
  };

  const handleEditProject = () => {
    toggleEditMode();
  };

  const handleDeleteProject = async () => {
    if (window.confirm('정말로 이 프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        const result = await deleteProject();
        if (result.success) {
          alert(result.message);
          navigate('/projects'); // 프로젝트 목록으로 이동
        } else {
          alert(`삭제 실패: ${result.error}`);
        }
      } catch (error) {
        alert(`삭제 중 오류 발생: ${error.message}`);
      }
    }
  };

  const handleBackupProject = async () => {
    const result = await createBackup('수동 백업');
    if (result.success) {
      await fetchBackups();
    }
  };

  const handleRestoreProject = () => {
    // TODO: 백업 선택 및 복원 로직
    console.log('프로젝트 복원');
  };

  const handleExportProject = () => {
    // TODO: 프로젝트 내보내기 로직
    console.log('프로젝트 내보내기');
  };

  const handleImportProject = () => {
    // TODO: 프로젝트 가져오기 로직
    console.log('프로젝트 가져오기');
  };

  const handleShareProject = () => {
    // TODO: 프로젝트 공유 로직
    console.log('프로젝트 공유');
  };

  const handlePrintProject = () => {
    // TODO: 프로젝트 인쇄 로직
    console.log('프로젝트 인쇄');
  };

  const handleViewProject = () => {
    // 이미 프로젝트 상세 페이지에 있으므로 아무것도 하지 않음
    console.log('프로젝트 보기');
  };

  const handleProjectSettings = () => {
    // TODO: 프로젝트 설정 페이지로 이동
    console.log('프로젝트 설정');
  };

  // 프로젝트 ID가 없으면 에러 처리
  if (!projectId) {
    return (
      <div>
        <h2>프로젝트 ID가 필요합니다.</h2>
        <button onClick={() => navigate('/projects')}>
          프로젝트 목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <ProjectDetailView
      // 프로젝트 데이터
      project={project}
      isLoading={isLoading}
      error={error}
      
      // 편집 상태
      isEditing={isEditing}
      hasUnsavedChanges={hasUnsavedChanges}
      
      // 보고서 데이터
      reports={reports}
      isLoadingReports={isLoadingReports}
      reportsError={reportsError}
      selectedReport={selectedReport}
      reportFilters={reportFilters}
      
      // 백업 데이터
      backups={backups}
      isLoadingBackups={isLoadingBackups}
      backupsError={backupsError}
      selectedBackup={selectedBackup}
      isCreatingBackup={isCreatingBackup}
      isRestoringBackup={isRestoringBackup}
      createBackupError={createBackupError}
      restoreBackupError={restoreBackupError}
      
      // 이벤트 핸들러들
      onEdit={handleEdit}
      onSave={handleSave}
      onCancel={handleCancel}
      onRefresh={handleRefresh}
      onReportSelect={handleReportSelect}
      onReportEdit={handleReportEdit}
      onReportDelete={handleReportDelete}
      onReportDownload={handleReportDownload}
      onReportFiltersChange={handleReportFiltersChange}
      onReportFiltersClear={handleReportFiltersClear}
      onBackupCreate={handleBackupCreate}
      onBackupRestore={handleBackupRestore}
      onBackupDelete={handleBackupDelete}
      onBackupDownload={handleBackupDownload}
      onBackupSelect={handleBackupSelect}
      onNewReport={handleNewReport}
      onEditProject={handleEditProject}
      onDeleteProject={handleDeleteProject}
      onBackupProject={handleBackupProject}
      onRestoreProject={handleRestoreProject}
      onExportProject={handleExportProject}
      onImportProject={handleImportProject}
      onShareProject={handleShareProject}
      onPrintProject={handlePrintProject}
      onViewProject={handleViewProject}
      onProjectSettings={handleProjectSettings}
      
      disabled={isLoading || isCreatingBackup || isRestoringBackup}
    />
  );
};

export default ProjectDetailContainer;
