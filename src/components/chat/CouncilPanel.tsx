'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { DeliberationTranscript } from './DeliberationTranscript';
import { MarkdownRenderer } from '../render/MarkdownRenderer';
import { ResponseMeta } from './ResponseMeta';
import { CouncilConfig } from './CouncilConfig';
import type { CompletedMessage } from '@/types/council';
import { formatTokenCount } from '@/lib/utils/tokens';

type Tab = 'deliberation' | 'final';

interface ActiveTurn {
  modelId: string;
  turnIndex: number;
  content: string;
}

interface CouncilPanelProps {
  finalResponse: string | null;
  isDeliberating: boolean;
  completedMessages: CompletedMessage[];
  activeTurn: ActiveTurn | null;
  budget: { used: number; total: number } | null;
  stats: { tokens: number; cost: number; latencyMs: number } | null;
  error?: string | null;
  councilMembers: string[];
  contextBudget: number;
  onMembersChange: (members: string[]) => void;
  onContextBudgetChange: (budget: number) => void;
}

export function CouncilPanel({
  finalResponse,
  isDeliberating,
  completedMessages,
  activeTurn,
  budget,
  stats,
  error,
  councilMembers,
  contextBudget,
  onMembersChange,
  onContextBudgetChange,
}: CouncilPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('deliberation');

  useEffect(() => {
    if (!isDeliberating && finalResponse) {
      setActiveTab('final');
    }
  }, [isDeliberating, finalResponse]);

  useEffect(() => {
    if (isDeliberating) {
      setActiveTab('deliberation');
    }
  }, [isDeliberating]);

  const hasContent = completedMessages.length > 0 || activeTurn !== null || finalResponse || error;

  // Budget progress
  const budgetPercent = budget ? Math.round((budget.used / budget.total) * 100) : 0;
  const budgetColor =
    budgetPercent >= 90 ? 'bg-red-500' : budgetPercent >= 70 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-lg border-2 border-primary/20 bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold">The Council</h3>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {councilMembers.length} members
          </span>
          {isDeliberating && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              deliberating
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isDeliberating && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          <CouncilConfig
            members={councilMembers}
            contextBudget={contextBudget}
            onMembersChange={onMembersChange}
            onContextBudgetChange={onContextBudgetChange}
          />
        </div>
      </div>

      {/* Budget progress bar */}
      {budget && isDeliberating && (
        <div className="border-b px-4 py-1.5">
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-300 ${budgetColor}`}
                style={{ width: `${Math.min(budgetPercent, 100)}%` }}
              />
            </div>
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {formatTokenCount(budget.used)} / {formatTokenCount(budget.total)}
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      {hasContent && (
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('deliberation')}
            className={`px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === 'deliberation'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Deliberation
            {completedMessages.length > 0 && (
              <span className="ml-1.5 text-[10px] text-muted-foreground">
                ({completedMessages.length})
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('final')}
            className={`px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === 'final'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Final Response
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {error ? (
          <div className="p-4">
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          </div>
        ) : activeTab === 'deliberation' ? (
          completedMessages.length > 0 || activeTurn ? (
            <DeliberationTranscript
              completedMessages={completedMessages}
              activeTurn={activeTurn}
              mode="standalone"
              defaultExpanded
            />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm text-muted-foreground">
                {isDeliberating ? 'Starting deliberation...' : 'Waiting for prompt...'}
              </p>
            </div>
          )
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {finalResponse ? (
              <div className="prose prose-sm max-w-none font-mono text-xs leading-relaxed dark:prose-invert">
                <MarkdownRenderer content={finalResponse} />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  {isDeliberating ? 'Deliberation in progress...' : 'No response yet'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer stats */}
      {stats && (
        <ResponseMeta
          tokenCount={stats.tokens}
          costUsd={stats.cost}
          latencyMs={stats.latencyMs}
          isStreaming={isDeliberating}
        />
      )}
    </div>
  );
}
