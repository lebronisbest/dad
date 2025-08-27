import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Chip,
  Tooltip,
  Fade,
  Zoom
} from '@mui/material';
import {
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Download as DownloadIcon,
  Info as InfoIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon
} from '@mui/icons-material';

const ImageModal = ({ 
  open, 
  image, 
  onClose, 
  onDownload, 
  onNavigate, 
  hasNext, 
  hasPrev 
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // 모달이 열릴 때마다 줌과 팬 초기화
  useEffect(() => {
    if (open) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [open]);

  // 키보드 단축키 처리
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!open) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (hasPrev) {
            onNavigate('prev');
          }
          break;
        case 'ArrowRight':
          if (hasNext) {
            onNavigate('next');
          }
          break;
        case '+':
        case '=':
          e.preventDefault();
          setZoom(prev => Math.min(prev * 1.2, 5));
          break;
        case '-':
          e.preventDefault();
          setZoom(prev => Math.max(prev / 1.2, 0.1));
          break;
        case '0':
          e.preventDefault();
          setZoom(1);
          setPan({ x: 0, y: 0 });
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, hasPrev, hasNext, onClose, onNavigate]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.1));
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(image);
    }
  };

  const handleNavigate = (direction) => {
    if (onNavigate) {
      onNavigate(direction);
    }
  };

  if (!image) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          boxShadow: 'none',
          borderRadius: 0,
          height: '100vh',
          maxHeight: '100vh'
        }
      }}
    >
      <DialogContent sx={{ p: 0, position: 'relative', overflow: 'hidden' }}>
        {/* 상단 툴바 */}
        <Fade in={true}>
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)',
              p: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            {/* 왼쪽: 이미지 정보 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6" color="white" sx={{ fontWeight: 'bold' }}>
                {image.displayName || image.name}
              </Typography>
              <Chip
                label={image.type?.split('/')[1]?.toUpperCase() || 'IMAGE'}
                size="small"
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
            </Box>

            {/* 오른쪽: 액션 버튼들 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title="줌 인 (Ctrl + +)" placement="bottom">
                <IconButton
                  onClick={handleZoomIn}
                  sx={{ color: 'white', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                >
                  <ZoomInIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="줌 아웃 (Ctrl + -)" placement="bottom">
                <IconButton
                  onClick={handleZoomOut}
                  sx={{ color: 'white', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                >
                  <ZoomOutIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="원본 크기 (0)" placement="bottom">
                <IconButton
                  onClick={handleResetZoom}
                  sx={{ color: 'white', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                >
                  <ZoomIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="다운로드" placement="bottom">
                <IconButton
                  onClick={handleDownload}
                  sx={{ color: 'white', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                >
                  <DownloadIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="닫기 (Esc)" placement="bottom">
                <IconButton
                  onClick={onClose}
                  sx={{ color: 'white', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                >
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Fade>

        {/* 이미지 영역 */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
            userSelect: 'none'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            src={image.src}
            alt={image.name}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
            }}
            draggable={false}
          />
        </Box>

        {/* 하단 정보 */}
        <Fade in={true}>
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1,
              background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
              p: 2
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', gap: 3, color: 'white' }}>
                <Typography variant="body2">
                  크기: {image.formattedSize}
                </Typography>
                <Typography variant="body2">
                  생성일: {image.formattedDate}
                </Typography>
                {image.width && image.height && (
                  <Typography variant="body2">
                    해상도: {image.width} × {image.height}
                  </Typography>
                )}
                <Typography variant="body2">
                  줌: {Math.round(zoom * 100)}%
                </Typography>
              </Box>
            </Box>
          </Box>
        </Fade>

        {/* 네비게이션 버튼들 */}
        {hasPrev && (
          <Fade in={true}>
            <Tooltip title="이전 이미지 (←)" placement="top">
              <IconButton
                onClick={() => handleNavigate('prev')}
                sx={{
                  position: 'absolute',
                  left: 20,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'white',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)'
                  }
                }}
              >
                <PrevIcon />
              </IconButton>
            </Tooltip>
          </Fade>
        )}

        {hasNext && (
          <Fade in={true}>
            <Tooltip title="다음 이미지 (→)" placement="top">
              <IconButton
                onClick={() => handleNavigate('next')}
                sx={{
                  position: 'absolute',
                  right: 20,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'white',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)'
                  }
                }}
              >
                <NextIcon />
              </IconButton>
            </Tooltip>
          </Fade>
        )}

        {/* 줌 레벨 표시 */}
        <Fade in={zoom !== 1}>
          <Box
            sx={{
              position: 'absolute',
              right: 20,
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              px: 2,
              py: 1,
              borderRadius: 2,
              fontSize: '0.875rem',
              fontWeight: 'bold'
            }}
          >
            {Math.round(zoom * 100)}%
          </Box>
        </Fade>
      </DialogContent>
    </Dialog>
  );
};

export default ImageModal;
