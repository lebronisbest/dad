// normalize.js에서 재export
export { normalizeReportDTO } from './normalize.js';

// AJV 스키마 정의
export const ReportDTOSchema = {
  type: "object",
  required: ["site", "org", "inspector", "round", "round_total", "visit"],
  properties: {
    site: { 
      type: "object",
      required: ["name"],
      properties: {
        name: { type: "string", minLength: 1 },
        address: { type: "string" },
        phone: { type: "string" },
        email: { type: "string" }
      }
    },
    org: { 
      type: "object",
      required: ["name"],
      properties: {
        name: { type: "string", minLength: 1 },
        inspector: { type: "string", minLength: 1 },
        position: { type: "string" },
        phone: { type: "string" },
        email: { type: "string" }
      }
    },
    inspector: { type: "string", minLength: 1 },
    round: { type: "integer", minimum: 1 },
    round_total: { type: "integer", minimum: 1 },
    visit: {
      type: "object",
      required: ["date"],
      properties: { 
        date: { type: "string" }, 
        time: { type: "string" },
        purpose: { type: "string" }
      }
    },
    progress: {
      type: "object",
      properties: {
        percent: { type: "integer", minimum: 0, maximum: 100 }
      }
    },
    sections: { 
      type: "array", 
      items: { 
        type: "object",
        properties: {
          title: { type: "string" },
          items: { type: "array" }
        }
      } 
    }
  },
  additionalProperties: true
};

// 스키마 검증 함수
export function validateReportSchema(data, schema = ReportDTOSchema) {
  const errors = [];
  
  // 필수 필드 검증
  for (const field of schema.required) {
    if (!data[field]) {
      errors.push(`필수 필드 누락: ${field}`);
    }
  }
  
  // 타입 검증 (간단한 버전)
  if (data.round && typeof data.round !== 'number') {
    errors.push('round는 숫자여야 합니다');
  }
  
  if (data.round_total && typeof data.round_total !== 'number') {
    errors.push('round_total은 숫자여야 합니다');
  }
  
  if (data.round && data.round_total && data.round > data.round_total) {
    errors.push('round는 round_total보다 클 수 없습니다');
  }
  
  return {
    ok: errors.length === 0,
    errors
  };
}
