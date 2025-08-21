const { PrismaClient } = require('@prisma/client');

class DatabaseService {
  constructor() {
    this.prisma = new PrismaClient();
    this.isConnected = false;
  }

  async connect() {
    try {
      await this.prisma.$connect();
      this.isConnected = true;
      console.log('데이터베이스 연결 성공');
    } catch (error) {
      console.error('데이터베이스 연결 실패:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await this.prisma.$disconnect();
      this.isConnected = false;
      console.log('데이터베이스 연결 해제');
    } catch (error) {
      console.error('데이터베이스 연결 해제 실패:', error);
    }
  }

  // 프로젝트 관련 메서드
  async createProject(projectData) {
    try {
      return await this.prisma.project.create({
        data: projectData
      });
    } catch (error) {
      console.error('프로젝트 생성 실패:', error);
      throw error;
    }
  }

  async getProjects(filters = {}) {
    try {
      const where = {};
      
      if (filters.status) {
        where.status = filters.status;
      }
      
      if (filters.contractor) {
        where.contractor = { contains: filters.contractor, mode: 'insensitive' };
      }

      return await this.prisma.project.findMany({
        where,
        include: {
          reports: {
            select: {
              id: true,
              templateType: true,
              inspectionDate: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('프로젝트 조회 실패:', error);
      throw error;
    }
  }

  async getProjectById(id) {
    try {
      return await this.prisma.project.findUnique({
        where: { id },
        include: {
          reports: {
            include: {
              findings: true,
              recommendations: true,
              attachments: true
            }
          }
        }
      });
    } catch (error) {
      console.error('프로젝트 조회 실패:', error);
      throw error;
    }
  }

  // 보고서 관련 메서드
  async createReport(reportData) {
    try {
      const { findings, recommendations, ...reportInfo } = reportData;
      
      return await this.prisma.report.create({
        data: {
          ...reportInfo,
          findings: {
            create: findings.map(finding => ({
              category: finding.category,
              description: finding.description,
              severity: this.mapSeverity(finding.severity),
              lawReference: finding.lawReference,
              location: finding.location
            }))
          },
          recommendations: {
            create: recommendations.map(rec => ({
              description: rec.description,
              priority: this.mapPriority(rec.priority),
              dueDate: rec.dueDate ? new Date(rec.dueDate) : null,
              responsible: rec.responsible,
              status: this.mapRecommendationStatus(rec.status)
            }))
          }
        },
        include: {
          findings: true,
          recommendations: true,
          project: true,
          inspector: true
        }
      });
    } catch (error) {
      console.error('보고서 생성 실패:', error);
      throw error;
    }
  }

  async getReports(filters = {}) {
    try {
      const where = {};
      
      if (filters.projectId) {
        where.projectId = filters.projectId;
      }
      
      if (filters.templateType) {
        where.templateType = filters.templateType;
      }
      
      if (filters.status) {
        where.status = filters.status;
      }
      
      if (filters.inspectorId) {
        where.inspectorId = filters.inspectorId;
      }

      return await this.prisma.report.findMany({
        where,
        include: {
          project: {
            select: {
              name: true,
              location: true,
              contractor: true
            }
          },
          inspector: {
            select: {
              name: true,
              email: true
            }
          },
          findings: true,
          recommendations: true,
          _count: {
            select: {
              attachments: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('보고서 조회 실패:', error);
      throw error;
    }
  }

  async getReportById(id) {
    try {
      return await this.prisma.report.findUnique({
        where: { id },
        include: {
          project: true,
          inspector: true,
          findings: true,
          recommendations: true,
          attachments: true,
          auditLogs: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      });
    } catch (error) {
      console.error('보고서 조회 실패:', error);
      throw error;
    }
  }

  async updateReport(id, updateData) {
    try {
      const { findings, recommendations, ...reportInfo } = updateData;
      
      // 기존 발견사항과 권고사항 삭제 후 재생성
      await this.prisma.finding.deleteMany({
        where: { reportId: id }
      });
      
      await this.prisma.recommendation.deleteMany({
        where: { reportId: id }
      });

      return await this.prisma.report.update({
        where: { id },
        data: {
          ...reportInfo,
          findings: {
            create: findings.map(finding => ({
              category: finding.category,
              description: finding.description,
              severity: this.mapSeverity(finding.severity),
              lawReference: finding.lawReference,
              location: finding.location
            }))
          },
          recommendations: {
            create: recommendations.map(rec => ({
              description: rec.description,
              priority: this.mapPriority(rec.priority),
              dueDate: rec.dueDate ? new Date(rec.dueDate) : null,
              responsible: rec.responsible,
              status: this.mapRecommendationStatus(rec.status)
            }))
          }
        },
        include: {
          findings: true,
          recommendations: true,
          project: true,
          inspector: true
        }
      });
    } catch (error) {
      console.error('보고서 수정 실패:', error);
      throw error;
    }
  }

  async deleteReport(id) {
    try {
      return await this.prisma.report.delete({
        where: { id }
      });
    } catch (error) {
      console.error('보고서 삭제 실패:', error);
      throw error;
    }
  }

  // 첨부파일 관련 메서드
  async addAttachment(reportId, attachmentData) {
    try {
      return await this.prisma.attachment.create({
        data: {
          reportId,
          ...attachmentData
        }
      });
    } catch (error) {
      console.error('첨부파일 추가 실패:', error);
      throw error;
    }
  }

  async getAttachments(reportId) {
    try {
      return await this.prisma.attachment.findMany({
        where: { reportId },
        orderBy: { uploadedAt: 'desc' }
      });
    } catch (error) {
      console.error('첨부파일 조회 실패:', error);
      throw error;
    }
  }

  // 감사 로그 관련 메서드
  async logAction(reportId, action, details = null, ipAddress = null, userAgent = null) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          reportId,
          action,
          details,
          ipAddress,
          userAgent
        }
      });
    } catch (error) {
      console.error('감사 로그 생성 실패:', error);
      // 감사 로그 실패는 전체 작업을 중단하지 않음
    }
  }

  // 사용자 관련 메서드
  async createUser(userData) {
    try {
      return await this.prisma.user.create({
        data: userData
      });
    } catch (error) {
      console.error('사용자 생성 실패:', error);
      throw error;
    }
  }

  async getUserByEmail(email) {
    try {
      return await this.prisma.user.findUnique({
        where: { email }
      });
    } catch (error) {
      console.error('사용자 조회 실패:', error);
      throw error;
    }
  }

  // 통계 메서드
  async getReportStats(filters = {}) {
    try {
      const where = {};
      
      if (filters.projectId) {
        where.projectId = filters.projectId;
      }
      
      if (filters.startDate) {
        where.inspectionDate = {
          gte: new Date(filters.startDate)
        };
      }
      
      if (filters.endDate) {
        where.inspectionDate = {
          ...where.inspectionDate,
          lte: new Date(filters.endDate)
        };
      }

      const [totalReports, pendingRecommendations, highSeverityFindings] = await Promise.all([
        this.prisma.report.count({ where }),
        this.prisma.recommendation.count({
          where: {
            report: where,
            status: 'PENDING'
          }
        }),
        this.prisma.finding.count({
          where: {
            report: where,
            severity: 'HIGH'
          }
        })
      ]);

      return {
        totalReports,
        pendingRecommendations,
        highSeverityFindings
      };
    } catch (error) {
      console.error('통계 조회 실패:', error);
      throw error;
    }
  }

  // 열거형 매핑 메서드
  mapSeverity(severity) {
    const mapping = {
      '높음': 'HIGH',
      '보통': 'MEDIUM',
      '낮음': 'LOW'
    };
    return mapping[severity] || 'MEDIUM';
  }

  mapPriority(priority) {
    const mapping = {
      '긴급': 'URGENT',
      '높음': 'HIGH',
      '보통': 'MEDIUM',
      '낮음': 'LOW'
    };
    return mapping[priority] || 'MEDIUM';
  }

  mapRecommendationStatus(status) {
    const mapping = {
      '미조치': 'PENDING',
      '조치중': 'IN_PROGRESS',
      '조치완료': 'COMPLETED'
    };
    return mapping[status] || 'PENDING';
  }

  // 헬스체크
  async healthCheck() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = DatabaseService;
