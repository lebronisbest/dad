import { getProjectManager } from './core/project_manager.js';

async function testProjectManager() {
  try {
    console.log('🔍 프로젝트 매니저 테스트 시작...');
    
    const manager = getProjectManager();
    await manager.ensureInitialized();
    
    console.log('✅ 초기화 완료');
    
    const projects = await manager.getAllProjects();
    console.log(`📊 프로젝트 수: ${projects.length}`);
    
    if (projects.length > 0) {
      console.log('📁 프로젝트 목록:');
      projects.forEach((p, index) => {
        console.log(`  ${index + 1}. ${p.name} (ID: ${p.id}, folder: ${p.folder_name || 'N/A'})`);
      });
    } else {
      console.log('⚠️ 프로젝트가 없습니다.');
    }
    
    // findProject 함수 테스트
    if (projects.length > 0) {
      const firstProject = projects[0];
      console.log(`\n🔍 findProject() 함수 테스트: "${firstProject.name}"으로 검색`);
      
      const result = await manager.findProject(firstProject.name);
      if (result.project) {
        console.log(`✅ 검색 성공: ${result.project.name} (ID: ${result.actualProjectId})`);
      } else {
        console.log('❌ 검색 실패');
      }
    }
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    console.error(error.stack);
  }
}

testProjectManager();
