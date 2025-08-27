import { access } from 'fs/promises';
import dayjs from 'dayjs';
import ko from 'dayjs/locale/ko.js';
dayjs.locale(ko);

/**
 * 날짜 형식 변환 유틸리티
 */
class DateFormatter {
  /**
   * ISO 날짜를 YY.MM.DD(요일) 형식으로 변환
   * @param {string|Date} date - ISO 날짜 문자열 또는 Date 객체
   * @returns {string} YY.MM.DD(요일) 형식
   */
  static toKoreanFormat(date) {
    if (!date) return '';
    
    try {
      const dayjsDate = dayjs(date);
      if (!dayjsDate.isValid()) return '';
      
      return dayjsDate.format('YY.MM.DD(ddd)');
    } catch (error) {
      console.error('날짜 변환 오류:', error);
      return '';
    }
  }

  /**
   * 한국 형식을 ISO 형식으로 변환
   * @param {string} koreanDate - YY.MM.DD(요일) 형식
   * @returns {string} ISO 형식 (YYYY-MM-DD)
   */
  static fromKoreanFormat(koreanDate) {
    if (!koreanDate) return '';
    
    try {
      // YY.MM.DD 형식에서 YYYY-MM-DD로 변환
      const match = koreanDate.match(/^(\d{2})\.(\d{2})\.(\d{2})/);
      if (!match) return '';
      
      const [, year, month, day] = match;
      const fullYear = parseInt(year) < 50 ? `20${year}` : `19${year}`;
      
      return `${fullYear}-${month}-${day}`;
    } catch (error) {
      console.error('한국 날짜 형식 변환 오류:', error);
      return '';
    }
  }

  /**
   * 현재 날짜를 한국 형식으로 반환
   * @returns {string} YY.MM.DD(요일) 형식
   */
  static getCurrentKoreanDate() {
    return dayjs().format('YY.MM.DD(ddd)');
  }

  /**
   * 날짜 유효성 검사
   * @param {string} date - 검사할 날짜
   * @returns {boolean} 유효성 여부
   */
  static isValidDate(date) {
    if (!date) return false;
    
    try {
      return dayjs(date).isValid();
    } catch (error) {
      return false;
    }
  }
}

/**
 * NPE 방지 유틸리티
 */
class SafeAccess {
  /**
   * 중첩된 객체에서 안전하게 값을 가져오기
   * @param {Object} obj - 객체
   * @param {string} path - 경로 (예: "site.name")
   * @param {*} defaultValue - 기본값
   * @returns {*} 값 또는 기본값
   */
  static getNestedValue(obj, path, defaultValue = '') {
    if (!obj || !path) return defaultValue;
    
    try {
      const keys = path.split('.');
      let current = obj;
      
      for (const key of keys) {
        if (current === null || current === undefined) return defaultValue;
        if (typeof current !== 'object') return defaultValue;
        current = current[key];
      }
      
      return current !== undefined ? current : defaultValue;
    } catch (error) {
      console.error(`안전 접근 오류 (${path}):`, error);
      return defaultValue;
    }
  }

  /**
   * 중첩된 객체에 안전하게 값 설정
   * @param {Object} obj - 객체
   * @param {string} path - 경로
   * @param {*} value - 설정할 값
   * @returns {boolean} 성공 여부
   */
  static setNestedValue(obj, path, value) {
    if (!obj || !path) return false;
    
    try {
      const keys = path.split('.');
      let current = obj;
      
      // 마지막 키 전까지 경로 생성
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current) || current[key] === null || typeof current[key] !== 'object') {
          current[key] = {};
        }
        current = current[key];
      }
      
      // 마지막 키에 값 설정
      const lastKey = keys[keys.length - 1];
      current[lastKey] = value;
      return true;
    } catch (error) {
      console.error(`안전 설정 오류 (${path}):`, error);
      return false;
    }
  }

  /**
   * 객체가 특정 경로를 가지고 있는지 확인
   * @param {Object} obj - 객체
   * @param {string} path - 경로
   * @returns {boolean} 존재 여부
   */
  static hasPath(obj, path) {
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
}

/**
 * 파일명 생성 유틸리티
 */
class FileNameGenerator {
  /**
   * 보고서 파일명 생성
   * @param {Object} options - 파일명 생성 옵션
   * @param {number} options.visitRound - 방문차수
   * @param {string} options.projectName - 프로젝트명
   * @param {string} options.extension - 파일 확장자 (기본값: 'json')
   * @returns {string} 생성된 파일명
   */
  static generateReportFileName(options) {
    const {
      visitRound = 1,
      projectName = '미지정프로젝트',
      extension = 'json'
    } = options;

    // 방문차수 텍스트 생성
    const roundText = `제${visitRound}회`;
    
    // 프로젝트명 정리 (특수문자 제거, 길이 제한)
    const sanitizedProjectName = this.sanitizeFileName(projectName);
    
    // 기본 파일명
    const fileName = `${roundText}_기술지도결과보고서_${sanitizedProjectName}.${extension}`;
    
    return fileName;
  }

  /**
   * 파일명에서 사용할 수 없는 특수문자 제거
   * @param {string} name - 원본 이름
   * @returns {string} 정리된 이름
   */
  static sanitizeFileName(name) {
    if (!name) return '미지정프로젝트';
    
    return name
      .replace(/[<>:"/\\|?*]/g, '_') // Windows에서 사용할 수 없는 문자
      .replace(/\s+/g, '_') // 공백을 언더스코어로 변경
      .replace(/_{2,}/g, '_') // 연속된 언더스코어를 하나로
      .replace(/^_|_$/g, '') // 앞뒤 언더스코어 제거
      .substring(0, 100); // 길이 제한
  }

  /**
   * 파일 중복 검사
   * @param {string} filePath - 파일 경로
   * @returns {Promise<boolean>} 중복 여부
   */
  static async checkFileExists(filePath) {
    try {
      await access(filePath);
      return true; // 파일이 존재함
    } catch {
      return false; // 파일이 존재하지 않음
    }
  }
}

// DataNormalizer는 normalize.js에서 재export
export { DataNormalizer } from './normalize.js';

export { DateFormatter, SafeAccess, FileNameGenerator };
