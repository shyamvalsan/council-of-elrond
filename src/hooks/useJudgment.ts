'use client';

import { useState, useCallback } from 'react';

type Winner = 'model_a' | 'model_b' | 'council' | 'tie';

interface UseJudgmentOptions {
  chatId?: string;
  userId?: string;
  promptText: string;
  modelAId: string;
  modelBId: string;
  councilMembers: string[];
  promptCategory?: string;
  submitToPublic?: boolean;
}

interface UseJudgmentReturn {
  vote: Winner | null;
  isSubmitting: boolean;
  hasVoted: boolean;
  error: string | null;
  submitVote: (winner: Winner) => Promise<void>;
  reset: () => void;
}

export function useJudgment(options: UseJudgmentOptions): UseJudgmentReturn {
  const [vote, setVote] = useState<Winner | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitVote = useCallback(
    async (winner: Winner) => {
      setIsSubmitting(true);
      setError(null);

      try {
        const response = await fetch('/api/judgments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: options.chatId,
            userId: options.userId,
            promptText: options.promptText,
            modelAId: options.modelAId,
            modelBId: options.modelBId,
            councilMembers: options.councilMembers,
            winner,
            promptCategory: options.promptCategory,
            submitToPublic: options.submitToPublic ?? false,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to submit vote');
        }

        setVote(winner);
        setHasVoted(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        setError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [options]
  );

  const reset = useCallback(() => {
    setVote(null);
    setIsSubmitting(false);
    setHasVoted(false);
    setError(null);
  }, []);

  return { vote, isSubmitting, hasVoted, error, submitVote, reset };
}
