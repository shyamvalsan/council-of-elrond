'use client';

import { useState, useCallback, useRef } from 'react';
import type { Message } from '@/types/chat';
import type { CouncilStreamEvent, CompletedMessage } from '@/types/council';
import { parseSSEStream } from '@/lib/utils/stream';

interface UseCouncilOptions {
  members: string[];
  contextBudget?: number;
  apiKey?: string;
  onEvent?: (event: CouncilStreamEvent) => void;
  onComplete?: (response: string) => void;
  onError?: (error: Error) => void;
}

interface ActiveTurn {
  modelId: string;
  turnIndex: number;
  content: string;
}

interface UseCouncilReturn {
  isDeliberating: boolean;
  completedMessages: CompletedMessage[];
  activeTurn: ActiveTurn | null;
  budget: { used: number; total: number } | null;
  finalResponse: string | null;
  stats: { tokens: number; cost: number; latencyMs: number } | null;
  error: string | null;
  startDeliberation: (messages: Message[]) => Promise<void>;
  reset: () => void;
}

export function useCouncil(options: UseCouncilOptions): UseCouncilReturn {
  const {
    members,
    contextBudget = 16384,
    apiKey,
    onEvent,
    onComplete,
    onError,
  } = options;

  const [isDeliberating, setIsDeliberating] = useState(false);
  const [completedMessages, setCompletedMessages] = useState<CompletedMessage[]>([]);
  const [activeTurn, setActiveTurn] = useState<ActiveTurn | null>(null);
  const [budget, setBudget] = useState<{ used: number; total: number } | null>(null);
  const [finalResponse, setFinalResponse] = useState<string | null>(null);
  const [stats, setStats] = useState<{ tokens: number; cost: number; latencyMs: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Accumulate streaming content in a ref; flush to state on a throttle
  const contentRef = useRef('');
  const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentTurnMetaRef = useRef<{ modelId: string; turnIndex: number } | null>(null);

  const flushContent = useCallback(() => {
    throttleRef.current = null;
    if (currentTurnMetaRef.current) {
      setActiveTurn({
        ...currentTurnMetaRef.current,
        content: contentRef.current,
      });
    }
  }, []);

  const scheduleFlush = useCallback(() => {
    if (throttleRef.current === null) {
      throttleRef.current = setTimeout(flushContent, 16); // ~60fps
    }
  }, [flushContent]);

  const startDeliberation = useCallback(
    async (messages: Message[]) => {
      setIsDeliberating(true);
      setCompletedMessages([]);
      setActiveTurn(null);
      contentRef.current = '';
      currentTurnMetaRef.current = null;
      setBudget(null);
      setFinalResponse(null);
      setStats(null);
      setError(null);

      abortRef.current = new AbortController();

      try {
        const response = await fetch('/api/council', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            members,
            contextBudget,
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
          onEvent?.(event);

          switch (event.type) {
            case 'turn_start':
              contentRef.current = '';
              currentTurnMetaRef.current = {
                modelId: event.modelId,
                turnIndex: event.turnIndex,
              };
              setActiveTurn({
                modelId: event.modelId,
                turnIndex: event.turnIndex,
                content: '',
              });
              break;

            case 'turn_delta':
              contentRef.current += event.content;
              scheduleFlush();
              break;

            case 'turn_end': {
              // Cancel any pending throttled flush
              if (throttleRef.current !== null) {
                clearTimeout(throttleRef.current);
                throttleRef.current = null;
              }
              // Capture content before clearing refs
              const finishedContent = contentRef.current;
              contentRef.current = '';
              currentTurnMetaRef.current = null;
              // Single atomic state update: clear active turn + append completed message
              setActiveTurn(null);
              setCompletedMessages((prev) => [
                ...prev,
                {
                  modelId: event.modelId,
                  content: finishedContent,
                  tokens: event.tokens,
                  cost: event.cost,
                },
              ]);
              break;
            }

            case 'final_answer':
              setFinalResponse(event.response);
              onComplete?.(event.response);
              break;

            case 'budget':
              setBudget({ used: event.used, total: event.total });
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
        contentRef.current = '';
        currentTurnMetaRef.current = null;
        if (throttleRef.current !== null) {
          clearTimeout(throttleRef.current);
          throttleRef.current = null;
        }
      }
    },
    [members, contextBudget, apiKey, onEvent, onComplete, onError, scheduleFlush]
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setIsDeliberating(false);
    setCompletedMessages([]);
    setActiveTurn(null);
    contentRef.current = '';
    currentTurnMetaRef.current = null;
    setBudget(null);
    setFinalResponse(null);
    setStats(null);
    setError(null);
    if (throttleRef.current !== null) {
      clearTimeout(throttleRef.current);
      throttleRef.current = null;
    }
  }, []);

  return {
    isDeliberating,
    completedMessages,
    activeTurn,
    budget,
    finalResponse,
    stats,
    error,
    startDeliberation,
    reset,
  };
}
