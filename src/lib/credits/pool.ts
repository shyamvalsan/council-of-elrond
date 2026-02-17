import type { UserAPIKeys } from '@/types/models';

export class CommunityCreditsExhaustedError extends Error {
  constructor() {
    super(
      'Community credits have run out. Please add your own API key to continue.'
    );
    this.name = 'CommunityCreditsExhaustedError';
  }
}

export interface CreditPoolStatus {
  mode: 'community' | 'byok' | 'exhausted';
  communityCreditsRemaining: number | null;
  dailyLimitPerUser: number;
  userSpentToday: number;
  canMakeRequest: boolean;
  estimatedCostForRequest: number;
}

export interface CreditPoolConfig {
  communityKey?: string;
  poolBalance?: number;
  dailyLimitPerUser?: number;
  maxPerRequest?: number;
  maxCouncilMembers?: number;
}

export class CreditPoolManager {
  private communityApiKey: string;
  private poolBalance: number;
  private dailyLimitPerUser: number;
  private maxPerRequest: number;
  private maxCouncilMembers: number;
  private userDailySpend: Map<string, number> = new Map();
  private userConcurrentRequests: Map<string, number> = new Map();

  constructor(config: CreditPoolConfig = {}) {
    this.communityApiKey = config.communityKey || process.env.OPENROUTER_API_KEY || '';
    this.poolBalance = config.poolBalance ?? 100;
    this.dailyLimitPerUser =
      config.dailyLimitPerUser ??
      parseFloat(process.env.CREDIT_POOL_DAILY_LIMIT_PER_USER || '0.50');
    this.maxPerRequest =
      config.maxPerRequest ??
      parseFloat(process.env.CREDIT_POOL_MAX_PER_REQUEST || '0.25');
    this.maxCouncilMembers =
      config.maxCouncilMembers ??
      parseInt(process.env.CREDIT_POOL_MAX_COUNCIL_MEMBERS || '5', 10);
  }

  /**
   * Check community pool balance via OpenRouter API.
   */
  async getPoolBalance(): Promise<number> {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/credits', {
        headers: { Authorization: `Bearer ${this.communityApiKey}` },
      });
      const json = await res.json();
      const credits = json.data || json;
      this.poolBalance = credits.total_credits - credits.total_usage;
      return this.poolBalance;
    } catch {
      return this.poolBalance;
    }
  }

  /**
   * Determine which API key to use for a request.
   */
  resolveApiKey(userKeys?: UserAPIKeys): { key: string; mode: 'community' | 'byok' } {
    if (userKeys?.openrouter) {
      return { key: userKeys.openrouter, mode: 'byok' };
    }
    if (this.poolBalance > 0) {
      return { key: this.communityApiKey, mode: 'community' };
    }
    throw new CommunityCreditsExhaustedError();
  }

  /**
   * Record usage for a user.
   */
  async recordUsage(userId: string, cost: number): Promise<void> {
    const current = this.userDailySpend.get(userId) || 0;
    this.userDailySpend.set(userId, current + cost);
    this.poolBalance = Math.max(0, this.poolBalance - cost);
  }

  /**
   * Check if a user can make a request given current spend.
   */
  canUserMakeRequest(userId: string, estimatedCost: number): boolean {
    const spent = this.userDailySpend.get(userId) || 0;
    return spent + estimatedCost <= this.dailyLimitPerUser;
  }

  /**
   * Check if a request is within per-request cost limits.
   */
  isWithinRequestLimit(estimatedCost: number): boolean {
    return estimatedCost <= this.maxPerRequest;
  }

  /**
   * Validate council size based on API key mode.
   */
  validateCouncilSize(memberCount: number, mode: 'community' | 'byok'): boolean {
    if (mode === 'byok') return memberCount >= 3 && memberCount <= 12;
    return memberCount >= 3 && memberCount <= this.maxCouncilMembers;
  }

  /**
   * Get current pool status for display.
   */
  async getStatus(userId: string, estimatedCost: number = 0): Promise<CreditPoolStatus> {
    const userSpent = this.userDailySpend.get(userId) || 0;
    const canMake = this.canUserMakeRequest(userId, estimatedCost);

    if (this.poolBalance <= 0) {
      return {
        mode: 'exhausted',
        communityCreditsRemaining: 0,
        dailyLimitPerUser: this.dailyLimitPerUser,
        userSpentToday: userSpent,
        canMakeRequest: false,
        estimatedCostForRequest: estimatedCost,
      };
    }

    return {
      mode: 'community',
      communityCreditsRemaining: this.poolBalance,
      dailyLimitPerUser: this.dailyLimitPerUser,
      userSpentToday: userSpent,
      canMakeRequest: canMake,
      estimatedCostForRequest: estimatedCost,
    };
  }

  /**
   * Check if the pool balance is below the low threshold.
   */
  isLowBalance(): boolean {
    const threshold = parseFloat(
      process.env.CREDIT_POOL_LOW_BALANCE_THRESHOLD || '10'
    );
    return this.poolBalance > 0 && this.poolBalance < threshold;
  }

  /**
   * Track concurrent requests per user.
   */
  startRequest(userId: string): boolean {
    const current = this.userConcurrentRequests.get(userId) || 0;
    if (current >= 2) return false; // Max 2 concurrent
    this.userConcurrentRequests.set(userId, current + 1);
    return true;
  }

  endRequest(userId: string): void {
    const current = this.userConcurrentRequests.get(userId) || 1;
    this.userConcurrentRequests.set(userId, Math.max(0, current - 1));
  }

  /**
   * Reset daily spend tracking (called at midnight).
   */
  resetDailySpend(): void {
    this.userDailySpend.clear();
  }
}
