# 관계법정 — 프로젝트 컨텍스트

> 이 파일을 읽으면 프로젝트 전체 맥락을 파악하고 바로 작업을 이어받을 수 있습니다.
> 마지막 업데이트: 2026-04-30

---

## 프로젝트 개요

**관계법정**은 연애·우정·가족 등 인간관계 분쟁을 AI 판사(Claude)가 심판하고 사용자들이 배심원으로 투표하는 웹앱입니다.

- 사용자가 사건을 접수 → AI 판사(Claude)가 판결 생성 → 전체 유저가 배심원 투표
- 관계법정 법전(DB에 저장된 조항)을 AI 판결에 인용
- 투표할수록 EXP·레벨 획득
- PWA로 모바일 홈 화면 설치 가능

---

## 기술 스택

| 분류 | 스택 |
|---|---|
| 프레임워크 | Next.js 15 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS 3 + 인라인 style |
| 폰트 | Noto Serif KR (Google Fonts) |
| 백엔드 | Supabase (PostgreSQL + Auth + RLS) |
| AI | Anthropic Claude API (`claude-opus-4-7`) |
| 인증 | Supabase OAuth (Google) |
| 배포 | Netlify (`@netlify/plugin-nextjs`) |
| 이미지 처리 | sharp (Next.js 내장) |

---

## 환경변수 (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=        # Supabase 프로젝트 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase anon key (public)
SUPABASE_SERVICE_ROLE_KEY=       # Supabase service role key (서버 전용, RLS 우회)
ANTHROPIC_API_KEY=               # Anthropic API key
```

**중요:** `SUPABASE_SERVICE_ROLE_KEY`는 서버 사이드 전용. 클라이언트에 절대 노출 금지.

---

## 파일 구조

```
gwanye-beopjeong/
├── app/
│   ├── layout.tsx                  # 루트 레이아웃 (Header, SplashScreen, 메타데이터)
│   ├── page.tsx                    # 홈 (서버 컴포넌트 — cases 조회 후 HomeClient에 전달)
│   ├── globals.css                 # 전역 스타일 (흑백 미니멀 테마)
│   ├── not-found.tsx
│   ├── admin/
│   │   ├── page.tsx                # 관리자 접근 제어 (sinuilyeong19@gmail.com만 허용)
│   │   └── AdminClient.tsx         # 관리자 UI (대시보드/유저/사건/커뮤니티 탭)
│   ├── api/
│   │   ├── admin/
│   │   │   ├── delete/route.ts     # 사건·게시글 삭제 (service role 사용)
│   │   │   └── users/route.ts      # auth.users 이메일 조회 (service role 사용)
│   │   ├── ai-verdict/route.ts     # Claude AI 판결 생성
│   │   └── auth/callback/route.ts  # OAuth 콜백
│   ├── cases/
│   │   ├── new/page.tsx            # 사건 접수 폼
│   │   └── [id]/
│   │       ├── page.tsx            # 사건 상세 (서버 컴포넌트)
│   │       ├── AIVerdictPanel.tsx  # AI 판결 요청·표시
│   │       ├── VotePanel.tsx       # 배심원 투표 UI
│   │       └── ShareButton.tsx     # 공유 버튼
│   ├── community/
│   │   ├── page.tsx                # 커뮤니티 목록
│   │   ├── new/page.tsx            # 게시글 작성
│   │   └── [id]/page.tsx           # 게시글 상세 + 댓글
│   ├── laws/page.tsx               # 관계법정 법전 목록
│   ├── onboarding/page.tsx         # 첫 로그인 시 닉네임·성별·나이 입력
│   ├── profile/page.tsx            # 마이페이지 (프로필, EXP, 투표 내역)
│   └── ranking/page.tsx            # 랭킹 (핫 사건/배심원/인기글 탭)
├── components/
│   ├── Header.tsx                  # 헤더 (로고, 네비, 로그인/유저 메뉴)
│   ├── HomeClient.tsx              # 홈 클라이언트 (히어로, 통계, 사건 목록)
│   ├── CaseCard.tsx                # 사건 카드 컴포넌트
│   └── SplashScreen.tsx            # 앱 시작 시 스플래시 화면
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # 클라이언트용 Supabase 인스턴스
│   │   └── server.ts               # 서버용 (createClient, createServiceClient)
│   ├── level.ts                    # 레벨 시스템 (getLevelInfo, getExpProgress)
│   └── types.ts                    # 전체 타입 정의
├── middleware.ts                   # Supabase 세션 갱신 미들웨어
├── next.config.mjs                 # Next.js 설정 (이미지 도메인, 보안 헤더)
├── netlify.toml                    # Netlify 배포 설정
├── public/
│   ├── manifest.json               # PWA 매니페스트
│   └── icons/
│       ├── icon-192.png            # PWA 아이콘 192px (~10KB)
│       ├── icon-512.png            # PWA 아이콘 512px (~44KB)
│       └── icon-512-maskable.png   # PWA 마스커블 아이콘 (~44KB)
└── supabase/
    ├── schema.sql                  # 전체 스키마 스냅샷
    └── migrations/                 # 순서대로 실행된 마이그레이션
        ├── 004_create_tables.sql   # cases, votes 테이블
        ├── 005_create_profiles.sql # profiles 테이블 + OAuth 트리거
        ├── 006_add_level_system.sql# exp, level, total_votes + add_vote_exp RPC
        ├── 007_create_community.sql# posts, post_likes, comments + RLS
        ├── 008_create_laws.sql     # laws 테이블
        └── 009_insert_all_laws.sql # 법전 조항 데이터 삽입
```

---

## 데이터베이스 스키마

### 핵심 테이블

#### `profiles`
```sql
id UUID PRIMARY KEY (= auth.users.id)
nickname TEXT
gender TEXT ('male' | 'female' | 'other')
age INT
exp INT DEFAULT 0
level INT DEFAULT 1
total_votes INT DEFAULT 0
created_at TIMESTAMPTZ
```
- Google 로그인 시 `auth.users`에 유저 생성 → `onboarding` 페이지에서 profiles 직접 insert
- 투표 시 `add_vote_exp(user_id)` RPC 호출 → exp +10, total_votes +1, level 자동 계산

#### `cases`
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES profiles(id)
title TEXT
plaintiff_name TEXT
defendant_name TEXT
plaintiff_statement TEXT
defendant_statement TEXT (nullable)
plaintiff_user_id UUID (nullable)
status TEXT ('open' | 'closed')
ai_verdict TEXT (nullable)
ai_verdict_winner TEXT ('plaintiff' | 'defendant' | 'neutral', nullable)
created_at TIMESTAMPTZ
```

#### `votes`
```sql
id UUID PRIMARY KEY
case_id UUID REFERENCES cases(id) ON DELETE CASCADE
user_id UUID REFERENCES profiles(id)
vote TEXT ('plaintiff' | 'defendant' | 'neutral')
created_at TIMESTAMPTZ
UNIQUE(case_id, user_id)  -- 사건당 1회 투표
```

#### `posts`
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES profiles(id) ON DELETE SET NULL
title TEXT
content TEXT
category TEXT ('자유' | '사연공유' | '판결결과' | '질문')
likes INT DEFAULT 0
comment_count INT DEFAULT 0
created_at TIMESTAMPTZ
```

#### `comments`
```sql
id UUID PRIMARY KEY
post_id UUID REFERENCES posts(id) ON DELETE CASCADE
user_id UUID REFERENCES profiles(id) ON DELETE SET NULL
content TEXT
created_at TIMESTAMPTZ
```
- `comments` insert/delete 시 트리거로 `posts.comment_count` 자동 동기화

#### `post_likes`
```sql
post_id UUID, user_id UUID — PRIMARY KEY (post_id, user_id)
```
- `toggle_post_like(p_post_id, p_user_id)` RPC로 원자적 처리

#### `laws`
```sql
id UUID PRIMARY KEY
article_number INT
title TEXT
content TEXT
category TEXT ('연애' | '우정' | '가족' | '직장학교' | '소셜미디어')
```

### RLS 정책 요약
- `cases`: SELECT 전체 허용, INSERT/UPDATE 본인만
- `votes`: SELECT 전체, INSERT 본인, UNIQUE 제약으로 중복 방지
- `posts`: SELECT 전체, INSERT 본인, DELETE 본인만
- `comments`: SELECT 전체, INSERT 본인, DELETE 본인만
- `post_likes`: SELECT 전체, INSERT/DELETE 본인만

---

## Supabase 클라이언트 사용 규칙

```ts
// 클라이언트 컴포넌트
import { createClient } from '@/lib/supabase/client'

// 서버 컴포넌트 / Route Handler (일반 유저 권한)
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()

// Route Handler (RLS 우회 필요 시 — admin 작업, auth.users 조회)
import { createServiceClient } from '@/lib/supabase/server'
const service = createServiceClient()  // async 아님 주의
```

**`createServiceClient`는 `@supabase/supabase-js`의 순수 `createClient` 사용** (쿠키 없음, RLS 완전 우회).
`@supabase/ssr`의 `createServerClient`에 service role key를 넣으면 쿠키 세션이 덮어씌워져 RLS가 적용될 수 있으므로 사용 금지.

---

## AI 판결 플로우

1. 사건 상세 페이지(`AIVerdictPanel.tsx`)에서 "AI 판결 받기" 버튼 클릭
2. `POST /api/ai-verdict` 호출 (caseId 전달)
3. 서버에서 `cases` + `laws` 테이블 조회
4. Claude `claude-opus-4-7` 모델에 시스템 프롬프트(법전 포함) + 사건 내용 전달
5. 판결문 + `WINNER: plaintiff|defendant|neutral` 파싱
6. `cases` 테이블에 `ai_verdict`, `ai_verdict_winner` 저장
7. 이미 판결이 있으면 캐시된 결과 반환 (중복 API 호출 방지)

---

## 레벨 시스템

| 레벨 | 타이틀 | 필요 EXP |
|---|---|---|
| 1 | 견습 배심원 | 0 |
| 2 | 초보 배심원 | 100 |
| 3 | 정식 배심원 | 300 |
| 4 | 숙련 배심원 | 600 |
| 5 | 전문 배심원 | 1000 |
| 6 | 수석 배심원 | 2000 |

- 투표 1회 = EXP +10
- `add_vote_exp(user_id)` DB 함수가 exp 증가 + 레벨 자동 계산 처리

---

## 관리자 페이지 (`/admin`)

- 접근: `sinuilyeong19@gmail.com` 계정만 (서버에서 이메일 체크 후 redirect)
- 탭: 대시보드(오늘/전체 통계) / 유저 관리 / 사건 관리 / 커뮤니티 관리
- 유저 관리 탭: `profiles` + `/api/admin/users`(auth.users 이메일) 병렬 조회 후 병합
- 삭제: `/api/admin/delete` Route Handler → service role로 삭제 (RLS 우회)

---

## 디자인 시스템

현재 테마: **흑백 미니멀** (애플/나이키 스타일)

| 토큰 | 값 |
|---|---|
| 배경 | `#000000` |
| 텍스트 | `#ffffff` |
| 카드 배경 | `#000000` |
| 카드 테두리 | `rgba(255,255,255,0.12)` |
| 구분선 | `rgba(255,255,255,0.08~0.15)` |
| 보조 텍스트 | `rgba(255,255,255,0.3~0.45)` |

주요 CSS 클래스 (`globals.css`):
- `.btn-gold` — 흰 배경 + 검정 텍스트 (주 CTA)
- `.btn-outline` — 검정 배경 + 흰 테두리
- `.btn-glass` — 홈 히어로 CTA (흰 배경 + 검정 텍스트)
- `.btn-ghost` — 보조 버튼 (반투명 흰 테두리)
- `.court-card` — 기본 카드 (검정 + 흰 테두리)
- `.step-card` — 홈 How It Works 카드
- `.case-card-glow` — 홈 사건 목록 카드

**주의:** `app/ranking/page.tsx`, `app/onboarding/page.tsx` 등 일부 페이지는 아직 골드 색상(`yellow-*` Tailwind 클래스)을 사용 중 — 미리뉴얼 미완료.

---

## PWA 설정

- `public/manifest.json` — `display: standalone`, 아이콘 3종
- `app/layout.tsx` — `manifest`, `appleWebApp`, `themeColor` 메타데이터 설정
- **Service Worker 없음** — 오프라인 지원 안 됨 (홈 화면 추가는 가능)
- `theme_color`: 레이아웃에 `#0a0a0a`로 되어 있음 → `#000000`으로 통일 고려

---

## 배포

- **플랫폼**: Netlify
- **빌드 명령**: `npm run build`
- **플러그인**: `@netlify/plugin-nextjs` (Next.js SSR 지원)
- Node.js 버전: 20

---

## 다음 할 일 (TODO)

### 디자인 미완료
- [ ] `app/ranking/page.tsx` — 흑백 테마로 업데이트 (현재 yellow 색상 잔존)
- [ ] `app/onboarding/page.tsx` — 흑백 테마로 업데이트
- [ ] `app/profile/page.tsx` — 흑백 테마로 업데이트
- [ ] `app/community/` 전체 — 흑백 테마로 업데이트
- [ ] `app/laws/page.tsx` — 흑백 테마로 업데이트
- [ ] `app/layout.tsx` — footer `border-yellow-900/20` → `rgba(255,255,255,0.08)`, themeColor `#0a0a0a` → `#000000`
- [ ] `public/manifest.json` — `theme_color`, `background_color` → `#000000`

### 기능
- [ ] Service Worker 추가 (`next-pwa` 등) — 오프라인 캐싱
- [ ] 사건 상태(`open`/`closed`) 관리 — 현재 접수 후 항상 `open`
- [ ] 알림 기능 — 내가 접수한 사건에 판결/투표 발생 시
- [ ] 사건 검색/필터 (카테고리별)
- [ ] 댓글 좋아요
- [ ] 관리자 페이지 — 유저 차단/정지 기능

### 기술 부채
- [ ] `app/cases/[id]/AIVerdictPanel.tsx` — `createServiceClient` 호출이 `await` 포함 여부 확인 필요 (서버 → 동기로 변경됨)
- [ ] 랭킹 페이지 사건 탭 — 클라이언트에서 전체 votes 조회 후 정렬 중 → 서버에서 집계하는 방식으로 개선 권장
- [ ] `screenshot-mobile.png` — `public/icons/`에 없음, manifest에 등록은 되어 있음
