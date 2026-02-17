import { describe, it, expect } from 'vitest';
import { CreditPoolManager, CommunityCreditsExhaustedError } from '@/lib/credits/pool';

describe('Credits API Integration', () => {
  it('should resolve API key based on three-tier hierarchy', () => {
    // Tier 1: User key takes priority
    const manager = new CreditPoolManager({
      communityKey: 'sk-community',
      poolBalance: 100,
    });
    const byokResult = manager.resolveApiKey({ openrouter: 'sk-user' });
    expect(byokResult.mode).toBe('byok');
    expect(byokResult.key).toBe('sk-user');

    // Tier 2: Community key when no user key
    const communityResult = manager.resolveApiKey();
    expect(communityResult.mode).toBe('community');
    expect(communityResult.key).toBe('sk-community');

    // Tier 3: Exhausted
    const emptyManager = new CreditPoolManager({
      communityKey: 'sk-community',
      poolBalance: 0,
    });
    expect(() => emptyManager.resolveApiKey()).toThrow(CommunityCreditsExhaustedError);
  });

  it('should enforce rate limits for community users', async () => {
    const manager = new CreditPoolManager({
      communityKey: 'sk-community',
      poolBalance: 100,
      dailyLimitPerUser: 0.5,
      maxPerRequest: 0.25,
    });

    // Should allow initial request
    expect(manager.canUserMakeRequest('user-1', 0.1)).toBe(true);

    // Record usage up to limit
    await manager.recordUsage('user-1', 0.45);

    // Should reject request that would exceed daily limit
    expect(manager.canUserMakeRequest('user-1', 0.1)).toBe(false);

    // Should still allow for different user
    expect(manager.canUserMakeRequest('user-2', 0.1)).toBe(true);
  });

  it('should cap council size for community credits', () => {
    const manager = new CreditPoolManager({
      maxCouncilMembers: 5,
    });

    expect(manager.validateCouncilSize(3, 'community')).toBe(true);
    expect(manager.validateCouncilSize(5, 'community')).toBe(true);
    expect(manager.validateCouncilSize(6, 'community')).toBe(false);
    expect(manager.validateCouncilSize(12, 'community')).toBe(false);

    // BYOK has full range
    expect(manager.validateCouncilSize(12, 'byok')).toBe(true);
  });

  it('should manage concurrent request limits', () => {
    const manager = new CreditPoolManager();

    // Allow up to 2 concurrent requests
    expect(manager.startRequest('user-1')).toBe(true);
    expect(manager.startRequest('user-1')).toBe(true);
    expect(manager.startRequest('user-1')).toBe(false);

    // End one request, now should allow
    manager.endRequest('user-1');
    expect(manager.startRequest('user-1')).toBe(true);
  });
});
