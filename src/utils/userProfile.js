// 사용자 프로필 정보 관리
const USER_PROFILE_KEY = 'safety_report_user_profile';

export const defaultUserProfile = {
  organization: '',      // 지도기관명 (myorg.name)
  phone: '',            // 지도 기관 연락처 (myorg.phone)
  inspector: '',        // 지도자명 (myorg.inspector)
  openai_api_key: '',   // OpenAI API 키
  lastUpdated: null
};

// 사용자 프로필 정보 가져오기
export const getUserProfile = () => {
  try {
    const stored = localStorage.getItem(USER_PROFILE_KEY);
    if (stored) {
      const profile = JSON.parse(stored);
      return {
        ...defaultUserProfile,
        ...profile
      };
    }
  } catch (error) {
    console.error('사용자 프로필 로드 오류:', error);
  }
  return { ...defaultUserProfile };
};

// 사용자 프로필 정보 저장
export const saveUserProfile = (profile) => {
  try {
    const profileToSave = {
      ...profile,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profileToSave));
    return true;
  } catch (error) {
    console.error('사용자 프로필 저장 오류:', error);
    return false;
  }
};

// 사용자 프로필 정보 업데이트
export const updateUserProfile = (updates) => {
  const currentProfile = getUserProfile();
  const updatedProfile = { ...currentProfile, ...updates };
  return saveUserProfile(updatedProfile);
};

// 사용자 프로필 정보 초기화
export const resetUserProfile = () => {
  try {
    localStorage.removeItem(USER_PROFILE_KEY);
    return true;
  } catch (error) {
    console.error('사용자 프로필 초기화 오류:', error);
    return false;
  }
};

// 보고서 데이터에 사용자 정보 프리필
export const prefillReportWithUserProfile = (reportData) => {
  try {
    // reportData가 유효한지 확인
    if (!reportData || typeof reportData !== 'object') {
      console.warn('prefillReportWithUserProfile: 유효하지 않은 reportData');
      return reportData || {};
    }

    const userProfile = getUserProfile();
    
    // org 객체가 존재하는지 확인하고 안전하게 처리 (본사 정보)
    const safeOrg = reportData.org || {};
    
    // myorg 객체가 존재하는지 확인하고 안전하게 처리 (지도 기관 정보)
    const safeMyorg = reportData.myorg || {};
    
    return {
      ...reportData,
      org: {
        ...safeOrg,
        name: safeOrg.name || '', // 본사 회사명
        phone: safeOrg.phone || '', // 본사 연락처
        address: safeOrg.address || '' // 본사 주소
      },
      myorg: {
        ...safeMyorg,
        name: safeMyorg.name || userProfile.organization || '', // 지도 기관명
        phone: safeMyorg.phone || userProfile.phone || '', // 지도 기관 연락처
        inspector: safeMyorg.inspector || userProfile.inspector || '' // 지도자명
      }
    };
  } catch (error) {
    console.error('prefillReportWithUserProfile 오류:', error);
    return reportData || {}; // 오류 발생 시 원본 데이터 반환
  }
};

// API 키 유효성 검사
export const validateApiKey = (apiKey) => {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  
  // OpenAI API 키 형식 검사 (sk-로 시작하는지)
  return apiKey.trim().startsWith('sk-');
};

// API 키 마스킹 (보안을 위해 일부만 표시)
export const maskApiKey = (apiKey) => {
  if (!apiKey || apiKey.length < 8) {
    return '***';
  }
  
  return `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
};
