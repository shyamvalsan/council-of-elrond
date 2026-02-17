'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CreditPoolStatus } from '@/lib/credits/pool';

interface UseCreditsReturn {
  status: CreditPoolStatus | null;
  isLoading: boolean;
  error: string | null;
  isLowBalance: boolean;
  refresh: () => void;
}

export function useCredits(userId?: string): UseCreditsReturn {
  const [status, setStatus] = useState<CreditPoolStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLowBalance, setIsLowBalance] = useState(false);

  const fetchCredits = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (userId) headers['x-user-id'] = userId;

      const response = await fetch('/api/credits', { headers });
      if (!response.ok) throw new Error('Failed to fetch credit status');

      const data = await response.json();
      setStatus(data);
      setIsLowBalance(data.isLowBalance || false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchCredits();
    // Refresh every 2 minutes
    const interval = setInterval(fetchCredits, 120_000);
    return () => clearInterval(interval);
  }, [fetchCredits]);

  return { status, isLoading, error, isLowBalance, refresh: fetchCredits };
}
