/**
 * 기능 플래그 설정
 * PDF 생성과 법령 도구의 분리를 위한 설정
 */

export const features = {
  // 법령 도구 (챗봇/추천/QA 전용) - 유지
  lawTool: true,
  
  // PDF에 법령 반영 - 비활성화 (무한로딩 방지)
  lawRender: false,
  
  // PDF 생성 관련 설정
  pdf: {
    // 타임아웃 설정 (3초)
    lawToolTimeout: 3000,
    
    // 동시 생성 제한
    maxConcurrentGenerations: 1,
    
    // 외부 리소스 차단
    blockExternalResources: true,
    
    // 인라인 CSS 사용
    useInlineCSS: true
  },
  
  // 이미지 처리 설정
  images: {
    // 로고/사진을 data URI로 변환
    convertToDataUri: true,
    
    // 최대 이미지 크기 (KB)
    maxSize: 500
  }
};

export default features;
