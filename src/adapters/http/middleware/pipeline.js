/**
 * 공통 파이프라인 래퍼
 * Project TT 가이드라인: normalize → validate → execute 패턴을 모든 라우트에 일관되게 적용
 */

/**
 * 파이프라인 래퍼 함수
 * @param {Object} config - 파이프라인 설정
 * @param {Function} config.normalize - 입력 데이터 정규화 함수 (선택사항)
 * @param {Function} config.validate - 데이터 검증 함수 (Zod schema.safeParse 결과 기대)
 * @param {Function} config.execute - 비즈니스 로직 실행 함수
 * @returns {Function} Express 미들웨어 함수
 */
export const withPipeline = ({ normalize, validate, execute }) => async (req, res, next) => {
  try {
    // 1. Normalize: 입력 데이터 정규화
    const input = normalize ? normalize(req) : { 
      body: req.body, 
      params: req.params, 
      query: req.query,
      headers: req.headers,
      user: req.user
    };

    // 2. Validate: 데이터 검증
    if (validate) {
      const validationResult = validate(input);
      if (!validationResult.success) {
        return res.status(400).json({ 
          ok: false, 
          code: 'VALIDATION_ERROR', 
          message: '입력 데이터 검증에 실패했습니다', 
          details: validationResult.error.format ? validationResult.error.format() : validationResult.error,
          requestId: req.id
        });
      }
      req.input = validationResult.data;
    } else {
      req.input = input;
    }

    // 3. Execute: 비즈니스 로직 실행
    const result = await execute(req.input, req);
    
    // **Project TT 가이드라인: 상태코드 세분화**
    const { status, data, message } = determineResponseStatus(req.method, result);
    
    // 성공 응답
    const response = { 
      ok: true, 
      data,
      requestId: req.id,
      timestamp: new Date().toISOString()
    };
    
    if (message) {
      response.message = message;
    }
    
    return res.status(status).json(response);

  } catch (err) {
    // 에러를 다음 미들웨어로 전달 (에러 핸들러에서 처리)
    next(err);
  }
};

/**
 * 간단한 파이프라인 (검증 없이 실행만)
 */
export const withSimplePipeline = ({ normalize, execute }) => async (req, res, next) => {
  try {
    const input = normalize ? normalize(req) : { 
      body: req.body, 
      params: req.params, 
      query: req.query,
      headers: req.headers,
      user: req.user
    };

    const result = await execute(input, req);
    
    // **Project TT 가이드라인: 상태코드 세분화**
    const { status, data, message } = determineResponseStatus(req.method, result);
    
    const response = { 
      ok: true, 
      data,
      requestId: req.id,
      timestamp: new Date().toISOString()
    };
    
    if (message) {
      response.message = message;
    }
    
    return res.status(status).json(response);

  } catch (err) {
    next(err);
  }
};

/**
 * 읽기 전용 파이프라인 (GET 요청용)
 */
export const withReadPipeline = ({ normalize, validate, execute }) => async (req, res, next) => {
  try {
    const input = normalize ? normalize(req) : { 
      params: req.params, 
      query: req.query,
      headers: req.headers,
      user: req.user
    };

    if (validate) {
      const validationResult = validate(input);
      if (!validationResult.success) {
        return res.status(400).json({ 
          ok: false, 
          code: 'VALIDATION_ERROR', 
          message: '요청 파라미터 검증에 실패했습니다', 
          details: validationResult.error.format ? validationResult.error.format() : validationResult.error,
          requestId: req.id
        });
      }
      req.input = validationResult.data;
    } else {
      req.input = input;
    }

    const result = await execute(req.input, req);
    
    // **Project TT 가이드라인: 상태코드 세분화**
    const { status, data, message } = determineResponseStatus(req.method, result);
    
    const response = { 
      ok: true, 
      data,
      requestId: req.id,
      timestamp: new Date().toISOString()
    };
    
    if (message) {
      response.message = message;
    }
    
    return res.status(status).json(response);

  } catch (err) {
    next(err);
  }
};

/**
 * **Project TT 가이드라인: 상태코드 세분화 로직**
 * 생성(POST create) → 201, 삭제(성공/본문 없음) → 204, 나머지 → 200
 */
function determineResponseStatus(method, result) {
  // result가 { status, data, message } 형태인 경우
  if (result && typeof result === 'object' && 'status' in result) {
    return {
      status: result.status || 200,
      data: result.data || result,
      message: result.message
    };
  }
  
  // HTTP 메서드와 결과에 따른 상태코드 결정
  let status = 200;
  let data = result;
  let message = null;
  
  // POST 요청 (생성) → 201
  if (method === 'POST') {
    status = 201;
    
    // 생성 결과에서 메시지 추출
    if (result && typeof result === 'object') {
      if (result.message) {
        message = result.message;
      }
      if (result.id) {
        // 생성된 리소스 정보 포함
        data = {
          id: result.id,
          ...(result.fileName && { fileName: result.fileName }),
          ...(result.name && { name: result.name }),
          ...(result.message && { message: result.message })
        };
      }
    }
  }
  
  // DELETE 요청 (삭제) → 204 (본문 없음)
  if (method === 'DELETE') {
    status = 204;
    data = undefined; // 204 응답에는 본문이 없어야 함
    
    // 삭제 성공 메시지는 헤더나 별도 응답으로 처리
    if (result && result.message) {
      message = result.message;
    }
  }
  
  // PUT/PATCH 요청 (업데이트) → 200
  if (method === 'PUT' || method === 'PATCH') {
    status = 200;
    
    // 업데이트 결과에서 메시지 추출
    if (result && typeof result === 'object' && result.message) {
      message = result.message;
    }
  }
  
  // GET 요청 (조회) → 200
  if (method === 'GET') {
    status = 200;
  }
  
  return { status, data, message };
}
