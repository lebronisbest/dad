const axios = require('axios');

class LawFetcher {
  constructor() {
    // 한국산업안전보건공단 안전보건법령 스마트검색 API
    this.baseUrl = process.env.KOSHA_API_BASE_URL || 'https://www.kosha.or.kr/kosha/data/openapi/lawSearch.do';
    this.apiKey = '2412dbcc3334b992d01beeb1c5a32b3d7d54c64e9f011056a04edff66e7aeb6b'; // 하드코딩된 API 키
    this.cache = new Map();
    this.cacheTimeout = 6 * 60 * 60 * 1000; // 6시간
  }

  /**
   * 법령 검색 (한국산업안전보건공단 API 사용)
   * @param {Object} params - 검색 파라미터
   * @returns {Object} 검색 결과
   */
  async fetchLaw(params) {
    const { query, filters = {} } = params;
    
    try {
      // 캐시 확인
      const cacheKey = this.generateCacheKey(query, filters);
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult) {
        return {
          ...cachedResult,
          from_cache: true
        };
      }

      // 한국산업안전보건공단 API 호출
      const searchParams = {
        serviceKey: this.apiKey,
        query: query,
        pageNo: filters.pageNo || 1,
        numOfRows: filters.numOfRows || 10,
        type: 'json'
      };

      // 추가 필터 적용
      if (filters.lawType) searchParams.lawType = filters.lawType;
      if (filters.category) searchParams.category = filters.category;

      const response = await axios.get(this.baseUrl, {
        params: searchParams,
        timeout: 15000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Safety-Report-MCP/1.0'
        }
      });

      const results = this.parseKoshaResponse(response.data);
      
      // 캐시에 저장
      this.setCache(cacheKey, results);

      return {
        items: results,
        notes: `"${query}" 검색 결과 (한국산업안전보건공단 API)`,
        total_count: results.length,
        query,
        filters,
        api_source: 'KOSHA'
      };

    } catch (error) {
      console.error('한국산업안전보건공단 API 호출 실패:', error.message);
      
      // 로컬 법령 파일에서 대체 검색
      return this.searchLocalLaws(query);
    }
  }

  /**
   * 한국산업안전보건공단 API 응답 파싱
   * @param {Object} data - JSON 응답
   * @returns {Array} 파싱된 결과
   */
  parseKoshaResponse(data) {
    const results = [];
    
    try {
      // API 응답 구조에 따라 파싱
      if (data.response && data.response.body && data.response.body.items) {
        const items = Array.isArray(data.response.body.items.item) 
          ? data.response.body.items.item 
          : [data.response.body.items.item];
        
        items.forEach(item => {
          if (item) {
            results.push({
              title: item.lawName || item.title || '제목 없음',
              snippet: item.content || item.summary || item.description || '내용 없음',
              source_url: item.url || this.generateKoshaUrl(item.lawName || item.title),
              published_at: item.pubDate || item.updateDate || '날짜 정보 없음',
              law_type: item.lawType || '법령',
              category: item.category || '안전관리',
              relevance_score: this.calculateRelevance(item.lawName || item.title, item.content || item.summary)
            });
          }
        });
      }
      
      // 관련성 점수로 정렬
      results.sort((a, b) => b.relevance_score - a.relevance_score);
      
      // 상위 10개만 반환
      return results.slice(0, 10);

    } catch (error) {
      console.error('한국산업안전보건공단 API 응답 파싱 실패:', error.message);
      return [];
    }
  }

  /**
   * 기존 법령 응답 파싱 (하위 호환성)
   * @param {string} html - HTML 응답
   * @returns {Array} 파싱된 결과
   */
  parseLawResponse(html) {
    const results = [];
    
    try {
      // 간단한 HTML 파싱 (실제로는 더 정교한 파싱 필요)
      const lawPattern = /<tr[^>]*>.*?<td[^>]*>([^<]+)<\/td>.*?<td[^>]*>([^<]+)<\/td>.*?<td[^>]*>([^<]+)<\/td>/gs;
      let match;
      
      while ((match = lawPattern.exec(html)) !== null) {
        if (match[1] && match[2] && match[3]) {
          results.push({
            title: this.cleanText(match[1]),
            snippet: this.cleanText(match[2]),
            source_url: this.generateLawUrl(match[1]),
            published_at: this.cleanText(match[3]),
            relevance_score: this.calculateRelevance(match[1], match[2])
          });
        }
      }

      // 관련성 점수로 정렬
      results.sort((a, b) => b.relevance_score - a.relevance_score);
      
      // 상위 5개만 반환
      return results.slice(0, 5);

    } catch (error) {
      console.error('법령 응답 파싱 실패:', error.message);
      return [];
    }
  }

  /**
   * 텍스트 정리
   * @param {string} text - 원본 텍스트
   * @returns {string} 정리된 텍스트
   */
  cleanText(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/&[^;]+;/g, '')
      .trim();
  }

  /**
   * 한국산업안전보건공단 법령 URL 생성
   * @param {string} title - 법령 제목
   * @returns {string} URL
   */
  generateKoshaUrl(title) {
    const encodedTitle = encodeURIComponent(title);
    return `https://www.kosha.or.kr/kosha/data/openapi/lawSearch.do?query=${encodedTitle}`;
  }

  /**
   * 기존 법령 URL 생성 (하위 호환성)
   * @param {string} title - 법령 제목
   * @returns {string} URL
   */
  generateLawUrl(title) {
    const encodedTitle = encodeURIComponent(title);
    return `https://www.law.go.kr/DRF/lawSearch.do?target=law&type=HTML&query=${encodedTitle}`;
  }

  /**
   * 관련성 점수 계산
   * @param {string} title - 제목
   * @param {string} snippet - 요약
   * @returns {number} 점수
   */
  calculateRelevance(title, snippet) {
    const safetyKeywords = [
      '안전', '보건', '산업안전', '건설업', '화학물질', '유해물질',
      '작업환경', '보호구', '교육', '점검', '검사', '허가', '신고'
    ];
    
    let score = 0;
    const text = (title + ' ' + snippet).toLowerCase();
    
    safetyKeywords.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) {
        score += 10;
      }
    });
    
    return score;
  }

  /**
   * 로컬 법령 파일에서 검색 (API 실패 시 대체)
   * @param {string} query - 검색어
   * @returns {Object} 검색 결과
   */
  async searchLocalLaws(query) {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      const legalDir = path.join(__dirname, '../legal');
      
      // legal 폴더가 존재하는지 확인
      try {
        await fs.access(legalDir);
      } catch (error) {
        // legal 폴더가 없으면 기존 fallback 데이터 반환
        return this.getFallbackData(query);
      }
      
      const lawFiles = await fs.readdir(legalDir);
      const searchResults = [];
      
      for (const file of lawFiles) {
        if (file.endsWith('.json')) {
          const filePath = path.join(legalDir, file);
          const lawData = JSON.parse(await fs.readFile(filePath, 'utf-8'));
          
          // 키워드 검색
          const matchingArticles = lawData.articles.filter(article => 
            article.title.includes(query) || 
            article.content.includes(query) ||
            article.category.includes(query) ||
            lawData.keywords.some(keyword => keyword.includes(query))
          );
          
          if (matchingArticles.length > 0) {
            searchResults.push({
              title: lawData.law_name,
              snippet: lawData.summary,
              source_url: this.generateKoshaUrl(lawData.law_name),
              published_at: lawData.enforcement_date,
              law_type: lawData.law_type,
              category: lawData.categories[0] || '안전관리',
              relevance_score: this.calculateRelevance(lawData.law_name, lawData.summary),
              matching_articles: matchingArticles
            });
          }
        }
      }
      
      if (searchResults.length === 0) {
        return this.getFallbackData(query);
      }
      
      // 관련성 점수로 정렬
      searchResults.sort((a, b) => b.relevance_score - a.relevance_score);
      
      return {
        items: searchResults,
        notes: `"${query}" 검색 결과 (로컬 법령 파일)`,
        total_count: searchResults.length,
        query,
        from_local: true
      };
      
    } catch (error) {
      console.error('로컬 법령 검색 실패:', error.message);
      return this.getFallbackData(query);
    }
  }

  /**
   * 대체 데이터 반환 (최후 수단)
   * @param {string} query - 검색어
   * @returns {Object} 대체 결과
   */
  getFallbackData(query) {
    const fallbackLaws = [
      {
        title: '산업안전보건법',
        snippet: '근로자의 안전과 보건을 확보하고 쾌적한 작업환경을 조성하기 위한 법률',
        source_url: 'https://www.kosha.or.kr/kosha/data/openapi/lawSearch.do?query=산업안전보건법',
        published_at: '2024.01.16',
        law_type: '법률',
        category: '안전관리',
        relevance_score: 100
      },
      {
        title: '건설업법',
        snippet: '건설업의 건전한 발전과 건설공사의 적정한 시공을 위한 법률',
        source_url: 'https://www.kosha.or.kr/kosha/data/openapi/lawSearch.do?query=건설업법',
        published_at: '2024.01.16',
        law_type: '법률',
        category: '건설업',
        relevance_score: 90
      },
      {
        title: '화학물질관리법',
        snippet: '화학물질의 적절한 관리를 통하여 국민건강과 환경을 보호하는 법률',
        source_url: 'https://www.kosha.or.kr/kosha/data/openapi/lawSearch.do?query=화학물질관리법',
        published_at: '2024.01.16',
        law_type: '법률',
        category: '화학물질',
        relevance_score: 85
      }
    ];

    return {
      items: fallbackLaws.filter(law => 
        law.title.toLowerCase().includes(query.toLowerCase()) ||
        law.snippet.toLowerCase().includes(query.toLowerCase())
      ),
      notes: `"${query}" 검색 결과 (대체 데이터)`,
      total_count: fallbackLaws.length,
      query,
      from_fallback: true
    };
  }

  /**
   * 캐시 키 생성
   * @param {string} query - 검색어
   * @param {Object} filters - 필터
   * @returns {string} 캐시 키
   */
  generateCacheKey(query, filters) {
    return `${query}_${JSON.stringify(filters)}`;
  }

  /**
   * 캐시에서 데이터 가져오기
   * @param {string} key - 캐시 키
   * @returns {Object|null} 캐시된 데이터
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    if (cached) {
      this.cache.delete(key);
    }
    
    return null;
  }

  /**
   * 캐시에 데이터 저장
   * @param {string} key - 캐시 키
   * @param {Object} data - 저장할 데이터
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 캐시 정리
   */
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 헬스체크
   * @returns {boolean} 상태
   */
  async healthCheck() {
    try {
      const response = await axios.get(this.baseUrl, {
        params: { 
          serviceKey: this.apiKey,
          query: '안전',
          pageNo: 1,
          numOfRows: 1,
          type: 'json'
        },
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

module.exports = LawFetcher;
