const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const logger = require('./logger.js');

class Cache {
  constructor(options = {}) {
    this.memoryCache = new Map();
    this.maxMemorySize = options.maxMemorySize || 100; // 최대 메모리 캐시 항목 수
    this.defaultTTL = options.defaultTTL || 3600000; // 1시간 (ms)
    this.cacheDir = options.cacheDir || path.join(__dirname, '../cache');
    this.enableFileCache = options.enableFileCache !== false;
    this.maxFileCacheSize = options.maxFileCacheSize || 100 * 1024 * 1024; // 100MB
    
    this.init();
  }

  async init() {
    if (this.enableFileCache) {
      try {
        await fs.mkdir(this.cacheDir, { recursive: true });
        await this.cleanupExpiredFiles();
      } catch (error) {
        logger.warn('캐시 디렉토리 초기화 실패', { error: error.message });
      }
    }
  }

  generateKey(key) {
    return crypto.createHash('md5').update(key).digest('hex');
  }

  // 메모리 캐시에 저장
  setMemory(key, value, ttl = this.defaultTTL) {
    const cacheKey = this.generateKey(key);
    const expiresAt = Date.now() + ttl;
    
    this.memoryCache.set(cacheKey, {
      value,
      expiresAt,
      size: JSON.stringify(value).length
    });

    // 메모리 캐시 크기 제한
    if (this.memoryCache.size > this.maxMemorySize) {
      this.evictOldestMemory();
    }

    logger.debug('메모리 캐시 저장', { key, ttl, size: this.memoryCache.size });
  }

  // 메모리 캐시에서 조회
  getMemory(key) {
    const cacheKey = this.generateKey(key);
    const item = this.memoryCache.get(cacheKey);
    
    if (!item) return null;
    
    if (Date.now() > item.expiresAt) {
      this.memoryCache.delete(cacheKey);
      return null;
    }
    
    logger.debug('메모리 캐시 히트', { key });
    return item.value;
  }

  // 파일 캐시에 저장
  async setFile(key, value, ttl = this.defaultTTL) {
    if (!this.enableFileCache) return;
    
    try {
      const cacheKey = this.generateKey(key);
      const cacheFile = path.join(this.cacheDir, `${cacheKey}.json`);
      
      const cacheData = {
        value,
        expiresAt: Date.now() + ttl,
        key: key,
        createdAt: Date.now()
      };
      
      await fs.writeFile(cacheFile, JSON.stringify(cacheData));
      
      logger.debug('파일 캐시 저장', { key, cacheFile });
    } catch (error) {
      logger.warn('파일 캐시 저장 실패', { key, error: error.message });
    }
  }

  // 파일 캐시에서 조회
  async getFile(key) {
    if (!this.enableFileCache) return null;
    
    try {
      const cacheKey = this.generateKey(key);
      const cacheFile = path.join(this.cacheDir, `${cacheKey}.json`);
      
      const data = await fs.readFile(cacheFile, 'utf-8');
      const cacheData = JSON.parse(data);
      
      if (Date.now() > cacheData.expiresAt) {
        await this.deleteFile(key);
        return null;
      }
      
      logger.debug('파일 캐시 히트', { key });
      return cacheData.value;
    } catch (error) {
      return null;
    }
  }

  // 통합 캐시 저장
  async set(key, value, ttl = this.defaultTTL) {
    this.setMemory(key, value, ttl);
    await this.setFile(key, value, ttl);
  }

  // 통합 캐시 조회
  async get(key) {
    // 먼저 메모리에서 조회
    let value = this.getMemory(key);
    if (value !== null) {
      return value;
    }
    
    // 메모리에 없으면 파일에서 조회
    value = await this.getFile(key);
    if (value !== null) {
      // 메모리에도 저장
      this.setMemory(key, value, this.defaultTTL);
    }
    
    return value;
  }

  // 캐시 삭제
  async delete(key) {
    const cacheKey = this.generateKey(key);
    this.memoryCache.delete(cacheKey);
    
    if (this.enableFileCache) {
      await this.deleteFile(key);
    }
    
    logger.debug('캐시 삭제', { key });
  }

  // 파일 캐시 삭제
  async deleteFile(key) {
    try {
      const cacheKey = this.generateKey(key);
      const cacheFile = path.join(this.cacheDir, `${cacheKey}.json`);
      await fs.unlink(cacheFile);
    } catch (error) {
      // 파일이 존재하지 않는 경우 무시
    }
  }

  // 만료된 메모리 캐시 정리
  evictOldestMemory() {
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const [key, item] of this.memoryCache.entries()) {
      if (item.expiresAt < oldestTime) {
        oldestTime = item.expiresAt;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
      logger.debug('오래된 메모리 캐시 제거', { key: oldestKey });
    }
  }

  // 만료된 파일 캐시 정리
  async cleanupExpiredFiles() {
    try {
      const files = await fs.readdir(this.cacheDir);
      const now = Date.now();
      let cleanedCount = 0;
      
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        
        try {
          const filePath = path.join(this.cacheDir, file);
          const data = await fs.readFile(filePath, 'utf-8');
          const cacheData = JSON.parse(data);
          
          if (now > cacheData.expiresAt) {
            await fs.unlink(filePath);
            cleanedCount++;
          }
        } catch (error) {
          // 손상된 파일 삭제
          try {
            await fs.unlink(path.join(this.cacheDir, file));
            cleanedCount++;
          } catch (unlinkError) {
            // 무시
          }
        }
      }
      
      if (cleanedCount > 0) {
        logger.info('만료된 파일 캐시 정리 완료', { cleanedCount });
      }
    } catch (error) {
      logger.warn('파일 캐시 정리 실패', { error: error.message });
    }
  }

  // 캐시 통계
  getStats() {
    const memorySize = this.memoryCache.size;
    const memoryKeys = Array.from(this.memoryCache.keys());
    
    return {
      memory: {
        size: memorySize,
        keys: memoryKeys,
        maxSize: this.maxMemorySize
      },
      file: {
        enabled: this.enableFileCache,
        directory: this.cacheDir
      },
      ttl: {
        default: this.defaultTTL
      }
    };
  }

  // 전체 캐시 클리어
  async clear() {
    this.memoryCache.clear();
    
    if (this.enableFileCache) {
      try {
        const files = await fs.readdir(this.cacheDir);
        for (const file of files) {
          if (file.endsWith('.json')) {
            await fs.unlink(path.join(this.cacheDir, file));
          }
        }
        logger.info('전체 캐시 클리어 완료');
      } catch (error) {
        logger.warn('파일 캐시 클리어 실패', { error: error.message });
      }
    }
  }

  // 주기적 정리 (1시간마다)
  startCleanupScheduler() {
    setInterval(() => {
      this.cleanupExpiredFiles();
    }, 3600000); // 1시간
  }
}

// 싱글톤 인스턴스
const cache = new Cache({
  maxMemorySize: parseInt(process.env.CACHE_MAX_MEMORY_SIZE) || 100,
  defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL) || 3600000,
  enableFileCache: process.env.CACHE_ENABLE_FILE !== 'false'
});

// 정리 스케줄러 시작
cache.startCleanupScheduler();

module.exports = cache;
