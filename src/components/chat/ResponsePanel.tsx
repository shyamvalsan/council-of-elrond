'use client';

import { MarkdownRenderer } from '../render/MarkdownRenderer';
import { ResponseMeta } from './ResponseMeta';
import { Loader2 } from 'lucide-react';

interface ResponsePanelProps {
  title: string;
  content: string | null;
  isStreaming: boolean;
  streamingContent?: string;
  tokenCount: number | null;
  costUsd: number | null;
  latencyMs: number | null;
  error?: string | null;
  headerActions?: React.ReactNode;
  footer?: React.ReactNode;
}

export function ResponsePanel({
  title,
  content,
  isStreaming,
  streamingContent = '',
  tokenCount,
  costUsd,
  latencyMs,
  error,
  headerActions,
  footer,
}: ResponsePanelProps) {
  const displayContent = content || streamingContent;

  return (
    <div className="flex h-full flex-col rounded-lg border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <div className="flex items-center gap-2">
          {isStreaming && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          {headerActions}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {error ? (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : displayContent ? (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <MarkdownRenderer content={displayContent} />
            {isStreaming && (
              <span className="inline-block h-4 w-1 animate-pulse bg-primary" />
            )}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              {isStreaming ? 'Generating response...' : 'Waiting for prompt...'}
            </p>
          </div>
        )}
      </div>

      {/* Meta */}
      {(tokenCount !== null || costUsd !== null || latencyMs !== null) && (
        <ResponseMeta
          tokenCount={tokenCount}
          costUsd={costUsd}
          latencyMs={latencyMs}
          isStreaming={isStreaming}
        />
      )}

      {/* Footer (e.g., deliberation transcript) */}
      {footer}
    </div>
  );
}
