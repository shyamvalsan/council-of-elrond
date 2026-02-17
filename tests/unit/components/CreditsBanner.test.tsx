import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CreditsBanner } from '@/components/layout/CreditsBanner';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';

// Mock the useCredits hook
vi.mock('@/hooks/useCredits', () => ({
  useCredits: vi.fn(),
}));

import { useCredits } from '@/hooks/useCredits';

const mockUseCredits = vi.mocked(useCredits);

describe('CreditsBanner', () => {
  it('should render nothing for BYOK mode', () => {
    mockUseCredits.mockReturnValue({
      status: {
        mode: 'byok',
        communityCreditsRemaining: null,
        dailyLimitPerUser: 0.5,
        userSpentToday: 0,
        canMakeRequest: true,
        estimatedCostForRequest: 0,
      },
      isLoading: false,
      error: null,
      isLowBalance: false,
      refresh: vi.fn(),
    });

    const { container } = render(<CreditsBanner />);
    expect(container.innerHTML).toBe('');
  });

  it('should show exhausted state with action buttons', () => {
    mockUseCredits.mockReturnValue({
      status: {
        mode: 'exhausted',
        communityCreditsRemaining: 0,
        dailyLimitPerUser: 0.5,
        userSpentToday: 0.45,
        canMakeRequest: false,
        estimatedCostForRequest: 0,
      },
      isLoading: false,
      error: null,
      isLowBalance: false,
      refresh: vi.fn(),
    });

    render(<CreditsBanner />);
    expect(screen.getByText('Community credits have run out.')).toBeInTheDocument();
    expect(screen.getByText('Add API Key')).toBeInTheDocument();
    expect(screen.getByText('Sponsor the Council')).toBeInTheDocument();
  });

  it('should show low balance warning with Elrond', () => {
    mockUseCredits.mockReturnValue({
      status: {
        mode: 'community',
        communityCreditsRemaining: 8.41,
        dailyLimitPerUser: 0.5,
        userSpentToday: 0.12,
        canMakeRequest: true,
        estimatedCostForRequest: 0,
      },
      isLoading: false,
      error: null,
      isLowBalance: true,
      refresh: vi.fn(),
    });

    render(<CreditsBanner />);
    expect(screen.getByText(/coffers grow thin/)).toBeInTheDocument();
  });

  it('should show normal community credits info', () => {
    mockUseCredits.mockReturnValue({
      status: {
        mode: 'community',
        communityCreditsRemaining: 42.18,
        dailyLimitPerUser: 0.5,
        userSpentToday: 0.12,
        canMakeRequest: true,
        estimatedCostForRequest: 0,
      },
      isLoading: false,
      error: null,
      isLowBalance: false,
      refresh: vi.fn(),
    });

    render(<CreditsBanner />);
    expect(screen.getByText(/\$42\.18 remaining/)).toBeInTheDocument();
    expect(screen.getByText(/\$0\.12 today/)).toBeInTheDocument();
  });
});
