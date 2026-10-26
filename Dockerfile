# 웹 완성본(next build) 이미지 — 팀원이 Docker 로 띄운 BE 에 붙여 테스트할 때 쓴다 (compose.yaml 참고).
# 개발할 때는 Docker 대신 npm run dev / npm run dev:be (고치면 바로 반영된다).
#
# API_ORIGIN: 웹이 BE 를 부를 주소. 빌드할 때도 필요하다 — next.config.ts 의 "대신 전달"(rewrites) 규칙은 빌드할 때 정해진다.
# 비우면 가짜 서버(Prism)용으로 빌드되니 꼭 준다.

# 1단계: 패키지 설치
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2단계: 빌드
FROM node:24-alpine AS build
WORKDIR /app
ARG API_ORIGIN
ENV API_ORIGIN=$API_ORIGIN
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN test -n "$API_ORIGIN" || (echo "API_ORIGIN 을 빌드 값으로 주세요 (예: http://api:8080)" && exit 1)
RUN npm run build

# 3단계: 실행 — standalone 폴더(필요한 파일만) + 정적 파일
FROM node:24-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ARG API_ORIGIN
ENV API_ORIGIN=$API_ORIGIN
RUN addgroup -S web && adduser -S web -G web
COPY --from=build --chown=web:web /app/.next/standalone ./
COPY --from=build --chown=web:web /app/.next/static ./.next/static
COPY --from=build --chown=web:web /app/public ./public
USER web
EXPOSE 3000
CMD ["node", "server.js"]
