import { NextRequest } from 'next/server';
import { getModels } from '@/lib/llm/models';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const apiKey =
      request.headers.get('x-api-key') || undefined;

    const models = await getModels(apiKey);
    return Response.json({ models });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch models';
    return Response.json({ error: message }, { status: 500 });
  }
}
