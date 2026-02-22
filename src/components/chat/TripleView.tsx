'use client';

import { useState, useEffect, useRef } from 'react';
import { PromptBanner } from './PromptBanner';
import { CompactResponseCard } from './CompactResponseCard';
import { CouncilPanel } from './CouncilPanel';
import { ModelSelector } from './ModelSelector';
import { JudgmentBar } from './JudgmentBar';
import { useChat } from '@/hooks/useChat';
import { useCouncil } from '@/hooks/useCouncil';
import { useJudgment } from '@/hooks/useJudgment';
import { getModelDisplayName } from '@/lib/llm/models';
import type { Message } from '@/types/chat';
import { DEFAULT_MODEL_A, DEFAULT_MODEL_B, DEFAULT_COUNCIL_MEMBERS } from '@/types/models';

interface TripleViewProps {
  messages: Message[];
}

export function TripleView({ messages }: TripleViewProps) {
  // Model selection state
  const [modelA, setModelA] = useState(DEFAULT_MODEL_A);
  const [modelB, setModelB] = useState(DEFAULT_MODEL_B);
  const [councilMembers, setCouncilMembers] = useState(DEFAULT_COUNCIL_MEMBERS);
  const [contextBudget, setContextBudget] = useState(16384);

  // Chat hooks for Model A and Model B
  const chatA = useChat({ model: modelA });
  const chatB = useChat({ model: modelB });

  // Council hook
  const council = useCouncil({
    members: councilMembers,
    contextBudget,
  });

  // Judgment hook
  const lastUserMessage = messages[messages.length - 1]?.content || '';
  const judgment = useJudgment({
    promptText: lastUserMessage,
    modelAId: modelA,
    modelBId: modelB,
    councilMembers,
  });

  // Track message count to detect new user messages
  const prevMessageCountRef = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.role === 'user') {
        // Fire off all three API calls in parallel
        chatA.sendMessage(lastMessage.content);
        chatB.sendMessage(lastMessage.content);
        council.startDeliberation([lastMessage]);
      }
    }
    prevMessageCountRef.current = messages.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  // Determine if responses are ready for voting
  const canVote =
    !chatA.isStreaming &&
    !chatB.isStreaming &&
    !council.isDeliberating &&
    chatA.messages.length > 0 &&
    council.finalResponse !== null;

  // Get latest assistant messages
  const latestA = chatA.messages.filter((m) => m.role === 'assistant').pop();
  const latestB = chatB.messages.filter((m) => m.role === 'assistant').pop();

  // Get the last user message for the prompt banner
  const lastUserMsg = messages.filter((m) => m.role === 'user').pop();

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Sticky prompt banner */}
      <PromptBanner prompt={lastUserMsg?.content ?? null} />

      {/* Scrollable content area */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
        {/* Model A & B compact row */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <CompactResponseCard
            title={getModelDisplayName(modelA)}
            content={latestA?.content ?? null}
            isStreaming={chatA.isStreaming}
            streamingContent={chatA.streamingContent}
            tokenCount={chatA.usage?.total_tokens ?? null}
            costUsd={null}
            latencyMs={null}
            error={chatA.error}
            headerActions={
              <ModelSelector
                value={modelA}
                onChange={setModelA}
                label="Model A"
              />
            }
          />

          <CompactResponseCard
            title={getModelDisplayName(modelB)}
            content={latestB?.content ?? null}
            isStreaming={chatB.isStreaming}
            streamingContent={chatB.streamingContent}
            tokenCount={chatB.usage?.total_tokens ?? null}
            costUsd={null}
            latencyMs={null}
            error={chatB.error}
            headerActions={
              <ModelSelector
                value={modelB}
                onChange={setModelB}
                label="Model B"
              />
            }
          />
        </div>

        {/* Council panel - hero section */}
        <CouncilPanel
          finalResponse={council.finalResponse}
          isDeliberating={council.isDeliberating}
          completedMessages={council.completedMessages}
          activeTurn={council.activeTurn}
          budget={council.budget}
          stats={council.stats}
          error={council.error}
          councilMembers={councilMembers}
          contextBudget={contextBudget}
          onMembersChange={setCouncilMembers}
          onContextBudgetChange={setContextBudget}
        />
      </div>

      {/* Judgment Bar */}
      {canVote && (
        <JudgmentBar
          onVote={judgment.submitVote}
          currentVote={judgment.vote}
          disabled={judgment.hasVoted}
          isSubmitting={judgment.isSubmitting}
          modelAName={getModelDisplayName(modelA)}
          modelBName={getModelDisplayName(modelB)}
        />
      )}
    </div>
  );
}
