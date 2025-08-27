/**
 * HTML 필드 정제 (법령 마커 제거)
 */

/**
 * HTML 필드 정제
 * @param {Object} dto - 정제할 DTO
 * @returns {Object} 정제된 DTO
 */
export function sanitizeHtmlFields(dto) {
  const sanitized = { ...dto };
  
  // HTML 필드 정제
  if (sanitized.summary_html) {
    sanitized.summary_html = sanitizeHtml(sanitized.summary_html);
  }
  
  if (sanitized.measures) {
    sanitized.measures = sanitized.measures.map(measure => ({
      ...measure,
      detail_html: measure.detail_html ? sanitizeHtml(measure.detail_html) : measure.detail_html
    }));
  }
  
  if (sanitized.work?.status_html) {
    sanitized.work.status_html = sanitizeHtml(sanitized.work.status_html);
  }
  
  return sanitized;
}

/**
 * HTML 내용 정제
 * @param {string} html - 정제할 HTML
 * @returns {string} 정제된 HTML
 */
function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') {
    return html;
  }
  
  // 법령 마커 제거
  let sanitized = html
    .replace(/\[법령:.*?\]/g, '')
    .replace(/\[조항:.*?\]/g, '')
    .replace(/\[내용:.*?\]/g, '');
  
  // 연속된 공백 정리
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  return sanitized;
}
