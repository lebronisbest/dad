import { randomUUID } from 'node:crypto';

/**
 * 요청 ID 미들웨어
 * 각 요청에 고유한 ID를 부여하여 추적성을 제공
 */
export function requestId(req, res, next) {
  // 요청 헤더에서 ID를 가져오거나 새로 생성
  req.id = req.headers['x-request-id'] || randomUUID();

  // 응답 헤더에 ID 설정
  res.setHeader('x-request-id', req.id);

  next();
}
