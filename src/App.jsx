import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { theme } from './theme';
import AppLayout from './components/Layout/AppLayout';
import RepositoryHomeContainer from './components/Repository/RepositoryHomeContainer';
import ProjectDetailContainer from './components/Repository/ProjectDetailContainer';
import AdvancedProjectManager from './components/Projects/AdvancedProjectManager';
import ScheduleManager from './components/Schedule/ScheduleManager';
import GalleryContainer from './components/Gallery/GalleryContainer';
import UserProfile from './components/UserProfile';
import FloatingChatbot from './components/FloatingChatbot';
import { ProjectProvider } from './contexts/ProjectContext';

// ✅ 보고서 관련 컴포넌트들 - 올바른 경로로 수정
import ReportListContainer from './components/reports/ReportListContainer';
import ReportFormContainer from './components/report/ReportFormContainer';

// 에러 바운더리 컴포넌트
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('에러 바운더리에서 오류 발생:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>오류가 발생했습니다</h2>
          <p>페이지를 새로고침하거나 잠시 후 다시 시도해주세요.</p>
          <button onClick={() => window.location.reload()}>
            페이지 새로고침
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <ProjectProvider>
            <Router>
              <div className="App">
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<Navigate to="/projects" replace />} />
                    <Route path="/projects" element={<RepositoryHomeContainer />} />
                    <Route path="/projects/advanced" element={<AdvancedProjectManager />} />
                    <Route path="/projects/:projectId" element={<ProjectDetailContainer />} />
                    <Route path="/schedule" element={<ScheduleManager />} />
                    <Route path="/gallery" element={<GalleryContainer />} />
                    <Route path="/profile" element={<UserProfile />} />
                    {/* ✅ 보고서 관련 라우트 추가 */}
                    <Route path="/reports" element={<ReportListContainer />} />
                    <Route path="/reports/new" element={<ReportFormContainer />} />
                    <Route path="/reports/:reportId" element={<ReportFormContainer />} />
                    <Route path="/reports/:reportId/edit" element={<ReportFormContainer />} />
                  </Routes>
                </AppLayout>
                <FloatingChatbot />
              </div>
            </Router>
          </ProjectProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
