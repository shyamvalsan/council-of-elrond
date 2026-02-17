import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsBar } from '@/components/layout/StatsBar';

vi.mock('@/hooks/useStats', () => ({
  useStats: () => ({
    stats: {
      totalUsers: 2847,
      totalTokens: 14200000,
      totalJudgments: 1203,
    },
    isLoading: false,
    error: null,
    refresh: vi.fn(),
  }),
}));

describe('StatsBar', () => {
  it('should display total users', () => {
    render(<StatsBar />);
    expect(screen.getByText('2,847 users')).toBeInTheDocument();
  });

  it('should display total tokens formatted', () => {
    render(<StatsBar />);
    expect(screen.getByText('14.2M tokens')).toBeInTheDocument();
  });

  it('should display total judgments', () => {
    render(<StatsBar />);
    expect(screen.getByText('1,203 judgments')).toBeInTheDocument();
  });

  it('should display leaderboard link', () => {
    render(<StatsBar />);
    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
  });

  it('should display sponsor link', () => {
    render(<StatsBar />);
    expect(screen.getByText('Sponsor the Council')).toBeInTheDocument();
  });
});
