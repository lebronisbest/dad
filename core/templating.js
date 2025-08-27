/**
 * HTML 템플릿 데이터 주입 엔진
 * layout.html 템플릿에 보고서 데이터를 주입
 */

export default class TemplatingEngine {
  constructor() {
    this.filters = {
      formatDate: this.formatDate.bind(this),
      formatCurrency: this.formatCurrency.bind(this),
      formatNumber: this.formatNumber.bind(this),
      formatBoolean: this.formatBoolean.bind(this),
      formatArray: this.formatArray.bind(this)
    };
  }

  /**
   * HTML 템플릿에 데이터 주입
   * @param {string} template - HTML 템플릿
   * @param {Object} data - 주입할 데이터
   * @returns {string} 데이터가 주입된 HTML
   */
  injectData(template, data) {
    try {
      console.log('🔍 TemplatingEngine.injectData 시작');
      console.log('  템플릿 크기:', template.length);
      console.log('  데이터 키:', Object.keys(data));
      console.log('  데이터 상세:', JSON.stringify(data, null, 2));
      
      if (!template || typeof template !== 'string') {
        throw new Error('템플릿은 문자열이어야 합니다');
      }

      if (!data || typeof data !== 'object') {
        throw new Error('데이터는 객체여야 합니다');
      }

      let result = template;

      // 1. 단순 필드 치환 (data-field)
      console.log('🔍 1단계: data-field 처리 시작');
      result = this.replaceDataFields(result, data);
      console.log('✅ 1단계: data-field 처리 완료');

      // 2. 반복 데이터 처리 (data-repeat)
      console.log('🔍 2단계: data-repeat 처리 시작');
      result = this.processRepeatableData(result, data);
      console.log('✅ 2단계: data-repeat 처리 완료');

      // 3. 조건부 표시 처리 (data-if)
      console.log('🔍 3단계: data-if 처리 시작');
      result = this.processConditionalDisplay(result, data);
      console.log('✅ 3단계: data-if 처리 완료');

      // 4. 기본값 설정
      console.log('🔍 4단계: 기본값 설정 시작');
      result = this.setDefaultValues(result, data);
      console.log('✅ 4단계: 기본값 설정 완료');

      console.log('✅ TemplatingEngine.injectData 완료, 결과 크기:', result.length);
      return result;
    } catch (error) {
      console.error('❌ TemplatingEngine.injectData 실패:', error);
      throw error;
    }
  }

  /**
   * data-field 속성 처리
   * @param {string} html - HTML 문자열
   * @param {Object} data - 데이터 객체
   * @returns {string} 처리된 HTML
   */
  replaceDataFields(html, data) {
    // HTML 템플릿을 정확하게 처리하는 정규식
    // <td data-field="site.name"></td> 같은 빈 태그도 정확히 매칭
    const fieldRegex = /data-field="([^"]+)"[^>]*>([^<]*?)</g;
    let processedCount = 0;
    
    console.log('🔍 replaceDataFields 시작');
    console.log('  HTML 길이:', html.length);
    console.log('  데이터 키:', Object.keys(data));
    console.log('  정규식:', fieldRegex.source);
    
    // 모든 data-field 속성 찾기 (디버깅용)
    const allMatches = html.match(fieldRegex);
    console.log('  발견된 data-field 개수:', allMatches ? allMatches.length : 0);
    
    const result = html.replace(fieldRegex, (match, fieldName, content) => {
      console.log(`\n🔍 매칭된 태그: ${match}`);
      console.log(`  필드명: ${fieldName}`);
      console.log(`  원본 내용: "${content}" (길이: ${content.length})`);
      
      const value = this.getNestedValue(data, fieldName);
      console.log(`  데이터 값: ${value} (타입: ${typeof value})`);
      
      if (value !== undefined && value !== null) {
        processedCount++;
        console.log(`  ✅ data-field 처리: ${fieldName} = ${value}`);
        
        // 필터 적용
        const filterMatch = content.match(/\{\{([^}]+)\}\}/);
        if (filterMatch) {
          const filterName = filterMatch[1].trim();
          if (this.filters[filterName]) {
            const filteredValue = this.filters[filterName](value);
            console.log(`    ✅ 필터 적용: ${filterName}(${value}) = ${filteredValue}`);
            // 전체 태그를 올바르게 교체
            const newMatch = match.replace(/>([^<]*?)</, `>${filteredValue}<`);
            console.log(`    🔄 교체 결과: ${newMatch}`);
            return newMatch;
          }
        }
        
        // 필터가 없으면 값 그대로 사용
        console.log(`    ✅ 값 주입: ${fieldName} = ${value}`);
        // 전체 태그를 올바르게 교체
        const newMatch = match.replace(/>([^<]*?)</, `>${String(value)}<`);
        console.log(`    🔄 교체 결과: ${newMatch}`);
        return newMatch;
      } else {
        console.log(`  ⚠️ data-field 값 없음: ${fieldName}`);
      }
      
      return match;
    });
    
    console.log(`\n✅ data-field 처리 완료: ${processedCount}개 필드 처리됨`);
    console.log('  결과 HTML 길이:', result.length);
    
    return result;
  }

  /**
   * data-repeat 속성 처리 (반복 데이터)
   * @param {string} html - HTML 문자열
   * @param {Object} data - 데이터 객체
   * @returns {string} 처리된 HTML
   */
  processRepeatableData(html, data) {
    const repeatRegex = /<tbody[^>]*data-repeat="([^"]+)"[^>]*>([\s\S]*?)<\/tbody>/g;
    
    return html.replace(repeatRegex, (match, fieldName, tbodyContent) => {
      const arrayData = this.getNestedValue(data, fieldName);
      
      if (!Array.isArray(arrayData) || arrayData.length === 0) {
        // 데이터가 없으면 빈 tbody 반환
        return `<tbody data-repeat="${fieldName}"></tbody>`;
      }

      // 각 배열 항목에 대해 행 생성
      const rows = arrayData.map(item => {
        let rowContent = tbodyContent;
        
        // 행 내의 data-field 처리
        const rowFieldRegex = /data-field="([^"]+)"[^>]*>([^<]*?)</g;
        rowContent = rowContent.replace(rowFieldRegex, (fieldMatch, fieldName, content) => {
          const value = this.getNestedValue(item, fieldName);
          if (value !== undefined && value !== null) {
            // 전체 태그를 올바르게 교체
            return fieldMatch.replace(/>([^<]*?)</, `>${String(value)}<`);
          }
          return fieldMatch;
        });

        return rowContent;
      });

      return `<tbody data-repeat="${fieldName}">${rows.join('')}</tbody>`;
    });
  }

  /**
   * data-if 속성 처리 (조건부 표시)
   * @param {string} html - HTML 문자열
   * @param {Object} data - 데이터 객체
   * @returns {string} 처리된 HTML
   */
  processConditionalDisplay(html, data) {
    const ifRegex = /<([^>]+)data-if="([^"]+)"[^>]*>([\s\S]*?)<\/[^>]+>/g;
    
    return html.replace(ifRegex, (match, tagName, condition, content) => {
      const shouldShow = this.evaluateCondition(condition, data);
      
      if (shouldShow) {
        // data-if 속성 제거하고 태그 반환
        return match.replace(/data-if="[^"]*"/, '');
      } else {
        // 조건이 false면 태그 제거
        return '';
      }
    });
  }

  /**
   * 기본값 설정
   * @param {string} html - HTML 문자열
   * @param {Object} data - 데이터 객체
   * @returns {string} 처리된 HTML
   */
  setDefaultValues(html, data) {
    // 빈 필드에 기본값 설정
    const emptyFieldRegex = />\s*</g;
    
    return html.replace(emptyFieldRegex, (match) => {
      // 실제로는 더 정교한 로직이 필요하지만, 현재는 간단하게 처리
      return match;
    });
  }

  /**
   * 중첩된 객체에서 값 가져오기
   * @param {Object} obj - 객체
   * @param {string} path - 경로 (예: "site.name")
   * @returns {*} 값
   */
  getNestedValue(obj, path) {
    if (!path) return obj;
    
    console.log(`  🔍 getNestedValue: ${path}`);
    console.log(`    시작 객체:`, obj);
    
    const result = path.split('.').reduce((current, key) => {
      console.log(`    키 "${key}" 처리 중:`, current);
      if (current && typeof current === 'object' && key in current) {
        const value = current[key];
        console.log(`    ✅ 값 발견: ${value}`);
        return value;
      } else {
        console.log(`    ❌ 값 없음: ${key}`);
        return undefined;
      }
    }, obj);
    
    console.log(`    최종 결과: ${result}`);
    return result;
  }

  /**
   * 조건 평가
   * @param {string} condition - 조건 문자열
   * @param {Object} data - 데이터 객체
   * @returns {boolean} 조건 결과
   */
  evaluateCondition(condition, data) {
    try {
      // 간단한 조건 평가 (실제로는 더 정교한 파서 필요)
      if (condition.includes('&&')) {
        return condition.split('&&').every(cond => this.evaluateCondition(cond.trim(), data));
      }
      
      if (condition.includes('||')) {
        return condition.split('||').some(cond => this.evaluateCondition(cond.trim(), data));
      }
      
      if (condition.includes('!')) {
        const subCondition = condition.replace('!', '').trim();
        return !this.evaluateCondition(subCondition, data);
      }
      
      if (condition.includes('===')) {
        const [left, right] = condition.split('===').map(s => s.trim());
        const leftValue = this.getNestedValue(data, left);
        return leftValue === right;
      }
      
      if (condition.includes('==')) {
        const [left, right] = condition.split('==').map(s => s.trim());
        const leftValue = this.getNestedValue(data, left);
        return leftValue == right; // eslint-disable-line eqeqeq
      }
      
      // 단순 존재 여부 확인
      const value = this.getNestedValue(data, condition);
      return value !== undefined && value !== null && value !== '';
      
    } catch (error) {
      console.warn('조건 평가 오류:', error);
      return false;
    }
  }

  // 필터 함수들
  formatDate(value) {
    if (!value) return '';
    
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return String(value);
      
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      return String(value);
    }
  }

  formatCurrency(value) {
    if (typeof value === 'number') {
      return value.toLocaleString('ko-KR') + '원';
    }
    return String(value);
  }

  formatNumber(value) {
    if (typeof value === 'number') {
      return value.toLocaleString('ko-KR');
    }
    return String(value);
  }

  formatBoolean(value) {
    if (typeof value === 'boolean') {
      return value ? '예' : '아니오';
    }
    return String(value);
  }

  formatArray(value) {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return String(value);
  }
}


