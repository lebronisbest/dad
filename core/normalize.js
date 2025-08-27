/**
 * DTO 정규화 모듈
 * 입력된 데이터를 표준화된 보고서 DTO 형식으로 변환
 */

/**
 * 보고서 DTO 정규화 함수
 * visit NPE 방지 및 데이터 일관성 보장을 위해 필수 필드들을 보장
 * @param {Object} input - 입력 데이터
 * @returns {Object} 정규화된 보고서 DTO
 */
export function normalizeReportDTO(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('입력 데이터는 객체여야 합니다');
  }

  // 입력값 상세 로깅 (한글 인코딩 문제 진단)
  console.log('🔍 normalizeReportDTO 입력값 상세:');
  console.log('  site.name:', input.site?.name, '(길이:', input.site?.name?.length, ')');
  console.log('  org.name:', input.org?.name, '(길이:', input.org?.name?.length, ')');
  console.log('  inspector:', input.inspector, '(길이:', input.inspector?.length, ')');

  const out = { ...input };

  // visitInfo → visit 필드 통합 (하위 호환성)
  if (input.visitInfo && !input.visit) {
    out.visit = input.visitInfo;
  }

  // visit 객체 보장 (NPE 방지)
  if (!out.visit) {
    out.visit = {};
  }

  // 필수 필드 기본값 설정 (객체 구조 유지)
  out.site = out.site || {};
  out.org = out.org || {};
  out.inspector = out.inspector || '안전점검자'; // ✅ 빈 문자열 대신 기본값 설정
  out.round = typeof out.round === 'number' ? out.round : 1;
  out.round_total = typeof out.round_total === 'number' ? out.round_total : 1;

  // visit 필드 기본값
  out.visit.date = out.visit.date || '';
  out.visit.time = out.visit.time || '';
  out.visit.purpose = out.visit.purpose || '';
  
  // visit 내 round 필드들을 정수로 보장
  out.visit.round = typeof out.visit.round === 'number' ? out.visit.round : 1;
  out.visit.round_total = typeof out.visit.round_total === 'number' ? out.visit.round_total : 1;

  // sections 배열 보장
  if (!Array.isArray(out.sections)) {
    out.sections = [];
  }

  // sections 내 각 항목 검증
  out.sections = out.sections.filter(section =>
    section &&
    typeof section === 'object' &&
    section.title &&
    Array.isArray(section.items)
  );

  return out;
}

/**
 * DTO 정규화 검증 함수
 * 정규화된 데이터의 유효성을 확인
 * @param {Object} normalized - 정규화된 데이터
 * @returns {Object} 검증 결과 { ok: boolean, errors: string[] }
 */
export function validateNormalizedDTO(normalized) {
  const errors = [];

  // 필수 필드 검증 (객체 구조 유지)
  if (!normalized.site || typeof normalized.site !== 'object') {
    errors.push('site 필드는 필수 객체입니다');
  }

  if (!normalized.org || typeof normalized.org !== 'object') {
    errors.push('org 필드는 필수 객체입니다');
  }

  if (!normalized.inspector || typeof normalized.inspector !== 'string') {
    errors.push('inspector 필드는 필수 문자열입니다');
  }

  if (typeof normalized.round !== 'number' || normalized.round < 1) {
    errors.push('round는 1 이상의 숫자여야 합니다');
  }

  if (typeof normalized.round_total !== 'number' || normalized.round_total < 1) {
    errors.push('round_total은 1 이상의 숫자여야 합니다');
  }

  if (normalized.round > normalized.round_total) {
    errors.push('round는 round_total보다 클 수 없습니다');
  }

  // visit 객체 검증
  if (!normalized.visit || typeof normalized.visit !== 'object') {
    errors.push('visit 객체가 필요합니다');
  } else {
    if (!normalized.visit.date || typeof normalized.visit.date !== 'string') {
      errors.push('visit.date 필드는 필수 문자열입니다');
    }
  }

  // sections 검증
  if (!Array.isArray(normalized.sections)) {
    errors.push('sections는 배열이어야 합니다');
  } else {
    normalized.sections.forEach((section, index) => {
      if (!section.title || typeof section.title !== 'string') {
        errors.push(`sections[${index}].title은 필수 문자열입니다`);
      }
      if (!Array.isArray(section.items)) {
        errors.push(`sections[${index}].items는 배열이어야 합니다`);
      } else {
        section.items.forEach((item, itemIndex) => {
          if (typeof item !== 'string') {
            errors.push(`sections[${index}].items[${itemIndex}]는 문자열이어야 합니다`);
          }
        });
      }
    });
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

/**
 * 샘플 DTO 생성 함수
 * 테스트 및 개발용으로 사용
 * @returns {Object} 샘플 보고서 DTO
 */
export function createSampleDTO() {
  return {
    site: "강남구 신축아파트 현장",
    org: "ABC 건설",
    inspector: "홍길동",
    round: 1,
    round_total: 3,
    visit: {
      date: "2025-08-24",
      time: "14:00",
      purpose: "정기 안전점검"
    },
    sections: [
      {
        title: "1. 현장 정리 상태",
        items: [
          "통로 확보가 양호함",
          "자재 정리 상태 좋음",
          "폐기물 적절히 분리 배출"
        ]
      },
      {
        title: "2. 안전 장비 착용",
        items: [
          "안전모 착용 확인",
          "안전대 착용 상태 양호",
          "보호화 착용 확인"
        ]
      },
      {
        title: "3. 위험요소 식별",
        items: [
          "높은 곳 작업 시 안전대 필수",
          "전기선 정리 필요",
          "미끄럼 방지 조치 필요"
        ]
      }
    ]
  };
}

/**
 * 이전 지도 이력 정규화 (스키마 미스매치 해결)
 * @param input - 입력 데이터
 * @returns 정규화된 이전 지도 이력 배열
 */
export function normalizePrevGuidance(input) {
  if (!input || typeof input !== 'object') {
    return [];
  }
  
  const list = Array.isArray(input.previous_guidance) ? input.previous_guidance : [];
  
  return list.map(item => {
    if (!item || typeof item !== 'object') {
      return {
        hazardous_location: '',
        hazardous_factor: '',
        pointed_issue: '',
        implementation_result: '진행중',
        date: ''
      };
    }
    
    return {
      // 위치 정보 (여러 필드명 지원)
      hazardous_location: item.hazardous_location || 
                         item.place || 
                         item.location || 
                         item.hazardous_place || '',
      
      // 위험 요인 (여러 필드명 지원)
      hazardous_factor: item.hazardous_factor || 
                       item.factor || 
                       item.risk_factor || 
                       item.dangerous_factor || '',
      
      // 지적 사항 (여러 필드명 지원)
      pointed_issue: item.pointed_issue || 
                    item.content || 
                    item.issue || 
                    item.guidance_content || 
                    item.instruction || '',
      
      // 이행 결과 (boolean 또는 문자열)
      implementation_result: item.completed === true ? '완료' : 
                           item.completed === false ? '미완료' :
                           item.implementation_result || 
                           item.status || 
                           item.result || '진행중',
      
      // 날짜 (여러 형식 지원)
      date: item.date || 
            item.guidance_date || 
            item.visit_date || 
            item.created_at || ''
    };
  }).filter(item => 
    // 빈 항목 필터링
    item.hazardous_location || 
    item.hazardous_factor || 
    item.pointed_issue || 
    item.date
  );
}

/**
 * 향후 작업 정규화
 * @param input - 입력 데이터
 * @returns 정규화된 향후 작업 배열
 */
export function normalizeFutureWork(input) {
  if (!input || typeof input !== 'object') {
    return [];
  }
  
  const list = Array.isArray(input.future_work) ? input.future_work : [];
  
  return list.map(item => {
    if (!item || typeof item !== 'object') {
      return {
        process: '',
        sub_process: '',
        hazardous_factor: '',
        prevention_measure: '',
        notes: ''
      };
    }
    
    return {
      process: item.process || item.main_process || item.work_process || '',
      sub_process: item.sub_process || item.sub_work || item.detail_process || '',
      hazardous_factor: item.hazardous_factor || item.risk_factor || item.danger || '',
      prevention_measure: item.prevention_measure || item.safety_measure || item.measure || '',
      notes: item.notes || item.additional_notes || item.remarks || ''
    };
  }).filter(item => 
    // 빈 항목 필터링
    item.process || 
    item.hazardous_factor || 
    item.prevention_measure
  );
}

/**
 * 필드 백필 규칙: visit.round|round_total이 없으면 상위 round|round_total에서 채움
 * @param input - 입력 데이터
 * @returns 백필된 데이터
 */
export function backfillRoundFields(input) {
  if (!input || typeof input !== 'object') {
    return input;
  }
  
  const backfilled = { ...input };
  
  // visit.round가 없으면 상위 round에서 채움
  if (backfilled.visit && !backfilled.visit.round && backfilled.round) {
    backfilled.visit.round = backfilled.round;
  }
  
  // visit.round_total이 없으면 상위 round_total에서 채움
  if (backfilled.visit && !backfilled.visit.round_total && backfilled.round_total) {
    backfilled.visit.round_total = backfilled.round_total;
  }
  
  return backfilled;
}

/**
 * 위험요소 정규화
 * @param input - 입력 데이터
 * @returns 정규화된 위험요소 배열
 */
export function normalizeHazards(input) {
  if (!input || typeof input !== 'object') {
    return [];
  }
  
  const list = Array.isArray(input.hazards) ? input.hazards : [];
  
  return list.map(item => {
    if (!item || typeof item !== 'object') {
      return {
        place: '',
        factor: '',
        measure: '',
        possibility_level: '',
        severity_level: '',
        risk_level: 0,
        priority: ''
      };
    }
    
    return {
      place: item.place || item.location || item.hazardous_location || '',
      factor: item.factor || item.hazardous_factor || item.risk_factor || '',
      measure: item.measure || item.safety_measure || item.prevention_measure || '',
      possibility_level: item.possibility_level || item.probability || item.likelihood || '',
      severity_level: item.severity_level || item.impact_level || item.damage_level || '',
      risk_level: typeof item.risk_level === 'number' ? item.risk_level : 
                 parseInt(item.risk_level) || 0,
      priority: item.priority || item.urgency || item.importance || ''
    };
  }  ).filter(item => 
    // 빈 항목 필터링
    item.place || 
    item.factor || 
    item.measure
  );
}

/**
 * 데이터 정규화 유틸리티
 */
export class DataNormalizer {
  /**
   * 보고서 데이터의 날짜 형식을 통일
   * @param {Object} data - 보고서 데이터
   * @returns {Object} 정규화된 데이터
   */
  static normalizeDates(data) {
    if (!data) return data;
    
    const normalized = JSON.parse(JSON.stringify(data));
    
    // visit.date 정규화
    if (normalized.visit && normalized.visit.date) {
      // ISO 형식이면 한국 형식으로 변환
      if (normalized.visit.date.includes('-')) {
        normalized.visit.date = normalized.visit.date.replace(/-/g, '.');
      }
    }
    
    // previous_guidance 날짜들 정규화
    if (normalized.previous_guidance && Array.isArray(normalized.previous_guidance)) {
      normalized.previous_guidance.forEach(item => {
        if (item.date && item.date.includes('-')) {
          item.date = item.date.replace(/-/g, '.');
        }
      });
    }
    
    return normalized;
  }

  /**
   * 빈 값들을 기본값으로 채우기
   * @param {Object} data - 데이터
   * @param {Object} defaults - 기본값 객체
   * @returns {Object} 채워진 데이터
   */
  static fillDefaults(data, defaults) {
    if (!data || !defaults) return data;
    
    const filled = JSON.parse(JSON.stringify(data));
    
    for (const [path, defaultValue] of Object.entries(defaults)) {
      if (!hasPath(filled, path) || getNestedValue(filled, path) === '') {
        setNestedValue(filled, path, defaultValue);
      }
    }
    
    return filled;
  }
}

// 유틸리티 함수들
function hasPath(obj, path) {
  if (!obj || !path) return false;
  
  try {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined) return false;
      if (typeof current !== 'object') return false;
      if (!(key in current)) return false;
      current = current[key];
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

function getNestedValue(obj, path) {
  if (!obj || !path) return undefined;
  
  try {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined) return undefined;
      if (typeof current !== 'object') return false;
      if (!(key in current)) return undefined;
      current = current[key];
    }
    
    return current;
  } catch (error) {
    return undefined;
  }
}

function setNestedValue(obj, path, value) {
  if (!obj || !path) return false;
  
  try {
    const keys = path.split('.');
    let current = obj;
    
    // 마지막 키 전까지 순회
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    // 마지막 키에 값 설정
    const lastKey = keys[keys.length - 1];
    current[lastKey] = value;
    return true;
  } catch (error) {
    return false;
  }
}
