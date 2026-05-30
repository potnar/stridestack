# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start dev server (uses webpack bundler explicitly)
npm run build        # production build
npm run lint         # ESLint
npx prisma migrate dev   # apply DB schema changes
npx prisma generate      # regenerate Prisma client after schema edits
npx prisma studio        # visual DB browser
```

No test suite exists yet.

## Architecture

### Data layer — DB-first with localStorage fallback

Every data operation goes through `src/lib/data-service.ts`, which tries the PostgreSQL DB first and silently falls back to localStorage when `DATABASE_URL` is missing or the DB is unreachable. This means the app runs fully offline out of the box.

- `src/app/actions.ts` — Next.js Server Actions (DB reads/writes, AI calls). All mutations return `ActionResult` (`{ success, error? }`).
- `src/lib/data-service.ts` — thin wrapper that routes to DB or localStorage. `shouldFallback(result)` checks for null or `DB not connected` errors.
- `src/lib/storage.ts` — localStorage implementation, mirrors every function in `actions.ts`.
- `src/lib/prisma.ts` — Prisma singleton; returns `null` when `DATABASE_URL` is absent so callers can handle it gracefully.

### Shared types

All TypeScript interfaces live in `src/types/index.ts`. Import from `@/types` everywhere — never define types locally in components.

Key types: `ActionResult`, `DashboardData`, `WeightEntry`, `ActivityEntry`, `Question`.

### Config

`src/lib/config.ts` holds user profile constants (currently `USER_HEIGHT_M` used for BMI). Extend here before hardcoding values.

### Routing

Three pages: `/` (dashboard + weight chart), `/career` (AI interview quiz), `/activity/details` (FIT activity breakdown with Leaflet map).

Navigation is a fixed bottom bar (`BottomNav`) with a centre `+` button that opens `AddEntryModal`. The modal handles three modes: weight entry, manual activity entry, and Suunto FIT file import.

### FIT file import

`AddEntryModal.tsx` parses binary `.fit` files using `fit-decoder`, splits the route into 100 m segments, and calculates pace (min/km) and speed (km/h) per segment. GPS coordinates use Suunto's semi-circle format and must be converted: `degrees = semicircles × (180 / 2^31)`. The parsed result is saved to `localStorage` under `stridestack_last_activity` and rendered in `ActivityDetailsClient.tsx` via Leaflet.

### AI quiz

`generateQuizQuestions()` in `actions.ts` calls OpenRouter (`OPENROUTER_API_KEY`) with the `google/gemini-2.0-flash-exp:free` model. Falls back to `MOCK_QUESTIONS` when the key is missing.

### PWA

Configured via `@ducanh2912/next-pwa`. Manifest is in `src/app/manifest.ts`.

## Environment variables

```env
DATABASE_URL=          # PostgreSQL connection string; omit to use localStorage only
OPENROUTER_API_KEY=    # OpenRouter key for AI quiz; omit to use mock questions
```

## Working preferences

- **Feature branches always** — never commit or push directly to `main`. Create `feat/<short-name>`, push, share Vercel preview URL, merge only after user confirms.
- **Terse responses** — no trailing summaries of what was just done.
- **No unnecessary comments** in code.

## Planned features (next up)

1. **User height as DB setting** — replace `USER_HEIGHT_M` constant with a per-user value stored in the `User` model so BMI is accurate.
2. **FIT import error handling** — surface parse errors to the user instead of silently failing.
3. **Food calendar** — new module: photo upload (S3/GCS) → LLM calorie estimate (Gemini Flash Vision via OpenRouter) → daily food log stored in DB.
4. **Cloud deployment** — containerise with Docker, deploy to GCP Cloud Run or AWS Amplify; connect custom domain.
