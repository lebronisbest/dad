FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# 시스템 패키지 업데이트 및 필요한 패키지 설치
RUN apk update && apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    curl

# Puppeteer 환경 변수 설정
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci --only=production

# 소스 코드 복사
COPY . .

# 필요한 디렉토리 생성
RUN mkdir -p exports uploads processed thumbnails logs

# 권한 설정
RUN chown -R node:node /app
USER node

# 포트 노출
EXPOSE 3001

# 헬스체크 엔드포인트 추가
RUN echo '{"status":"ok","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' > health.json

# 애플리케이션 시작
CMD ["npm", "start"]
