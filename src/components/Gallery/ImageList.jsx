import React from 'react';
import { 
  Box, 
  Grid,
  Skeleton,
  Typography
} from '@mui/material';
import { 
  Image as ImageIcon 
} from '@mui/icons-material';
import ImageCard from './ImageCard';

const ImageList = ({ images, loading, error, onImageClick, onDownload }) => {
  if (loading) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
          <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={item}>
            <Box sx={{ height: 320 }}>
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
              <Box sx={{ p: 2 }}>
                <Skeleton variant="text" width="80%" height={24} />
                <Skeleton variant="text" width="60%" height={20} />
                <Skeleton variant="text" width="70%" height={20} />
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="error" gutterBottom>
          이미지를 불러오는 중 오류가 발생했습니다
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error}
        </Typography>
      </Box>
    );
  }

  if (!images || images.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <ImageIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          이미지가 없습니다
        </Typography>
        <Typography variant="body2" color="text.secondary">
          갤러리에 이미지를 추가해보세요
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {images.map((image) => (
        <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={image.id}>
          <ImageCard 
            image={image}
            onImageClick={onImageClick}
            onDownload={onDownload}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default ImageList;
