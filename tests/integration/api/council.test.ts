import { describe, it, expect } from 'vitest';
import { CouncilEngine } from '@/lib/llm/council';
import type { CouncilStreamEvent } from '@/types/council';

describe('Council API Integration', () => {
  it('should complete a full council deliberation via MSW', async () => {
    const engine = new CouncilEngine(
      {
        members: [
          'anthropic/claude-opus-4-6',
          'openai/gpt-5-2',
          'google/gemini-3-pro-preview',
        ],
        maxRounds: 1,
        convergenceThreshold: 1.0,
        userPrompt: 'What is 2+2?',
        synthesizerStrategy: 'round-robin',
      },
      { openrouter: 'sk-or-test' }
    );

    const events: CouncilStreamEvent[] = [];
    for await (const event of engine.deliberate()) {
      events.push(event);
    }

    // Verify all expected phase types occurred
    const phaseTypes = events
      .filter((e) => e.type === 'phase')
      .map((e) => (e as { type: 'phase'; phase: string }).phase);

    expect(phaseTypes).toContain('acquaintance');
    expect(phaseTypes).toContain('draft');
    expect(phaseTypes).toContain('critique');
    expect(phaseTypes).toContain('synthesis');
    expect(phaseTypes).toContain('approval');

    // Should have a final event
    const lastEvent = events[events.length - 1];
    expect(
      lastEvent.type === 'converged' || lastEvent.type === 'max_rounds'
    ).toBe(true);

    // Should have member responses
    const memberResponses = events.filter((e) => e.type === 'member_response');
    expect(memberResponses.length).toBeGreaterThan(0);

    // Should have stats
    const statsEvents = events.filter((e) => e.type === 'stats');
    expect(statsEvents.length).toBe(1);
  }, 30000);

  it('should handle 1-round council', async () => {
    const engine = new CouncilEngine(
      {
        members: [
          'anthropic/claude-opus-4-6',
          'openai/gpt-5-2',
          'google/gemini-3-pro-preview',
        ],
        maxRounds: 1,
        convergenceThreshold: 1.0,
        userPrompt: 'Hello',
        synthesizerStrategy: 'fixed',
      },
      { openrouter: 'sk-or-test' }
    );

    const events: CouncilStreamEvent[] = [];
    for await (const event of engine.deliberate()) {
      events.push(event);
    }

    const lastEvent = events[events.length - 1];
    expect(
      lastEvent.type === 'converged' || lastEvent.type === 'max_rounds'
    ).toBe(true);
  }, 30000);
});
