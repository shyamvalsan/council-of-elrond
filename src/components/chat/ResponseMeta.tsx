'use client';

import { Clock, Hash, DollarSign } from 'lucide-react';
import { formatTokenCount } from '@/lib/utils/tokens';
import { formatCost } from '@/lib/utils/cost';

interface ResponseMetaProps {
  tokenCount: number | null;
  costUsd: number | null;
  latencyMs: number | null;
  isStreaming?: boolean;
}

export function ResponseMeta({
  tokenCount,
  costUsd,
  latencyMs,
  isStreaming = false,
}: ResponseMetaProps) {
  return (
    <div className="flex items-center gap-3 border-t px-3 py-1.5 text-xs text-muted-foreground">
      {latencyMs !== null && (
        <span className="flex items-center gap-1" title="Response time">
          <Clock className="h-3 w-3" />
          {isStreaming ? '...' : `${(latencyMs / 1000).toFixed(1)}s`}
        </span>
      )}
      {tokenCount !== null && (
        <span className="flex items-center gap-1" title="Token count">
          <Hash className="h-3 w-3" />
          {formatTokenCount(tokenCount)}
        </span>
      )}
      {costUsd !== null && (
        <span className="flex items-center gap-1" title="Cost">
          <DollarSign className="h-3 w-3" />
          {formatCost(costUsd)}
        </span>
      )}
    </div>
  );
}
