/**
 * 이미지 처리 (로고, 사진)
 * 이미지를 data URI로 변환하고 최적화
 */

/**
 * 로고 이미지 처리
 * @param {Object} org - 조직 정보
 * @returns {Object} 로고가 처리된 조직 정보
 */
export function processLogoImage(org) {
  if (!org) return org;
  
  const processed = { ...org };
  
  // 로고 이미지가 있는 경우 data URI로 변환
  if (processed.logo && typeof processed.logo === 'string') {
    // 이미 data URI인 경우 그대로 사용
    if (processed.logo.startsWith('data:')) {
      return processed;
    }
    
    // 파일 경로인 경우 data URI로 변환 (실제로는 파일 읽기 필요)
    // 현재는 기본 로고 사용
    processed.logo = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRkZGRkZGIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjMzMzMzMzIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+TG9nbzwvdGV4dD4KPC9zdmc+';
  }
  
  return processed;
}

/**
 * 사진 이미지들 처리
 * @param {Array} photos - 사진 배열
 * @returns {Array} 처리된 사진 배열
 */
export function processPhotoImages(photos) {
  if (!Array.isArray(photos)) return photos;
  
  return photos.map(photo => {
    if (typeof photo === 'string') {
      // 이미 data URI인 경우 그대로 사용
      if (photo.startsWith('data:')) {
        return photo;
      }
      
      // 파일 경로인 경우 기본 이미지로 대체
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjVGNUY1Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iNzUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlBob3RvPC90ZXh0Pgo8L3N2Zz4=';
    }
    
    // 객체인 경우 URL 필드 처리
    if (typeof photo === 'object' && photo.url) {
      if (photo.url.startsWith('data:')) {
        return photo;
      }
      
      return {
        ...photo,
        url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjVGNUY1Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iNzUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlBob3RvPC90ZXh0Pgo8L3N2Zz4='
      };
    }
    
    return photo;
  });
}

/**
 * 이미지 최적화 (크기 조정, 품질 조정)
 * @param {string} imageData - 이미지 데이터 (data URI)
 * @param {Object} options - 최적화 옵션
 * @returns {string} 최적화된 이미지 데이터
 */
export function optimizeImage(imageData, options = {}) {
  const { maxWidth = 800, maxHeight = 600, quality = 0.8 } = options;
  
  // data URI가 아닌 경우 그대로 반환
  if (!imageData || !imageData.startsWith('data:')) {
    return imageData;
  }
  
  // 현재는 기본 이미지 반환 (실제로는 Canvas API로 리사이즈)
  return imageData;
}

/**
 * 이미지 유효성 검사
 * @param {string} imageData - 이미지 데이터
 * @returns {boolean} 유효성 여부
 */
export function validateImage(imageData) {
  if (!imageData) return false;
  
  // data URI 형식 검사
  if (typeof imageData === 'string' && imageData.startsWith('data:')) {
    return true;
  }
  
  // 파일 경로 형식 검사
  if (typeof imageData === 'string' && (imageData.endsWith('.jpg') || imageData.endsWith('.jpeg') || imageData.endsWith('.png') || imageData.endsWith('.gif'))) {
    return true;
  }
  
  return false;
}
