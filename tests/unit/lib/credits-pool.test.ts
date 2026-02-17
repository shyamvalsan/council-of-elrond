import { describe, it, expect } from 'vitest';
import {
  CreditPoolManager,
  CommunityCreditsExhaustedError,
} from '@/lib/credits/pool';

describe('CreditPoolManager', () => {
  it('should use user key when available (BYOK mode)', () => {
    const manager = new CreditPoolManager({ communityKey: 'sk-community' });
    const result = manager.resolveApiKey({ openrouter: 'sk-user' });
    expect(result).toEqual({ key: 'sk-user', mode: 'byok' });
  });

  it('should use community key when no user key and pool has balance', () => {
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
      dailyLimitPerUser: 0.5,
    });
    await manager.recordUsage('user-1', 0.48);
    expect(manager.canUserMakeRequest('user-1', 0.05)).toBe(false);
  });

  it('should allow requests within daily limit', async () => {
    const manager = new CreditPoolManager({
      communityKey: 'sk-community',
      poolBalance: 100,
      dailyLimitPerUser: 0.5,
    });
    await manager.recordUsage('user-1', 0.1);
    expect(manager.canUserMakeRequest('user-1', 0.05)).toBe(true);
  });

  it('should cap council size for community credits', () => {
    const manager = new CreditPoolManager({ maxCouncilMembers: 5 });
    expect(manager.validateCouncilSize(7, 'community')).toBe(false);
    expect(manager.validateCouncilSize(7, 'byok')).toBe(true);
    expect(manager.validateCouncilSize(5, 'community')).toBe(true);
    expect(manager.validateCouncilSize(3, 'community')).toBe(true);
    expect(manager.validateCouncilSize(2, 'community')).toBe(false);
  });

  it('should check per-request cost limits', () => {
    const manager = new CreditPoolManager({ maxPerRequest: 0.25 });
    expect(manager.isWithinRequestLimit(0.2)).toBe(true);
    expect(manager.isWithinRequestLimit(0.3)).toBe(false);
  });

  it('should track concurrent requests', () => {
    const manager = new CreditPoolManager();
    expect(manager.startRequest('user-1')).toBe(true);
    expect(manager.startRequest('user-1')).toBe(true);
    expect(manager.startRequest('user-1')).toBe(false); // Max 2 concurrent
    manager.endRequest('user-1');
    expect(manager.startRequest('user-1')).toBe(true);
  });

  it('should report low balance correctly', () => {
    const lowManager = new CreditPoolManager({ poolBalance: 5 });
    expect(lowManager.isLowBalance()).toBe(true);

    const healthyManager = new CreditPoolManager({ poolBalance: 50 });
    expect(healthyManager.isLowBalance()).toBe(false);

    const emptyManager = new CreditPoolManager({ poolBalance: 0 });
    expect(emptyManager.isLowBalance()).toBe(false); // 0 is exhausted, not low
  });

  it('should get status for user', async () => {
    const manager = new CreditPoolManager({
      communityKey: 'sk-community',
      poolBalance: 42.18,
      dailyLimitPerUser: 0.5,
    });
    await manager.recordUsage('user-1', 0.12);

    const status = await manager.getStatus('user-1', 0.05);
    expect(status.mode).toBe('community');
    expect(status.communityCreditsRemaining).toBeCloseTo(42.06, 1);
    expect(status.userSpentToday).toBeCloseTo(0.12, 2);
    expect(status.canMakeRequest).toBe(true);
  });

  it('should report exhausted status', async () => {
    const manager = new CreditPoolManager({
      communityKey: 'sk-community',
      poolBalance: 0,
    });

    const status = await manager.getStatus('user-1');
    expect(status.mode).toBe('exhausted');
    expect(status.canMakeRequest).toBe(false);
  });

  it('should reset daily spend', async () => {
    const manager = new CreditPoolManager({
      communityKey: 'sk-community',
      poolBalance: 100,
      dailyLimitPerUser: 0.5,
    });
    await manager.recordUsage('user-1', 0.48);
    expect(manager.canUserMakeRequest('user-1', 0.05)).toBe(false);

    manager.resetDailySpend();
    expect(manager.canUserMakeRequest('user-1', 0.05)).toBe(true);
  });

  it('should decrease pool balance after usage', async () => {
    const manager = new CreditPoolManager({
      communityKey: 'sk-community',
      poolBalance: 10,
    });
    await manager.recordUsage('user-1', 3);
    const status = await manager.getStatus('user-1');
    expect(status.communityCreditsRemaining).toBeCloseTo(7, 1);
  });
});
