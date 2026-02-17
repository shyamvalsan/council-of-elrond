import { getStatsCacheValue, computeAndCacheStats } from '@/lib/db/queries';

export const runtime = 'nodejs';

let lastComputeTime = 0;
const COMPUTE_INTERVAL = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  try {
    // Recompute stats periodically
    const now = Date.now();
    if (now - lastComputeTime > COMPUTE_INTERVAL) {
      await computeAndCacheStats();
      lastComputeTime = now;
    }

    const totalUsers = (await getStatsCacheValue('total_users')) ?? 0;
    const totalTokens = (await getStatsCacheValue('total_tokens')) ?? 0;
    const totalJudgments = (await getStatsCacheValue('total_judgments')) ?? 0;

    return Response.json({
      totalUsers,
      totalTokens,
      totalJudgments,
    });
  } catch (error) {
    // Return zeros on error rather than failing
    return Response.json({
      totalUsers: 0,
      totalTokens: 0,
      totalJudgments: 0,
    });
  }
}
