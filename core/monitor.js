const os = require('os');
const process = require('process');
const logger = require('./logger.js');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        error: 0,
        byTool: new Map()
      },
      performance: {
        responseTimes: [],
        memoryUsage: [],
        cpuUsage: []
      },
      errors: {
        byType: new Map(),
        recent: []
      }
    };
    
    this.startTime = Date.now();
    this.maxResponseTimes = 1000; // 최대 저장할 응답 시간 수
    this.maxErrors = 100; // 최대 저장할 에러 수
    
    this.startMonitoring();
  }

  // 요청 시작 기록
  startRequest(toolName) {
    const requestId = this.generateRequestId();
    const startTime = process.hrtime.bigint();
    
    this.metrics.requests.total++;
    
    if (!this.metrics.requests.byTool.has(toolName)) {
      this.metrics.requests.byTool.set(toolName, {
        total: 0,
        success: 0,
        error: 0,
        avgResponseTime: 0
      });
    }
    
    const toolStats = this.metrics.requests.byTool.get(toolName);
    toolStats.total++;
    
    return {
      requestId,
      startTime,
      toolName
    };
  }

  // 요청 완료 기록
  endRequest(requestInfo, success = true, error = null) {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - requestInfo.startTime) / 1000000; // ms
    
    // 전체 통계 업데이트
    if (success) {
      this.metrics.requests.success++;
    } else {
      this.metrics.requests.error++;
    }
    
    // 도구별 통계 업데이트
    const toolStats = this.metrics.requests.byTool.get(requestInfo.toolName);
    if (success) {
      toolStats.success++;
    } else {
      toolStats.error++;
    }
    
    // 응답 시간 통계 업데이트
    toolStats.avgResponseTime = this.updateAverageResponseTime(
      toolStats.avgResponseTime,
      duration,
      toolStats.total
    );
    
    // 전체 응답 시간 기록
    this.metrics.performance.responseTimes.push({
      tool: requestInfo.toolName,
      duration,
      timestamp: Date.now()
    });
    
    // 최대 개수 제한
    if (this.metrics.performance.responseTimes.length > this.maxResponseTimes) {
      this.metrics.performance.responseTimes.shift();
    }
    
    // 에러 기록
    if (error) {
      this.recordError(error, requestInfo.toolName);
    }
    
    logger.debug('요청 완료', {
      tool: requestInfo.toolName,
      duration_ms: duration.toFixed(2),
      success
    });
  }

  // 에러 기록
  recordError(error, toolName) {
    const errorType = error.name || 'UnknownError';
    const errorInfo = {
      type: errorType,
      message: error.message,
      tool: toolName,
      timestamp: Date.now(),
      stack: error.stack
    };
    
    // 에러 타입별 통계
    if (!this.metrics.errors.byType.has(errorType)) {
      this.metrics.errors.byType.set(errorType, 0);
    }
    this.metrics.errors.byType.set(errorType, this.metrics.errors.byType.get(errorType) + 1);
    
    // 최근 에러 기록
    this.metrics.errors.recent.push(errorInfo);
    if (this.metrics.errors.recent.length > this.maxErrors) {
      this.metrics.errors.recent.shift();
    }
    
    logger.error('에러 발생', errorInfo);
  }

  // 평균 응답 시간 계산
  updateAverageResponseTime(currentAvg, newValue, totalCount) {
    return (currentAvg * (totalCount - 1) + newValue) / totalCount;
  }

  // 시스템 리소스 모니터링
  recordSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    this.metrics.performance.memoryUsage.push({
      rss: memUsage.rss,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      timestamp: Date.now()
    });
    
    this.metrics.performance.cpuUsage.push({
      user: cpuUsage.user,
      system: cpuUsage.system,
      timestamp: Date.now()
    });
    
    // 최대 개수 제한
    if (this.metrics.performance.memoryUsage.length > 100) {
      this.metrics.performance.memoryUsage.shift();
    }
    if (this.metrics.performance.cpuUsage.length > 100) {
      this.metrics.performance.cpuUsage.shift();
    }
  }

  // 요청 ID 생성
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 모니터링 시작
  startMonitoring() {
    // 시스템 메트릭 수집 (10초마다)
    setInterval(() => {
      this.recordSystemMetrics();
    }, 10000);
    
    // 성능 리포트 생성 (1분마다)
    setInterval(() => {
      this.generatePerformanceReport();
    }, 60000);
  }

  // 성능 리포트 생성
  generatePerformanceReport() {
    const uptime = Date.now() - this.startTime;
    const uptimeHours = (uptime / 3600000).toFixed(2);
    
    const report = {
      uptime_hours: uptimeHours,
      requests: {
        total: this.metrics.requests.total,
        success: this.metrics.requests.success,
        error: this.metrics.requests.error,
        success_rate: this.metrics.requests.total > 0 
          ? ((this.metrics.requests.success / this.metrics.requests.total) * 100).toFixed(2) + '%'
          : '0%'
      },
      tools: Object.fromEntries(
        Array.from(this.metrics.requests.byTool.entries()).map(([tool, stats]) => [
          tool,
          {
            total: stats.total,
            success: stats.success,
            error: stats.error,
            avg_response_time_ms: stats.avgResponseTime.toFixed(2)
          }
        ])
      ),
      system: {
        memory: this.getCurrentMemoryUsage(),
        cpu: this.getCurrentCpuUsage(),
        platform: os.platform(),
        arch: os.arch(),
        node_version: process.version
      }
    };
    
    logger.info('성능 리포트', report);
    return report;
  }

  // 현재 메모리 사용량
  getCurrentMemoryUsage() {
    const memUsage = process.memoryUsage();
    return {
      rss_mb: (memUsage.rss / 1024 / 1024).toFixed(2),
      heap_used_mb: (memUsage.heapUsed / 1024 / 1024).toFixed(2),
      heap_total_mb: (memUsage.heapTotal / 1024 / 1024).toFixed(2),
      external_mb: (memUsage.external / 1024 / 1024).toFixed(2)
    };
  }

  // 현재 CPU 사용량
  getCurrentCpuUsage() {
    const cpuUsage = process.cpuUsage();
    return {
      user_ms: cpuUsage.user,
      system_ms: cpuUsage.system
    };
  }

  // 특정 도구의 성능 통계
  getToolStats(toolName) {
    return this.metrics.requests.byTool.get(toolName) || null;
  }

  // 전체 통계 조회
  getStats() {
    return {
      ...this.metrics,
      uptime: Date.now() - this.startTime,
      current_memory: this.getCurrentMemoryUsage(),
      current_cpu: this.getCurrentCpuUsage()
    };
  }

  // 통계 초기화
  resetStats() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        error: 0,
        byTool: new Map()
      },
      performance: {
        responseTimes: [],
        memoryUsage: [],
        cpuUsage: []
      },
      errors: {
        byType: new Map(),
        recent: []
      }
    };
    
    this.startTime = Date.now();
    logger.info('성능 통계 초기화 완료');
  }

  // 헬스체크
  getHealthStatus() {
    const uptime = Date.now() - this.startTime;
    const errorRate = this.metrics.requests.total > 0 
      ? this.metrics.requests.error / this.metrics.requests.total 
      : 0;
    
    const memoryUsage = this.getCurrentMemoryUsage();
    const memoryUsagePercent = (parseFloat(memoryUsage.heap_used_mb) / parseFloat(memoryUsage.heap_total_mb)) * 100;
    
    return {
      status: errorRate < 0.1 && memoryUsagePercent < 90 ? 'healthy' : 'degraded',
      uptime_hours: (uptime / 3600000).toFixed(2),
      error_rate: (errorRate * 100).toFixed(2) + '%',
      memory_usage_percent: memoryUsagePercent.toFixed(2) + '%',
      total_requests: this.metrics.requests.total
    };
  }
}

// 싱글톤 인스턴스
const monitor = new PerformanceMonitor();

module.exports = monitor;
