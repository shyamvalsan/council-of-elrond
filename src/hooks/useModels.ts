'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ModelInfo } from '@/types/models';

interface UseModelsReturn {
  models: ModelInfo[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useModels(apiKey?: string): UseModelsReturn {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const headers: Record<string, string> = {};
      if (apiKey) headers['x-api-key'] = apiKey;

      const response = await fetch('/api/models', { headers });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to fetch models');
      }

      const data = await response.json();
      setModels(data.models);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch models';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return { models, isLoading, error, refresh: fetchModels };
}
