import type {
  CouncilConfig,
  CouncilResult,
  CouncilStreamEvent,
  CompletedMessage,
} from '@/types/council';
import type { Message } from '@/types/chat';
import type { LLMProvider } from './provider';
import { resolveProvider, getModelDisplayName } from './models';
import type { UserAPIKeys } from '@/types/models';
import { estimateTokens } from '../utils/tokens';

const MAX_TURNS = 30;

function buildSystemPrompt(
  config: CouncilConfig,
  modelId: string,
  budgetUsed: number,
  conversationHistory: { modelId: string; content: string }[]
): string {
  const memberList = config.members
    .map((m) => getModelDisplayName(m))
    .join(', ');
  const budgetRemaining = config.contextBudget - budgetUsed;
  const budgetPercent = Math.round((budgetUsed / config.contextBudget) * 100);
  const majorityCount = Math.ceil(config.members.length / 2);

  let budgetWarning = '';
  if (budgetPercent >= 90) {
    budgetWarning =
      '\n\nCRITICAL: Budget nearly exhausted. You MUST either <<ENDORSE>> an existing proposal or propose a <<FINAL_ANSWER>> NOW.';
  } else if (budgetPercent >= 80) {
    budgetWarning =
      '\n\nWARNING: Budget running low. Focus on converging — endorse a proposal or propose a final answer.';
  }

  let historyBlock = '';
  if (conversationHistory.length > 0) {
    historyBlock =
      '\n\nCONVERSATION SO FAR:\n' +
      conversationHistory
        .map((m) => `[${getModelDisplayName(m.modelId)}]: ${m.content}`)
        .join('\n\n');
  }

  return `You are ${getModelDisplayName(modelId)}, participating in The Council of Elrond — a group chat of AI models working together to answer a user's question.

OTHER PARTICIPANTS: ${memberList}
USER'S QUESTION: ${config.userPrompt}

TOKEN BUDGET: ${config.contextBudget} total, ${budgetRemaining} remaining (${budgetPercent}% used).

RULES:
1. Free-form group chat. No rounds, phases, or assigned roles. Talk naturally.
2. Be concise. Every token costs money and depletes the shared budget.
3. Disagree openly. Challenge weak reasoning. Build on good ideas.
4. DO NOT repeat what others said. DO NOT summarize unless proposing a final answer.
5. Address others by name when responding to their points.

CONVERGENCE:
- To propose a final answer: <<FINAL_ANSWER>> [answer here] <</FINAL_ANSWER>>
- To endorse someone's proposal: <<ENDORSE>>
- To disagree: explain why and optionally propose a new final answer.
- Finalized when ${majorityCount}+ of ${config.members.length} members endorse.

BUDGET AWARENESS:
- Below 20% remaining: focus on converging.
- Below 10%: you MUST endorse or propose a final answer.${budgetWarning}${historyBlock}`;
}

/**
 * Tracks <<FINAL_ANSWER>> proposals and <<ENDORSE>> endorsements.
 */
class ConvergenceTracker {
  private latestProposal: { modelId: string; content: string } | null = null;
  private endorsements = new Set<string>();
  private memberCount: number;

  constructor(memberCount: number) {
    this.memberCount = memberCount;
  }

  processMessage(modelId: string, content: string): void {
    const openTag = '<<FINAL_ANSWER>>';
    const closeTag = '<</FINAL_ANSWER>>';
    const openIdx = content.indexOf(openTag);
    const closeIdx = content.indexOf(closeTag);
    const proposalMatch =
      openIdx !== -1 && closeIdx !== -1 && closeIdx > openIdx
        ? content.substring(openIdx + openTag.length, closeIdx).trim()
        : null;
    if (proposalMatch !== null) {
      this.latestProposal = { modelId, content: proposalMatch };
      this.endorsements.clear();
      this.endorsements.add(modelId);
      return;
    }

    if (content.includes('<<ENDORSE>>') && this.latestProposal) {
      this.endorsements.add(modelId);
    }
  }

  hasConverged(): boolean {
    if (!this.latestProposal) return false;
    const majority = Math.ceil(this.memberCount / 2);
    return this.endorsements.size >= majority;
  }

  getFinalAnswer(): string | null {
    return this.latestProposal?.content ?? null;
  }
}

/**
 * Selects next speaker using weighted-random with recency penalty.
 */
class SpeakerSelector {
  private weights: Map<string, number>;
  private members: string[];

  constructor(members: string[]) {
    this.members = members;
    this.weights = new Map();
    for (const m of members) {
      this.weights.set(m, 1.0);
    }
  }

  select(lastMessage?: { modelId: string; content: string }): string {
    const mentionBonuses = new Map<string, number>();
    if (lastMessage) {
      for (const m of this.members) {
        const displayName = getModelDisplayName(m);
        if (lastMessage.content.includes(displayName)) {
          mentionBonuses.set(m, 2.0);
        }
      }
    }

    let totalWeight = 0;
    const entries: { modelId: string; weight: number }[] = [];
    for (const m of this.members) {
      let w = this.weights.get(m) ?? 1.0;
      const bonus = mentionBonuses.get(m);
      if (bonus) w *= bonus;
      entries.push({ modelId: m, weight: w });
      totalWeight += w;
    }

    let roll = Math.random() * totalWeight;
    for (const entry of entries) {
      roll -= entry.weight;
      if (roll <= 0) {
        this.onSpoke(entry.modelId);
        return entry.modelId;
      }
    }

    const fallback = entries[entries.length - 1].modelId;
    this.onSpoke(fallback);
    return fallback;
  }

  private onSpoke(modelId: string): void {
    this.weights.set(modelId, 0.1);
    for (const m of this.members) {
      if (m !== modelId) {
        const current = this.weights.get(m) ?? 1.0;
        this.weights.set(m, Math.min(current + 0.3, 2.0));
      }
    }
  }
}

export class CouncilEngine {
  private config: CouncilConfig;
  private userKeys?: UserAPIKeys;
  private totalTokens = 0;
  private totalCost = 0;
  private startTime = 0;
  private memberStats: Record<string, { tokens: number; cost: number }> = {};

  constructor(config: CouncilConfig, userKeys?: UserAPIKeys) {
    if (config.members.length < 3) {
      throw new Error('Council requires minimum 3 members');
    }
    if (config.members.length > 12) {
      throw new Error('Council allows maximum 12 members');
    }
    this.config = config;
    this.userKeys = userKeys;

    for (const member of config.members) {
      this.memberStats[member] = { tokens: 0, cost: 0 };
    }
  }

  private getProvider(modelId: string): LLMProvider {
    return resolveProvider(modelId, this.userKeys);
  }

  private async *callModelStreaming(
    modelId: string,
    messages: Message[],
    turnIndex: number,
    maxTokens: number
  ): AsyncGenerator<CouncilStreamEvent> {
    yield { type: 'turn_start', modelId, turnIndex };

    const provider = this.getProvider(modelId);
    let content = '';
    let usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    try {
      for await (const chunk of provider.chat({
        model: modelId,
        messages,
        stream: true,
        max_tokens: maxTokens,
      })) {
        content += chunk.content;
        if (chunk.content) {
          yield { type: 'turn_delta', modelId, turnIndex, content: chunk.content };
        }
        if (chunk.usage) {
          usage = chunk.usage;
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Model call failed';
      yield { type: 'turn_delta', modelId, turnIndex, content: `[Error: ${errMsg}]` };
      content = `[Error: ${errMsg}]`;
    }

    const tokens = usage.total_tokens || estimateTokens(content);
    const cost = tokens * 0.00001;

    this.totalTokens += tokens;
    this.totalCost += cost;
    this.memberStats[modelId] = {
      tokens: (this.memberStats[modelId]?.tokens || 0) + tokens,
      cost: (this.memberStats[modelId]?.cost || 0) + cost,
    };

    yield { type: 'turn_end', modelId, turnIndex, tokens, cost };
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  private getMaxTokensForTurn(): number {
    const remaining = this.config.contextBudget - this.totalTokens;
    return Math.max(256, Math.min(2000, Math.floor(remaining * 0.3)));
  }

  async *deliberate(): AsyncGenerator<CouncilStreamEvent> {
    this.startTime = Date.now();

    const convergence = new ConvergenceTracker(this.config.members.length);
    const speakerSelector = new SpeakerSelector(this.config.members);
    const history: { modelId: string; content: string }[] = [];
    const completedMessages: CompletedMessage[] = [];
    let turnIndex = 0;

    yield { type: 'budget', used: 0, total: this.config.contextBudget };

    // Opening round: all models respond in shuffled order
    const shuffledMembers = this.shuffle(this.config.members);
    for (const modelId of shuffledMembers) {
      const maxTokens = this.getMaxTokensForTurn();
      const systemPrompt = buildSystemPrompt(
        this.config,
        modelId,
        this.totalTokens,
        history
      );

      const messages: Message[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: this.config.userPrompt },
      ];

      let turnContent = '';
      for await (const event of this.callModelStreaming(modelId, messages, turnIndex, maxTokens)) {
        yield event;
        if (event.type === 'turn_delta') turnContent += event.content;
        if (event.type === 'turn_end') {
          completedMessages.push({ modelId, content: turnContent, tokens: event.tokens, cost: event.cost });
        }
      }

      history.push({ modelId, content: turnContent });
      convergence.processMessage(modelId, turnContent);
      turnIndex++;

      yield { type: 'budget', used: this.totalTokens, total: this.config.contextBudget };

      if (convergence.hasConverged()) {
        yield { type: 'stats', tokens: this.totalTokens, cost: this.totalCost, latencyMs: Date.now() - this.startTime };
        yield { type: 'final_answer', response: convergence.getFinalAnswer()! };
        return;
      }

      if (this.totalTokens >= this.config.contextBudget) break;
    }

    // Main deliberation loop
    while (turnIndex < MAX_TURNS && this.totalTokens < this.config.contextBudget) {
      const lastMsg = history.length > 0 ? history[history.length - 1] : undefined;
      const modelId = speakerSelector.select(lastMsg);

      const maxTokens = this.getMaxTokensForTurn();
      const systemPrompt = buildSystemPrompt(
        this.config,
        modelId,
        this.totalTokens,
        history
      );

      const messages: Message[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: this.config.userPrompt },
      ];

      let turnContent = '';
      for await (const event of this.callModelStreaming(modelId, messages, turnIndex, maxTokens)) {
        yield event;
        if (event.type === 'turn_delta') turnContent += event.content;
        if (event.type === 'turn_end') {
          completedMessages.push({ modelId, content: turnContent, tokens: event.tokens, cost: event.cost });
        }
      }

      history.push({ modelId, content: turnContent });
      convergence.processMessage(modelId, turnContent);
      turnIndex++;

      yield { type: 'budget', used: this.totalTokens, total: this.config.contextBudget };

      if (convergence.hasConverged()) {
        yield { type: 'stats', tokens: this.totalTokens, cost: this.totalCost, latencyMs: Date.now() - this.startTime };
        yield { type: 'final_answer', response: convergence.getFinalAnswer()! };
        return;
      }
    }

    // Budget exhausted or max turns: take best existing proposal or last substantive message
    yield { type: 'stats', tokens: this.totalTokens, cost: this.totalCost, latencyMs: Date.now() - this.startTime };

    const existingAnswer = convergence.getFinalAnswer();
    if (existingAnswer) {
      yield { type: 'final_answer', response: existingAnswer };
    } else {
      const best =
        completedMessages
          .filter((m) => m.content.length > 50)
          .sort((a, b) => b.content.length - a.content.length)[0] ??
        completedMessages[completedMessages.length - 1];
      yield {
        type: 'final_answer',
        response: best?.content ?? 'The council could not reach a conclusion.',
      };
    }
  }

  async run(): Promise<CouncilResult> {
    let finalResponse = '';
    const messages: CompletedMessage[] = [];

    for await (const event of this.deliberate()) {
      if (event.type === 'final_answer') {
        finalResponse = event.response;
      }
    }

    return {
      finalResponse,
      messages,
      totalTokens: this.totalTokens,
      totalCost: this.totalCost,
      totalLatencyMs: Date.now() - this.startTime,
      memberStats: this.memberStats,
    };
  }
}
