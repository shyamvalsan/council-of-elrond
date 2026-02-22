import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CouncilConfig } from '@/components/chat/CouncilConfig';

describe('CouncilConfig', () => {
  const defaultProps = {
    members: ['anthropic/claude-opus-4-6', 'openai/gpt-5-2', 'google/gemini-3-pro-preview'],
    contextBudget: 16384,
    onMembersChange: vi.fn(),
    onContextBudgetChange: vi.fn(),
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

  it('should show context budget slider', () => {
    render(<CouncilConfig {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /council settings/i }));
    expect(screen.getByText('Context Budget')).toBeInTheDocument();
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('should call onContextBudgetChange when slider is adjusted', () => {
    const onContextBudgetChange = vi.fn();
    render(
      <CouncilConfig {...defaultProps} onContextBudgetChange={onContextBudgetChange} />
    );
    fireEvent.click(screen.getByRole('button', { name: /council settings/i }));

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '2' } });
    expect(onContextBudgetChange).toHaveBeenCalledWith(24576);
  });
});
