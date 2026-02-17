import { NextRequest } from 'next/server';
import { createJudgment, markJudgmentPublic } from '@/lib/db/queries';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      chatId,
      userId,
      promptText,
      modelAId,
      modelBId,
      councilMembers,
      winner,
      promptCategory,
      submitToPublic,
    } = body;

    if (!promptText || !modelAId || !modelBId || !councilMembers?.length || !winner) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const validWinners = ['model_a', 'model_b', 'council', 'tie'];
    if (!validWinners.includes(winner)) {
      return Response.json(
        { error: 'Invalid winner value' },
        { status: 400 }
      );
    }

    const judgment = await createJudgment({
      chatId: chatId || 'anonymous',
      userId: userId || 'anonymous',
      promptText,
      modelAId,
      modelBId,
      councilMembers,
      winner,
      promptCategory,
    });

    // Submit to public leaderboard if requested
    if (submitToPublic && process.env.LEADERBOARD_SUBMIT_ENABLED === 'true') {
      try {
        const leaderboardUrl = process.env.LEADERBOARD_API_URL;
        if (leaderboardUrl) {
          // Hash the prompt for privacy
          const encoder = new TextEncoder();
          const data = encoder.encode(promptText);
          const hashBuffer = await crypto.subtle.digest('SHA-256', data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const promptHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

          await fetch(`${leaderboardUrl}/judgments`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.LEADERBOARD_API_KEY}`,
            },
            body: JSON.stringify({
              promptHash,
              promptCategory,
              modelAId,
              modelBId,
              councilMembers,
              winner,
            }),
          });

          await markJudgmentPublic(judgment.id);
        }
      } catch {
        // Non-fatal: judgment still saved locally
      }
    }

    return Response.json({ judgment });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return Response.json({ error: message }, { status: 500 });
  }
}
