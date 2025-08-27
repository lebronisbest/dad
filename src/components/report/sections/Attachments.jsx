import React, { useRef } from 'react';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  Divider,
  Button,
  IconButton,
  Paper,
  Card,
  CardMedia,
  CardContent,
  CardActions
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  PhotoCamera as PhotoCameraIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';

const Attachments = ({ 
  formData, 
  errors, 
  onFieldChange,
  onArrayItemAdd,
  onArrayItemRemove,
  isEmbedded = false 
}) => {
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);

  const handleChange = (path, value) => {
    onFieldChange(path, value);
  };

  const handleAddPhoto = () => {
    if (photoInputRef.current) {
      photoInputRef.current.click();
    }
  };

  const handlePhotoUpload = (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newPhoto = {
            id: Date.now().toString(),
            url: e.target?.result,
            caption: '',
            timestamp: new Date().toISOString(),
            filename: file.name
          };
          onArrayItemAdd('photos', newPhoto);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemovePhoto = (index) => {
    onArrayItemRemove('photos', index);
  };

  const handlePhotoChange = (index, field, value) => {
    const updatedPhotos = [...formData.photos];
    updatedPhotos[index] = { ...updatedPhotos[index], [field]: value };
    onFieldChange('photos', updatedPhotos);
  };

  const handleNotificationChange = (method, checked) => {
    const updatedNotification = { ...formData.notification };
    updatedNotification[method] = checked;
    
    // 'other'가 체크 해제되면 other_method도 초기화
    if (method === 'other' && !checked) {
      updatedNotification.other_method = '';
    }
    
    onFieldChange('notification', updatedNotification);
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        첨부 파일 및 통지 방법
      </Typography>
      
      {/* 통지 방법 */}
      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, mb: 1 }}>
        통지 방법
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.notification.registered_mail}
                  onChange={(e) => handleNotificationChange('registered_mail', e.target.checked)}
                />
              }
              label="등기우편"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.notification.email}
                  onChange={(e) => handleNotificationChange('email', e.target.checked)}
                />
              }
              label="이메일"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.notification.mobile}
                  onChange={(e) => handleNotificationChange('mobile', e.target.checked)}
                />
              }
              label="휴대폰"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.notification.other}
                  onChange={(e) => handleNotificationChange('other', e.target.checked)}
                />
              }
              label="기타"
            />
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          {formData.notification.other && (
            <TextField
              fullWidth
              label="기타 통지 방법"
              value={formData.notification.other_method || ''}
              onChange={(e) => handleChange('notification.other_method', e.target.value)}
              placeholder="예: 팩스, 대면 등"
              multiline
              rows={3}
            />
          )}
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* 사진 첨부 */}
      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, mb: 1 }}>
        사진 첨부
      </Typography>
      
      {formData.photos && formData.photos.length > 0 ? (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {formData.photos.map((photo, index) => (
            <Grid item xs={12} sm={6} md={4} key={photo.id || index}>
              <Card sx={{ position: 'relative' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={photo.url}
                  alt={photo.caption || `사진 ${index + 1}`}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ p: 2 }}>
                  <TextField
                    fullWidth
                    label="설명"
                    value={photo.caption || ''}
                    onChange={(e) => handlePhotoChange(index, 'caption', e.target.value)}
                    size="small"
                    multiline
                    rows={2}
                  />
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    {photo.filename}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {new Date(photo.timestamp).toLocaleString()}
                  </Typography>
                </CardContent>
                <CardActions sx={{ p: 1, justifyContent: 'center' }}>
                  <IconButton
                    size="small"
                    onClick={() => handleRemovePhoto(index)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
          <PhotoCameraIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
          <Typography variant="body2">
            첨부된 사진이 없습니다.
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            사진을 추가하여 현장 상황을 기록하세요.
          </Typography>
        </Box>
      )}
      
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          startIcon={<PhotoCameraIcon />}
          onClick={handleAddPhoto}
          sx={{ minWidth: 120 }}
        >
          사진 추가
        </Button>
        
        <input
          ref={photoInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handlePhotoUpload}
          style={{ display: 'none' }}
        />
        
        <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
          지원 형식: JPG, PNG, GIF (최대 10MB)
        </Typography>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* 파일 첨부 안내 */}
      <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 1, border: '1px solid', borderColor: 'info.200' }}>
        <Typography variant="subtitle2" color="info.main" gutterBottom>
          📎 첨부 파일 안내
        </Typography>
        <Typography variant="body2" color="info.main">
          • <strong>사진</strong>: 현장 상황, 안전 상태, 작업 진행 상황 등을 기록하는 사진을 첨부하세요.<br/>
          • <strong>문서</strong>: 관련 서류, 도면, 매뉴얼 등을 첨부할 수 있습니다.<br/>
          • <strong>크기 제한</strong>: 개별 파일당 최대 10MB, 총 용량 제한 없음<br/>
          • <strong>권장 사항</strong>: 고해상도 사진으로 현장 상황을 명확하게 기록하세요.
        </Typography>
      </Box>
    </Box>
  );
};

export default Attachments;
