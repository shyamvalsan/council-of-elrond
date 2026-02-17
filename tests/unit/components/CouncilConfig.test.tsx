import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CouncilConfig } from '@/components/chat/CouncilConfig';

describe('CouncilConfig', () => {
  const defaultProps = {
    members: ['anthropic/claude-opus-4-6', 'openai/gpt-5-2', 'google/gemini-3-pro-preview'],
    maxRounds: 3,
    synthesizerStrategy: 'round-robin' as const,
    onMembersChange: vi.fn(),
    onMaxRoundsChange: vi.fn(),
    onStrategyChange: vi.fn(),
  };

  it('should render the settings button', () => {
    render(<CouncilConfig {...defaultProps} />);
    expect(screen.getByRole('button', { name: /council settings/i })).toBeInTheDocument();
  });

  it('should open config panel when clicked', () => {
    render(<CouncilConfig {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /council settings/i }));
    expect(screen.getByText('Council Configuration')).toBeInTheDocument();
  });

  it('should show member count', () => {
    render(<CouncilConfig {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /council settings/i }));
    expect(screen.getByText('Members (3/12, min 3)')).toBeInTheDocument();
  });

  it('should show current max rounds', () => {
    render(<CouncilConfig {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /council settings/i }));
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should call onMaxRoundsChange when rounds are adjusted', () => {
    const onMaxRoundsChange = vi.fn();
    render(
      <CouncilConfig {...defaultProps} onMaxRoundsChange={onMaxRoundsChange} />
    );
    fireEvent.click(screen.getByRole('button', { name: /council settings/i }));

    // Find the minus button (first one after the round label)
    const buttons = screen.getAllByRole('button');
    const minusButton = buttons.find((b) => b.querySelector('.lucide-minus'));
    if (minusButton) {
      fireEvent.click(minusButton);
      expect(onMaxRoundsChange).toHaveBeenCalledWith(2);
    }
  });
});
