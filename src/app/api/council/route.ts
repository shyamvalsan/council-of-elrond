import { NextRequest } from 'next/server';
import { CouncilEngine } from '@/lib/llm/council';
import { createSSEResponse } from '@/lib/utils/stream';
import type { CouncilRequestBody } from '@/types/council';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body: CouncilRequestBody = await request.json();
    const {
      members,
      contextBudget = 16384,
      messages,
      userApiKey,
    } = body;

    if (!members?.length || !messages?.length) {
      return Response.json(
        { error: 'Council members and messages are required' },
        { status: 400 }
      );
    }

    const userMessage = messages[messages.length - 1];
    if (!userMessage || userMessage.role !== 'user') {
      return Response.json(
        { error: 'Last message must be from user' },
        { status: 400 }
      );
    }

    const userKeys = userApiKey ? { openrouter: userApiKey } : undefined;

    const engine = new CouncilEngine(
      {
        members,
        contextBudget,
        userPrompt: userMessage.content,
      },
      userKeys
    );

    return createSSEResponse(engine.deliberate(), request.signal);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('minimum') || message.includes('maximum') ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}
