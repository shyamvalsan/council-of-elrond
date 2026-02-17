import { http, HttpResponse } from 'msw';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

const mockModels = [
  {
    id: 'anthropic/claude-opus-4-6',
    name: 'Claude Opus 4.6',
    description: 'Anthropic Claude Opus 4.6',
    pricing: { prompt: '0.000015', completion: '0.000075' },
    context_length: 200000,
    top_provider: { max_completion_tokens: 4096 },
  },
  {
    id: 'openai/gpt-5-2',
    name: 'GPT-5.2',
    description: 'OpenAI GPT-5.2',
    pricing: { prompt: '0.00001', completion: '0.00003' },
    context_length: 128000,
    top_provider: { max_completion_tokens: 4096 },
  },
  {
    id: 'google/gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    description: 'Google Gemini 3 Pro Preview',
    pricing: { prompt: '0.000007', completion: '0.000021' },
    context_length: 1000000,
    top_provider: { max_completion_tokens: 8192 },
  },
];

export const handlers = [
  // OpenRouter models endpoint
  http.get(`${OPENROUTER_BASE}/models`, () => {
    return HttpResponse.json({ data: mockModels });
  }),

  // OpenRouter chat completions (non-streaming)
  http.post(`${OPENROUTER_BASE}/chat/completions`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;

    if (body.stream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          const chunks = [
            { choices: [{ delta: { content: 'Hello' }, index: 0 }] },
            { choices: [{ delta: { content: ' world' }, index: 0 }] },
            {
              choices: [{ delta: { content: '!' }, finish_reason: 'stop', index: 0 }],
              usage: { prompt_tokens: 10, completion_tokens: 3, total_tokens: 13 },
            },
          ];

          for (const chunk of chunks) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });

      return new HttpResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    return HttpResponse.json({
      id: 'gen-test-123',
      choices: [
        {
          message: { role: 'assistant', content: 'Hello world!' },
          finish_reason: 'stop',
        },
      ],
      usage: { prompt_tokens: 10, completion_tokens: 3, total_tokens: 13 },
    });
  }),

  // OpenRouter credits endpoint
  http.get(`${OPENROUTER_BASE}/credits`, () => {
    return HttpResponse.json({
      total_credits: 100,
      total_usage: 57.82,
    });
  }),
];
