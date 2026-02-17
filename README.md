# 🏛️ The Council of Elrond

> *"You have come and are here met, in this very nick of time, by chance as it may seem. Yet it is not so. Believe rather that it is so ordered that we, who sit here, and none others, must now find counsel for the peril of the world."*

**Can a council of LLMs deliberately collaborate and produce better responses than any single SOTA model alone?**

We already know what happens when thousands of AI agents interact in the wild — chaotic, emergent, fascinating, but ultimately uncontrolled. The Council of Elrond takes the opposite approach: small, structured, measurable collaboration between frontier models on real tasks, judged by real humans.

Users submit prompts and see three responses side-by-side — two from individual models and one from a deliberating council. They judge which is best. Every judgment feeds a public leaderboard, building a first-of-its-kind dataset on fine-grained LLM collaboration dynamics.

---

## Why This Matters

Large-scale agent swarms have shown us emergent behavior at scale. But that tells us very little about *how* models actually collaborate at the task level. This project zooms in:

- **Do councils consistently beat individual frontier models?**
- **Which model combinations produce the best councils?**
- **Which models are natural collaborators vs. lone wolves?**
- **Does collaboration help more on certain task types** (reasoning, creative, code, factual)?
- **What deliberation patterns emerge?** Do models defer, argue, specialize?
- **Is there a "collaboration tax"** — and when is it worth paying?

We aim to generate the data to answer these questions empirically, across thousands of prompts and judgments from an open community.

---

## How It Works

### The UI — Three Columns, One Verdict

```
┌──────────────────────────────────────────────────────────────────────┐
│ ☰  The Council of Elrond                                     ⚙️ 🔑  │
├─────────┬────────────────────────────────────────────────────────────┤
│         │                                                            │
│ 🔍      │   [Model A ▾]        [Model B ▾]        [Council ⚙️]      │
│ Search  │                                                            │
│         │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │
│ History │  │             │  │             │  │                 │    │
│         │  │ Response A  │  │ Response B  │  │ Council Result  │    │
│ • Chat 1│  │             │  │             │  │                 │    │
│ • Chat 2│  │             │  │             │  │ Deliberating... │    │
│ • Chat 3│  │             │  │             │  │ Round 2/3       │    │
│ • Chat 4│  │ ──────────  │  │ ──────────  │  │ ──────────────  │    │
│ • Chat 5│  │ ⏱ 2.3s      │  │ ⏱ 1.8s      │  │ ⏱ 12.4s         │    │
│         │  │ 🔤 1,240 tok │  │ 🔤 980 tok   │  │ 🔤 8,420 tok     │    │
│         │  │ 💰 $0.03     │  │ 💰 $0.02     │  │ 💰 $0.18         │    │
│         │  └─────────────┘  └─────────────┘  └─────────────────┘    │
│         │                                                            │
│         │  ┌───────────────────────────────────────────────┐         │
│         │  │  Which response was best?                     │         │
│         │  │  [ A ]     [ B ]     [ Council ]     [ Tie ]  │         │
│         │  └───────────────────────────────────────────────┘         │
│         │                                                            │
│         │  ┌───────────────────────────────────────────────┐         │
│         │  │  Type your message...               📎 🎤 ⏎   │         │
│         │  └───────────────────────────────────────────────┘         │
└─────────┴────────────────────────────────────────────────────────────┘
```

**Flow:**
1. User types a prompt (supports text, file attachments, audio input)
2. Three responses stream in side-by-side:
   - **Model A** — single model, user-selected via dropdown
   - **Model B** — different single model, user-selected via dropdown
   - **The Council** — a group of 3-12 models that deliberate together
3. Each panel shows: rendered response, token count, cost, and response time
4. Rich content (SVG, HTML, code output, diagrams) renders inline — not as raw text
5. User votes on which was best → vote stored → feeds the leaderboard

### The Left Sidebar

- **Chat History**: Scrollable list of previous sessions
- **Search**: Full-text search across past chats
- **New Chat** button
- Clean, collapsible on mobile

### Main Page Footer Bar

A persistent footer strip across the bottom of the main page shows live community stats and links:

```
┌─────────────────────────────────────────────────────────────────────┐
│  👥 2,847 users  ·  🔤 14.2M tokens  ·  🗳️ 1,203 judgments        │
│  📊 Leaderboard  ·  🧙 Characters  ·  ☕ Sponsor the Council       │
└─────────────────────────────────────────────────────────────────────┘
```

| Stat | Source |
|------|--------|
| **Total users** | Count of unique users who have submitted at least one prompt |
| **Total tokens consumed** | Sum of all `token_count` across all messages (individual + council, including deliberation) |
| **Total judgments** | Count of votes submitted (local instance + public leaderboard aggregate) |

The **Leaderboard** and **Characters** links go to the public leaderboard site. These stats are cached and refreshed every few minutes — not computed on every page load. They serve two purposes: social proof for new visitors ("people are actually using this") and a running scoreboard for the research mission.

### Content Rendering

All three response panels render rich content:

- **Markdown** — full formatting (headers, tables, lists, bold/italic, links)
- **Code blocks** — syntax highlighting + copy button
- **SVG** — rendered visually inline, not as code text
- **HTML** — rendered in a sandboxed iframe
- **Executable code** (Python, JS) — "Run" button with output panel, code-interpreter style
- **LaTeX/Math** — rendered via KaTeX or MathJax
- **Mermaid diagrams** — rendered as visual diagrams
- **Images** — displayed if models return image URLs or base64

---

## The Council — How Models Deliberate

The council is not a majority vote or simple ensemble. It's a structured, multi-round deliberation between 3 to 12 models.

### Council Composition

- **Minimum**: 3 models
- **Maximum**: 12 models
- **User-configurable**: Which models, how many, and max deliberation rounds
- **Default**: Claude Opus 4.6 + GPT-5.2 + Gemini 3 Pro (3 members, 3 rounds)

### Deliberation Protocol

```
┌─────────────────────────────────────────────────────┐
│  Phase 1: ACQUAINTANCE                              │
│  Models learn who's on the council, see the prompt, │
│  and choose their roles/personas                    │
├─────────────────────────────────────────────────────┤
│  Phase 2: INDEPENDENT DRAFTS                        │
│  Each model produces its own draft response         │
├─────────────────────────────────────────────────────┤
│  Phase 3: DELIBERATION (repeats up to N rounds)     │
│  ├── Critique: Models review each other's drafts    │
│  ├── Discussion: Models debate trade-offs, errors   │
│  └── Synthesis: A synthesizer proposes a unified    │
│      response incorporating the best elements       │
├─────────────────────────────────────────────────────┤
│  Phase 4: APPROVAL GATE                             │
│  Each model reviews the synthesis and either        │
│  approves or requests changes. Response emits       │
│  when all approve (or max rounds hit).              │
└─────────────────────────────────────────────────────┘
```

**The council system prompt framework:**

```
You are a member of The Council of Elrond — a deliberative body of AI models
collaborating to produce the best possible response to a user's query.

Your fellow council members are: {member_list_with_model_names}
The user's query is: {user_prompt}

Current phase: {current_phase}
Round: {round_number} of {max_rounds}

You are free to:
- Adopt a persona or specialization that serves the problem best
- Disagree with other members and argue your position with evidence
- Propose structural approaches to solving the problem
- Build on the strengths of other members' contributions
- Point out errors, gaps, or weaknesses in any draft
- Call for additional deliberation if quality is insufficient
- Signal when you believe the response is ready

Your explicit goal is to produce a response that is BETTER than what any
of you could produce individually. Collaborate, challenge, synthesize.

{phase_specific_instructions}
```

### Council Configuration UI

A settings panel (gear icon ⚙️ on the Council column header) lets users:

- **Add/remove models** from the council (3 minimum, 12 maximum)
- **Set max deliberation rounds** (default: 3, range: 1–10)
- **Toggle deliberation transcript visibility** (collapsed by default, expandable)
- **Choose synthesizer rotation strategy**: round-robin, voted, or fixed

### Deliberation Transcript

When expanded, users see the full multi-round conversation between models — who said what, who disagreed, how the final answer emerged. This is key for understanding *why* a council response is good (or bad).

---

## Tech Stack

### Frontend
- **Next.js 14+** (App Router) with TypeScript
- **Tailwind CSS** — clean, minimal, elegant
- **shadcn/ui** — accessible UI primitives
- **React Markdown** + rehype/remark plugins for rendering
- **Monaco Editor** or **CodeMirror** for code blocks
- **Sandpack** or sandboxed iframes for code execution
- **Framer Motion** for subtle animations

### Backend
- **Next.js API Routes** for the main application
- **OpenRouter API** as the unified LLM gateway
- **Server-Sent Events (SSE)** for streaming responses

### Database & Storage
- **SQLite** (via Drizzle ORM) for local development
- **PostgreSQL** for production/hosted deployment
- **Schema** covers: users, chats, messages, judgments, council_sessions, council_transcripts

### Leaderboard (separate sub-project)
- Lives in `/leaderboard` — independently deployable
- **Express** or **Hono** API server
- **PostgreSQL** database
- **Next.js** or static frontend for the public leaderboard UI
- See [`/leaderboard/README.md`](./leaderboard/README.md) for setup and deployment

### Infrastructure
- **Docker** + **Docker Compose** for local dev
- Deployable to Vercel, Railway, Fly.io, or self-hosted

---

## Project Structure

```
council-of-elrond/
├── README.md
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── docker-compose.yml              # Runs app + leaderboard + DBs
├── .env.example
├── .env
│
├── drizzle/
│   ├── schema.ts
│   └── migrations/
│
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # Main chat interface
│   │   └── api/
│   │       ├── chat/
│   │       │   └── route.ts         # Single model chat (SSE streaming)
│   │       ├── council/
│   │       │   └── route.ts         # Council deliberation (SSE streaming)
│   │       ├── models/
│   │       │   └── route.ts         # List available models from OpenRouter
│   │       ├── judgments/
│   │       │   └── route.ts         # Submit judgments (local + remote leaderboard)
│   │       ├── credits/
│   │       │   └── route.ts         # Community credit pool status
│   │       └── stats/
│   │           └── route.ts         # Public stats: total users, tokens, judgments
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx          # Chat history, search, new chat
│   │   │   ├── Header.tsx
│   │   │   ├── StatsBar.tsx         # Footer: total users, tokens, leaderboard links
│   │   │   ├── SettingsModal.tsx    # API keys, preferences, theme
│   │   │   └── CreditsBanner.tsx   # Elrond credit status / BYOK prompt / sponsor link
│   │   ├── chat/
│   │   │   ├── ChatInput.tsx        # Prompt input w/ attachments, audio
│   │   │   ├── ResponsePanel.tsx    # Single response column
│   │   │   ├── TripleView.tsx       # Three-column layout
│   │   │   ├── ModelSelector.tsx    # Dropdown for picking a model
│   │   │   ├── CouncilConfig.tsx    # Council member picker (3-12 models)
│   │   │   ├── JudgmentBar.tsx      # Vote buttons: A / B / Council / Tie
│   │   │   ├── ResponseMeta.tsx     # Tokens, cost, time display
│   │   │   └── DeliberationTranscript.tsx  # Expandable council conversation
│   │   └── render/
│   │       ├── MarkdownRenderer.tsx
│   │       ├── CodeBlock.tsx        # Syntax highlight + run button
│   │       ├── SVGRenderer.tsx      # Renders SVG inline visually
│   │       ├── HTMLSandbox.tsx      # Sandboxed iframe for HTML
│   │       ├── MermaidRenderer.tsx
│   │       └── MathRenderer.tsx
│   │
│   ├── lib/
│   │   ├── llm/
│   │   │   ├── provider.ts          # Abstract LLM provider interface
│   │   │   ├── openrouter.ts        # OpenRouter API client
│   │   │   ├── anthropic.ts         # Direct Anthropic provider (optional)
│   │   │   ├── openai.ts            # Direct OpenAI provider (optional)
│   │   │   ├── google.ts            # Direct Google AI provider (optional)
│   │   │   ├── models.ts            # Model registry, resolver, metadata
│   │   │   └── council.ts           # Council orchestration engine
│   │   ├── credits/
│   │   │   ├── pool.ts              # Community credit pool manager
│   │   │   ├── rate-limiter.ts      # Per-user rate limiting for community credits
│   │   │   └── budget.ts            # Cost estimation before execution
│   │   ├── db/
│   │   │   ├── client.ts
│   │   │   ├── schema.ts
│   │   │   └── queries.ts
│   │   └── utils/
│   │       ├── tokens.ts            # Token counting
│   │       ├── cost.ts              # Cost calculation from OpenRouter pricing
│   │       └── stream.ts            # SSE streaming helpers
│   │
│   ├── hooks/
│   │   ├── useChat.ts
│   │   ├── useCouncil.ts
│   │   ├── useModels.ts
│   │   ├── useJudgment.ts
│   │   ├── useCredits.ts            # Credit pool status hook
│   │   └── useStats.ts              # Community stats (users, tokens, judgments)
│   │
│   └── types/
│       ├── models.ts
│       ├── chat.ts
│       ├── council.ts
│       └── leaderboard.ts
│
├── leaderboard/                     # ← SEPARATE SUB-PROJECT
│   ├── README.md                    #    Full setup, deploy, hosting instructions
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   ├── docker-compose.yml           #    Standalone leaderboard stack
│   ├── drizzle/
│   │   ├── schema.ts
│   │   └── migrations/
│   ├── src/
│   │   ├── server/                  #    API server (Express or Hono)
│   │   │   ├── index.ts
│   │   │   ├── routes/
│   │   │   │   ├── judgments.ts     #    POST /api/v1/judgments
│   │   │   │   ├── leaderboard.ts   #    GET /api/v1/leaderboard
│   │   │   │   └── characters.ts    #    GET /api/v1/characters (model→character mapping)
│   │   │   ├── scoring/
│   │   │   │   ├── elo.ts           #    ELO / Bradley-Terry scoring
│   │   │   │   ├── aggregation.ts   #    Stats computation
│   │   │   │   └── character-mapping.ts  # Maps models to LOTR characters
│   │   │   └── db/
│   │   │       ├── client.ts
│   │   │       ├── schema.ts
│   │   │       └── queries.ts
│   │   └── web/                     #    Public leaderboard frontend
│   │       ├── app/
│   │       │   ├── page.tsx         #    Main leaderboard view
│   │       │   ├── characters/
│   │       │   │   └── page.tsx     #    "Who Is Your Model?" character page
│   │       │   └── stats/
│   │       │       └── page.tsx     #    Deep analytics & charts
│   │       └── components/
│   │           ├── LeaderboardTable.tsx
│   │           ├── CharacterCard.tsx      # Model as LOTR character w/ photo
│   │           ├── CouncilComboChart.tsx   # Best council compositions
│   │           ├── CollaborationIndex.tsx  # Per-model collab scores
│   │           └── CategoryBreakdown.tsx
│   └── tests/
│       ├── scoring.test.ts
│       ├── judgments.test.ts
│       └── character-mapping.test.ts
│
└── tests/                           # Main app tests
    ├── unit/
    │   ├── lib/
    │   │   ├── openrouter.test.ts
    │   │   ├── council.test.ts
    │   │   ├── provider.test.ts
    │   │   ├── cost.test.ts
    │   │   └── credits-pool.test.ts
    │   └── components/
    │       ├── ModelSelector.test.tsx
    │       ├── JudgmentBar.test.tsx
    │       ├── CouncilConfig.test.tsx
    │       ├── ResponsePanel.test.tsx
    │       ├── CreditsBanner.test.tsx
    │       ├── StatsBar.test.tsx
    │       └── DeliberationTranscript.test.tsx
    ├── integration/
    │   ├── api/
    │   │   ├── chat.test.ts
    │   │   ├── council.test.ts
    │   │   ├── judgments.test.ts
    │   │   ├── credits.test.ts
    │   │   └── stats.test.ts
    │   └── council-flow.test.ts
    └── e2e/
        ├── chat-flow.spec.ts
        ├── judgment-flow.spec.ts
        └── council-deliberation.spec.ts
```

---

## Data Model

### Main Application Database

```sql
-- Users (optional, for tracking repeat visitors)
CREATE TABLE users (
  id            TEXT PRIMARY KEY DEFAULT (uuid()),
  display_name  TEXT,
  api_key_mode  TEXT DEFAULT 'community',  -- 'community' | 'byok'
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Chat sessions
CREATE TABLE chats (
  id            TEXT PRIMARY KEY DEFAULT (uuid()),
  user_id       TEXT REFERENCES users(id),
  title         TEXT,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- Individual messages within a chat
CREATE TABLE messages (
  id            TEXT PRIMARY KEY DEFAULT (uuid()),
  chat_id       TEXT REFERENCES chats(id) ON DELETE CASCADE,
  role          TEXT NOT NULL,           -- 'user' | 'assistant_a' | 'assistant_b' | 'council'
  model_id      TEXT,                    -- OpenRouter model ID (null for user messages)
  content       TEXT NOT NULL,
  token_count   INTEGER,
  cost_usd      REAL,
  latency_ms    INTEGER,
  funded_by     TEXT DEFAULT 'community', -- 'community' | 'user'
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Council deliberation sessions
CREATE TABLE council_sessions (
  id                TEXT PRIMARY KEY DEFAULT (uuid()),
  chat_id           TEXT REFERENCES chats(id) ON DELETE CASCADE,
  message_id        TEXT REFERENCES messages(id),
  member_models     TEXT NOT NULL,        -- JSON array of model IDs (3-12)
  num_rounds        INTEGER,
  total_tokens      INTEGER,
  total_cost_usd    REAL,
  total_latency_ms  INTEGER,
  transcript        TEXT,                 -- Full JSON deliberation transcript
  created_at        TIMESTAMP DEFAULT NOW()
);

-- User judgments
CREATE TABLE judgments (
  id                  TEXT PRIMARY KEY DEFAULT (uuid()),
  chat_id             TEXT REFERENCES chats(id),
  user_id             TEXT REFERENCES users(id),
  prompt_text         TEXT NOT NULL,
  model_a_id          TEXT NOT NULL,
  model_b_id          TEXT NOT NULL,
  council_members     TEXT NOT NULL,      -- JSON array of 3-12 model IDs
  winner              TEXT NOT NULL,      -- 'model_a' | 'model_b' | 'council' | 'tie'
  prompt_category     TEXT,              -- 'code' | 'creative' | 'reasoning' | 'factual' | ...
  submitted_to_public BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMP DEFAULT NOW()
);

-- Community credit pool tracking
CREATE TABLE credit_usage (
  id            TEXT PRIMARY KEY DEFAULT (uuid()),
  user_id       TEXT REFERENCES users(id),
  cost_usd      REAL NOT NULL,
  model_id      TEXT NOT NULL,
  request_type  TEXT NOT NULL,           -- 'chat' | 'council'
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Cached aggregate stats (refreshed every few minutes, served to the footer bar)
CREATE TABLE stats_cache (
  key           TEXT PRIMARY KEY,         -- 'total_users' | 'total_tokens' | 'total_judgments'
  value         REAL NOT NULL,
  updated_at    TIMESTAMP DEFAULT NOW()
);
```

### Leaderboard Database (in `/leaderboard`)

```sql
-- All judgments received from any Council of Elrond instance
CREATE TABLE public_judgments (
  id              TEXT PRIMARY KEY DEFAULT (uuid()),
  prompt_hash     TEXT NOT NULL,          -- SHA-256 of prompt (privacy)
  prompt_category TEXT,
  model_a_id      TEXT NOT NULL,
  model_b_id      TEXT NOT NULL,
  council_members TEXT NOT NULL,          -- JSON array of 3-12 model IDs
  winner          TEXT NOT NULL,
  source_instance TEXT,                   -- Identifier of submitting instance
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Computed leaderboard entries (refreshed periodically)
CREATE TABLE leaderboard_entries (
  id                  TEXT PRIMARY KEY DEFAULT (uuid()),
  entity_id           TEXT NOT NULL UNIQUE,
  entity_type         TEXT NOT NULL,      -- 'model' | 'council'
  display_name        TEXT NOT NULL,
  character_id        TEXT,               -- LOTR character assignment
  wins                INTEGER DEFAULT 0,
  losses              INTEGER DEFAULT 0,
  ties                INTEGER DEFAULT 0,
  elo_rating          REAL DEFAULT 1000.0,
  win_rate            REAL DEFAULT 0.0,
  collaboration_index REAL,              -- How much this model boosts councils
  total_judgments      INTEGER DEFAULT 0,
  updated_at          TIMESTAMP DEFAULT NOW()
);

-- LOTR character assignments (dynamic, recomputed as data grows)
CREATE TABLE character_assignments (
  id              TEXT PRIMARY KEY DEFAULT (uuid()),
  model_id        TEXT NOT NULL UNIQUE,
  character_id    TEXT NOT NULL,
  character_name  TEXT NOT NULL,
  rationale       TEXT,                   -- Why this model maps to this character
  photo_url       TEXT,                   -- Character portrait URL
  flavor_text     TEXT,                   -- In-character quote about the model
  assigned_at     TIMESTAMP DEFAULT NOW()
);
```

---

## 🧙 The Fellowship — Model Character Mapping

One of the leaderboard's signature features: **each AI model earns a Council of Elrond character** based on its observed behavior, collaboration style, and performance patterns. Assignments are dynamic and recompute as judgment data accumulates.

| Character | Archetype | Earning Criteria |
|-----------|-----------|-----------------|
| **Gandalf** 🧙 | The Wise Orchestrator | Highest solo win rate AND highest collaboration index — great alone and makes everyone better |
| **Aragorn** ⚔️ | The Reluctant King | Most consistent performer across all prompt categories — reliable under any circumstances |
| **Legolas** 🏹 | The Sharp-Eyed Specialist | Highest positive delta when added to a council — the precision that catches what others miss |
| **Gimli** ⛏️ | The Stubborn Powerhouse | High solo score but lower collaboration index — devastating alone, clashes in groups |
| **Boromir** 🛡️ | The Ambitious Contender | Strong solo but actively hurts council outcomes — impressive yet corruptive in collaboration |
| **Frodo** 💍 | The Unexpected Hero | Best cost-adjusted performance (quality per dollar) — the small model that carries the weight |
| **Sam** 🌱 | The Loyal Supporter | Highest average positive delta when added to *any* council — makes everyone around them better |
| **Elrond** 👑 | The Wise Convener | Best score specifically in the synthesizer role — brings order from chaos |
| **Glorfindel** ✨ | The Ancient Specialist | Highest win rate in a single category (e.g., code OR creative) — devastating in their domain |
| **Erestor** 📜 | The Cautious Advisor | Lowest error rate across all judgments — conservative, thorough, rarely wrong |
| **Galdor** 🌊 | The Questioner | Most frequently triggers productive additional deliberation rounds — asks the right questions |
| **Bilbo** 📖 | The Storyteller | Highest win rate on creative and writing tasks — surprising, inventive, full of unexpected angles |

### Character Cards

Each model's leaderboard entry features a **character card** with:

- 🖼️ **Character portrait** — from film stills, book illustrations, or original commissioned art
- 📊 **Key stats** — ELO rating, win rate, collaboration index, total judgments
- 📝 **Rationale** — auto-generated explanation of why this model earned this character
- 💬 **Flavor text** — an in-character quote about the model's performance, e.g.:
  > *"A wizard is never late, nor is he early. He arrives precisely when he means to — and with the correct answer."* — Gandalf on Claude Opus 4.6

Character assignments refresh as new judgment data arrives. They're designed to be shareable and fun — a hook for the community to rally around.

---

## LLM Provider Architecture

### OpenRouter as Primary Gateway

All model calls route through OpenRouter by default:

```typescript
// src/lib/llm/provider.ts

export interface LLMProvider {
  id: string;
  name: string;
  chat(params: ChatParams): AsyncGenerator<StreamChunk>;
  listModels(): Promise<ModelInfo[]>;
}

export interface ChatParams {
  model: string;
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
  stream: boolean;
}

export interface StreamChunk {
  content: string;
  done: boolean;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

```typescript
// src/lib/llm/openrouter.ts

export class OpenRouterProvider implements LLMProvider {
  id = 'openrouter';
  name = 'OpenRouter';
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async *chat(params: ChatParams): AsyncGenerator<StreamChunk> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://council-of-elrond.dev',
        'X-Title': 'Council of Elrond',
      },
      body: JSON.stringify({
        model: params.model,
        messages: params.messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.max_tokens,
        stream: params.stream,
      }),
    });
    // Handle SSE streaming...
  }

  async listModels(): Promise<ModelInfo[]> {
    const response = await fetch(`${this.baseUrl}/models`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
    });
    const data = await response.json();
    return data.data.map(mapOpenRouterModel);
  }
}
```

### Extensibility — Bring Your Own Keys

The provider system is pluggable. Users can supply their own API keys in the UI settings:

```typescript
// src/lib/llm/models.ts

export function resolveProvider(modelId: string, userKeys?: UserAPIKeys): LLMProvider {
  if (modelId.startsWith('anthropic/') && userKeys?.anthropic) {
    return new AnthropicProvider(userKeys.anthropic);
  }
  if (modelId.startsWith('openai/') && userKeys?.openai) {
    return new OpenAIProvider(userKeys.openai);
  }
  if (modelId.startsWith('google/') && userKeys?.google) {
    return new GoogleAIProvider(userKeys.google);
  }
  // Default: route through OpenRouter
  return new OpenRouterProvider(userKeys?.openrouter ?? process.env.OPENROUTER_API_KEY!);
}
```

### Default Models

| Role        | Model             | OpenRouter ID                    |
|-------------|-------------------|----------------------------------|
| Default A   | Claude Opus 4.6   | `anthropic/claude-opus-4.6`      |
| Default B   | GPT-5.2           | `openai/gpt-5-2`                |
| Council     | All three above + Gemini 3 Pro | `google/gemini-3-pro-preview` |

All models are selectable via dropdown. The full model list is fetched live from OpenRouter's `/api/v1/models` endpoint.

---

## Council Orchestration Engine

The council engine is the heart of the project — `src/lib/llm/council.ts`.

```typescript
export interface CouncilConfig {
  members: string[];              // Model IDs — minimum 3, maximum 12
  maxRounds: number;              // Default: 3, range: 1-10
  convergenceThreshold: number;   // 0-1, proportion of approvals needed
  userPrompt: string;
  attachments?: Attachment[];
  synthesizerStrategy: 'round-robin' | 'voted' | 'fixed';
}

export interface CouncilResult {
  finalResponse: string;
  transcript: CouncilRound[];
  totalTokens: number;
  totalCost: number;
  totalLatencyMs: number;
  roundsUsed: number;
  approvals: Map<string, boolean>;
  memberStats: Map<string, { tokens: number; cost: number }>;
}

export class CouncilEngine {
  constructor(config: CouncilConfig) {
    if (config.members.length < 3) throw new Error('Council requires minimum 3 members');
    if (config.members.length > 12) throw new Error('Council allows maximum 12 members');
    // ...
  }

  async *deliberate(): AsyncGenerator<CouncilStreamEvent> {
    // Phase 0: Acquaintance
    yield { type: 'phase', phase: 'acquaintance' };
    const roles = await this.acquaint();

    // Phase 1: Independent drafts
    yield { type: 'phase', phase: 'draft' };
    const drafts = await this.gatherDrafts(roles);

    // Phase 2-N: Deliberation rounds
    let currentState = drafts;
    for (let round = 1; round <= this.config.maxRounds; round++) {
      yield { type: 'phase', phase: 'critique', round };
      const critiques = await this.gatherCritiques(currentState, round);

      yield { type: 'phase', phase: 'synthesis', round };
      const synthesis = await this.synthesize(currentState, critiques, round);

      yield { type: 'phase', phase: 'approval', round };
      const approvals = await this.checkApprovals(synthesis);

      if (this.hasConverged(approvals)) {
        yield { type: 'converged', response: synthesis, round };
        return;
      }
      currentState = { drafts: currentState, critiques, synthesis };
    }

    yield { type: 'max_rounds', response: currentState };
  }
}
```

### Streaming Events to the UI

```typescript
type CouncilStreamEvent =
  | { type: 'phase'; phase: string; round?: number }
  | { type: 'member_response'; modelId: string; content: string; phase: string }
  | { type: 'synthesis'; content: string; round: number }
  | { type: 'converged'; response: string; round: number }
  | { type: 'max_rounds'; response: string }
  | { type: 'stats'; tokens: number; cost: number; latencyMs: number }
  | { type: 'error'; message: string };
```

---

## 💰 Community Credits & API Key Strategy

The hosted public instance uses a **community credit pool** — a shared OpenRouter balance that lets anyone try the Council of Elrond without needing their own API key. When the pool runs out, users bring their own keys.

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    API KEY RESOLUTION                        │
│                                                             │
│  1. User has their own key in settings?                     │
│     → Use user's key (BYOK mode)                           │
│     → No rate limits, no pool drain                         │
│     → Badge: "Using your API key"                          │
│                                                             │
│  2. Community pool has credits remaining?                   │
│     → Use community OpenRouter key                          │
│     → Per-user rate limits apply                           │
│     → Badge: "Community credits ☕"                         │
│                                                             │
│  3. Community pool exhausted?                               │
│     → Block request, show BYOK prompt                      │
│     → "Community credits have run out!                     │
│        Add your own OpenRouter key to keep going."          │
│     → Link to OpenRouter signup + key creation              │
│     → Optional: "Sponsor the Council" donation link         │
└─────────────────────────────────────────────────────────────┘
```

### Community Credit Pool Manager

```typescript
// src/lib/credits/pool.ts

export interface CreditPoolStatus {
  mode: 'community' | 'byok' | 'exhausted';
  communityCreditsRemaining: number | null;  // null if unknown/unchecked
  dailyLimitPerUser: number;                 // Max $ per user per day on community credits
  userSpentToday: number;                    // How much this user has spent today
  canMakeRequest: boolean;
  estimatedCostForRequest: number;           // Pre-flight cost estimate
}

export class CreditPoolManager {
  // Check OpenRouter balance via their API
  async getPoolBalance(): Promise<number> {
    const res = await fetch('https://openrouter.ai/api/v1/credits', {
      headers: { 'Authorization': `Bearer ${this.communityApiKey}` },
    });
    const data = await res.json();
    return data.total_credits - data.total_usage;
  }

  // Determine which key to use for a request
  resolveApiKey(userKeys?: UserAPIKeys): {
    key: string;
    mode: 'community' | 'byok';
  } {
    if (userKeys?.openrouter) return { key: userKeys.openrouter, mode: 'byok' };
    if (this.poolBalance > 0) return { key: this.communityApiKey, mode: 'community' };
    throw new CommunityCreditsExhaustedError();
  }
}
```

### Rate Limits for Community Credits

To prevent any single user from draining the pool, community-key usage is rate-limited:

| Limit | Value | Notes |
|-------|-------|-------|
| **Per-user daily spend** | $0.50/day | Enough for ~5-10 council sessions with frontier models |
| **Per-request max cost** | $0.25 | Prevents a 12-model, 10-round council from burning the pool |
| **Concurrent requests** | 2 | Per user, to prevent automated abuse |
| **Council max members (community)** | 5 | Community credits cap at 5-model councils; BYOK users get full 3-12 range |

BYOK users have **no rate limits** — they're spending their own money.

### UI: Credits Banner

A persistent but unobtrusive banner at the top of the chat interface shows the current state:

```
┌─────────────────────────────────────────────────────────┐
│ ☕ Community credits: ~$42.18 remaining                  │
│    You've used $0.12 today · Rate limit: $0.50/day       │
│    [Add your own key →] for unlimited access             │
└─────────────────────────────────────────────────────────┘
```

When the pool drops below $10, a stern Elrond banner appears:

```
┌─────────────────────────────────────────────────────────┐
│  ┌──────┐  The Council's coffers grow thin.             │
│  │      │  Community credits: ~$8.41 remaining          │
│  │  🧝  │                                               │
│  │      │  [☕ Sponsor the Council]  [Add your own key]  │
│  └──────┘                                               │
└─────────────────────────────────────────────────────────┘
```

When fully exhausted, the same banner updates its message:

```
│  │  🧝  │  Community credits have run out.              │
│  │      │  Add your own key — or help refill the pool.  │
│         │  [Add API Key]  [Get OpenRouter key (free)]   │
│         │  [☕ Sponsor the Council on GitHub]             │
```

The **"Sponsor the Council"** button links to the project's **GitHub Sponsors** page. Donations are manually loaded onto the community OpenRouter account by the maintainer. Use a small portrait of Elrond (original illustration to avoid licensing issues) — stern, in-universe, not a guilt trip.

### Cost Estimation Before Execution

Before running a query, show the user an estimated cost (especially for council queries):

```
Estimated cost: ~$0.14
├── Model A (Claude Opus 4.6):     ~$0.03
├── Model B (GPT-5.2):             ~$0.02
└── Council (3 models × 3 rounds): ~$0.09
[Run] [Cancel]
```

This is particularly useful for larger councils (say 8 models, 5 rounds) where the council cost can become significant. The estimate is based on model pricing from OpenRouter's `/api/v1/models` endpoint and the estimated token count of the prompt + expected response lengths.

---

## 🚀 Hosting & Deployment

### Target Architecture (Public Instance)

```
                    ┌────────────────────────────┐
                    │  Vercel (free tier)         │
                    │  ─────────────────          │
                    │  Main Next.js App           │
                    │  - Chat UI                  │
                    │  - API routes               │
                    │  - SSE streaming             │
                    │  Serverless functions        │
                    └──────────┬─────────────────┘
                               │
                    ┌──────────▼─────────────────┐
                    │  Vercel KV / Upstash Redis  │
                    │  ─────────────────────────  │
                    │  - Rate limiting state       │
                    │  - Credit pool cache         │
                    │  - Session data              │
                    │  (free tier: 10K cmds/day)   │
                    └─────────────────────────────┘

                    ┌─────────────────────────────┐
                    │  Railway / Fly.io (hobby)    │
                    │  ───────────────────────     │
                    │  Leaderboard API + DB        │
                    │  - Hono API server           │
                    │  - PostgreSQL                │
                    │  - Leaderboard frontend      │
                    │  (Railway: $5/mo hobby plan  │
                    │   or Fly.io free tier)       │
                    └─────────────────────────────┘

                    ┌─────────────────────────────┐
                    │  OpenRouter                  │
                    │  ─────────                   │
                    │  Community credit pool       │
                    │  (pre-loaded balance)         │
                    └─────────────────────────────┘
```

### Hosting Options & Costs

| Component | Option | Cost | Notes |
|-----------|--------|------|-------|
| **Main app** | Vercel free tier | $0/mo | Next.js native. 100GB bandwidth, serverless functions. May hit execution time limits on long council sessions — see below. |
| **Main app** (alt) | Railway hobby | $5/mo | Better for long-running SSE streams. No function timeout. |
| **Main app** (alt) | Fly.io free tier | $0/mo | 3 shared VMs, 256MB each. Good for small traffic. |
| **Leaderboard** | Railway hobby | $5/mo | PostgreSQL included. Simple API + static frontend. |
| **Leaderboard** (alt) | Fly.io + Neon | $0/mo | Fly for compute, Neon free-tier PostgreSQL. |
| **Rate limiting** | Upstash Redis | $0/mo | Free tier: 10K commands/day. Enough for rate limiting. |
| **Domain** | council-of-elrond.dev | ~$12/yr | Or use Vercel's `.vercel.app` subdomain for free. |

**Total minimum cost: $0–5/mo** (excluding LLM API credits).

### Vercel Timeout Consideration

Vercel's free-tier serverless functions have a **60-second execution limit** (300s on Pro). A 5-model council with 3 deliberation rounds could exceed this. Strategies:

1. **Streaming SSE keeps the connection alive** — Vercel's edge runtime allows long-lived SSE connections if data is sent within the timeout window. As long as the council sends phase updates frequently, this should work.
2. **Cap deliberation on community credits** — Community-key users get max 3-model, 2-round councils. BYOK users can go bigger.
3. **If needed, move to Railway** — $5/mo, no timeout limits, better for this use case.

### Deployment Commands

```bash
# Deploy main app to Vercel
vercel deploy --prod

# Deploy leaderboard to Railway
cd leaderboard
railway up

# Or deploy everything with Docker
docker compose -f docker-compose.prod.yml up -d
```

---

## 📣 Distribution & Community Growth

### Where to Share

When the project is ready for public use:

| Platform | Approach |
|----------|----------|
| **Hacker News** | "Show HN: Council of Elrond — Can a council of LLMs beat any single model?" Post with early results. |
| **Reddit** | r/MachineLearning, r/LocalLLaMA, r/artificial, r/ChatGPT — share interesting council deliberation transcripts and early leaderboard data. |
| **Twitter/X** | Thread with example prompts where the council produced surprisingly good (or amusingly bad) results. Tag AI researchers. |
| **LLM community Discords** | OpenRouter, Anthropic, OpenAI developer communities. |
| **Product Hunt** | Launch with the leaderboard + character cards as the hook. |
| **AI newsletters** | Pitch to The Batch, TLDR AI, Ben's Bites with early results. |
| **Academic** | If results are interesting, write up as a short paper — LLM collaboration dynamics is an underexplored area. Submit to EMNLP, NeurIPS workshop, or arXiv. |

### Hooks That Drive Engagement

1. **The character cards** — "Claude is Gandalf this week" is inherently shareable.
2. **Surprising council wins** — When 3 mediocre models beat a frontier model working alone, that's a story.
3. **The deliberation transcripts** — Watching models argue with each other is genuinely entertaining. Consider a "Best of Council Debates" page.
4. **Cost comparison** — "A council of 3 cheap models at $0.05 total beat Opus 4.6 at $0.25 solo" is a practical finding people care about.

---

## 🤝 Funding & Sustainability

The main cost is **LLM API tokens**, not hosting. A single council query with 3 frontier models and 3 rounds can cost $0.10–0.30. At scale, this adds up fast.

### Phase 1: Bootstrap ($0 budget)

- **Your own OpenRouter credits** fund initial community pool
- Keep pool modest ($25-50), apply rate limits
- Set up **GitHub Sponsors** for the repo — this is the "Sponsor the Council" target
- **Donation workflow**: Sponsor donates via GitHub Sponsors → maintainer receives funds → maintainer tops up OpenRouter community account → pool balance increases → Elrond relaxes
- Focus on collecting judgments and building the leaderboard dataset
- Optimize: encourage users to BYOK early, frame it as "support the research"

### Phase 2: Grants & Sponsorships (if it has legs)

| Source | What to Ask For | Likelihood |
|--------|----------------|------------|
| **OpenRouter** | API credits sponsorship. They actively sponsor open-source projects that drive usage to their platform. Email team@openrouter.ai. | High — this drives traffic to their platform |
| **Anthropic** | Research credits. They have a [research access program](https://www.anthropic.com/research). Pitch: studying multi-model collaboration dynamics. | Medium — novel research angle |
| **OpenAI** | [Researcher Access Program](https://openai.com/form/researcher-access-program/). Same pitch: structured LLM collaboration study. | Medium |
| **Google AI** | Cloud credits for research via Google Cloud for Startups or AI research grants. | Medium |
| **LMSYS / Chatbot Arena team** | Partnership or shared infrastructure. Your leaderboard data is complementary to theirs. | Worth exploring — shared research interest |
| **Academic compute grants** | NSF, university AI lab partnerships. If you can attach a PI and publish results. | Slow but sustainable |
| **GitHub Sponsors / Open Collective** | Community funding. Small but signals real demand. | Low $ but useful for credibility |

### Phase 3: Self-Sustaining (if it takes off)

- **Community-funded pool**: "Buy the Council a Coffee" — donations go directly to the OpenRouter credit pool. Show real-time balance and what it funds.
- **"Sponsor a Model" tier**: Companies/providers can sponsor their model's API costs on the council. OpenRouter, Anthropic, etc. have incentive — their model gets tested and compared publicly.
- **Premium BYOK features**: The core experience is always free. Premium features for BYOK users: unlimited council size, extended history, API access to raw judgment data, custom leaderboard views.

### Cost Projections

| Scenario | Daily Users | Queries/Day | Estimated Daily Cost | Monthly |
|----------|-------------|-------------|---------------------|---------|
| **Soft launch** | 20 | 50 | ~$5 | ~$150 |
| **HN front page day** | 500 | 1,000 | ~$100 | spike |
| **Steady organic** | 100 | 300 | ~$30 | ~$900 |
| **Growing community** | 500 | 1,500 | ~$150 | ~$4,500 |

With rate limiting and BYOK nudges, the community pool drain is much lower — maybe 30-50% of queries use community credits, the rest BYOK.

---

## Environment Variables

```env
# .env.example

# ─── Required ───────────────────────────────────────────
OPENROUTER_API_KEY=sk-or-...          # Community pool key (for hosted instance)
                                       # OR user's personal key (for self-hosted)

# ─── Optional: Direct Provider Keys ────────────────────
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=...

# ─── Database ──────────────────────────────────────────
DATABASE_URL=file:./dev.db            # SQLite for local dev
# DATABASE_URL=postgresql://...       # PostgreSQL for production

# ─── Community Credit Pool ─────────────────────────────
CREDIT_POOL_ENABLED=true               # Enable community credit pool
CREDIT_POOL_DAILY_LIMIT_PER_USER=0.50  # Max $ per user/day on community key
CREDIT_POOL_MAX_PER_REQUEST=0.25       # Max $ per single request
CREDIT_POOL_MAX_COUNCIL_MEMBERS=5      # Council size cap on community credits
CREDIT_POOL_LOW_BALANCE_THRESHOLD=10   # $ — show "running low" warning below this

# ─── Rate Limiting ─────────────────────────────────────
UPSTASH_REDIS_URL=...                  # For rate limiting (production)
UPSTASH_REDIS_TOKEN=...

# ─── Leaderboard ───────────────────────────────────────
LEADERBOARD_API_URL=https://leaderboard.council-of-elrond.dev/api/v1
LEADERBOARD_API_KEY=...
LEADERBOARD_SUBMIT_ENABLED=true

# ─── Hosting ───────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://council-of-elrond.dev
```

### User-Configurable Settings (via Settings Modal)

- **API Keys**: Own OpenRouter key or direct provider keys. Stored in browser localStorage only.
- **Default Models**: Default Model A, Model B, and council composition.
- **Council Settings**: Number of members (3-12), max rounds (1-10), transcript visibility.
- **Leaderboard**: Opt in/out of public judgment submission.
- **Theme**: Light / Dark mode.

---

## Development Methodology — Red-Green TDD

Every feature starts with a failing test.

### Testing Stack

- **Vitest** — Unit and integration tests
- **React Testing Library** — Component tests
- **Playwright** — E2E tests
- **MSW (Mock Service Worker)** — API mocking for OpenRouter

### TDD Workflow

1. **🔴 RED**: Write a failing test that describes the desired behavior
2. **🟢 GREEN**: Write the minimum code to make the test pass
3. **🔵 REFACTOR**: Clean up — tests stay green

### Example: Community Credit Pool Tests

```typescript
describe('CreditPoolManager', () => {
  it('should use user key when available (BYOK mode)', () => {
    const manager = new CreditPoolManager({ communityKey: 'sk-community' });
    const result = manager.resolveApiKey({ openrouter: 'sk-user' });
    expect(result).toEqual({ key: 'sk-user', mode: 'byok' });
  });

  it('should use community key when no user key and pool has balance', async () => {
    const manager = new CreditPoolManager({
      communityKey: 'sk-community',
      poolBalance: 42.18,
    });
    const result = manager.resolveApiKey();
    expect(result).toEqual({ key: 'sk-community', mode: 'community' });
  });

  it('should throw when community pool is exhausted and no user key', () => {
    const manager = new CreditPoolManager({
      communityKey: 'sk-community',
      poolBalance: 0,
    });
    expect(() => manager.resolveApiKey()).toThrow(CommunityCreditsExhaustedError);
  });

  it('should enforce daily per-user spend limit', async () => {
    const manager = new CreditPoolManager({
      communityKey: 'sk-community',
      poolBalance: 100,
      dailyLimitPerUser: 0.50,
    });
    await manager.recordUsage('user-1', 0.48);
    expect(manager.canUserMakeRequest('user-1', 0.05)).toBe(false);
  });

  it('should cap council size for community credits', () => {
    const manager = new CreditPoolManager({ maxCouncilMembers: 5 });
    expect(manager.validateCouncilSize(7, 'community')).toBe(false);
    expect(manager.validateCouncilSize(7, 'byok')).toBe(true);
  });
});
```

### Test Commands

```bash
npm test                    # All tests
npm run test:watch          # Watch mode
npm run test:unit           # Unit only
npm run test:integration    # Integration only
npm run test:e2e            # E2E (Playwright)
npm run test:coverage       # With coverage

cd leaderboard && npm test  # Leaderboard tests
```

---

## Implementation Order

Each phase starts with failing tests. Follow this sequence for a TDD build.

### Phase 1: Foundation
1. Project scaffolding — Next.js 14, Tailwind, shadcn/ui, Vitest, Playwright, MSW
2. LLM provider interface + OpenRouter client with tests
3. Model listing endpoint + `ModelSelector` component
4. Basic single-model chat with SSE streaming

### Phase 2: Triple View
5. `TripleView` three-column layout
6. Parallel model calls — two individual + council placeholder
7. `ResponseMeta` (tokens, cost, time per column)
8. Rich renderers: Markdown, Code, SVG, HTML sandbox, Mermaid, Math

### Phase 3: The Council
9. `CouncilEngine` — validation (3-12 members), acquaintance phase
10. `CouncilEngine` — draft phase (parallel independent responses)
11. `CouncilEngine` — critique + synthesis rounds
12. `CouncilEngine` — approval gate + convergence
13. Council SSE streaming to frontend
14. `CouncilConfig` UI — model picker (3-12), round config
15. `DeliberationTranscript` — expandable viewer

### Phase 4: Judgment & Leaderboard
16. `JudgmentBar` — vote buttons + local submission
17. Local judgment storage in app DB
18. `/leaderboard` sub-project scaffolding (package.json, DB, API server)
19. Leaderboard API — judgment ingestion + ELO scoring
20. Leaderboard web UI — rankings table
21. Character mapping engine (model → LOTR character from stats)
22. Character cards UI with portraits and flavor text
23. Public judgment submission: main app → leaderboard API

### Phase 5: Community Credits & Hosting
24. `CreditPoolManager` — balance checking, key resolution, rate limiting
25. `CreditsBanner` component — stern Elrond portrait at <$10, BYOK nudge, GitHub Sponsors link
26. Cost estimation before execution
27. Per-user daily spend tracking (`credit_usage` table + Upstash Redis)
28. Graceful degradation: pool exhausted → BYOK-only mode
29. `StatsBar` footer — total users, total tokens, total judgments (from `stats_cache` table)
30. `/api/stats` endpoint + periodic cache refresh
31. "Sponsor the Council" flow → GitHub Sponsors page, manual credit top-up workflow

### Phase 6: Polish & Launch
32. `Sidebar` — chat history with search
33. `ChatInput` — file attachments + audio input
34. `SettingsModal` — API keys, preferences, theme
35. Direct provider support (Anthropic, OpenAI, Google)
36. Docker Compose — full stack (app + leaderboard + DBs)
37. Deploy to Vercel + Railway
38. Documentation, license, contributing guide
39. Write launch post for HN / Reddit / Twitter

---

## Design Principles

- **Minimalist**: Calm, focused, generous whitespace. No visual noise.
- **Responsive**: Three columns on desktop, tabs on mobile.
- **Streaming**: Live response streaming. No full-page spinners.
- **Transparent**: Tokens, cost, time, deliberation process — all visible.
- **Extensible**: New provider = one interface. New renderer = one component. New metric = one function.
- **Privacy-first**: API keys in browser only. Prompts hashed before submission. Judgment sharing is opt-in.
- **Generous then graceful**: Community credits let anyone try it. When they run out, the transition to BYOK is helpful, not hostile.

---

## Getting Started

### Prerequisites
- Node.js 20+
- An [OpenRouter](https://openrouter.ai) API key

### Quick Start (Local)

```bash
git clone https://github.com/your-org/council-of-elrond.git
cd council-of-elrond
npm install
cp .env.example .env
# Add OPENROUTER_API_KEY to .env
npm run db:push
npm run dev
```

### Full Stack (App + Leaderboard)

```bash
docker compose up
```

### Self-Hosted Public Instance

See the [Hosting & Deployment](#-hosting--deployment) section for full instructions on deploying to Vercel + Railway.

---

## Contributing

1. Fork the repo
2. Create a feature branch
3. Write tests first (red-green TDD)
4. Submit a PR with a clear description

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

MIT — See [LICENSE](LICENSE).

---

<p align="center">
  <em>"I will take the Ring, though I do not know the way."</em>
  <br><br>
  If a council of hobbits, elves, dwarves, men, and a wizard can save Middle-earth,<br>
  perhaps a council of language models can write a better email.
  <br><br>
  <strong><a href="https://council-of-elrond.dev">Try it live</a></strong> · <strong><a href="https://leaderboard.council-of-elrond.dev">View the Leaderboard</a></strong> · <strong><a href="#-funding--sustainability">Sponsor the Council ☕</a></strong>
</p>
