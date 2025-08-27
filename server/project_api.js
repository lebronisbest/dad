import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// 프로젝트 목록 조회
router.get('/projects', async (req, res) => {
  console.log(`🔍 project_api: GET /projects 요청 처리 시작`);
  try {
    const projectsDir = path.join(__dirname, '..', 'projects');
    
    // 실제 프로젝트 폴더들 확인
    const items = await fs.readdir(projectsDir);
    const projects = [];
    
    for (const item of items) {
      // 폴더인지 확인하고 project.json이 있는지 체크
      if (!item.includes('.')) {
        try {
          const projectPath = path.join(projectsDir, item, 'project.json');
          const projectData = await fs.readFile(projectPath, 'utf8');
          const project = JSON.parse(projectData);
          
          // 폴더명을 ID로 사용 (기존 ID와 폴더명이 다른 경우)
          if (!project.id || project.id !== item) {
            project.id = item;
          }
          
          projects.push(project);
        } catch (error) {
          console.log(`프로젝트 ${item} 로드 실패:`, error.message);
        }
      }
    }
    
    console.log(`✅ project_api: 프로젝트 목록 조회 완료 - ${projects.length}개`);
    res.json({
      ok: true,
      data: projects  // 배열 형태로 반환
    });
  } catch (error) {
    console.error('❌ project_api: 프로젝트 목록 조회 오류:', error);
    res.status(500).json({
      ok: false,
      error: '프로젝트 목록을 불러올 수 없습니다.'
    });
  }
});

// 특정 프로젝트 조회
router.get('/projects/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const projectPath = path.join(__dirname, '..', 'projects', projectId, 'project.json');
    const projectData = await fs.readFile(projectPath, 'utf8');
    const project = JSON.parse(projectData);
    
    res.json({
      ok: true,
      data: project
    });
  } catch (error) {
    console.error('프로젝트 조회 오류:', error);
    res.status(500).json({
      ok: false,
      error: '프로젝트를 불러올 수 없습니다.'
    });
  }
});

// 프로젝트의 보고서 목록 조회
router.get('/projects/:projectId/reports', async (req, res) => {
  try {
    const { projectId } = req.params;
    const reportsDir = path.join(__dirname, '..', 'projects', projectId, 'reports');
    
    // reports 폴더가 존재하는지 확인
    try {
      await fs.access(reportsDir);
    } catch (error) {
      // 폴더가 없으면 빈 배열 반환
      console.log(` reports 폴더가 존재하지 않음: ${projectId}`);
      return res.json({
        ok: true,
        data: []
      });
    }
    
    const files = await fs.readdir(reportsDir);
    const reports = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const reportPath = path.join(reportsDir, file);
          const reportData = await fs.readFile(reportPath, 'utf8');
          const report = JSON.parse(reportData);
          reports.push(report);
        } catch (error) {
          console.log(`⚠️ 보고서 파일 읽기 실패: ${file}`, error.message);
        }
      }
    }
    
    // 생성일 기준으로 정렬 (최신순)
    reports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    res.json({
      ok: true,
      data: reports
    });
  } catch (error) {
    console.error('보고서 목록 조회 오류:', error);
    res.status(500).json({
      ok: false,
      error: '보고서 목록을 불러올 수 없습니다.'
    });
  }
});

// 특정 보고서 조회
router.get('/projects/:projectId/reports/:reportId', async (req, res) => {
  try {
    const { projectId, reportId } = req.params;
    const reportPath = path.join(__dirname, '..', 'projects', projectId, 'reports', `${reportId}.json`);
    const reportData = await fs.readFile(reportPath, 'utf8');
    const report = JSON.parse(reportData);
    
    res.json({
      ok: true,
      data: report
    });
  } catch (error) {
    console.error('보고서 조회 오류:', error);
    res.status(500).json({
      ok: false,
      error: '보고서를 불러올 수 없습니다.'
    });
  }
});

export default router;
