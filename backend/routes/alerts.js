import { Router } from 'express';

const router = Router();
const sseClients = new Set();

router.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
  const client = { id: Date.now(), res };
  sseClients.add(client);
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 30_000);
  req.on('close', () => { clearInterval(heartbeat); sseClients.delete(client); });
});

router.get('/latest', (_req, res) => {
  res.json({ alerts: [] });
});

export default router;