# Codex 인수인계 문서 — 2026-04-08

## 현재 상황

`s-reborn-clinic` 저장소의 GitHub Actions → Cloudflare Pages 배포가 실패하고 있다.
사이트 URL: https://s-reborn-clinic.pages.dev/
저장소: https://github.com/a3492/s-reborn-clinic

## 배포 아키텍처

- **Astro** (output: static, adapter: @astrojs/cloudflare)
- 빌드 출력: `dist/client` (정적), `dist/server` (Worker)
- **Cloudflare Pages Functions**: `functions/` 디렉토리 (API 엔드포인트)
- **GitHub Actions**: `.github/workflows/deploy.yml` → `wrangler pages deploy dist/client`
- **Cloudflare 대시보드에도 Git 통합이 연결되어 있음** (이중 배포 가능성)

## 지금까지 한 작업 (커밋 379ac12 ~ 22127c3)

1. **deploy.yml**: `cloudflare/pages-action@v1` → `npx wrangler pages deploy`로 변경
2. **deploy.yml**: `cp -r functions dist/client/` 제거 (잘못된 위치에 함수 복사하고 있었음)
3. **astro.config.mjs**: sitemap customPages 도메인 `s-reborn-blog.pages.dev` → `s-reborn-clinic.pages.dev`
4. **BaseHead.astro**: favicon을 거대한 data URI에서 `/favicon.svg` 파일 참조로 복원
5. **functions/api/og/[slug].ts**, **functions/api/og/procedure/[slug].ts**: `import initWasm, { Resvg }` → `import { Resvg, initWasm }` (named export 수정)
6. **wrangler.toml**: `compatibility_flags = ["nodejs_compat"]` 추가
7. **deploy.yml**: `--compatibility-flags=nodejs_compat` CLI 플래그 추가

## 현재 막힌 에러

```
✘ [ERROR] Deployment failed!
  Failed to publish your Function. Got error: Uncaught ReferenceError: process is not defined
    at functionsWorker-0.xxx.js:20112:5 in ../node_modules/satori/dist/index.js
```

- `satori` 라이브러리가 모듈 로드 시점에 `process`를 참조
- `--compatibility-flags=nodejs_compat`를 CLI에 추가했지만 아직 테스트 결과 미확인 (이 커밋이 가장 최신)
- 만약 이것도 실패하면 아래 대안 필요

## 해결 대안 (우선순위 순)

### A. OG 함수 임시 제거 → 배포 성공 우선
`functions/api/og/` 디렉토리를 임시 삭제 또는 빈 파일로 대체.
다른 모든 기능(영어, 파비콘, 시술 페이지 등)이 먼저 라이브에 반영되게 한다.
OG 이미지는 나중에 Cloudflare Workers 호환되는 방식으로 재구현.

### B. satori를 @cf-wasm/satori로 교체
Cloudflare Workers 호환 포크: `@cf-wasm/satori` + `@cf-wasm/resvg`
Workers 환경에서 process 없이 동작하도록 만들어진 패키지.

### C. GitHub Actions 대신 Cloudflare 자체 빌드로 전환
deploy.yml을 삭제하고, Cloudflare 대시보드에서:
- Build command: `npm run build`
- Build output directory: `dist/client`
- Node version: 22
- 환경변수 등록 필요 (현재 GitHub Secrets에만 있음)
Cloudflare 자체 빌드는 functions/ 디렉토리를 자동으로 감지·배포함.

## GitHub Secrets (등록 완료)

- `CLOUDFLARE_API_TOKEN` ✅
- `CLOUDFLARE_ACCOUNT_ID` ✅
- 기타 `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` 등은 **미등록** (빌드 시 없으면 빈 값)

## Cloudflare 대시보드 상태

- **s-reborn-clinic** 프로젝트: `a3492/s-reborn-clinic` 연결됨
- **Automatic deployments: Enabled** (Branch control → main)
- **Compatibility date**: 2026-03-15
- **Variables**: `PUBLIC_SUPABASE_ANON_KEY`, `PUBLIC_SUPABASE_URL` 만 등록됨

## 주의사항

1. Cloudflare 대시보드의 자동 배포가 켜져 있으므로, push할 때마다 **Cloudflare 자체 빌드 + GitHub Actions 빌드** 두 개가 동시에 실행될 수 있음. 하나를 비활성화해야 함.
2. `wrangler.toml`의 KV 바인딩 ID가 `YOUR_KV_NAMESPACE_ID` 플레이스홀더로 되어 있음.
3. `public/` 에 `favicon.svg`만 있고 `favicon.ico`, `apple-touch-icon.png`는 없음 (BaseHead.astro에서 apple-touch-icon 참조함).

## 파일 구조 요약

```
s-reborn-clinic/
├── .github/workflows/deploy.yml   # GitHub Actions 배포
├── astro.config.mjs                # Astro + Cloudflare adapter
├── wrangler.toml                   # Cloudflare 설정
├── functions/                      # Cloudflare Pages Functions (API)
│   └── api/og/                     # ← 현재 에러 원인 (satori + resvg-wasm)
├── public/                         # 정적 에셋
├── src/
│   ├── pages/en/                   # 영어 페이지
│   ├── pages/procedures/           # 시술 안내
│   ├── pages/consult/              # 온라인 상담
│   └── components/BaseHead.astro   # favicon, meta 등
└── dist/                           # 빌드 출력 (client + server)
```
