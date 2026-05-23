# StrideStack

A personal fitness and career tracker built as a Progressive Web App (PWA). Log your weight and physical activities, analyze Suunto FIT files with detailed pace/speed breakdowns, and prepare for senior fullstack developer interviews with AI-generated questions.

---

## Features

### Fitness Tracking
- **Weight log** — add daily entries, view progress on an interactive chart (daily/weekly views), delete entries
- **Activity tracking** — log running and cycling sessions with distance and date
- **BMI calculation** — auto-calculated from your latest weight entry
- **Suunto FIT file import** — upload `.fit` files from your GPS watch to extract route, pace (min/km), and speed (km/h) per 100 m segment

### Career Prep
- **AI interview quiz** — generates technical questions for senior fullstack developers (Node.js, Next.js, PostgreSQL, Stripe, security)
- **Explanations** — every answer includes a detailed explanation
- **Fallback mode** — mock questions available when the AI API is unreachable

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4, Recharts, Leaflet |
| Language | TypeScript 5 (strict) |
| Database | PostgreSQL via Prisma ORM |
| Offline | localStorage fallback when DB is unavailable |
| PWA | `@ducanh2912/next-pwa` |
| FIT parsing | `fit-decoder` |
| AI | OpenRouter API |

---

## Getting Started

### Prerequisites

- Node.js 20+
- A PostgreSQL database (optional — app works offline with localStorage)

### Installation

```bash
git clone https://github.com/your-username/stridestack.git
cd stridestack
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
# PostgreSQL connection string (optional — omit to use localStorage only)
DATABASE_URL="postgresql://user:password@localhost:5432/stridestack"

# OpenRouter API key (optional — omit to use mock interview questions)
OPENROUTER_API_KEY="sk-or-..."
```

### Database Setup

If you have PostgreSQL configured:

```bash
npx prisma migrate dev
```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm run start
```

---

## Project Structure

```
stridestack/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Main dashboard (weight, activity summary, BMI)
│   │   ├── layout.tsx                # Root layout with bottom navigation
│   │   ├── actions.ts                # Server actions (DB reads/writes, AI calls)
│   │   ├── globals.css
│   │   ├── manifest.ts               # PWA manifest
│   │   ├── career/
│   │   │   └── page.tsx              # Interview quiz page
│   │   └── activity/details/
│   │       └── page.tsx              # Per-activity details page
│   ├── components/
│   │   ├── BottomNav.tsx             # Mobile navigation bar
│   │   ├── AddEntryModal.tsx         # Modal for adding weight/activity + FIT import
│   │   ├── WeightChart.tsx           # Interactive weight chart with Recharts
│   │   ├── ActivitySummaryModal.tsx  # Summary view for an activity
│   │   └── ActivityDetailsClient.tsx # Map + segment breakdown for a FIT activity
│   ├── lib/
│   │   ├── data-service.ts           # Abstraction layer: DB first, localStorage fallback
│   │   ├── storage.ts                # localStorage read/write operations
│   │   ├── prisma.ts                 # Prisma client singleton
│   │   └── utils.ts                  # cn() class name helper
│   └── types/
│       ├── index.ts                  # Shared interfaces: DashboardData, WeightEntry, ActivityEntry, Question, ActionResult
│       └── fit-decoder.d.ts          # Type declarations for fit-decoder package
├── prisma/
│   └── schema.prisma                 # Database schema
├── public/                           # Static assets and PWA icons
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

---

## Key Concepts

### Shared Types (`types/index.ts`)

All TypeScript interfaces live in a single file — import from `@/types` everywhere instead of defining types locally. Key exports:

| Type | Description |
|---|---|
| `DashboardData` | Shape of data returned by `getDashboardData()` |
| `WeightEntry` | A single weight log entry |
| `ActivityEntry` | A single running or cycling session |
| `Question` | Interview quiz question with options and explanation |
| `ActionResult` | Generic `{ success, error? }` returned by mutations |

### Data Layer (`lib/data-service.ts`)

All data access goes through a single service layer that tries PostgreSQL first and silently falls back to localStorage if the database is unavailable. This means the app works fully offline — useful during development or on devices without a DB connection.

### FIT File Import

When you upload a `.fit` file from a Suunto watch, the app:
1. Parses binary records using `fit-decoder`
2. Splits the route into 100 m segments
3. Calculates pace (min/km) and speed (km/h) for each segment
4. Extracts GPS coordinates for the map view (via Leaflet)

The import logic lives in `AddEntryModal.tsx` and the result is displayed in `ActivityDetailsClient.tsx`.

### Server Actions (`app/actions.ts`)

All database mutations and AI calls are implemented as Next.js Server Actions — no separate API routes needed. Key actions:

| Action | Description |
|---|---|
| `addWeightEntry` | Add a weight log entry for a given date |
| `deleteWeightEntry` | Remove a weight entry by ID |
| `addActivityEntry` | Log a running or cycling session |
| `getDashboardData` | Fetch latest weight, BMI, and total distances |
| `generateInterviewQuestions` | Call OpenRouter API for AI interview questions |

### PWA

StrideStack is installable as a PWA on mobile and desktop. The manifest and service worker are configured via `@ducanh2912/next-pwa` and `app/manifest.ts`.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx prisma migrate dev` | Apply DB migrations |
| `npx prisma studio` | Open Prisma visual editor |
