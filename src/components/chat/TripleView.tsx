'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ResponsePanel } from './ResponsePanel';
import { ModelSelector } from './ModelSelector';
import { CouncilConfig } from './CouncilConfig';
import { JudgmentBar } from './JudgmentBar';
import { DeliberationTranscript } from './DeliberationTranscript';
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
  const [maxRounds, setMaxRounds] = useState(3);
  const [synthesizerStrategy, setSynthesizerStrategy] = useState<'round-robin' | 'voted' | 'fixed'>('round-robin');

  // Chat hooks for Model A and Model B
  const chatA = useChat({ model: modelA });
  const chatB = useChat({ model: modelB });

  // Council hook
  const council = useCouncil({
    members: councilMembers,
    maxRounds,
    synthesizerStrategy,
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
  const hasResponses =
    (chatA.messages.length > 0 || chatA.streamingContent) &&
    (chatB.messages.length > 0 || chatB.streamingContent) &&
    (council.finalResponse || council.isDeliberating);
  const canVote =
    !chatA.isStreaming &&
    !chatB.isStreaming &&
    !council.isDeliberating &&
    chatA.messages.length > 0 &&
    council.finalResponse !== null;

  // Get latest assistant messages
  const latestA = chatA.messages.filter((m) => m.role === 'assistant').pop();
  const latestB = chatB.messages.filter((m) => m.role === 'assistant').pop();

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Three columns */}
      <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden p-4 md:grid-cols-3">
        {/* Model A */}
        <ResponsePanel
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

        {/* Model B */}
        <ResponsePanel
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

        {/* Council */}
        <ResponsePanel
          title="The Council"
          content={council.finalResponse}
          isStreaming={council.isDeliberating}
          streamingContent={
            council.currentPhase
              ? `Deliberating... Phase: ${council.currentPhase}${
                  council.currentRound ? ` (Round ${council.currentRound})` : ''
                }`
              : ''
          }
          tokenCount={council.stats?.tokens ?? null}
          costUsd={council.stats?.cost ?? null}
          latencyMs={council.stats?.latencyMs ?? null}
          error={council.error}
          headerActions={
            <CouncilConfig
              members={councilMembers}
              maxRounds={maxRounds}
              synthesizerStrategy={synthesizerStrategy}
              onMembersChange={setCouncilMembers}
              onMaxRoundsChange={setMaxRounds}
              onStrategyChange={setSynthesizerStrategy}
            />
          }
          footer={
            <DeliberationTranscript events={council.transcript} />
          }
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
