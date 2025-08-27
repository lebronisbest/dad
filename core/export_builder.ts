/**
 * 내보내기용 DTO 빌더
 * 입력 데이터를 PDF 렌더링용 DTO로 변환
 */

import { InputDTO, ExportReportDTO, WorkContext } from './types.js';
import { sanitizeHtmlFields } from './sanitizer.js';
import { 
  normalizeReportDTO, 
  normalizePrevGuidance, 
  normalizeFutureWork, 
  normalizeHazards 
} from './normalize.js';
import { processLogoImage, processPhotoImages } from './image_processor.js';

/**
 * 내보내기용 DTO 빌더
 * @param input - 사용자 입력 데이터
 * @returns 내보내기용 DTO
 */
export function buildExportDTO(input: InputDTO): ExportReportDTO {
  if (!input || typeof input !== 'object') {
    throw new Error('입력 데이터는 객체여야 합니다');
  }
  
  // 1. 기본 정규화
  const normalized = normalizeReportDTO(input);
  
  // 2. HTML 필드 정제 (법령 마커 제거)
  const sanitized = sanitizeHtmlFields(normalized);
  
  // 3. 이미지 처리 (data URI 변환)
  const withImages = processImages(sanitized);
  
  // 4. 스키마 정규화
  const withNormalizedSchema = normalizeSchemaFields(withImages);
  
  // 5. 기본값 설정 (undefined.visit 방지)
  const withDefaults = setDefaultValues(withNormalizedSchema);
  
  return withDefaults;
}

/**
 * 이미지 처리 (로고, 사진)
 * @param dto - 처리할 DTO
 * @returns 이미지가 처리된 DTO
 */
function processImages(dto: any): any {
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
 * @param dto - 정규화할 DTO
 * @returns 정규화된 DTO
 */
function normalizeSchemaFields(dto: any): any {
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
 * @param dto - 기본값을 설정할 DTO
 * @returns 기본값이 설정된 DTO
 */
function setDefaultValues(dto: any): any {
  const withDefaults = { ...dto };
  
  // 필수 객체 기본값
  withDefaults.site = withDefaults.site || {};
  withDefaults.org = withDefaults.org || {};
  withDefaults.visit = withDefaults.visit || {};
  
  // 배열 기본값
  withDefaults.measures = Array.isArray(withDefaults.measures) ? withDefaults.measures : [];
  withDefaults.photos = Array.isArray(withDefaults.photos) ? withDefaults.photos : [];
  withDefaults.sections = Array.isArray(withDefaults.sections) ? withDefaults.sections : [];
  withDefaults.previous_guidance = Array.isArray(withDefaults.previous_guidance) ? withDefaults.previous_guidance : [];
  withDefaults.future_work = Array.isArray(withDefaults.future_work) ? withDefaults.future_work : [];
  withDefaults.hazards = Array.isArray(withDefaults.hazards) ? withDefaults.hazards : [];
  withDefaults.support = Array.isArray(withDefaults.support) ? withDefaults.support : [];
  
  // 필수 필드 기본값
  withDefaults.site.name = withDefaults.site.name || '현장명 미입력';
  withDefaults.org.name = withDefaults.org.name || '조직명 미입력';
  withDefaults.inspector = withDefaults.inspector || '점검자명 미입력';
  withDefaults.round = typeof withDefaults.round === 'number' ? withDefaults.round : 1;
  withDefaults.round_total = typeof withDefaults.round_total === 'number' ? withDefaults.round_total : 1;
  withDefaults.visit.date = withDefaults.visit.date || new Date().toISOString().split('T')[0];
  
  // 진행률 기본값
  if (withDefaults.progress && typeof withDefaults.progress.percent !== 'number') {
    withDefaults.progress.percent = 0;
  }
  
  return withDefaults;
}

/**
 * DTO 검증 (내보내기 전 최종 검증)
 * @param dto - 검증할 DTO
 * @returns 검증 결과
 */
export function validateExportDTO(dto: ExportReportDTO): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 필수 필드 검증
  if (!dto.site?.name) errors.push('현장명은 필수입니다');
  if (!dto.org?.name) errors.push('조직명은 필수입니다');
  if (!dto.inspector) errors.push('점검자명은 필수입니다');
  if (!dto.visit?.date) errors.push('점검일자는 필수입니다');
  
  // 타입 검증
  if (typeof dto.round !== 'number' || dto.round < 1) {
    errors.push('차수는 1 이상의 숫자여야 합니다');
  }
  
  if (typeof dto.round_total !== 'number' || dto.round_total < 1) {
    errors.push('총 차수는 1 이상의 숫자여야 합니다');
  }
  
  if (dto.round > dto.round_total) {
    errors.push('차수는 총 차수보다 클 수 없습니다');
  }
  
  // 진행률 검증
  if (dto.progress?.percent !== undefined) {
    const percent = dto.progress.percent;
    if (percent < 0 || percent > 100) {
      errors.push('진행률은 0-100 범위여야 합니다');
    }
  }
  
  // 이미지 검증
  if (Array.isArray(dto.photos)) {
    dto.photos.forEach((photo, index) => {
      if (photo.url && !photo.url.startsWith('data:') && !photo.url.startsWith('http')) {
        errors.push(`사진 ${index + 1}의 URL이 유효하지 않습니다`);
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * DTO 정리 (불필요한 필드 제거)
 * @param dto - 정리할 DTO
 * @returns 정리된 DTO
 */
export function cleanExportDTO(dto: ExportReportDTO): ExportReportDTO {
  const cleaned = { ...dto };
  
  // PDF에 불필요한 필드 제거
  const fieldsToRemove = [
    'external',
    'citations',
    'law_references',
    'temp_data',
    'debug_info',
    'internal_notes'
  ];
  
  fieldsToRemove.forEach(field => {
    if (cleaned[field] !== undefined) {
      delete cleaned[field];
    }
  });
  
  // 빈 배열/객체 정리
  Object.keys(cleaned).forEach(key => {
    if (Array.isArray(cleaned[key]) && cleaned[key].length === 0) {
      delete cleaned[key];
    }
    if (cleaned[key] && typeof cleaned[key] === 'object' && 
        Object.keys(cleaned[key]).length === 0) {
      delete cleaned[key];
    }
  });
  
  return cleaned;
}
