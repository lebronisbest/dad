import { performance } from 'perf_hooks';
import logger from './logger.js';

// ✅ 에러율 알림 설정 (프로젝트 TT 가이드라인: 5분 실패율 > 2%)
const ERROR_RATE_CONFIG = {
  WARNING_THRESHOLD: 0.02, // 2% (0.02)
  CRITICAL_THRESHOLD: 0.05, // 5% (0.05)
  MONITORING_WINDOW: 5 * 60 * 1000, // 5분 (밀리초)
  ALERT_COOLDOWN: 2 * 60 * 1000, // 2분 (밀리초)
};

// ✅ 에러율 모니터링 상태
let errorRateAlerts = {
  lastWarningTime: 0,
  lastCriticalTime: 0,
  warningCount: 0,
  criticalCount: 0,
  isAlerting: false,
};

/**
 * PDF 렌더링 메트릭스 수집기
 */
class PDFMetricsCollector {
  constructor() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      stageMetrics: {
        normalization: [],
        backfill: [],
        sanitization: [],
        imageProcessing: [],
        schemaNormalization: [],
        defaultSetting: [],
        pdfRendering: []
      },
      performanceMetrics: {
        p50: 0,
        p95: 0,
        p99: 0,
        average: 0,
        min: Infinity,
        max: 0
      },
      errorRates: {
        normalization: 0,
        backfill: 0,
        sanitization: 0,
        imageProcessing: 0,
        schemaNormalization: 0,
        defaultSetting: 0,
        pdfRendering: 0
      },
      lastUpdated: new Date().toISOString()
    };
    
    this.stageTimers = new Map();
    
    // ✅ 에러율 모니터링 시작
    this.startErrorRateMonitoring();
  }

  // ✅ 에러율 모니터링 시작
  startErrorRateMonitoring() {
    setInterval(() => {
      this.checkErrorRate();
    }, 30000); // 30초마다 체크
  }

  // ✅ 에러율 체크 및 알림
  checkErrorRate() {
    const now = Date.now();
    const windowStart = now - ERROR_RATE_CONFIG.MONITORING_WINDOW;
    
    // 최근 5분간의 요청 수집
    const recentRequests = this.getRecentRequests(windowStart);
    
    if (recentRequests.total === 0) return;
    
    const errorRate = recentRequests.failed / recentRequests.total;
    
    // 경고 임계값 체크
    if (errorRate > ERROR_RATE_CONFIG.CRITICAL_THRESHOLD) {
      if (now - errorRateAlerts.lastCriticalTime > ERROR_RATE_CONFIG.ALERT_COOLDOWN) {
        this.triggerCriticalAlert(errorRate, recentRequests);
        errorRateAlerts.lastCriticalTime = now;
        errorRateAlerts.criticalCount++;
      }
    } else if (errorRate > ERROR_RATE_CONFIG.WARNING_THRESHOLD) {
      if (now - errorRateAlerts.lastWarningTime > ERROR_RATE_CONFIG.ALERT_COOLDOWN) {
        this.triggerWarningAlert(errorRate, recentRequests);
        errorRateAlerts.lastWarningTime = now;
        errorRateAlerts.warningCount++;
      }
    }
  }

  // ✅ 최근 요청 데이터 수집
  getRecentRequests(since) {
    const recentRequests = {
      total: 0,
      failed: 0,
      successful: 0,
      errors: []
    };
    
    // 각 단계별 메트릭스에서 최근 요청 수집
    Object.values(this.metrics.stageMetrics).forEach(stageData => {
      stageData.forEach(entry => {
        const entryTime = new Date(entry.timestamp).getTime();
        if (entryTime >= since) {
          recentRequests.total++;
          if (entry.success) {
            recentRequests.successful++;
          } else {
            recentRequests.failed++;
            if (entry.error) {
              recentRequests.errors.push(entry.error);
            }
          }
        }
      });
    });
    
    return recentRequests;
  }

  // ✅ 심각한 에러율 알림
  triggerCriticalAlert(errorRate, recentRequests) {
    const alertMessage = `🚨 심각한 에러율 알림: ${(errorRate * 100).toFixed(1)}% (${recentRequests.failed}/${recentRequests.total})`;
    logger.error(alertMessage, {
      errorRate: errorRate,
      recentRequests: recentRequests,
      timestamp: new Date().toISOString(),
      alertType: 'critical_error_rate'
    });
    
    // 시스템 관리자에게 알림 (실제 환경에서는 Slack, 이메일 등)
    this.sendSystemAlert('critical', alertMessage, recentRequests);
  }

  // ✅ 경고 에러율 알림
  triggerWarningAlert(errorRate, recentRequests) {
    const alertMessage = `⚠️ 에러율 경고: ${(errorRate * 100).toFixed(1)}% (${recentRequests.failed}/${recentRequests.total})`;
    logger.warn(alertMessage, {
      errorRate: errorRate,
      recentRequests: recentRequests,
      timestamp: new Date().toISOString(),
      alertType: 'warning_error_rate'
    });
    
    // 시스템 관리자에게 알림
    this.sendSystemAlert('warning', alertMessage, recentRequests);
  }

  // ✅ 시스템 알림 전송 (확장 가능)
  sendSystemAlert(level, message, data) {
    try {
      // 실제 환경에서는 Slack, 이메일, SMS 등으로 전송
      if (process.env.ALERT_WEBHOOK_URL) {
        // Slack 웹훅 예시
        this.sendSlackAlert(level, message, data);
      }
      
      // 로컬 환경에서는 콘솔에 출력
      console.log(`[${level.toUpperCase()}] ${message}`);
      console.log('상세 데이터:', JSON.stringify(data, null, 2));
      
    } catch (error) {
      logger.error('시스템 알림 전송 실패:', error);
    }
  }

  // ✅ Slack 알림 전송 (예시)
  async sendSlackAlert(level, message, data) {
    try {
      const webhookUrl = process.env.ALERT_WEBHOOK_URL;
      if (!webhookUrl) return;
      
      const payload = {
        text: message,
        attachments: [{
          color: level === 'critical' ? '#ff0000' : '#ffaa00',
          fields: [
            {
              title: '에러율',
              value: `${(data.errorRate * 100).toFixed(1)}%`,
              short: true
            },
            {
              title: '실패/전체',
              value: `${data.failed}/${data.total}`,
              short: true
            },
            {
              title: '시간',
              value: new Date().toLocaleString('ko-KR'),
              short: true
            }
          ]
        }]
      };
      
      // 실제 구현에서는 fetch 또는 axios 사용
      // await fetch(webhookUrl, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payload)
      // });
      
    } catch (error) {
      logger.error('Slack 알림 전송 실패:', error);
    }
  }

  /**
   * 단계별 타이머 시작
   * @param {string} stage - 단계명
   */
  startStage(stage) {
    this.stageTimers.set(stage, performance.now());
  }

  /**
   * 단계별 타이머 종료 및 메트릭스 기록
   * @param {string} stage - 단계명
   * @param {boolean} success - 성공 여부
   */
  endStage(stage, success = true) {
    const startTime = this.stageTimers.get(stage);
    if (!startTime) return;

    const duration = performance.now() - startTime;
    this.stageTimers.delete(stage);

    // 단계별 메트릭스 기록
    if (!this.metrics.stageMetrics[stage]) {
      this.metrics.stageMetrics[stage] = [];
    }
    
    this.metrics.stageMetrics[stage].push({
      duration,
      success,
      timestamp: new Date().toISOString()
    });

    // 최근 100개만 유지
    if (this.metrics.stageMetrics[stage].length > 100) {
      this.metrics.stageMetrics[stage] = this.metrics.stageMetrics[stage].slice(-100);
    }

    // 에러율 계산
    this.updateErrorRates(stage);
  }

  /**
   * 전체 요청 메트릭스 기록
   * @param {boolean} success - 성공 여부
   * @param {number} totalTime - 전체 처리 시간
   */
  recordRequest(success, totalTime) {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // 성능 메트릭스 업데이트
    this.updatePerformanceMetrics(totalTime);
    this.metrics.lastUpdated = new Date().toISOString();
  }

  /**
   * 성능 메트릭스 업데이트
   * @param {number} duration - 처리 시간
   */
  updatePerformanceMetrics(duration) {
    const { performanceMetrics } = this.metrics;
    
    // 최소/최대값 업데이트
    performanceMetrics.min = Math.min(performanceMetrics.min, duration);
    performanceMetrics.max = Math.max(performanceMetrics.max, duration);

    // 모든 단계의 처리 시간을 수집
    const allDurations = Object.values(this.metrics.stageMetrics)
      .flat()
      .map(m => m.duration)
      .filter(d => d > 0);

    if (allDurations.length > 0) {
      // 평균 계산
      performanceMetrics.average = allDurations.reduce((sum, d) => sum + d, 0) / allDurations.length;
      
      // 백분위수 계산
      const sorted = allDurations.sort((a, b) => a - b);
      performanceMetrics.p50 = sorted[Math.floor(sorted.length * 0.5)];
      performanceMetrics.p95 = sorted[Math.floor(sorted.length * 0.95)];
      performanceMetrics.p99 = sorted[Math.floor(sorted.length * 0.99)];
    }
  }

  /**
   * 에러율 업데이트
   * @param {string} stage - 단계명
   */
  updateErrorRates(stage) {
    const stageData = this.metrics.stageMetrics[stage];
    if (!stageData || stageData.length === 0) return;

    const total = stageData.length;
    const failed = stageData.filter(m => !m.success).length;
    this.metrics.errorRates[stage] = (failed / total) * 100;
  }

  /**
   * 메트릭스 데이터 반환
   * @returns {Object} 메트릭스 데이터
   */
  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalRequests > 0 
        ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100 
        : 0,
      failureRate: this.metrics.totalRequests > 0 
        ? (this.metrics.failedRequests / this.metrics.totalRequests) * 100 
        : 0
    };
  }

  /**
   * 메트릭스 초기화
   */
  reset() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      stageMetrics: {
        normalization: [],
        backfill: [],
        sanitization: [],
        imageProcessing: [],
        schemaNormalization: [],
        defaultSetting: [],
        pdfRendering: []
      },
      performanceMetrics: {
        p50: 0,
        p95: 0,
        p99: 0,
        average: 0,
        min: Infinity,
        max: 0
      },
      errorRates: {
        normalization: 0,
        backfill: 0,
        sanitization: 0,
        imageProcessing: 0,
        schemaNormalization: 0,
        defaultSetting: 0,
        pdfRendering: 0
      },
      lastUpdated: new Date().toISOString()
    };
    
    this.stageTimers.clear();
    logger.info('메트릭스 초기화 완료');
  }

  /**
   * 메트릭스 상태 확인
   * @returns {Object} 상태 정보
   */
  getHealthStatus() {
    const { errorRates, performanceMetrics } = this.metrics;
    
    // 에러율이 10% 이상인 단계 확인
    const highErrorStages = Object.entries(errorRates)
      .filter(([stage, rate]) => rate > 10)
      .map(([stage, rate]) => ({ stage, rate }));

    // 성능 이슈 확인 (p95가 30초 이상)
    const performanceIssues = performanceMetrics.p95 > 30000;

    return {
      healthy: highErrorStages.length === 0 && !performanceIssues,
      highErrorStages,
      performanceIssues,
      lastUpdated: this.metrics.lastUpdated
    };
  }
}

// 싱글톤 인스턴스
const metricsCollector = new PDFMetricsCollector();

/**
 * 메트릭스 수집 헬퍼 함수들
 */
export const MetricsHelpers = {
  /**
   * 단계 시작
   * @param {string} stage - 단계명
   */
  startStage: (stage) => metricsCollector.startStage(stage),

  /**
   * 단계 완료
   * @param {string} stage - 단계명
   * @param {boolean} success - 성공 여부
   */
  endStage: (stage, success = true) => metricsCollector.endStage(stage, success),

  /**
   * 요청 완료
   * @param {boolean} success - 성공 여부
   * @param {number} totalTime - 전체 처리 시간
   */
  recordRequest: (success, totalTime) => metricsCollector.recordRequest(success, totalTime),

  /**
   * 메트릭스 데이터 조회
   * @returns {Object} 메트릭스 데이터
   */
  getMetrics: () => metricsCollector.getMetrics(),

  /**
   * 헬스 상태 조회
   * @returns {Object} 헬스 상태
   */
  getHealthStatus: () => metricsCollector.getHealthStatus(),

  /**
   * 메트릭스 초기화
   */
  reset: () => metricsCollector.reset()
};

// 기본 export
export default metricsCollector;
