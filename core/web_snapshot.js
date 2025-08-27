const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

class WebSnapshot {
  constructor() {
    this.config = null;
    this.loadConfig();
  }

  /**
   * 설정 파일 로드
   */
  async loadConfig() {
    try {
      const configPath = path.join(__dirname, '../config/web_sources.json');
      const configData = await fs.readFile(configPath, 'utf-8');
      this.config = JSON.parse(configData);
    } catch (error) {
      console.error('설정 파일 로드 실패, 기본값 사용:', error.message);
      this.config = this.getDefaultConfig();
    }
  }

  /**
   * 기본 설정 반환
   */
  getDefaultConfig() {
    return {
      safety_keywords: ['안전', '보건', '위험', '사고', '재해'],
      scraping_settings: {
        default_timeout: 10000,
        max_redirects: 5,
        max_text_length: 5000,
        max_summary_length: 200,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    };
  }

  /**
   * 웹 페이지 스냅샷 생성
   * @param {Object} params - 파라미터
   * @returns {Object} 스냅샷 결과
   */
  async createSnapshot(params) {
    const { url, with_image = false, max_chars } = params;
    
    // 설정이 로드되지 않았으면 대기
    if (!this.config) {
      await this.loadConfig();
    }
    
    const maxChars = max_chars || this.config.scraping_settings.max_text_length;
    
    try {
      // URL 유효성 검사
      if (!this.isValidUrl(url)) {
        throw new Error('유효하지 않은 URL입니다');
      }

      // 웹 페이지 가져오기
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.config.scraping_settings.user_agent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: this.config.scraping_settings.default_timeout,
        maxRedirects: this.config.scraping_settings.max_redirects
      });

      // HTML 파싱
      const $ = cheerio.load(response.data);
      
      // 메타데이터 추출
      const metadata = this.extractMetadata($);
      
      // 텍스트 추출 및 정리
      const text = this.extractText($, max_chars);
      
      // 요약 생성
      const summary = this.generateSummary(text, this.maxSummaryLength);
      
      // 이미지 스냅샷 (옵션)
      let imageDataUrl = null;
      if (with_image) {
        imageDataUrl = await this.captureImage(url);
      }

      return {
        text: text.substring(0, max_chars),
        summary,
        image_data_url: imageDataUrl,
        metadata,
        url,
        timestamp: new Date().toISOString(),
        text_length: text.length,
        summary_length: summary.length
      };

    } catch (error) {
      console.error('웹 스냅샷 생성 실패:', error.message);
      
      return {
        error: {
          code: 'SNAPSHOT_FAILED',
          message: `웹 스냅샷 생성 실패: ${error.message}`,
          details: error.stack
        },
        url,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * URL 유효성 검사
   * @param {string} url - URL
   * @returns {boolean} 유효성
   */
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 메타데이터 추출
   * @param {Object} $ - Cheerio 객체
   * @returns {Object} 메타데이터
   */
  extractMetadata($) {
    const metadata = {};
    
    // 제목
    metadata.title = $('title').text().trim() || 
                    $('h1').first().text().trim() || 
                    $('meta[property="og:title"]').attr('content') || 
                    '제목 없음';
    
    // 설명
    metadata.description = $('meta[name="description"]').attr('content') || 
                          $('meta[property="og:description"]').attr('content') || 
                          $('p').first().text().trim().substring(0, 160) || 
                          '';
    
    // 키워드
    metadata.keywords = $('meta[name="keywords"]').attr('content') || '';
    
    // 작성자
    metadata.author = $('meta[name="author"]').attr('content') || 
                     $('meta[property="og:author"]').attr('content') || 
                     '';
    
    // 이미지
    metadata.image = $('meta[property="og:image"]').attr('content') || 
                    $('meta[name="twitter:image"]').attr('content') || 
                    '';
    
    // 언어
    metadata.language = $('html').attr('lang') || 
                       $('meta[http-equiv="content-language"]').attr('content') || 
                       'ko';
    
    // 수정일
    metadata.modified = $('meta[property="article:modified_time"]').attr('content') || 
                       $('meta[name="last-modified"]').attr('content') || 
                       '';

    return metadata;
  }

  /**
   * 텍스트 추출 및 정리
   * @param {Object} $ - Cheerio 객체
   * @param {number} maxLength - 최대 길이
   * @returns {string} 정리된 텍스트
   */
  extractText($, maxLength) {
    // 설정에서 제거할 선택자들을 사용
    if (this.config && this.config.scraping_settings.remove_selectors) {
      this.config.scraping_settings.remove_selectors.forEach(selector => {
        $(selector).remove();
      });
    } else {
      // 기본 제거 선택자
      $('script, style, noscript, iframe, embed, object, applet, form, nav, header, footer, aside').remove();
      $('.ad, .advertisement, .banner, .popup, .modal, .overlay').remove();
      $('[class*="ad"], [id*="ad"], [class*="banner"], [id*="banner"]').remove();
    }
    
    // 텍스트 추출
    let text = '';
    
    // 제목 요소들
    $('h1, h2, h3, h4, h5, h6').each((i, elem) => {
      const headingText = $(elem).text().trim();
      if (headingText) {
        text += headingText + '\n\n';
      }
    });
    
    // 본문 텍스트
    $('p, div, li, td, th').each((i, elem) => {
      const elementText = $(elem).text().trim();
      if (elementText && elementText.length > 10) { // 짧은 텍스트 제외
        text += elementText + '\n\n';
      }
    });
    
    // 텍스트 정리
    text = text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
    
    // 길이 제한
    if (text.length > maxLength) {
      text = text.substring(0, maxLength) + '...';
    }
    
    return text;
  }

  /**
   * 요약 생성
   * @param {string} text - 원본 텍스트
   * @param {number} maxLength - 최대 길이
   * @returns {string} 요약
   */
  generateSummary(text, maxLength) {
    if (text.length <= maxLength) {
      return text;
    }
    
    // 문장 단위로 분할
    const sentences = text.split(/[.!?。\n]+/).filter(s => s.trim().length > 0);
    
    let summary = '';
    for (const sentence of sentences) {
      if ((summary + sentence).length <= maxLength) {
        summary += sentence + '. ';
      } else {
        break;
      }
    }
    
    return summary.trim() || text.substring(0, maxLength) + '...';
  }

  /**
   * 이미지 캡처 (간단한 구현)
   * @param {string} url - URL
   * @returns {string|null} 이미지 data URL
   */
  async captureImage(url) {
    try {
      // 실제 구현에서는 Puppeteer나 다른 스크린샷 도구 사용
      // 여기서는 간단한 플레이스홀더 반환
      return `data:image/svg+xml;base64,${Buffer.from(`
        <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#f0f0f0"/>
          <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial" font-size="24" fill="#666">
            ${url}
          </text>
        </svg>
      `).toString('base64')}`;
    } catch (error) {
      console.error('이미지 캡처 실패:', error.message);
      return null;
    }
  }

  /**
   * 안전 관련 키워드 검색
   * @param {string} text - 텍스트
   * @returns {Array} 키워드 목록
   */
  extractSafetyKeywords(text) {
    // 설정에서 안전 키워드를 가져오기
    const safetyKeywords = this.config ? this.config.safety_keywords : [
      '안전', '보건', '위험', '사고', '재해', '예방', '점검', '검사',
      '교육', '훈련', '보호구', '작업환경', '유해물질', '화학물질',
      '건설', '공사', '작업', '장비', '기계', '전기', '화재', '폭발'
    ];
    
    const foundKeywords = [];
    const lowerText = text.toLowerCase();
    
    safetyKeywords.forEach(keyword => {
      if (lowerText.includes(keyword.toLowerCase())) {
        foundKeywords.push(keyword);
      }
    });
    
    return [...new Set(foundKeywords)]; // 중복 제거
  }

  /**
   * 추천 사이트 목록 조회
   * @param {string} category - 카테고리 (선택사항)
   * @returns {Object} 사이트 목록
   */
  getRecommendedSites(category = null) {
    if (!this.config || !this.config.recommended_sites) {
      return { error: '설정 파일을 찾을 수 없습니다.' };
    }

    if (category) {
      return {
        category,
        sites: this.config.recommended_sites[category] || []
      };
    }

    return {
      all_sites: this.config.recommended_sites,
      categories: Object.keys(this.config.recommended_sites)
    };
  }

  /**
   * 특정 카테고리의 사이트 목록 조회
   * @param {string} category - 카테고리명
   * @returns {Array} 사이트 목록
   */
  getSitesByCategory(category) {
    if (!this.config || !this.config.recommended_sites) {
      return [];
    }

    return this.config.recommended_sites[category] || [];
  }

  /**
   * 우선순위별 사이트 목록 조회
   * @param {string} priority - 우선순위 (high, medium, low)
   * @returns {Array} 사이트 목록
   */
  getSitesByPriority(priority) {
    if (!this.config || !this.config.recommended_sites) {
      return [];
    }

    const sites = [];
    Object.values(this.config.recommended_sites).forEach(categorySites => {
      categorySites.forEach(site => {
        if (site.priority === priority) {
          sites.push(site);
        }
      });
    });

    return sites;
  }

  /**
   * 안전 키워드 목록 조회
   * @returns {Array} 키워드 목록
   */
  getSafetyKeywords() {
    return this.config ? this.config.safety_keywords : [];
  }

  /**
   * 헬스체크
   * @returns {boolean} 상태
   */
  async healthCheck() {
    try {
      const response = await axios.get('https://httpbin.org/get', {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

module.exports = WebSnapshot;
