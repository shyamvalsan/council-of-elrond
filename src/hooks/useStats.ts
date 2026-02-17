'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CommunityStats } from '@/types/leaderboard';

interface UseStatsReturn {
  stats: CommunityStats;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useStats(): UseStatsReturn {
  const [stats, setStats] = useState<CommunityStats>({
    totalUsers: 0,
    totalTokens: 0,
    totalJudgments: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 300_000); // 5 min
    return () => clearInterval(interval);
  }, [fetchStats]);

  return { stats, isLoading, error, refresh: fetchStats };
}
