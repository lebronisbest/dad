import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Key as KeyIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { getUserProfile, saveUserProfile, resetUserProfile, validateApiKey, maskApiKey } from '../utils/userProfile';

const AnimatedCard = motion(Card);

function UserProfile() {
  const [profile, setProfile] = useState({
    organization: '',
    inspector: '',
    contact: '',
    openai_api_key: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 컴포넌트 마운트 시 저장된 프로필 정보 로드
  useEffect(() => {
    const savedProfile = getUserProfile();
    setProfile(savedProfile);
  }, []);

  // 입력 필드 변경 처리
  const handleInputChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 편집 모드 토글
  const toggleEdit = () => {
    if (isEditing) {
      // 편집 취소 시 원래 값으로 복원
      const savedProfile = getUserProfile();
      setProfile(savedProfile);
    }
    setIsEditing(!isEditing);
  };

  // 프로필 저장
  const handleSave = () => {
              if (!profile.organization.trim() || !profile.inspector.trim() || !profile.openai_api_key.trim()) {
            setErrorMessage('지도기관명, 지도자명, OpenAI API 키는 필수 입력 항목입니다.');
            setShowError(true);
            return;
          }
          
          // API 키 유효성 검사
          if (!validateApiKey(profile.openai_api_key)) {
            setErrorMessage('올바른 OpenAI API 키 형식이 아닙니다. sk-로 시작하는 키를 입력해주세요.');
            setShowError(true);
            return;
          }

    const success = saveUserProfile(profile);
    if (success) {
      setShowSuccess(true);
      setIsEditing(false);
    } else {
      setErrorMessage('프로필 저장에 실패했습니다.');
      setShowError(true);
    }
  };

  // 프로필 초기화
  const handleReset = () => {
    if (window.confirm('저장된 프로필 정보를 모두 삭제하시겠습니까?')) {
      const success = resetUserProfile();
      if (success) {
        setProfile({
          organization: '',
          inspector: '',
          contact: ''
        });
        setIsEditing(false);
        setShowSuccess(true);
      } else {
        setErrorMessage('프로필 초기화에 실패했습니다.');
        setShowError(true);
      }
    }
  };

  // 입력 필드 렌더링
  const renderInputField = (field, label, icon, placeholder, required = false) => (
    <TextField
      fullWidth
      label={label}
      value={profile[field]}
      onChange={(e) => handleInputChange(field, e.target.value)}
      disabled={!isEditing}
      required={required}
      placeholder={placeholder}
      variant="outlined"
      size="medium"
      sx={{
        mb: 2,
        '& .MuiOutlinedInput-root': {
          '&.Mui-disabled': {
            backgroundColor: 'action.hover'
          }
        }
      }}
      InputProps={{
        startAdornment: icon
      }}
    />
  );

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <AnimatedCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        elevation={2}
      >
        <CardContent sx={{ p: 4 }}>
          {/* 헤더 */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <PersonIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                내 정보 관리
              </Typography>
              <Typography variant="body1" color="text.secondary">
                지도기관 정보를 입력하면 보고서 작성 시 자동으로 적용됩니다
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* 프로필 정보 입력 폼 */}
          <Box sx={{ mb: 4 }}>
            {renderInputField(
              'organization',
              '지도기관명',
              <BusinessIcon sx={{ color: 'action.active', mr: 1 }} />,
              '예: 건설재해예방전문지도기관',
              true
            )}
            
            {renderInputField(
              'inspector',
              '지도자명',
              <PersonIcon sx={{ color: 'action.active', mr: 1 }} />,
              '예: 김안전',
              true
            )}
            
                                {renderInputField(
                      'contact',
                      '연락처',
                      <PhoneIcon sx={{ color: 'action.active', mr: 1 }} />,
                      '예: 02-1234-5678 또는 010-1234-5678'
                    )}
                    
                    {/* API 키 렌더링 */}
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <KeyIcon color="primary" />
                      OpenAI API 키 설정
                    </Typography>
                    
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        <strong>API 키가 필요한 이유:</strong> 안전보고서 PDF 생성을 위해 OpenAI의 AI 서비스가 필요합니다.
                      </Typography>
                    </Alert>
                    
                    <TextField
                      fullWidth
                      label="OpenAI API 키"
                      type="password"
                      value={profile.openai_api_key}
                      onChange={(e) => handleInputChange('openai_api_key', e.target.value)}
                      disabled={!isEditing}
                      placeholder="sk-로 시작하는 API 키를 입력하세요"
                      helperText={
                        isEditing 
                          ? "OpenAI 웹사이트(https://platform.openai.com/api-keys)에서 API 키를 발급받아 입력하세요"
                          : maskApiKey(profile.openai_api_key)
                      }
                      sx={{ mb: 2 }}
                    />
                    
                    {!profile.openai_api_key && (
                      <Alert severity="warning" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          <strong>API 키를 설정하지 않으면 PDF 생성이 불가능합니다.</strong>
                          <br />
                          1. <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI 웹사이트</a>에서 계정 생성
                          <br />
                          2. API 키 발급 (무료 크레딧 제공)
                          <br />
                          3. 위 필드에 API 키 입력 후 저장
                        </Typography>
                      </Alert>
                    )}
                    
                    {profile.openai_api_key && !validateApiKey(profile.openai_api_key) && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          유효하지 않은 API 키 형식입니다. sk-로 시작하는 올바른 API 키를 입력해주세요.
                        </Typography>
                      </Alert>
                    )}
          </Box>

          {/* 액션 버튼들 */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {isEditing ? (
              <>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  size="large"
                  sx={{ minWidth: 120 }}
                >
                  저장
                </Button>
                <Button
                  variant="outlined"
                  onClick={toggleEdit}
                  size="large"
                  sx={{ minWidth: 120 }}
                >
                  취소
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                onClick={toggleEdit}
                size="large"
                sx={{ minWidth: 120 }}
              >
                편집
              </Button>
            )}
            
            <Tooltip title="프로필 정보 초기화">
              <Button
                variant="outlined"
                color="error"
                startIcon={<RefreshIcon />}
                onClick={handleReset}
                size="large"
                sx={{ minWidth: 120 }}
              >
                초기화
              </Button>
            </Tooltip>
          </Box>

          {/* 정보 안내 */}
          <Box sx={{ mt: 4, p: 3, bgcolor: 'info.50', borderRadius: 2, border: '1px solid', borderColor: 'info.200' }}>
            <Typography variant="h6" color="info.main" gutterBottom>
              💡 사용법 안내
            </Typography>
                              <Typography variant="body2" color="info.700">
                    • 지도기관명, 지도자명, OpenAI API 키는 필수 입력 항목입니다.<br/>
                    • OpenAI API 키는 sk-...로 시작하는 형식입니다.<br/>
                    • 입력한 정보는 로컬에 저장되어 브라우저를 닫아도 유지됩니다.<br/>
                    • 보고서 작성 시 자동으로 지도기관 정보가 프리필됩니다.<br/>
                    • 언제든지 편집 버튼을 클릭하여 정보를 수정할 수 있습니다.
                  </Typography>
          </Box>
        </CardContent>
      </AnimatedCard>

      {/* 성공 알림 */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowSuccess(false)} severity="success" sx={{ width: '100%' }}>
          프로필 정보가 성공적으로 저장되었습니다!
        </Alert>
      </Snackbar>

      {/* 오류 알림 */}
      <Snackbar
        open={showError}
        autoHideDuration={4000}
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowError(false)} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default UserProfile;
