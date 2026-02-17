import type {
  CouncilConfig,
  CouncilResult,
  CouncilRound,
  CouncilStreamEvent,
  MemberResponse,
} from '@/types/council';
import type { Message, StreamChunk } from '@/types/chat';
import type { LLMProvider } from './provider';
import { resolveProvider, getModelDisplayName } from './models';
import type { UserAPIKeys } from '@/types/models';
import { estimateTokens } from '../utils/tokens';

const COUNCIL_SYSTEM_PROMPT = `You are a member of The Council of Elrond — a deliberative body of AI models collaborating to produce the best possible response to a user's query.

Your fellow council members are: {member_list}
The user's query is: {user_prompt}

Current phase: {phase}
Round: {round} of {max_rounds}

You are free to:
- Adopt a persona or specialization that serves the problem best
- Disagree with other members and argue your position with evidence
- Propose structural approaches to solving the problem
- Build on the strengths of other members' contributions
- Point out errors, gaps, or weaknesses in any draft
- Call for additional deliberation if quality is insufficient
- Signal when you believe the response is ready

Your explicit goal is to produce a response that is BETTER than what any of you could produce individually. Collaborate, challenge, synthesize.

{phase_instructions}`;

function buildSystemPrompt(
  config: CouncilConfig,
  phase: string,
  round: number,
  phaseInstructions: string
): string {
  const memberList = config.members
    .map((m) => getModelDisplayName(m))
    .join(', ');

  return COUNCIL_SYSTEM_PROMPT
    .replace('{member_list}', memberList)
    .replace('{user_prompt}', config.userPrompt)
    .replace('{phase}', phase)
    .replace('{round}', round.toString())
    .replace('{max_rounds}', config.maxRounds.toString())
    .replace('{phase_instructions}', phaseInstructions);
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
    if (config.maxRounds < 1 || config.maxRounds > 10) {
      throw new Error('Max rounds must be between 1 and 10');
    }
    this.config = {
      ...config,
      convergenceThreshold: config.convergenceThreshold ?? 1.0,
    };
    this.userKeys = userKeys;

    for (const member of config.members) {
      this.memberStats[member] = { tokens: 0, cost: 0 };
    }
  }

  private getProvider(modelId: string): LLMProvider {
    return resolveProvider(modelId, this.userKeys);
  }

  private async callModel(
    modelId: string,
    messages: Message[]
  ): Promise<MemberResponse> {
    const provider = this.getProvider(modelId);
    const start = Date.now();
    let content = '';
    let usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    for await (const chunk of provider.chat({
      model: modelId,
      messages,
      stream: true,
    })) {
      content += chunk.content;
      if (chunk.usage) {
        usage = chunk.usage;
      }
    }

    const latencyMs = Date.now() - start;
    const tokens = usage.total_tokens || estimateTokens(content);
    // Rough cost estimate if not provided
    const cost = tokens * 0.00001; // Approximate

    this.totalTokens += tokens;
    this.totalCost += cost;
    this.memberStats[modelId] = {
      tokens: (this.memberStats[modelId]?.tokens || 0) + tokens,
      cost: (this.memberStats[modelId]?.cost || 0) + cost,
    };

    return { modelId, content, tokens, cost, latencyMs };
  }

  private getSynthesizerForRound(round: number): string {
    switch (this.config.synthesizerStrategy) {
      case 'round-robin':
        return this.config.members[(round - 1) % this.config.members.length];
      case 'fixed':
        return this.config.members[0];
      case 'voted':
        // Default to round-robin for voted (would need voting logic)
        return this.config.members[(round - 1) % this.config.members.length];
      default:
        return this.config.members[0];
    }
  }

  async *deliberate(): AsyncGenerator<CouncilStreamEvent> {
    this.startTime = Date.now();

    // Phase 0: Acquaintance
    yield { type: 'phase', phase: 'acquaintance' };
    const roles = await this.acquaint();
    for (const role of roles) {
      yield {
        type: 'member_response',
        modelId: role.modelId,
        content: role.content,
        phase: 'acquaintance',
      };
    }

    // Phase 1: Independent drafts
    yield { type: 'phase', phase: 'draft' };
    const drafts = await this.gatherDrafts();
    for (const draft of drafts) {
      yield {
        type: 'member_response',
        modelId: draft.modelId,
        content: draft.content,
        phase: 'draft',
      };
    }

    // Phase 2-N: Deliberation rounds
    let lastSynthesis = '';
    const transcript: CouncilRound[] = [];

    for (let round = 1; round <= this.config.maxRounds; round++) {
      // Critique phase
      yield { type: 'phase', phase: 'critique', round };
      const critiques = await this.gatherCritiques(drafts, lastSynthesis, round);
      for (const critique of critiques) {
        yield {
          type: 'member_response',
          modelId: critique.modelId,
          content: critique.content,
          phase: 'critique',
        };
      }

      // Synthesis phase
      yield { type: 'phase', phase: 'synthesis', round };
      const synthesizerId = this.getSynthesizerForRound(round);
      const synthesis = await this.synthesize(drafts, critiques, round, synthesizerId);
      lastSynthesis = synthesis.content;
      yield { type: 'synthesis', content: synthesis.content, round };

      // Approval gate
      yield { type: 'phase', phase: 'approval', round };
      const approvals = await this.checkApprovals(synthesis.content, round);

      const roundData: CouncilRound = {
        round,
        critiques,
        synthesis: synthesis.content,
        synthesizerId,
        approvals,
      };
      transcript.push(roundData);

      // Check convergence
      if (this.hasConverged(approvals)) {
        yield {
          type: 'stats',
          tokens: this.totalTokens,
          cost: this.totalCost,
          latencyMs: Date.now() - this.startTime,
        };
        yield { type: 'converged', response: lastSynthesis, round };
        return;
      }
    }

    // Max rounds reached
    yield {
      type: 'stats',
      tokens: this.totalTokens,
      cost: this.totalCost,
      latencyMs: Date.now() - this.startTime,
    };
    yield { type: 'max_rounds', response: lastSynthesis };
  }

  /**
   * Run the full deliberation and return a structured result.
   */
  async run(): Promise<CouncilResult> {
    let finalResponse = '';
    let roundsUsed = 0;
    const transcript: CouncilRound[] = [];
    let finalApprovals: Record<string, boolean> = {};

    for await (const event of this.deliberate()) {
      if (event.type === 'converged') {
        finalResponse = event.response;
        roundsUsed = event.round;
      } else if (event.type === 'max_rounds') {
        finalResponse = event.response;
        roundsUsed = this.config.maxRounds;
      }
    }

    return {
      finalResponse,
      transcript,
      totalTokens: this.totalTokens,
      totalCost: this.totalCost,
      totalLatencyMs: Date.now() - this.startTime,
      roundsUsed,
      approvals: finalApprovals,
      memberStats: this.memberStats,
    };
  }

  private async acquaint(): Promise<MemberResponse[]> {
    const systemPrompt = buildSystemPrompt(
      this.config,
      'acquaintance',
      0,
      'Introduce yourself briefly. What perspective or expertise do you bring to this query? Keep it to 1-2 sentences.'
    );

    const responses = await Promise.all(
      this.config.members.map((modelId) =>
        this.callModel(modelId, [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: this.config.userPrompt },
        ])
      )
    );

    return responses;
  }

  private async gatherDrafts(): Promise<MemberResponse[]> {
    const systemPrompt = buildSystemPrompt(
      this.config,
      'independent_draft',
      0,
      'Produce your independent draft response to the user\'s query. Be thorough and complete. This is your solo attempt before deliberation begins.'
    );

    const responses = await Promise.all(
      this.config.members.map((modelId) =>
        this.callModel(modelId, [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: this.config.userPrompt },
        ])
      )
    );

    return responses;
  }

  private async gatherCritiques(
    drafts: MemberResponse[],
    previousSynthesis: string,
    round: number
  ): Promise<MemberResponse[]> {
    const draftsText = drafts
      .map(
        (d) =>
          `[${getModelDisplayName(d.modelId)}]:\n${d.content}`
      )
      .join('\n\n---\n\n');

    const contextParts = [`Previous drafts:\n\n${draftsText}`];
    if (previousSynthesis) {
      contextParts.push(`\nPrevious synthesis:\n${previousSynthesis}`);
    }

    const systemPrompt = buildSystemPrompt(
      this.config,
      'critique',
      round,
      `Review the drafts from your fellow council members. Identify strengths, weaknesses, errors, and gaps. Be constructive but honest. Suggest specific improvements.\n\n${contextParts.join('\n')}`
    );

    const responses = await Promise.all(
      this.config.members.map((modelId) =>
        this.callModel(modelId, [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: this.config.userPrompt },
        ])
      )
    );

    return responses;
  }

  private async synthesize(
    drafts: MemberResponse[],
    critiques: MemberResponse[],
    round: number,
    synthesizerId: string
  ): Promise<MemberResponse> {
    const draftsText = drafts
      .map(
        (d) =>
          `[${getModelDisplayName(d.modelId)}]:\n${d.content}`
      )
      .join('\n\n---\n\n');

    const critiquesText = critiques
      .map(
        (c) =>
          `[${getModelDisplayName(c.modelId)}]:\n${c.content}`
      )
      .join('\n\n---\n\n');

    const systemPrompt = buildSystemPrompt(
      this.config,
      'synthesis',
      round,
      `You are the designated synthesizer for this round. Combine the best elements from all drafts and address the critiques to produce a unified, improved response.\n\nDrafts:\n${draftsText}\n\nCritiques:\n${critiquesText}\n\nProduce the best possible unified response.`
    );

    return this.callModel(synthesizerId, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: this.config.userPrompt },
    ]);
  }

  private async checkApprovals(
    synthesis: string,
    round: number
  ): Promise<Record<string, boolean>> {
    const systemPrompt = buildSystemPrompt(
      this.config,
      'approval',
      round,
      `Review this synthesized response. Do you approve it as the council's final answer? Respond with APPROVE if you're satisfied, or REVISE if you think it needs changes (and explain what changes).\n\nSynthesized response:\n${synthesis}`
    );

    const responses = await Promise.all(
      this.config.members.map(async (modelId) => {
        const response = await this.callModel(modelId, [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: this.config.userPrompt },
        ]);
        const approved =
          response.content.toUpperCase().includes('APPROVE') &&
          !response.content.toUpperCase().includes('REVISE');
        return { modelId, approved };
      })
    );

    const approvals: Record<string, boolean> = {};
    for (const r of responses) {
      approvals[r.modelId] = r.approved;
    }
    return approvals;
  }

  private hasConverged(approvals: Record<string, boolean>): boolean {
    const totalMembers = this.config.members.length;
    const approvedCount = Object.values(approvals).filter(Boolean).length;
    return approvedCount / totalMembers >= this.config.convergenceThreshold;
  }
}
