/**
 * 내보내기용 DTO 빌더
 * 입력 데이터를 PDF 렌더링용 DTO로 변환
 */

import { sanitizeHtmlFields } from './sanitizer.js';
import { 
  normalizeReportDTO, 
  normalizePrevGuidance, 
  normalizeFutureWork, 
  normalizeHazards,
  backfillRoundFields
} from './normalize.js';
import { processLogoImage, processPhotoImages } from './image_processor.js';

/**
 * 내보내기용 DTO 빌더
 * @param {Object} input - 사용자 입력 데이터
 * @returns {Object} 내보내기용 DTO
 */
export function buildExportDTO(input) {
  try {
    console.log('🔍 buildExportDTO 시작 - 입력:', Object.keys(input));
    console.log('🔍 buildExportDTO 입력값 상세:');
    console.log('  site.name:', input.site?.name, '(길이:', input.site?.name?.length, ')');
    console.log('  org.name:', input.org?.name, '(길이:', input.org?.name?.length, ')');
    console.log('  inspector:', input.inspector, '(길이:', input.inspector?.length, ')');
    
    if (!input || typeof input !== 'object') {
      throw new Error('입력 데이터는 객체여야 합니다');
    }
    
    // 1. 기본 정규화
    const normalized = normalizeReportDTO(input);
    console.log('✅ 1단계 정규화 완료:', Object.keys(normalized));
    
    // 2. 필드 백필 (visit.round|round_total)
    const backfilled = backfillRoundFields(normalized);
    console.log('✅ 2단계 필드 백필 완료:', Object.keys(backfilled));
    
    // 3. HTML 필드 정제 (법령 마커 제거)
    const sanitized = sanitizeHtmlFields(backfilled);
    console.log('✅ 3단계 HTML 정제 완료:', Object.keys(sanitized));
    
    // 4. 이미지 처리 (data URI 변환)
    const withImages = processImages(sanitized);
    console.log('✅ 4단계 이미지 처리 완료:', Object.keys(withImages));
    
    // 5. 스키마 정규화
    const withNormalizedSchema = normalizeSchemaFields(withImages);
    console.log('✅ 5단계 스키마 정규화 완료:', Object.keys(withNormalizedSchema));
    
    // 6. 기본값 설정 (undefined.visit 방지)
    const withDefaults = setDefaultValues(withNormalizedSchema, input);
    console.log('✅ 6단계 기본값 설정 완료:', Object.keys(withDefaults));
    
    return withDefaults;
  } catch (error) {
    console.error('❌ buildExportDTO 실패:', error);
    throw error;
  }
}

/**
 * 이미지 처리 (로고, 사진)
 * @param {Object} dto - 처리할 DTO
 * @returns {Object} 이미지가 처리된 DTO
 */
function processImages(dto) {
  const processed = { ...dto };
  
  // 로고 처리
  if (processed.org) {
    processed.org = processLogoImage(processed.org);
  }
  
  // 사진 처리
  if (Array.isArray(processed.photos)) {
    processed.photos = processPhotoImages(processed.photos);
  }
  
  return processed;
}

/**
 * 스키마 필드 정규화
 * @param {Object} dto - 정규화할 DTO
 * @returns {Object} 정규화된 DTO
 */
function normalizeSchemaFields(dto) {
  const normalized = { ...dto };
  
  // 이전 지도 이력 정규화
  if (dto.previous_guidance) {
    normalized.previous_guidance = normalizePrevGuidance(dto);
  }
  
  // 향후 작업 정규화
  if (dto.future_work) {
    normalized.future_work = normalizeFutureWork(dto);
  }
  
  // 위험요소 정규화
  if (dto.hazards) {
    normalized.hazards = normalizeHazards(dto);
  }
  
  return normalized;
}

/**
 * 기본값 설정 (undefined.visit 방지)
 * @param {Object} dto - 기본값을 설정할 DTO
 * @returns {Object} 기본값이 설정된 DTO
 */
function setDefaultValues(dto, originalInput) {
  const withDefaults = { ...dto };
  
  // 필수 객체 기본값 (객체가 없을 때만 생성)
  if (!withDefaults.site) withDefaults.site = {};
  if (!withDefaults.org) withDefaults.org = {};
  if (!withDefaults.visit) withDefaults.visit = {};
  
  // 필수 필드 기본값 (값이 없을 때만 설정)
  if (!withDefaults.site.name) withDefaults.site.name = '미지정현장';
  if (!withDefaults.org.name) withDefaults.org.name = '미지정조직';
  if (!withDefaults.inspector) withDefaults.inspector = '미지정점검자';
  if (!withDefaults.visit.date) {
    // ✅ 한국 시간대 기준 오늘 날짜
    const now = new Date();
    const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    withDefaults.visit.date = koreanTime.toISOString().split('T')[0];
  }
  
  // 디버깅: 실제 값 확인 (한글 인코딩 문제 진단)
  console.log('🔍 setDefaultValues 결과:');
  console.log('  site.name:', withDefaults.site.name, '(타입:', typeof withDefaults.site.name, ')');
  console.log('  org.name:', withDefaults.org.name, '(타입:', typeof withDefaults.org.name, ')');
  console.log('  inspector:', withDefaults.inspector, '(타입:', typeof withDefaults.inspector, ')');
  console.log('  visit.date:', withDefaults.visit.date, '(타입:', typeof withDefaults.visit.date, ')');
  
  // 원본 입력값과 비교
  console.log('🔍 원본 입력값 확인:');
  console.log('  originalInput.site.name:', originalInput.site?.name);
  console.log('  originalInput.org.name:', originalInput.org?.name);
  console.log('  originalInput.inspector:', originalInput.inspector);
  
  return withDefaults;
}

/**
 * DTO 검증
 * @param {Object} dto - 검증할 DTO
 * @returns {Object} 검증 결과
 */
export function validateExportDTO(dto) {
  const errors = [];
  
  // 필수 필드 검증
  if (!dto.site?.name) {
    errors.push('현장명은 필수입니다');
  }
  
  if (!dto.org?.name) {
    errors.push('조직명은 필수입니다');
  }
  
  if (!dto.inspector) {
    errors.push('점검자명은 필수입니다');
  }
  
  if (!dto.visit?.date) {
    errors.push('점검일은 필수입니다');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    score: errors.length === 0 ? 100 : Math.max(0, 100 - errors.length * 20)
  };
}

/**
 * DTO 정리 (민감한 정보 제거)
 * @param {Object} dto - 정리할 DTO
 * @returns {Object} 정리된 DTO
 */
export function cleanExportDTO(dto) {
  const cleaned = { ...dto };
  
  // 민감한 정보 제거
  if (cleaned.org?.registration_number) {
    delete cleaned.org.registration_number;
  }
  
  if (cleaned.org?.license_number) {
    delete cleaned.org.license_number;
  }
  
  return cleaned;
}
