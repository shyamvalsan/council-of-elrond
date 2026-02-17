import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ModelSelector } from '@/components/chat/ModelSelector';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';

// Mock the useModels hook to avoid needing internal API routes
vi.mock('@/hooks/useModels', () => ({
  useModels: () => ({
    models: [
      {
        id: 'anthropic/claude-opus-4-6',
        name: 'Claude Opus 4.6',
        description: 'Test',
        contextLength: 200000,
        maxCompletionTokens: 4096,
        pricing: { promptPerToken: 0.000015, completionPerToken: 0.000075 },
        provider: 'openrouter',
      },
      {
        id: 'openai/gpt-5-2',
        name: 'GPT-5.2',
        description: 'Test',
        contextLength: 128000,
        maxCompletionTokens: 4096,
        pricing: { promptPerToken: 0.00001, completionPerToken: 0.00003 },
        provider: 'openrouter',
      },
      {
        id: 'google/gemini-3-pro-preview',
        name: 'Gemini 3 Pro',
        description: 'Test',
        contextLength: 1000000,
        maxCompletionTokens: 8192,
        pricing: { promptPerToken: 0.000007, completionPerToken: 0.000021 },
        provider: 'openrouter',
      },
    ],
    isLoading: false,
    error: null,
    refresh: vi.fn(),
  }),
}));

describe('ModelSelector', () => {
  it('should render a button', () => {
    render(<ModelSelector value="anthropic/claude-opus-4-6" onChange={vi.fn()} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should display selected model name', () => {
    render(
      <ModelSelector value="anthropic/claude-opus-4-6" onChange={vi.fn()} />
    );
    expect(screen.getByText('Claude Opus 4.6')).toBeInTheDocument();
  });

  it('should show dropdown when clicked', () => {
    render(
      <ModelSelector value="anthropic/claude-opus-4-6" onChange={vi.fn()} />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('GPT-5.2')).toBeInTheDocument();
    expect(screen.getByText('Gemini 3 Pro')).toBeInTheDocument();
  });

  it('should call onChange when a model is selected', () => {
    const onChange = vi.fn();
    render(
      <ModelSelector value="anthropic/claude-opus-4-6" onChange={onChange} />
    );
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('GPT-5.2'));
    expect(onChange).toHaveBeenCalledWith('openai/gpt-5-2');
  });

  it('should close dropdown after selection', () => {
    const onChange = vi.fn();
    render(
      <ModelSelector value="anthropic/claude-opus-4-6" onChange={onChange} />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('GPT-5.2')).toBeInTheDocument();

    fireEvent.click(screen.getByText('GPT-5.2'));
    // Dropdown should close
    expect(screen.queryByText('Gemini 3 Pro')).not.toBeInTheDocument();
  });

  it('should render optional label', () => {
    render(
      <ModelSelector
        value="anthropic/claude-opus-4-6"
        onChange={vi.fn()}
        label="Model A"
      />
    );
    expect(screen.getByText('Model A')).toBeInTheDocument();
  });
});
