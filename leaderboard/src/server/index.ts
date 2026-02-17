import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import judgments from './routes/judgments.js';
import leaderboard from './routes/leaderboard.js';
import characters from './routes/characters.js';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', 'https://council-of-elrond.dev'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'council-of-elrond-leaderboard' });
});

// API routes
app.route('/api/v1/judgments', judgments);
app.route('/api/v1/leaderboard', leaderboard);
app.route('/api/v1/characters', characters);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

const port = parseInt(process.env.PORT ?? '3001', 10);

console.log(`Leaderboard API server starting on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
export { app };
