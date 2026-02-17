/**
 * SSE streaming utilities for both server and client.
 */

/**
 * Create a Server-Sent Events response from an async generator.
 */
export function createSSEResponse(
  generator: AsyncGenerator<unknown>,
  signal?: AbortSignal
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of generator) {
          if (signal?.aborted) break;
          const data = JSON.stringify(event);
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        const errEvent = JSON.stringify({ type: 'error', message: errMsg });
        controller.enqueue(encoder.encode(`data: ${errEvent}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

/**
 * Parse SSE stream on the client side.
 * Yields parsed JSON events from the SSE stream.
 */
export async function* parseSSEStream<T>(
  response: Response
): AsyncGenerator<T> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;

      const data = trimmed.slice(6);
      if (data === '[DONE]') return;

      try {
        yield JSON.parse(data) as T;
      } catch {
        // Skip malformed JSON
      }
    }
  }
}

/**
 * Create an SSE response for chat streaming.
 */
export function createChatSSEResponse(
  generator: AsyncGenerator<{ content: string; done: boolean; usage?: unknown }>
): Response {
  return createSSEResponse(generator);
}
