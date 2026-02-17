import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeliberationTranscript } from '@/components/chat/DeliberationTranscript';
import type { CouncilStreamEvent } from '@/types/council';

const sampleEvents: CouncilStreamEvent[] = [
  { type: 'phase', phase: 'acquaintance' },
  {
    type: 'member_response',
    modelId: 'anthropic/claude-opus-4-6',
    content: 'I bring expertise in reasoning.',
    phase: 'acquaintance',
  },
  { type: 'phase', phase: 'draft' },
  {
    type: 'member_response',
    modelId: 'anthropic/claude-opus-4-6',
    content: 'Here is my draft response.',
    phase: 'draft',
  },
  { type: 'phase', phase: 'critique', round: 1 },
  {
    type: 'member_response',
    modelId: 'openai/gpt-5-2',
    content: 'The draft could be improved by...',
    phase: 'critique',
  },
  { type: 'synthesis', content: 'Combined response here.', round: 1 },
  {
    type: 'stats',
    tokens: 5000,
    cost: 0.05,
    latencyMs: 12000,
  },
];

describe('DeliberationTranscript', () => {
  it('should render nothing when no events', () => {
    const { container } = render(<DeliberationTranscript events={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('should show event count in collapsed state', () => {
    render(<DeliberationTranscript events={sampleEvents} />);
    expect(
      screen.getByText(/Deliberation Transcript \(8 events\)/)
    ).toBeInTheDocument();
  });

  it('should expand when clicked', () => {
    render(<DeliberationTranscript events={sampleEvents} />);
    fireEvent.click(screen.getByText(/Deliberation Transcript/));
    expect(screen.getByText('acquaintance')).toBeInTheDocument();
  });

  it('should show member responses when expanded', () => {
    render(<DeliberationTranscript events={sampleEvents} defaultExpanded />);
    expect(
      screen.getByText('I bring expertise in reasoning.')
    ).toBeInTheDocument();
  });

  it('should show synthesis events', () => {
    render(<DeliberationTranscript events={sampleEvents} defaultExpanded />);
    expect(screen.getByText('Combined response here.')).toBeInTheDocument();
  });

  it('should show stats', () => {
    render(<DeliberationTranscript events={sampleEvents} defaultExpanded />);
    expect(screen.getByText(/5,000/)).toBeInTheDocument();
  });
});
