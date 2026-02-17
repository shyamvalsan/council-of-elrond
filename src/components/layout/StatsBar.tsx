'use client';

import { useStats } from '@/hooks/useStats';
import { formatTokenCount } from '@/lib/utils/tokens';
import { BarChart3, Users, MessageSquare } from 'lucide-react';

export function StatsBar() {
  const { stats } = useStats();

  return (
    <footer className="flex items-center justify-center gap-6 border-t bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <Users className="h-3 w-3" />
        {stats.totalUsers.toLocaleString()} users
      </span>
      <span className="text-border">·</span>
      <span className="flex items-center gap-1">
        {formatTokenCount(stats.totalTokens)} tokens
      </span>
      <span className="text-border">·</span>
      <span className="flex items-center gap-1">
        <MessageSquare className="h-3 w-3" />
        {stats.totalJudgments.toLocaleString()} judgments
      </span>
      <span className="text-border">·</span>
      <a
        href="#leaderboard"
        className="flex items-center gap-1 hover:text-foreground"
      >
        <BarChart3 className="h-3 w-3" />
        Leaderboard
      </a>
      <span className="text-border">·</span>
      <a
        href="#characters"
        className="hover:text-foreground"
      >
        Characters
      </a>
      <span className="text-border">·</span>
      <a
        href="#sponsor"
        className="hover:text-foreground"
      >
        Sponsor the Council
      </a>
    </footer>
  );
}
