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
        contextBudget: 16384,
        userPrompt: 'What is 2+2?',
      },
      { openrouter: 'sk-or-test' }
    );

    const events: CouncilStreamEvent[] = [];
    for await (const event of engine.deliberate()) {
      events.push(event);
    }

    // Should have turn events
    const turnStarts = events.filter((e) => e.type === 'turn_start');
    expect(turnStarts.length).toBeGreaterThan(0);

    // Should have a final answer
    const finalAnswers = events.filter((e) => e.type === 'final_answer');
    expect(finalAnswers.length).toBe(1);

    // Should have stats
    const statsEvents = events.filter((e) => e.type === 'stats');
    expect(statsEvents.length).toBe(1);
  }, 30000);

  it('should handle small budget council', async () => {
    const engine = new CouncilEngine(
      {
        members: [
          'anthropic/claude-opus-4-6',
          'openai/gpt-5-2',
          'google/gemini-3-pro-preview',
        ],
        contextBudget: 8192,
        userPrompt: 'Hello',
      },
      { openrouter: 'sk-or-test' }
    );

    const events: CouncilStreamEvent[] = [];
    for await (const event of engine.deliberate()) {
      events.push(event);
    }

    const finalAnswers = events.filter((e) => e.type === 'final_answer');
    expect(finalAnswers.length).toBe(1);
  }, 30000);
});
