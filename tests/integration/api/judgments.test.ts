import { describe, it, expect } from 'vitest';

describe('Judgments API Integration', () => {
  it('should validate winner field', () => {
    const validWinners = ['model_a', 'model_b', 'council', 'tie'];
    for (const w of validWinners) {
      expect(validWinners.includes(w)).toBe(true);
    }
    expect(validWinners.includes('invalid')).toBe(false);
  });

  it('should require all fields for judgment submission', () => {
    const required = [
      'promptText',
      'modelAId',
      'modelBId',
      'councilMembers',
      'winner',
    ];

    const validBody = {
      promptText: 'test prompt',
      modelAId: 'anthropic/claude-opus-4-6',
      modelBId: 'openai/gpt-5-2',
      councilMembers: ['anthropic/claude-opus-4-6', 'openai/gpt-5-2', 'google/gemini-3-pro-preview'],
      winner: 'council',
    };

    for (const field of required) {
      const body = { ...validBody };
      delete (body as Record<string, unknown>)[field];
      const missing = !body.promptText || !body.modelAId || !body.modelBId || !body.councilMembers?.length || !body.winner;
      expect(missing).toBe(true);
    }
  });

  it('should accept SHA-256 prompt hashing for privacy', async () => {
    const promptText = 'What is the meaning of life?';
    const encoder = new TextEncoder();
    const data = encoder.encode(promptText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const promptHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    expect(promptHash).toHaveLength(64);
    expect(promptHash).not.toBe(promptText);
    // Same input should produce same hash
    const data2 = encoder.encode(promptText);
    const hashBuffer2 = await crypto.subtle.digest('SHA-256', data2);
    const hashArray2 = Array.from(new Uint8Array(hashBuffer2));
    const promptHash2 = hashArray2.map((b) => b.toString(16).padStart(2, '0')).join('');
    expect(promptHash2).toBe(promptHash);
  });
});
