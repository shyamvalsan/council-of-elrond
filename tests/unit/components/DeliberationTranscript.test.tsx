import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeliberationTranscript } from '@/components/chat/DeliberationTranscript';
import type { CompletedMessage } from '@/types/council';

const sampleMessages: CompletedMessage[] = [
  {
    modelId: 'anthropic/claude-opus-4-6',
    content: 'I bring expertise in reasoning.',
    tokens: 120,
    cost: 0.0012,
  },
  {
    modelId: 'openai/gpt-5-2',
    content: 'Here is my draft response.',
    tokens: 150,
    cost: 0.0015,
  },
  {
    modelId: 'google/gemini-3-pro-preview',
    content: 'The draft could be improved by...',
    tokens: 200,
    cost: 0.002,
  },
];

describe('DeliberationTranscript', () => {
  it('should render nothing when no messages and no active turn', () => {
    const { container } = render(
      <DeliberationTranscript completedMessages={[]} activeTurn={null} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('should show message count in collapsed state', () => {
    render(
      <DeliberationTranscript completedMessages={sampleMessages} activeTurn={null} />
    );
    expect(screen.getByText('3 messages')).toBeInTheDocument();
  });

  it('should expand when clicked', () => {
    render(
      <DeliberationTranscript completedMessages={sampleMessages} activeTurn={null} />
    );
    fireEvent.click(screen.getByText(/council_transcript/));
    expect(screen.getByText('I bring expertise in reasoning.')).toBeInTheDocument();
  });

  it('should show completed messages when expanded', () => {
    render(
      <DeliberationTranscript
        completedMessages={sampleMessages}
        activeTurn={null}
        defaultExpanded
      />
    );
    expect(screen.getByText('I bring expertise in reasoning.')).toBeInTheDocument();
    expect(screen.getByText('Here is my draft response.')).toBeInTheDocument();
  });

  it('should show streaming indicator for active turn', () => {
    render(
      <DeliberationTranscript
        completedMessages={sampleMessages}
        activeTurn={{
          modelId: 'anthropic/claude-opus-4-6',
          turnIndex: 3,
          content: 'Currently streaming...',
        }}
        defaultExpanded
      />
    );
    expect(screen.getByText('streaming')).toBeInTheDocument();
    expect(screen.getByText(/Currently streaming/)).toBeInTheDocument();
  });

  it('should show token and cost stats for completed messages', () => {
    render(
      <DeliberationTranscript
        completedMessages={sampleMessages}
        activeTurn={null}
        defaultExpanded
      />
    );
    expect(screen.getByText(/120 tok/)).toBeInTheDocument();
  });
});
