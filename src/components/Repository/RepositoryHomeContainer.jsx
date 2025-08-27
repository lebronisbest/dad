import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RepositoryHome from './RepositoryHome';
import { apiProjectStorage } from '../../utils/fileStorage';

const RepositoryHomeContainer = () => {
  const navigate = useNavigate();
  const [recentProjects, setRecentProjects] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [statistics, setStatistics] = useState({
    totalProjects: 0,
    totalReports: 0,
    activeProjects: 0,
    totalBackups: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 프로젝트 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 최근 프로젝트 5개 로드 (fileStorage 사용)
        const allProjects = await apiProjectStorage.getAllProjects();
        
        if (allProjects && Array.isArray(allProjects)) {
          // 최근 5개 프로젝트 선택
          const recent = allProjects.slice(0, 5);
          setRecentProjects(recent);
          
          setStatistics(prev => ({
            ...prev,
            totalProjects: allProjects.length,
            activeProjects: allProjects.filter(p => p.status === 'active').length
          }));
        } else {
          console.error('프로젝트 데이터 형식 오류:', allProjects);
          setError('프로젝트 데이터 형식이 올바르지 않습니다.');
        }

        // TODO: 보고서 데이터 로드 (reportService 구현 후)
        // 현재는 빈 배열로 설정
        setRecentReports([]);
        setStatistics(prev => ({
          ...prev,
          totalReports: 0,
          totalBackups: 0
        }));

      } catch (err) {
        console.error('데이터 로드 오류:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // 이벤트 핸들러들
  const handleNewProject = () => {
    navigate('/projects/advanced');
  };

  const handleViewAllProjects = () => {
    navigate('/projects');
  };

  const handleViewAllReports = () => {
    navigate('/reports');
  };

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        데이터를 불러오는 중...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
        오류: {error}
      </div>
    );
  }

  return (
    <RepositoryHome
      recentProjects={recentProjects}
      recentReports={recentReports}
      statistics={statistics}
      onNewProject={handleNewProject}
      onViewAllProjects={handleViewAllProjects}
      onViewAllReports={handleViewAllReports}
      disabled={false}
    />
  );
};

export default RepositoryHomeContainer;
