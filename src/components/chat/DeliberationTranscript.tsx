'use client';

import { useRef, useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Terminal } from 'lucide-react';
import type { CompletedMessage } from '@/types/council';
import { getModelDisplayName, getModelColor } from '@/lib/llm/models';

interface ActiveTurn {
  modelId: string;
  turnIndex: number;
  content: string;
}

interface DeliberationTranscriptProps {
  completedMessages: CompletedMessage[];
  activeTurn: ActiveTurn | null;
  defaultExpanded?: boolean;
  mode?: 'collapsible' | 'standalone';
}

export function DeliberationTranscript({
  completedMessages,
  activeTurn,
  defaultExpanded = false,
  mode = 'collapsible',
}: DeliberationTranscriptProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafScrollRef = useRef<number | null>(null);

  const hasContent = completedMessages.length > 0 || activeTurn !== null;
  const isStreaming = activeTurn !== null;

  // Auto-scroll: always scroll to bottom when content changes
  useEffect(() => {
    if (!(mode === 'standalone' || expanded) || !scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [activeTurn?.content, completedMessages.length, expanded, mode]);

  // Continuous scroll loop while streaming (covers content between state flushes)
  useEffect(() => {
    if (!isStreaming || !(mode === 'standalone' || expanded)) return;
    const loop = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
      rafScrollRef.current = requestAnimationFrame(loop);
    };
    rafScrollRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafScrollRef.current !== null) {
        cancelAnimationFrame(rafScrollRef.current);
        rafScrollRef.current = null;
      }
    };
  }, [isStreaming, expanded, mode]);

  if (!hasContent) return null;

  const messageCount = completedMessages.length;

  const terminalContent = (
    <>
      {/* Terminal header bar */}
      <div className="sticky top-0 z-10 flex items-center gap-1.5 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur px-3 py-1.5">
        <span className="h-2 w-2 rounded-full bg-red-500/80" />
        <span className="h-2 w-2 rounded-full bg-yellow-500/80" />
        <span className="h-2 w-2 rounded-full bg-green-500/80" />
        <span className="ml-2 text-zinc-500">deliberation</span>
      </div>

      <div className="space-y-0.5 p-2">
        {completedMessages.map((msg, i) => (
          <CompletedMessageBubble key={i} message={msg} />
        ))}
        {activeTurn && <StreamingMessageBubble turn={activeTurn} />}
      </div>
    </>
  );

  if (mode === 'standalone') {
    return (
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-zinc-950 font-mono text-[11px] leading-relaxed"
      >
        {terminalContent}
      </div>
    );
  }

  return (
    <div className="border-t border-zinc-700/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        <Terminal className="h-3 w-3" />
        <span className="font-mono">council_transcript</span>
        <span className="ml-auto font-mono text-zinc-500">
          {messageCount} messages
        </span>
      </button>

      {expanded && (
        <div
          ref={scrollRef}
          className="max-h-[28rem] overflow-y-auto bg-zinc-950 font-mono text-[11px] leading-relaxed"
        >
          {terminalContent}
        </div>
      )}
    </div>
  );
}

function ModelAvatar({ modelId }: { modelId: string }) {
  const displayName = getModelDisplayName(modelId);
  const initial = displayName.charAt(0).toUpperCase();
  const color = getModelColor(modelId);

  return (
    <div
      className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
      style={{ backgroundColor: color + '30', color }}
    >
      {initial}
    </div>
  );
}

function CompletedMessageBubble({ message }: { message: CompletedMessage }) {
  const name = getModelDisplayName(message.modelId);

  return (
    <div className="group flex gap-2 rounded px-1.5 py-1 hover:bg-zinc-900/80">
      <ModelAvatar modelId={message.modelId} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[11px] font-semibold text-sky-400">{name}</span>
          <span className="text-[9px] text-zinc-600">
            {message.tokens.toLocaleString()} tok &middot; ${message.cost.toFixed(4)}
          </span>
        </div>
        <p className="mt-0.5 whitespace-pre-wrap break-words text-zinc-300">
          {message.content}
        </p>
      </div>
    </div>
  );
}

function StreamingMessageBubble({ turn }: { turn: ActiveTurn }) {
  const name = getModelDisplayName(turn.modelId);

  return (
    <div className="group flex gap-2 rounded px-1.5 py-1 bg-zinc-900/40">
      <ModelAvatar modelId={turn.modelId} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[11px] font-semibold text-sky-400">{name}</span>
          <span className="flex items-center gap-1 text-[9px] text-emerald-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            streaming
          </span>
        </div>
        <p className="mt-0.5 whitespace-pre-wrap break-words text-zinc-300">
          {turn.content}
          <span className="inline-block h-3 w-1 animate-pulse bg-sky-400/70 ml-0.5" />
        </p>
      </div>
    </div>
  );
}
