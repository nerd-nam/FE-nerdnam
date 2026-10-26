# nerdnam 웹 (FE)

Next.js 16 웹. 기획·계약은 옆 폴더의 `SPEC-nerdnam`에 있다(`../SPEC-nerdnam`). 처음 한 번 `npm install`.

## 실행하기

웹이 데이터를 묻는 서버를 둘 중 하나로 고른다. 명령은 Mac·Linux 기준이다.

### 1. 가짜 서버(Prism)로 — BE 없이 화면만 볼 때

터미널 두 개에서 하나씩:

```bash
npm run mock:api   # Prism, 4010번. SPEC 계약(web-api.openapi.yaml)의 예시만 돌려준다
npm run dev        # 웹, http://localhost:3000
```

- 구글·카카오 버튼은 웹의 개발용 대역(`src/app/dev-api`)이 가짜 로그인 쿠키만 심고 바로 넘어간다(로그인 창 없음).
- 늘 같은 예시("예시 회사" 등)가 오고, 저장해도 기억하지 않는다. 고장이 아니다.

### 2. 진짜 BE로 — 저장·수정까지 확인할 때

BE를 Docker로 띄운 뒤(BE 레포 `docs/11-Docker-Compose-실행.md`, 8080번):

```bash
npm run dev:be     # = API_ORIGIN=http://localhost:8080 npm run dev
```

- 로그인은 진짜 구글·카카오 화면으로 간다. BE `.env`에 로그인 키(`GOOGLE_CLIENT_ID` 등)가 있어야 끝까지 된다. 키가 없으면 구글이 막는다.
- BE 주소가 다르면 `API_ORIGIN=주소 npm run dev`로 직접 준다.

### 3. 웹도 Docker로 — BE·AI 팀원이 웹을 써 볼 때

웹 완성본(`next build`)을 Docker로 띄워, Docker로 띄운 BE에 붙인다. 코드를 고치면 다시 빌드해야 하니 FE 개발은 2번으로 한다.

```bash
# 1. BE 폴더에서 BE 먼저 (BE·DB·Redis)
docker compose up -d
# 2. 이 폴더에서 웹 → http://localhost:3000
docker compose up --build -d
# 끝낼 때 (이 폴더)
docker compose down
```

- 웹 컨테이너는 BE와 같은 Docker 네트워크(`be-nerdnam_default`)에 들어가 BE를 `http://api:8080`으로 부른다. BE가 안 떠 있으면 "network … could not be found" 오류가 난다.
- 3000번을 이미 쓰고 있으면 `WEB_PORT=3001 docker compose up --build -d`. 다만 BE는 로그인이 끝나면 3000번으로 돌려보낸다.
- BE 폴더 이름이 `BE-nerdnam`이 아니면 네트워크 이름이 달라진다: `BE_NETWORK=폴더이름소문자_default docker compose up --build -d`.
- 로그인은 2번과 같이 BE `.env`에 구글·카카오 키가 있어야 끝까지 된다.

## 자주 쓰는 명령

```bash
npm run lint        # 코드 검사 (eslint)
npx tsc --noEmit    # 타입 검사
npm run api:types   # SPEC 계약이 바뀌면 타입(src/shared/api/schema.d.ts) 다시 만들기
```

이 프로젝트엔 prettier가 없다. `npx prettier`를 쓰면 전체 줄바꿈이 바뀌니 쓰지 않는다.
