import { NextRequest } from 'next/server';
import { CreditPoolManager } from '@/lib/credits/pool';

export const runtime = 'nodejs';

const poolManager = new CreditPoolManager();

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'anonymous';
    const estimatedCost = parseFloat(
      request.nextUrl.searchParams.get('estimatedCost') || '0'
    );

    const balance = await poolManager.getPoolBalance();
    const status = await poolManager.getStatus(userId, estimatedCost);

    return Response.json({
      ...status,
      isLowBalance: poolManager.isLowBalance(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return Response.json({ error: message }, { status: 500 });
  }
}
