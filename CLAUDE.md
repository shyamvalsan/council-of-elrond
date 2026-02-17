# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Council of Elrond is a web app that lets users compare LLM responses side-by-side: two individual models vs. a deliberating council of 3-12 models. Users judge which response is best, feeding a public leaderboard with ELO rankings and LOTR character assignments.

**Status**: Greenfield — the README.md is a comprehensive design spec. No code has been written yet.

## Build & Dev Commands

```bash
# Main app
npm install
npm run dev                 # Start Next.js dev server
npm run db:push             # Push Drizzle schema to database

# Testing (Vitest + React Testing Library + Playwright + MSW)
npm test                    # All tests
npm run test:watch          # Watch mode
npm run test:unit           # Unit only
npm run test:integration    # Integration only
npm run test:e2e            # E2E (Playwright)
npm run test:coverage       # With coverage

# Leaderboard (separate sub-project)
cd leaderboard && npm install
cd leaderboard && npm test
cd leaderboard && npm run dev

# Full stack via Docker
docker compose up
```

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend**: Next.js API Routes with SSE streaming
- **LLM Gateway**: OpenRouter API (primary), with pluggable direct providers (Anthropic, OpenAI, Google)
- **Database**: SQLite via Drizzle ORM (dev), PostgreSQL (prod)
- **Testing**: Vitest, React Testing Library, Playwright, MSW for API mocking
- **Leaderboard**: Separate sub-project in `/leaderboard` — Express/Hono API, PostgreSQL, own frontend

## Architecture

### Two Independent Projects

1. **Main app** (`/`) — Next.js chat UI + API routes
2. **Leaderboard** (`/leaderboard/`) — independently deployable API server + frontend with its own package.json, DB schema, and Dockerfile

### Core Engine: Council Deliberation (`src/lib/llm/council.ts`)

The `CouncilEngine` orchestrates multi-model deliberation in 4 phases:
1. **Acquaintance** — models learn who's on the council, choose roles
2. **Independent Drafts** — each model drafts a response in parallel
3. **Deliberation** (repeats up to N rounds) — critique → discussion → synthesis
4. **Approval Gate** — models approve or request changes; emits when all approve or max rounds hit

Council streams `CouncilStreamEvent` objects via SSE to the frontend. Synthesizer role can rotate via round-robin, voted, or fixed strategy.

### LLM Provider System (`src/lib/llm/`)

- `provider.ts` — abstract `LLMProvider` interface with `chat()` (AsyncGenerator<StreamChunk>) and `listModels()`
- `openrouter.ts` — primary provider, all models route here by default
- `models.ts` — `resolveProvider()` checks for user-supplied direct API keys before falling back to OpenRouter
- Direct providers (`anthropic.ts`, `openai.ts`, `google.ts`) are optional, activated by BYOK keys

### Community Credit Pool (`src/lib/credits/`)

Three-tier key resolution: user's own key → community pool → exhausted (block + BYOK prompt). Community users face rate limits ($0.50/day, $0.25/request, max 5-model councils, 2 concurrent requests). BYOK users have no limits.

### UI: Triple View (`src/components/chat/TripleView.tsx`)

Three-column layout showing Model A, Model B, and Council responses side-by-side. Each panel renders rich content (Markdown, code, SVG, HTML sandbox, Mermaid, LaTeX). Users vote via `JudgmentBar` → stored locally and optionally submitted to public leaderboard.

### Leaderboard Scoring

Uses ELO/Bradley-Terry scoring. Models earn LOTR character assignments based on behavior patterns (e.g., highest solo + collab win rate = Gandalf, best cost-adjusted = Frodo). Character assignments are dynamic and recompute as data grows.

## Development Methodology

**Red-Green TDD**: every feature starts with a failing test. Write the test first (red), write minimum code to pass (green), then refactor. Follow the implementation order in README.md (Phases 1-6).

## Key Environment Variables

- `OPENROUTER_API_KEY` — required, community pool key or personal key
- `DATABASE_URL` — `file:./dev.db` for local SQLite
- `CREDIT_POOL_ENABLED`, `CREDIT_POOL_DAILY_LIMIT_PER_USER`, `CREDIT_POOL_MAX_PER_REQUEST` — credit pool config
- `LEADERBOARD_API_URL`, `LEADERBOARD_API_KEY` — connects main app to leaderboard
- See `.env.example` for full list

## Design Constraints

- Council size: 3-12 members (validated in `CouncilEngine` constructor)
- Community credit councils capped at 5 members
- All streaming uses SSE (Server-Sent Events), not WebSockets
- API keys stored in browser localStorage only, never server-side
- Prompts are SHA-256 hashed before submission to leaderboard (privacy)
- Vercel free tier has 60s function timeout — council queries must stream phase updates frequently to keep connection alive
