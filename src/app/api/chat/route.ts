import { NextRequest } from 'next/server';
import { resolveProvider } from '@/lib/llm/models';
import { createSSEResponse } from '@/lib/utils/stream';
import type { ChatRequestBody } from '@/types/chat';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json();
    const { model, messages, temperature, maxTokens, userApiKey } = body;

    if (!model || !messages?.length) {
      return Response.json(
        { error: 'Model and messages are required' },
        { status: 400 }
      );
    }

    const userKeys = userApiKey ? { openrouter: userApiKey } : undefined;
    const provider = resolveProvider(model, userKeys);

    const generator = provider.chat({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    });

    return createSSEResponse(generator, request.signal);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return Response.json({ error: message }, { status: 500 });
  }
}
