// 갤러리 이미지 관련 유틸리티 함수들

// 지원하는 이미지 형식
const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];

// 파일이 이미지인지 확인
export const isImageFile = (filename) => {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return SUPPORTED_FORMATS.includes(extension);
};

// 파일 크기를 읽기 쉬운 형태로 변환
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 파일 생성일을 읽기 쉬운 형태로 변환
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 이미지 메타데이터 추출
export const extractImageMetadata = (file) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight
      });
    };
    img.onerror = () => {
      resolve({
        width: 0,
        height: 0,
        aspectRatio: 1
      });
    };
    img.src = URL.createObjectURL(file);
  });
};

// 갤러리 이미지 목록 로딩 (현재는 목업 데이터)
export const loadGalleryImages = async () => {
  try {
    // TODO: 실제 API 호출로 대체
    // 현재는 목업 데이터를 반환하여 UI 테스트
    const mockImages = [
      {
        id: '1',
        name: 'construction_site_001.svg',
        src: '/placeholder-image-1.svg',
        size: 1024 * 1024, // 1MB
        createdAt: new Date('2024-01-15T10:30:00Z').toISOString(),
        type: 'image/svg+xml',
        width: 200,
        height: 200
      },
      {
        id: '2',
        name: 'safety_check_002.svg',
        src: '/placeholder-image-2.svg',
        size: 2.5 * 1024 * 1024, // 2.5MB
        createdAt: new Date('2024-01-16T14:20:00Z').toISOString(),
        type: 'image/svg+xml',
        width: 200,
        height: 200
      },
      {
        id: '3',
        name: 'equipment_inspection_003.svg',
        src: '/placeholder-image-3.svg',
        size: 800 * 1024, // 800KB
        createdAt: new Date('2024-01-17T09:15:00Z').toISOString(),
        type: 'image/svg+xml',
        width: 200,
        height: 200
      }
    ];

    // 실제 이미지 데이터로 변환
    const processedImages = mockImages.map(img => ({
      ...img,
      displayName: img.name.length > 25 ? img.name.substring(0, 22) + '...' : img.name,
      formattedSize: formatFileSize(img.size),
      formattedDate: formatDate(img.createdAt),
      thumbnail: img.src // 실제 구현시에는 썸네일 URL로 대체
    }));

    // 로딩 시뮬레이션 (실제 API 호출 시 제거)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { success: true, images: processedImages };
  } catch (error) {
    console.error('이미지 로딩 실패:', error);
    return { 
      success: false, 
      error: error.message,
      images: [] 
    };
  }
};

// 이미지 검색 및 필터링
export const filterImages = (images, searchTerm, filters = {}) => {
  let filtered = [...images];

  // 검색어 필터링
  if (searchTerm) {
    filtered = filtered.filter(img => 
      img.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      img.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // 파일 형식 필터링
  if (filters.format && filters.format !== 'all') {
    filtered = filtered.filter(img => {
      const extension = img.name.toLowerCase().substring(img.name.lastIndexOf('.'));
      return extension === filters.format;
    });
  }

  // 크기 범위 필터링
  if (filters.sizeRange && filters.sizeRange !== 'all') {
    filtered = filtered.filter(img => {
      const sizeMB = img.size / (1024 * 1024);
      switch (filters.sizeRange) {
        case 'small':
          return sizeMB < 1;
        case 'medium':
          return sizeMB >= 1 && sizeMB < 5;
        case 'large':
          return sizeMB >= 5;
        default:
          return true;
      }
    });
  }

  // 날짜 범위 필터링
  if (filters.dateRange && filters.dateRange !== 'all') {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    const yearStart = new Date(today.getFullYear(), 0, 1);

    filtered = filtered.filter(img => {
      const imgDate = new Date(img.createdAt);
      switch (filters.dateRange) {
        case 'today':
          return imgDate >= today;
        case 'week':
          return imgDate >= weekAgo;
        case 'month':
          return imgDate >= monthAgo;
        case 'year':
          return imgDate >= yearStart;
        default:
          return true;
      }
    });
  }

  return filtered;
};

// 이미지 정렬
export const sortImages = (images, sortBy = 'name', sortOrder = 'asc') => {
  const sorted = [...images];
  
  sorted.sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'size':
        aValue = a.size;
        bValue = b.size;
        break;
      case 'date':
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      default:
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
  
  return sorted;
};
