const { SafeAccess, DateFormatter } = require('./utils');

/**
 * 템플릿 DSL 파서
 * data-repeat, data-if, data-text, data-pagebreak 등의 속성을 처리
 */
class TemplateParser {
  constructor() {
    this.supportedAttributes = [
      'data-field',
      'data-format', 
      'data-repeat',
      'data-if',
      'data-pagebreak',
      'data-text'
    ];
  }

  /**
   * HTML 템플릿을 파싱하고 데이터를 바인딩
   * @param {string} html - HTML 템플릿
   * @param {Object} data - 바인딩할 데이터
   * @returns {string} 처리된 HTML
   */
  parseTemplate(html, data) {
    if (!html || !data) return html;
    
    try {
      let processedHtml = html;
      
      // 1. 조건부 표시 처리 (data-if)
      processedHtml = this.processConditionalDisplay(processedHtml, data);
      
      // 2. 반복 데이터 처리 (data-repeat)
      processedHtml = this.processRepeatedData(processedHtml, data);
      
      // 3. 단일 필드 바인딩 (data-field)
      processedHtml = this.processFieldBinding(processedHtml, data);
      
      // 4. 포맷 함수 처리 (data-format)
      processedHtml = this.processFormatFunctions(processedHtml, data);
      
      // 5. 계산된 텍스트 처리 (data-text)
      processedHtml = this.processComputedText(processedHtml, data);
      
      // 6. 페이지 나눔 처리 (data-pagebreak)
      processedHtml = this.processPageBreaks(processedHtml);
      
      return processedHtml;
      
    } catch (error) {
      console.error('템플릿 파싱 오류:', error);
      return html;
    }
  }

  /**
   * 조건부 표시 처리 (data-if)
   * @param {string} html - HTML 내용
   * @param {Object} data - 데이터
   * @returns {string} 처리된 HTML
   */
  processConditionalDisplay(html, data) {
    const conditionalPattern = /<([^>]+)data-if="([^"]+)"([^>]*)>/g;
    
    return html.replace(conditionalPattern, (match, tagStart, condition, tagEnd) => {
      try {
        const isVisible = this.evaluateCondition(condition, data);
        if (!isVisible) {
          // 조건이 false면 요소를 숨김
          return `<${tagStart}style="display: none;"${tagEnd}>`;
        }
        return match;
      } catch (error) {
        console.error(`조건 평가 오류 (${condition}):`, error);
        return match;
      }
    });
  }

  /**
   * 반복 데이터 처리 (data-repeat)
   * @param {string} html - HTML 내용
   * @param {Object} data - 데이터
   * @returns {string} 처리된 HTML
   */
  processRepeatedData(html, data) {
    const repeatPattern = /<([^>]+)data-repeat="([^"]+)"([^>]*)>([\s\S]*?)<\/\1>/g;
    
    return html.replace(repeatPattern, (match, tagName, dataPath, attributes, content) => {
      try {
        const arrayData = SafeAccess.getNestedValue(data, dataPath);
        if (!Array.isArray(arrayData) || arrayData.length === 0) {
          return ''; // 빈 배열이면 내용 제거
        }
        
        // 각 배열 항목에 대해 내용 반복
        const repeatedContent = arrayData.map((item, index) => {
          let itemContent = content;
          
          // 인덱스 변수 바인딩
          itemContent = itemContent.replace(/\{\{index\}\}/g, index + 1);
          itemContent = itemContent.replace(/\{\{index0\}\}/g, index);
          
          // 배열 항목의 필드들을 바인딩
          Object.keys(item).forEach(key => {
            const value = item[key];
            const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            itemContent = itemContent.replace(placeholder, value || '');
          });
          
          return itemContent;
        }).join('');
        
        return repeatedContent;
        
      } catch (error) {
        console.error(`반복 데이터 처리 오류 (${dataPath}):`, error);
        return match;
      }
    });
  }

  /**
   * 단일 필드 바인딩 처리 (data-field)
   * @param {string} html - HTML 내용
   * @param {Object} data - 데이터
   * @returns {string} 처리된 HTML
   */
  processFieldBinding(html, data) {
    const fieldPattern = /data-field="([^"]+)"/g;
    
    return html.replace(fieldPattern, (match, fieldPath) => {
      try {
        const value = SafeAccess.getNestedValue(data, fieldPath);
        return `data-field="${fieldPath}" data-value="${value || ''}"`;
      } catch (error) {
        console.error(`필드 바인딩 오류 (${fieldPath}):`, error);
        return match;
      }
    });
  }

  /**
   * 포맷 함수 처리 (data-format)
   * @param {string} html - HTML 내용
   * @param {Object} data - 데이터
   * @returns {string} 처리된 HTML
   */
  processFormatFunctions(html, data) {
    const formatPattern = /data-format="([^"]+)"/g;
    
    return html.replace(formatPattern, (match, formatExpression) => {
      try {
        const formattedValue = this.evaluateFormatFunction(formatExpression, data);
        return `data-format="${formatExpression}" data-formatted="${formattedValue}"`;
      } catch (error) {
        console.error(`포맷 함수 처리 오류 (${formatExpression}):`, error);
        return match;
      }
    });
  }

  /**
   * 계산된 텍스트 처리 (data-text)
   * @param {string} html - HTML 내용
   * @param {Object} data - 데이터
   * @returns {string} 처리된 HTML
   */
  processComputedText(html, data) {
    const textPattern = /data-text="([^"]+)"/g;
    
    return html.replace(textPattern, (match, expression) => {
      try {
        const computedValue = this.evaluateComputedExpression(expression, data);
        return `data-text="${expression}" data-computed="${computedValue}"`;
      } catch (error) {
        console.error(`계산된 텍스트 처리 오류 (${expression}):`, error);
        return match;
      }
    });
  }

  /**
   * 페이지 나눔 처리 (data-pagebreak)
   * @param {string} html - HTML 내용
   * @returns {string} 처리된 HTML
   */
  processPageBreaks(html) {
    const pagebreakPattern = /data-pagebreak="([^"]+)"/g;
    
    return html.replace(pagebreakPattern, (match, breakType) => {
      const cssClass = `page-break-${breakType}`;
      const cssStyle = this.getPageBreakStyle(breakType);
      return `class="${cssClass}" style="${cssStyle}"`;
    });
  }

  /**
   * 조건 평가
   * @param {string} condition - 조건식
   * @param {Object} data - 데이터
   * @returns {boolean} 평가 결과
   */
  evaluateCondition(condition, data) {
    try {
      // 간단한 조건식 파서
      if (condition.includes('>')) {
        const [left, right] = condition.split('>').map(s => s.trim());
        const leftValue = SafeAccess.getNestedValue(data, left);
        const rightValue = this.parseValue(right);
        return leftValue > rightValue;
      }
      
      if (condition.includes('<')) {
        const [left, right] = condition.split('<').map(s => s.trim());
        const leftValue = SafeAccess.getNestedValue(data, left);
        const rightValue = this.parseValue(right);
        return leftValue < rightValue;
      }
      
      if (condition.includes('==')) {
        const [left, right] = condition.split('==').map(s => s.trim());
        const leftValue = SafeAccess.getNestedValue(data, left);
        const rightValue = this.parseValue(right);
        return leftValue == rightValue;
      }
      
      if (condition.includes('!=')) {
        const [left, right] = condition.split('!=').map(s => s.trim());
        const leftValue = SafeAccess.getNestedValue(data, left);
        const rightValue = this.parseValue(right);
        return leftValue != rightValue;
      }
      
      // 단순 존재 여부 체크
      const value = SafeAccess.getNestedValue(data, condition);
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return !!value;
      
    } catch (error) {
      console.error(`조건 평가 오류 (${condition}):`, error);
      return false;
    }
  }

  /**
   * 포맷 함수 평가
   * @param {string} expression - 포맷 표현식
   * @param {Object} data - 데이터
   * @returns {string} 포맷된 값
   */
  evaluateFormatFunction(expression, data) {
    try {
      // formatDate(visit.date, 'YY.MM.DD(ddd)') 형태 파싱
      const functionMatch = expression.match(/^(\w+)\(([^)]+)\)$/);
      if (!functionMatch) return expression;
      
      const [, functionName, args] = functionMatch;
      const argList = args.split(',').map(arg => arg.trim().replace(/['"]/g, ''));
      
      switch (functionName) {
        case 'formatDate':
          const dateValue = SafeAccess.getNestedValue(data, argList[0]);
          const format = argList[1] || 'YY.MM.DD(ddd)';
          return DateFormatter.toKoreanFormat(dateValue);
          
        case 'roundText':
          const roundValue = SafeAccess.getNestedValue(data, argList[0]);
          return `${roundValue}차`;
          
        case 'concat':
          const concatValues = argList.map(arg => {
            if (arg.startsWith('data.')) {
              return SafeAccess.getNestedValue(data, arg) || '';
            }
            return arg;
          });
          return concatValues.join('');
          
        case 'case':
          // case(condition1, value1, condition2, value2, default)
          for (let i = 0; i < argList.length - 1; i += 2) {
            const condition = argList[i];
            const value = argList[i + 1];
            if (this.evaluateCondition(condition, data)) {
              return value;
            }
          }
          return argList[argList.length - 1] || '';
          
        default:
          return expression;
      }
      
    } catch (error) {
      console.error(`포맷 함수 평가 오류 (${expression}):`, error);
      return expression;
    }
  }

  /**
   * 계산된 표현식 평가
   * @param {string} expression - 계산 표현식
   * @param {Object} data - 데이터
   * @returns {string} 계산된 값
   */
  evaluateComputedExpression(expression, data) {
    try {
      // = concat(site.name, ' / ', visit.round, '차') 형태 파싱
      if (expression.startsWith('=')) {
        const formula = expression.substring(1).trim();
        return this.evaluateFormatFunction(formula, data);
      }
      
      return expression;
      
    } catch (error) {
      console.error(`계산된 표현식 평가 오류 (${expression}):`, error);
      return expression;
    }
  }

  /**
   * 페이지 나눔 스타일 반환
   * @param {string} breakType - 나눔 타입
   * @returns {string} CSS 스타일
   */
  getPageBreakStyle(breakType) {
    switch (breakType) {
      case 'before':
        return 'page-break-before: always;';
      case 'after':
        return 'page-break-after: always;';
      case 'avoid':
        return 'page-break-inside: avoid;';
      default:
        return '';
    }
  }

  /**
   * 값 파싱 (문자열을 적절한 타입으로 변환)
   * @param {string} value - 파싱할 값
   * @returns {*} 파싱된 값
   */
  parseValue(value) {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (!isNaN(value)) return Number(value);
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }
    if (value.startsWith("'") && value.endsWith("'")) {
      return value.slice(1, -1);
    }
    return value;
  }

  /**
   * 템플릿 유효성 검사
   * @param {string} html - HTML 템플릿
   * @returns {Object} 검사 결과
   */
  validateTemplate(html) {
    const issues = [];
    
    // 지원되지 않는 data-* 속성 검사
    const dataAttributePattern = /data-([^="\s]+)="([^"]*)"/g;
    const foundAttributes = new Set();
    
    let match;
    while ((match = dataAttributePattern.exec(html)) !== null) {
      const [, attrName, attrValue] = match;
      foundAttributes.add(attrName);
      
      if (!this.supportedAttributes.includes(`data-${attrName}`)) {
        issues.push({
          type: 'warning',
          message: `지원되지 않는 data-${attrName} 속성`,
          severity: 'medium'
        });
      }
    }
    
    // 필수 속성 검사
    const requiredAttributes = ['data-field', 'data-repeat'];
    const missingAttributes = requiredAttributes.filter(attr => 
      !foundAttributes.has(attr.replace('data-', ''))
    );
    
    if (missingAttributes.length > 0) {
      issues.push({
        type: 'info',
        message: `일부 필수 속성이 누락됨: ${missingAttributes.join(', ')}`,
        severity: 'low'
      });
    }
    
    return {
      valid: issues.filter(issue => issue.type === 'error').length === 0,
      issues,
      supportedAttributes: Array.from(foundAttributes),
      totalAttributes: foundAttributes.size
    };
  }

  /**
   * 템플릿에서 사용된 데이터 필드 추출
   * @param {string} html - HTML 템플릿
   * @returns {Array} 필드 목록
   */
  extractDataFields(html) {
    const fields = new Set();
    
    // data-field 속성에서 필드 추출
    const fieldPattern = /data-field="([^"]+)"/g;
    let match;
    while ((match = fieldPattern.exec(html)) !== null) {
      fields.add(match[1]);
    }
    
    // data-repeat 속성에서 필드 추출
    const repeatPattern = /data-repeat="([^"]+)"/g;
    while ((match = repeatPattern.exec(html)) !== null) {
      fields.add(match[1]);
    }
    
    return Array.from(fields);
  }
}

module.exports = TemplateParser;
