'use client';

import { useCredits } from '@/hooks/useCredits';
import { formatCost } from '@/lib/utils/cost';
import { AlertTriangle, ExternalLink } from 'lucide-react';

export function CreditsBanner() {
  const { status, isLowBalance } = useCredits();

  if (!status) return null;

  // BYOK mode — no banner needed
  if (status.mode === 'byok') return null;

  // Exhausted state
  if (status.mode === 'exhausted') {
    return (
      <div className="border-b bg-destructive/10 px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center gap-4">
          <div className="text-3xl">🧝</div>
          <div className="flex-1">
            <p className="text-sm font-medium">Community credits have run out.</p>
            <p className="text-xs text-muted-foreground">
              Add your own key — or help refill the pool.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
              Add API Key
            </button>
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
            >
              Get OpenRouter key <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="#sponsor"
              className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
            >
              Sponsor the Council
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Low balance warning
  if (isLowBalance) {
    return (
      <div className="border-b bg-yellow-500/10 px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center gap-4">
          <div className="text-3xl">🧝</div>
          <div className="flex-1">
            <p className="text-sm font-medium">
              <AlertTriangle className="mr-1 inline h-4 w-4" />
              The Council's coffers grow thin.
            </p>
            <p className="text-xs text-muted-foreground">
              Community credits: ~{formatCost(status.communityCreditsRemaining ?? 0)} remaining
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="#sponsor"
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              Sponsor the Council
            </a>
            <button className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted">
              Add your own key
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Normal community mode
  return (
    <div className="border-b bg-muted/30 px-4 py-1.5">
      <div className="mx-auto flex max-w-4xl items-center justify-between text-xs text-muted-foreground">
        <span>
          Community credits: ~{formatCost(status.communityCreditsRemaining ?? 0)} remaining
          {' · '}
          You've used {formatCost(status.userSpentToday)} today
          {' · '}
          Rate limit: {formatCost(status.dailyLimitPerUser)}/day
        </span>
        <button className="hover:text-foreground">
          Add your own key for unlimited access
        </button>
      </div>
    </div>
  );
}
