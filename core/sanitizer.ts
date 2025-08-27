/**
 * HTML 필드 정제 및 법령 마커 제거
 * PDF 렌더링 전 데이터 정제를 위한 모듈
 */

/**
 * 법령 마커 제거 (data-cite 속성 등)
 * @param html - 정제할 HTML 문자열
 * @returns 정제된 HTML 문자열
 */
export function stripLawMarkers(html: string = ''): string {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  return html
    // data-cite 속성을 가진 sup 태그 제거
    .replace(/\s*<sup[^>]*data-cite[^>]*>.*?<\/sup>/gi, '')
    
    // 법령 인용 관련 클래스 제거
    .replace(/\s*<span[^>]*class="[^"]*citation[^"]*"[^>]*>.*?<\/span>/gi, '')
    
    // 법령 관련 data 속성 제거
    .replace(/\s*data-law="[^"]*"/gi, '')
    .replace(/\s*data-article="[^"]*"/gi, '')
    
    // 빈 태그 정리
    .replace(/<[^\/>][^>]*><\/[^>]*>/g, '')
    
    // 연속 공백 정리
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * HTML 필드 정제 (DTO 전체에 적용)
 * @param dto - 정제할 DTO 객체
 * @returns 정제된 DTO 객체
 */
export function sanitizeHtmlFields(dto: any): any {
  if (!dto || typeof dto !== 'object') {
    return dto;
  }
  
  const sanitized = { ...dto };
  
  // 요약 HTML 정제
  if (sanitized.summary_html) {
    sanitized.summary_html = stripLawMarkers(sanitized.summary_html);
  }
  
  // 조치사항 HTML 정제
  if (Array.isArray(sanitized.measures)) {
    sanitized.measures = sanitized.measures.map(measure => {
      if (measure && typeof measure === 'object') {
        const cleanMeasure = { ...measure };
        if (cleanMeasure.detail_html) {
          cleanMeasure.detail_html = stripLawMarkers(cleanMeasure.detail_html);
        }
        return cleanMeasure;
      }
      return measure;
    });
  }
  
  // 작업 현황 HTML 정제
  if (sanitized.work?.status_html) {
    sanitized.work.status_html = stripLawMarkers(sanitized.work.status_html);
  }
  
  // 기타 HTML 필드들 정제
  const htmlFields = [
    'description_html',
    'notes_html',
    'content_html',
    'additional_notes_html'
  ];
  
  htmlFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = stripLawMarkers(sanitized[field]);
    }
  });
  
  // external.laws 필드 완전 제거 (PDF에 반영 금지)
  if (sanitized.external && sanitized.external.laws) {
    delete sanitized.external.laws;
  }
  
  // citations 필드 제거 (법령 인용 박스)
  if (sanitized.findings?.citations) {
    delete sanitized.findings.citations;
  }
  
  return sanitized;
}

/**
 * 안전한 HTML 문자열 검증
 * @param html - 검증할 HTML 문자열
 * @returns 검증 결과
 */
export function validateHtmlSafety(html: string): { safe: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (!html || typeof html !== 'string') {
    return { safe: true, issues: [] };
  }
  
  // 위험한 태그/속성 검사
  const dangerousPatterns = [
    /<script\b[^>]*>/gi,
    /<iframe\b[^>]*>/gi,
    /<object\b[^>]*>/gi,
    /<embed\b[^>]*>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data-cite\s*=/gi,
    /data-law\s*=/gi
  ];
  
  dangerousPatterns.forEach((pattern, index) => {
    if (pattern.test(html)) {
      const patternNames = [
        'script 태그',
        'iframe 태그',
        'object 태그',
        'embed 태그',
        'javascript: 프로토콜',
        '이벤트 핸들러',
        '법령 인용 속성',
        '법령 데이터 속성'
      ];
      issues.push(`${patternNames[index]}가 발견되었습니다`);
    }
  });
  
  return {
    safe: issues.length === 0,
    issues
  };
}

/**
 * HTML 내용 길이 제한
 * @param html - 제한할 HTML 문자열
 * @param maxLength - 최대 길이 (기본값: 10000)
 * @returns 제한된 HTML 문자열
 */
export function truncateHtml(html: string, maxLength: number = 10000): string {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  if (html.length <= maxLength) {
    return html;
  }
  
  // HTML 태그를 고려한 안전한 자르기
  const truncated = html.substring(0, maxLength);
  const lastTagIndex = truncated.lastIndexOf('<');
  
  if (lastTagIndex > maxLength * 0.8) {
    // 태그 중간에서 잘린 경우, 이전 완전한 태그까지 자르기
    return truncated.substring(0, lastTagIndex) + '...';
  }
  
  return truncated + '...';
}
