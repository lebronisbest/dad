import Ajv from 'ajv';
import { normalizeReportDTO } from './normalize.js';

const ajv = new Ajv({
  allErrors: true,
  verbose: true,
  coerceTypes: false
});

// 표준화된 보고서 스키마 (실제 템플릿 구조에 맞춤)
export const reportSchema = {
  type: 'object',
  required: ['site', 'org', 'inspector', 'round', 'round_total', 'visit'],
  properties: {
    site: {
      type: 'object',
      required: ['name'],
      description: '현장 정보',
      properties: {
        name: { type: 'string', minLength: 1 },
        address: { type: 'string' },
        phone: { type: 'string' },
        email: { type: 'string' },
        management_number: { type: 'string' },
        construction_period: { type: 'string' },
        construction_amount: { type: 'string' },
        responsible_person: { type: 'string' }
      }
    },
    org: {
      type: 'object',
      required: ['name'],
      description: '조직 정보',
      properties: {
        name: { type: 'string', minLength: 1 },
        inspector: { type: 'string', minLength: 1 },
        position: { type: 'string' },
        phone: { type: 'string' },
        email: { type: 'string' },
        registration_number: { type: 'string' },
        license_number: { type: 'string' },
        address: { type: 'string' }
      }
    },
    inspector: {
      type: 'string',
      minLength: 1,
      description: '점검자명'
    },
    round: {
      type: 'integer',
      minimum: 1,
      description: '차수'
    },
    round_total: {
      type: 'integer',
      minimum: 1,
      description: '총 차수'
    },
    visit: {
      type: 'object',
      required: ['date'],
      properties: {
        date: {
          type: 'string',
          description: '점검일자 (YYYY-MM-DD 형식)'
        },
        time: {
          type: 'string',
          nullable: true,
          description: '점검시간'
        },
        purpose: {
          type: 'string',
          nullable: true,
          description: '점검목적'
        },
        round: { type: 'integer' },
        round_total: { type: 'integer' }
      }
    },
    // 기존 템플릿에서 사용하는 추가 필드들
    progress: {
      type: 'object',
      properties: {
        percent: { type: 'integer', minimum: 0, maximum: 100 }
      }
    },
    category: {
      type: 'object',
      properties: {
        type: { type: 'string' },
        subtype: { type: 'string' },
        is_construction: { type: 'boolean' },
        is_electrical: { type: 'boolean' }
      }
    },
    guide: {
      type: 'object',
      properties: {
        org_name: { type: 'string' },
        inspector: { type: 'string' },
        phone: { type: 'string' },
        previous_completed: { type: 'boolean' },
        previous_incomplete: { type: 'boolean' }
      }
    },
    work: {
      type: 'object',
      properties: {
        status_html: { type: 'string' },
        description: { type: 'string' },
        is_working_today: { type: 'boolean' },
        today_work: { type: 'string' },
        current_work: { type: 'string' },
        additional_notes: { type: 'string' }
      }
    },
    notification: {
      type: 'object',
      properties: {
        registered_mail: { type: 'boolean' },
        email: { type: 'boolean' },
        mobile: { type: 'boolean' },
        other: { type: 'boolean' },
        other_method: { type: 'string' }
      }
    },
    previous_guidance: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          date: { type: 'string' },
          content: { type: 'string' },
          completed: { type: 'boolean' }
        }
      }
    },
    hazards: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          place: { type: 'string' },
          factor: { type: 'string' },
          measure: { type: 'string' },
          possibility_level: { type: 'string' },
          severity_level: { type: 'string' },
          risk_level: { type: 'integer' },
          priority: { type: 'string' }
        }
      }
    },
    risk_assessment: {
      type: 'object',
      properties: {
        possibility: {
          type: 'object',
          properties: {
            high: { type: 'string' },
            medium: { type: 'string' },
            low: { type: 'string' }
          }
        },
        severity: {
          type: 'object',
          properties: {
            high: { type: 'string' },
            medium: { type: 'string' },
            low: { type: 'string' }
          }
        },
        improvement_methods: {
          type: 'object',
          properties: {
            high: { type: 'string' },
            medium: { type: 'string' },
            low: { type: 'string' }
          }
        }
      }
    },
    future_work: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          process: { type: 'string' },
          sub_process: { type: 'string' },
          hazardous_factor: { type: 'string' },
          prevention_measure: { type: 'string' },
          notes: { type: 'string' }
        }
      }
    },
    support: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          description: { type: 'string' },
          date: { type: 'string' },
          status: { type: 'string' }
        }
      }
    },
    photos: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          caption: { type: 'string' },
          taken_at: { type: 'string' },
          index: { type: 'integer' }
        }
      }
    }
  }
};

const validate = ajv.compile(reportSchema);

/**
 * 보고서 데이터 검증 (AJV 기반)
 * @param {Object} data - 검증할 데이터
 * @returns {Object} 검증 결과
 */
export function validateReport(data) {
  console.log('🔍 AJV 검증 시작:', JSON.stringify(data, null, 2));
  
  const ok = validate(data);
  console.log('🔍 AJV 검증 결과:', ok);

  if (ok) {
    console.log('✅ AJV 검증 성공');
    return {
      ok: true,
      errors: [],
      data
    };
  }

  // AJV 에러를 사용자 친화적 형식으로 변환
  const errors = validate.errors.map(error => ({
    path: error.instancePath || error.dataPath || '/',
    message: error.message,
    keyword: error.keyword,
    params: error.params
  }));

  console.error('❌ AJV 검증 실패:', errors);
  return {
    ok: false,
    errors,
    data: null
  };
}

/**
 * 간단한 수동 검증 (AJV 보완용)
 * @param {Object} data - 검증할 데이터
 * @returns {Object} 검증 결과
 */
export function validateReportExtra(data) {
  const errors = [];

  // 날짜 형식 검증 (AJV에서는 제한적)
  if (data.visit?.date) {
    const date = data.visit.date;
    const koreanPattern = /^\d{2}\.\d{2}\.\d{2}\([월화수목금토일]\)$/;
    const isoPattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!koreanPattern.test(date) && !isoPattern.test(date)) {
      errors.push({
        path: '/visit/date',
        message: '날짜는 YY.MM.DD(요일) 또는 YYYY-MM-DD 형식이어야 합니다',
        keyword: 'format'
      });
    }
  }

  // round와 round_total 관계 검증
  if (data.round && data.round_total && data.round > data.round_total) {
    errors.push({
      path: '/round',
      message: 'round는 round_total보다 클 수 없습니다',
      keyword: 'maximum'
    });
  }

  // progress.percent 범위 검증
  if (data.progress?.percent !== undefined) {
    const percent = data.progress.percent;
    if (percent < 0 || percent > 100) {
      errors.push({
        path: '/progress/percent',
        message: '진행률은 0-100 범위여야 합니다',
        keyword: 'range'
      });
    }
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

/**
 * 종합 검증 함수 (DTO 정규화 포함)
 * @param {Object} data - 검증할 데이터
 * @returns {Object} 검증 결과 { ok, errors, data, normalizedData }
 */
export function validateReportData(data) {
  try {
    console.log('🔍 검증 시작 - 원본 데이터:', JSON.stringify(data, null, 2));
    
    // 1. DTO 정규화 (visit NPE 방지)
    const normalizedData = normalizeReportDTO(data);
    console.log('🔍 정규화된 데이터:', JSON.stringify(normalizedData, null, 2));

    // 2. AJV 스키마 검증
    const schemaResult = validateReport(normalizedData);
    console.log('🔍 스키마 검증 결과:', schemaResult);
    
    if (!schemaResult.ok) {
      console.error('❌ 스키마 검증 실패:', schemaResult.errors);
      return {
        ok: false,
        errors: schemaResult.errors,
        data: null,
        normalizedData
      };
    }

    // 3. 추가 검증 (하위 호환성)
    const extraResult = validateReportExtra(normalizedData);
    if (!extraResult.ok) {
      return {
        ok: false,
        errors: [...schemaResult.errors, ...extraResult.errors],
        data: null,
        normalizedData
      };
    }

    return {
      ok: true,
      errors: [],
      data: normalizedData,
      normalizedData
    };

  } catch (error) {
    return {
      ok: false,
      errors: [{ path: '/', message: error.message, keyword: 'normalize_error' }],
      data: null,
      normalizedData: null
    };
  }
}
