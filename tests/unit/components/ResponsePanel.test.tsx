import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResponsePanel } from '@/components/chat/ResponsePanel';

describe('ResponsePanel', () => {
  it('should render the title', () => {
    render(
      <ResponsePanel
        title="Claude Opus 4.6"
        content={null}
        isStreaming={false}
        tokenCount={null}
        costUsd={null}
        latencyMs={null}
      />
    );
    expect(screen.getByText('Claude Opus 4.6')).toBeInTheDocument();
  });

  it('should show "Waiting for prompt" when no content', () => {
    render(
      <ResponsePanel
        title="Test"
        content={null}
        isStreaming={false}
        tokenCount={null}
        costUsd={null}
        latencyMs={null}
      />
    );
    expect(screen.getByText('Waiting for prompt...')).toBeInTheDocument();
  });

  it('should render markdown content', () => {
    render(
      <ResponsePanel
        title="Test"
        content="Hello **world**"
        isStreaming={false}
        tokenCount={null}
        costUsd={null}
        latencyMs={null}
      />
    );
    expect(screen.getByText('world')).toBeInTheDocument();
  });

  it('should show streaming indicator when streaming', () => {
    render(
      <ResponsePanel
        title="Test"
        content={null}
        isStreaming={true}
        streamingContent="Generating..."
        tokenCount={null}
        costUsd={null}
        latencyMs={null}
      />
    );
    // The streaming cursor should be present
    expect(document.querySelector('.animate-pulse')).not.toBeNull();
  });

  it('should display error message', () => {
    render(
      <ResponsePanel
        title="Test"
        content={null}
        isStreaming={false}
        error="Something went wrong"
        tokenCount={null}
        costUsd={null}
        latencyMs={null}
      />
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should show response metadata when available', () => {
    render(
      <ResponsePanel
        title="Test"
        content="Hello"
        isStreaming={false}
        tokenCount={1240}
        costUsd={0.03}
        latencyMs={2300}
      />
    );
    expect(screen.getByText('1.2K')).toBeInTheDocument();
    expect(screen.getByText('$0.03')).toBeInTheDocument();
    expect(screen.getByText('2.3s')).toBeInTheDocument();
  });
});
