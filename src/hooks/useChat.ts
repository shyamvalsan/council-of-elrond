'use client';

import { useState, useCallback, useRef } from 'react';
import type { Message, StreamChunk } from '@/types/chat';
import { parseSSEStream } from '@/lib/utils/stream';

interface UseChatOptions {
  model: string;
  apiKey?: string;
  onChunk?: (chunk: StreamChunk) => void;
  onComplete?: (fullContent: string, usage?: StreamChunk['usage']) => void;
  onError?: (error: Error) => void;
}

interface UseChatReturn {
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
  error: string | null;
  usage: StreamChunk['usage'] | null;
  sendMessage: (content: string) => Promise<void>;
  reset: () => void;
}

export function useChat(options: UseChatOptions): UseChatReturn {
  const { model, apiKey, onChunk, onComplete, onError } = options;
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<StreamChunk['usage'] | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      const userMessage: Message = { role: 'user', content };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setIsStreaming(true);
      setStreamingContent('');
      setError(null);
      setUsage(null);

      abortRef.current = new AbortController();

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: newMessages,
            userApiKey: apiKey,
          }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || `HTTP ${response.status}`);
        }

        let fullContent = '';
        let finalUsage: StreamChunk['usage'] | undefined;

        for await (const chunk of parseSSEStream<StreamChunk & { type?: string; message?: string }>(response)) {
          // Handle error events from SSE stream
          if (chunk.type === 'error') {
            throw new Error(chunk.message || 'Stream error');
          }

          if (chunk.content) {
            fullContent += chunk.content;
            setStreamingContent(fullContent);
          }
          onChunk?.(chunk);

          if (chunk.usage) {
            finalUsage = chunk.usage;
            setUsage(chunk.usage);
          }
        }

        const assistantMessage: Message = {
          role: 'assistant',
          content: fullContent,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setStreamingContent('');
        onComplete?.(fullContent, finalUsage);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, model, apiKey, onChunk, onComplete, onError]
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setStreamingContent('');
    setError(null);
    setUsage(null);
    setIsStreaming(false);
  }, []);

  return {
    messages,
    isStreaming,
    streamingContent,
    error,
    usage,
    sendMessage,
    reset,
  };
}
