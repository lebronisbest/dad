import React, { useState } from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Fade
} from '@mui/material';
import {
  InsertDriveFile as FileIcon,
  ZoomIn as ZoomInIcon,
  Download as DownloadIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const ImageCard = ({ image, onImageClick, onDownload }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleCardClick = () => {
    if (onImageClick) {
      onImageClick(image);
    }
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    if (onDownload) {
      onDownload(image);
    }
  };

  const handleInfoClick = (e) => {
    e.stopPropagation();
    // TODO: 이미지 상세 정보 모달 표시
    console.log('Image info:', image);
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
          '& .image-actions': {
            opacity: 1,
            transform: 'translateY(0)'
          }
        }
      }}
      onClick={handleCardClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* 이미지 영역 */}
      <Box sx={{ position: 'relative', height: 200 }}>
        {!imageError ? (
          <CardMedia
            component="img"
            height="200"
            image={image.thumbnail || image.src}
            alt={image.name}
            sx={{
              objectFit: 'cover',
              backgroundColor: 'grey.100',
              transition: 'transform 0.3s ease-in-out',
              transform: imageLoaded ? 'scale(1)' : 'scale(1.05)',
              filter: imageLoaded ? 'none' : 'blur(2px)'
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        ) : (
          <Box
            sx={{
              height: 200,
              backgroundColor: 'grey.100',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column'
            }}
          >
            <FileIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
            <Typography variant="body2" color="grey.500">
              이미지 로드 실패
            </Typography>
          </Box>
        )}

        {/* 이미지 액션 버튼들 */}
        <Fade in={showActions}>
          <Box
            className="image-actions"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              opacity: 0,
              transform: 'translateY(-10px)',
              transition: 'all 0.3s ease-in-out'
            }}
          >
            <Tooltip title="확대 보기" placement="left">
              <IconButton
                size="small"
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 1)'
                  }
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <ZoomInIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="다운로드" placement="left">
              <IconButton
                size="small"
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 1)'
                  }
                }}
                onClick={handleDownload}
              >
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="상세 정보" placement="left">
              <IconButton
                size="small"
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 1)'
                  }
                }}
                onClick={handleInfoClick}
              >
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Fade>

        {/* 파일 형식 배지 */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8
          }}
        >
          <Chip
            label={image.type?.split('/')[1]?.toUpperCase() || 'IMAGE'}
            size="small"
            variant="filled"
            sx={{
              fontSize: '0.7rem',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              fontWeight: 'bold'
            }}
          />
        </Box>

        {/* 로딩 오버레이 */}
        {!imageLoaded && !imageError && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography variant="body2" color="text.secondary">
              로딩 중...
            </Typography>
          </Box>
        )}
      </Box>

      {/* 카드 내용 */}
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
        <Typography
          variant="subtitle2"
          component="h3"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            mb: 1
          }}
        >
          {image.displayName || image.name}
        </Typography>

        <Box sx={{ mt: 'auto' }}>
          {/* 파일 크기 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              크기
            </Typography>
            <Typography variant="caption" color="text.primary" fontWeight="medium">
              {image.formattedSize}
            </Typography>
          </Box>

          {/* 생성일 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              생성일
            </Typography>
            <Typography variant="caption" color="text.primary">
              {image.formattedDate}
            </Typography>
          </Box>

          {/* 해상도 */}
          {image.width && image.height && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                해상도
              </Typography>
              <Typography variant="caption" color="text.primary">
                {image.width} × {image.height}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default ImageCard;
