import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JudgmentBar } from '@/components/chat/JudgmentBar';

describe('JudgmentBar', () => {
  it('should render all vote options', () => {
    render(
      <JudgmentBar
        onVote={vi.fn()}
        currentVote={null}
        modelAName="Claude"
        modelBName="GPT"
      />
    );
    expect(screen.getByText('Claude')).toBeInTheDocument();
    expect(screen.getByText('GPT')).toBeInTheDocument();
    expect(screen.getByText('Council')).toBeInTheDocument();
    expect(screen.getByText('Tie')).toBeInTheDocument();
  });

  it('should render the prompt text', () => {
    render(
      <JudgmentBar
        onVote={vi.fn()}
        currentVote={null}
      />
    );
    expect(screen.getByText('Which response was best?')).toBeInTheDocument();
  });

  it('should call onVote when a button is clicked', () => {
    const onVote = vi.fn();
    render(<JudgmentBar onVote={onVote} currentVote={null} />);

    fireEvent.click(screen.getByText('Council'));
    expect(onVote).toHaveBeenCalledWith('council');
  });

  it('should highlight the selected vote', () => {
    render(
      <JudgmentBar
        onVote={vi.fn()}
        currentVote="council"
      />
    );

    const councilButton = screen.getByText('Council').closest('button');
    expect(councilButton?.className).toContain('bg-primary');
  });

  it('should disable other options after voting', () => {
    render(
      <JudgmentBar
        onVote={vi.fn()}
        currentVote="model_a"
        disabled={true}
        modelAName="Claude"
      />
    );

    const tieButton = screen.getByText('Tie').closest('button');
    expect(tieButton).toBeDisabled();
  });
});
