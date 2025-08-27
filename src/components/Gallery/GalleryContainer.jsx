import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Paper, Alert, CircularProgress } from '@mui/material';
import { loadGalleryImages, filterImages, sortImages } from '../../utils/galleryUtils';
import ImageList from './ImageList';
import GalleryHeader from './GalleryHeader';
import ImageModal from './ImageModal';

const GalleryContainer = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 검색 및 필터링 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('grid');
  
  // 모달 상태
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await loadGalleryImages();
        
        if (result.success) {
          setImages(result.images);
        } else {
          setError(result.error || '이미지를 불러오는데 실패했습니다.');
        }
      } catch (err) {
        setError('이미지 로딩 중 오류가 발생했습니다: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  // 필터링 및 정렬된 이미지 계산
  const filteredAndSortedImages = useMemo(() => {
    let filtered = filterImages(images, searchTerm, filters);
    return sortImages(filtered, sortBy, sortOrder);
  }, [images, searchTerm, filters, sortBy, sortOrder]);

  // 현재 선택된 이미지의 인덱스
  const currentImageIndex = useMemo(() => {
    if (!selectedImage) return -1;
    return filteredAndSortedImages.findIndex(img => img.id === selectedImage.id);
  }, [selectedImage, filteredAndSortedImages]);

  // 이미지 클릭 핸들러
  const handleImageClick = (image) => {
    setSelectedImage(image);
    setModalOpen(true);
  };

  // 이미지 다운로드 핸들러
  const handleImageDownload = (image) => {
    // TODO: 실제 다운로드 기능 구현
    console.log('Download image:', image);
    
    // 임시 다운로드 시뮬레이션
    const link = document.createElement('a');
    link.href = image.src;
    link.download = image.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 모달 닫기 핸들러
  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedImage(null);
  };

  // 이미지 네비게이션 핸들러
  const handleImageNavigate = (direction) => {
    if (currentImageIndex === -1) return;

    let newIndex;
    if (direction === 'prev') {
      newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : filteredAndSortedImages.length - 1;
    } else {
      newIndex = currentImageIndex < filteredAndSortedImages.length - 1 ? currentImageIndex + 1 : 0;
    }

    setSelectedImage(filteredAndSortedImages[newIndex]);
  };

  // 정렬 변경 핸들러
  const handleSortChange = (key, value) => {
    setSortBy(key);
    setSortOrder(value);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 4, mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          📸 사진첩
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          프로젝트 관련 이미지들을 관리하고 보고서에 삽입할 수 있습니다.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          현재 {images.length}개의 이미지가 있습니다
        </Typography>
      </Paper>

      {/* 갤러리 헤더 */}
      <GalleryHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFiltersChange={setFilters}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalImages={images.length}
        filteredCount={filteredAndSortedImages.length}
      />

      {/* 이미지 목록 */}
      <ImageList 
        images={filteredAndSortedImages} 
        loading={loading} 
        error={error} 
        onImageClick={handleImageClick}
        onDownload={handleImageDownload}
      />

      {/* 이미지 모달 */}
      <ImageModal
        open={modalOpen}
        image={selectedImage}
        onClose={handleModalClose}
        onDownload={handleImageDownload}
        onNavigate={handleImageNavigate}
        hasNext={currentImageIndex < filteredAndSortedImages.length - 1}
        hasPrev={currentImageIndex > 0}
      />
    </Box>
  );
};

export default GalleryContainer;
