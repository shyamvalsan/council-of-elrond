'use client';

import { useState, useCallback, useRef } from 'react';
import type { Message } from '@/types/chat';
import type { CouncilStreamEvent } from '@/types/council';
import { parseSSEStream } from '@/lib/utils/stream';

interface UseCouncilOptions {
  members: string[];
  maxRounds?: number;
  convergenceThreshold?: number;
  synthesizerStrategy?: 'round-robin' | 'voted' | 'fixed';
  apiKey?: string;
  onEvent?: (event: CouncilStreamEvent) => void;
  onComplete?: (response: string) => void;
  onError?: (error: Error) => void;
}

interface UseCouncilReturn {
  isDeliberating: boolean;
  currentPhase: string | null;
  currentRound: number;
  finalResponse: string | null;
  transcript: CouncilStreamEvent[];
  stats: { tokens: number; cost: number; latencyMs: number } | null;
  error: string | null;
  startDeliberation: (messages: Message[]) => Promise<void>;
  reset: () => void;
}

export function useCouncil(options: UseCouncilOptions): UseCouncilReturn {
  const {
    members,
    maxRounds = 3,
    convergenceThreshold = 1.0,
    synthesizerStrategy = 'round-robin',
    apiKey,
    onEvent,
    onComplete,
    onError,
  } = options;

  const [isDeliberating, setIsDeliberating] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [finalResponse, setFinalResponse] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<CouncilStreamEvent[]>([]);
  const [stats, setStats] = useState<{ tokens: number; cost: number; latencyMs: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const startDeliberation = useCallback(
    async (messages: Message[]) => {
      setIsDeliberating(true);
      setCurrentPhase(null);
      setCurrentRound(0);
      setFinalResponse(null);
      setTranscript([]);
      setStats(null);
      setError(null);

      abortRef.current = new AbortController();

      try {
        const response = await fetch('/api/council', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            members,
            maxRounds,
            convergenceThreshold,
            synthesizerStrategy,
            messages,
            userApiKey: apiKey,
          }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || `HTTP ${response.status}`);
        }

        for await (const event of parseSSEStream<CouncilStreamEvent>(response)) {
          setTranscript((prev) => [...prev, event]);
          onEvent?.(event);

          switch (event.type) {
            case 'phase':
              setCurrentPhase(event.phase);
              if (event.round) setCurrentRound(event.round);
              break;
            case 'converged':
              setFinalResponse(event.response);
              onComplete?.(event.response);
              break;
            case 'max_rounds':
              setFinalResponse(event.response);
              onComplete?.(event.response);
              break;
            case 'stats':
              setStats({
                tokens: event.tokens,
                cost: event.cost,
                latencyMs: event.latencyMs,
              });
              break;
            case 'error':
              setError(event.message);
              break;
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
      } finally {
        setIsDeliberating(false);
      }
    },
    [members, maxRounds, convergenceThreshold, synthesizerStrategy, apiKey, onEvent, onComplete, onError]
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setIsDeliberating(false);
    setCurrentPhase(null);
    setCurrentRound(0);
    setFinalResponse(null);
    setTranscript([]);
    setStats(null);
    setError(null);
  }, []);

  return {
    isDeliberating,
    currentPhase,
    currentRound,
    finalResponse,
    transcript,
    stats,
    error,
    startDeliberation,
    reset,
  };
}
