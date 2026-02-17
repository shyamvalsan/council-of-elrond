'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { CouncilStreamEvent } from '@/types/council';
import { getModelDisplayName } from '@/lib/llm/models';
import { MarkdownRenderer } from '../render/MarkdownRenderer';

interface DeliberationTranscriptProps {
  events: CouncilStreamEvent[];
  defaultExpanded?: boolean;
}

export function DeliberationTranscript({
  events,
  defaultExpanded = false,
}: DeliberationTranscriptProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (events.length === 0) return null;

  // Group events by phase/round
  const phases: {
    label: string;
    events: CouncilStreamEvent[];
  }[] = [];

  let currentPhase: (typeof phases)[0] | null = null;

  for (const event of events) {
    if (event.type === 'phase') {
      const label = event.round
        ? `${event.phase} (Round ${event.round})`
        : event.phase;
      currentPhase = { label, events: [] };
      phases.push(currentPhase);
    } else if (currentPhase) {
      currentPhase.events.push(event);
    }
  }

  return (
    <div className="border-t">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-1 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        Deliberation Transcript ({events.length} events)
      </button>

      {expanded && (
        <div className="max-h-96 overflow-y-auto px-3 pb-3">
          {phases.map((phase, i) => (
            <PhaseSection key={i} phase={phase} />
          ))}
        </div>
      )}
    </div>
  );
}

function PhaseSection({
  phase,
}: {
  phase: { label: string; events: CouncilStreamEvent[] };
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="mb-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        {phase.label}
      </button>

      {expanded && (
        <div className="space-y-2 pl-4">
          {phase.events.map((event, i) => (
            <EventItem key={i} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

function EventItem({ event }: { event: CouncilStreamEvent }) {
  switch (event.type) {
    case 'member_response':
      return (
        <div className="rounded-md border bg-muted/30 p-2">
          <p className="mb-1 text-xs font-medium text-primary">
            {getModelDisplayName(event.modelId)}
          </p>
          <div className="prose prose-sm max-w-none text-xs">
            <MarkdownRenderer content={event.content} />
          </div>
        </div>
      );

    case 'synthesis':
      return (
        <div className="rounded-md border-2 border-primary/30 bg-primary/5 p-2">
          <p className="mb-1 text-xs font-semibold text-primary">
            Synthesis (Round {event.round})
          </p>
          <div className="prose prose-sm max-w-none text-xs">
            <MarkdownRenderer content={event.content} />
          </div>
        </div>
      );

    case 'stats':
      return (
        <div className="text-xs text-muted-foreground">
          Tokens: {event.tokens.toLocaleString()} | Cost: ${event.cost.toFixed(4)} | Time: {(event.latencyMs / 1000).toFixed(1)}s
        </div>
      );

    default:
      return null;
  }
}
