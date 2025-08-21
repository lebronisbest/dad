const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const DatabaseService = require('./database');

class AuthService {
  constructor() {
    this.db = new DatabaseService();
    this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
  }

  // 사용자 등록
  async registerUser(userData) {
    try {
      const { email, password, name, role = 'INSPECTOR' } = userData;

      // 이메일 중복 확인
      const existingUser = await this.db.getUserByEmail(email);
      if (existingUser) {
        throw new Error('이미 등록된 이메일입니다');
      }

      // 비밀번호 해시화
      const hashedPassword = await bcrypt.hash(password, 12);

      // 사용자 생성
      const user = await this.db.createUser({
        email,
        name,
        role,
        password: hashedPassword
      });

      // 비밀번호 제거 후 반환
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('사용자 등록 실패:', error);
      throw error;
    }
  }

  // 사용자 로그인
  async loginUser(email, password) {
    try {
      // 사용자 조회
      const user = await this.db.getUserByEmail(email);
      if (!user) {
        throw new Error('등록되지 않은 사용자입니다');
      }

      // 비밀번호 확인
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('비밀번호가 올바르지 않습니다');
      }

      // JWT 토큰 생성
      const token = this.generateToken(user);

      // 세션 생성
      await this.db.createSession({
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7일
      });

      // 비밀번호 제거 후 반환
      const { password: _, ...userWithoutPassword } = user;
      return {
        user: userWithoutPassword,
        token
      };
    } catch (error) {
      console.error('로그인 실패:', error);
      throw error;
    }
  }

  // JWT 토큰 생성
  generateToken(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7일
    };

    return jwt.sign(payload, this.jwtSecret);
  }

  // JWT 토큰 검증
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      return { isValid: true, payload: decoded };
    } catch (error) {
      return { isValid: false, payload: null, error: error.message };
    }
  }

  // 토큰에서 사용자 정보 추출
  async getUserFromToken(token) {
    try {
      const verification = this.verifyToken(token);
      if (!verification.isValid) {
        throw new Error('유효하지 않은 토큰입니다');
      }

      const user = await this.db.getUserById(verification.payload.userId);
      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다');
      }

      return user;
    } catch (error) {
      console.error('토큰에서 사용자 정보 추출 실패:', error);
      throw error;
    }
  }

  // 로그아웃
  async logoutUser(token) {
    try {
      // 세션 삭제
      await this.db.deleteSession(token);
      return true;
    } catch (error) {
      console.error('로그아웃 실패:', error);
      throw error;
    }
  }

  // 권한 확인
  checkPermission(userRole, requiredRole) {
    const roleHierarchy = {
      'ADMIN': 3,
      'INSPECTOR': 2,
      'VIEWER': 1
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }

  // 보고서 접근 권한 확인
  async checkReportAccess(userId, reportId, action = 'READ') {
    try {
      const report = await this.db.getReportById(reportId);
      if (!report) {
        return { hasAccess: false, reason: '보고서를 찾을 수 없습니다' };
      }

      const user = await this.db.getUserById(userId);
      if (!user) {
        return { hasAccess: false, reason: '사용자를 찾을 수 없습니다' };
      }

      // 관리자는 모든 권한
      if (user.role === 'ADMIN') {
        return { hasAccess: true };
      }

      // 보고서 작성자는 모든 권한
      if (report.inspectorId === userId) {
        return { hasAccess: true };
      }

      // 뷰어는 읽기만 가능
      if (user.role === 'VIEWER' && action === 'READ') {
        return { hasAccess: true };
      }

      // 인스펙터는 자신의 보고서만 수정 가능
      if (user.role === 'INSPECTOR' && report.inspectorId === userId) {
        return { hasAccess: true };
      }

      return { hasAccess: false, reason: '권한이 없습니다' };
    } catch (error) {
      console.error('보고서 접근 권한 확인 실패:', error);
      return { hasAccess: false, reason: '권한 확인 중 오류가 발생했습니다' };
    }
  }

  // 프로젝트 접근 권한 확인
  async checkProjectAccess(userId, projectId, action = 'READ') {
    try {
      const project = await this.db.getProjectById(projectId);
      if (!project) {
        return { hasAccess: false, reason: '프로젝트를 찾을 수 없습니다' };
      }

      const user = await this.db.getUserById(userId);
      if (!user) {
        return { hasAccess: false, reason: '사용자를 찾을 수 없습니다' };
      }

      // 관리자는 모든 권한
      if (user.role === 'ADMIN') {
        return { hasAccess: true };
      }

      // 인스펙터는 프로젝트의 보고서를 작성할 수 있음
      if (user.role === 'INSPECTOR' && action === 'CREATE_REPORT') {
        return { hasAccess: true };
      }

      // 뷰어는 읽기만 가능
      if (user.role === 'VIEWER' && action === 'READ') {
        return { hasAccess: true };
      }

      return { hasAccess: false, reason: '권한이 없습니다' };
    } catch (error) {
      console.error('프로젝트 접근 권한 확인 실패:', error);
      return { hasAccess: false, reason: '권한 확인 중 오류가 발생했습니다' };
    }
  }

  // 미들웨어용 인증 체크
  async authenticateToken(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: '인증 토큰이 필요합니다'
        });
      }

      const verification = this.verifyToken(token);
      if (!verification.isValid) {
        return res.status(401).json({
          success: false,
          message: '유효하지 않은 토큰입니다'
        });
      }

      // 사용자 정보를 요청 객체에 추가
      req.user = verification.payload;
      next();
    } catch (error) {
      console.error('토큰 인증 실패:', error);
      return res.status(401).json({
        success: false,
        message: '인증에 실패했습니다'
      });
    }
  }

  // 권한 체크 미들웨어
  requireRole(requiredRole) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: '인증이 필요합니다'
        });
      }

      if (!this.checkPermission(req.user.role, requiredRole)) {
        return res.status(403).json({
          success: false,
          message: '권한이 없습니다'
        });
      }

      next();
    };
  }

  // 보고서 접근 권한 체크 미들웨어
  requireReportAccess(action = 'READ') {
    return async (req, res, next) => {
      try {
        const reportId = req.params.reportId || req.body.reportId;
        if (!reportId) {
          return res.status(400).json({
            success: false,
            message: '보고서 ID가 필요합니다'
          });
        }

        const accessCheck = await this.checkReportAccess(req.user.userId, reportId, action);
        if (!accessCheck.hasAccess) {
          return res.status(403).json({
            success: false,
            message: accessCheck.reason
          });
        }

        next();
      } catch (error) {
        console.error('보고서 접근 권한 체크 실패:', error);
        return res.status(500).json({
          success: false,
          message: '권한 확인 중 오류가 발생했습니다'
        });
      }
    };
  }

  // 프로젝트 접근 권한 체크 미들웨어
  requireProjectAccess(action = 'READ') {
    return async (req, res, next) => {
      try {
        const projectId = req.params.projectId || req.body.projectId;
        if (!projectId) {
          return res.status(400).json({
            success: false,
            message: '프로젝트 ID가 필요합니다'
          });
        }

        const accessCheck = await this.checkProjectAccess(req.user.userId, projectId, action);
        if (!accessCheck.hasAccess) {
          return res.status(403).json({
            success: false,
            message: accessCheck.reason
          });
        }

        next();
      } catch (error) {
        console.error('프로젝트 접근 권한 체크 실패:', error);
        return res.status(500).json({
          success: false,
          message: '권한 확인 중 오류가 발생했습니다'
        });
      }
    };
  }
}

module.exports = AuthService;
