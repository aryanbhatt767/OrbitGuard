/**
 * server.js — OrbitGuard Backend
 * ─────────────────────────────────────────────────────────────────────────────
 * Express server that:
 *   • Proxies NASA Space-Track.org API (requires free account)
 *   • Caches TLE data with Redis (falls back to in-memory if Redis unavailable)
 *   • Serves AI risk analysis via Anthropic Claude API
 *   • Exposes SSE endpoint for real-time conjunction alerts
 *
 * Environment variables (see .env.example):
 *   SPACETRACK_USER     – Space-Track.org username
 *   SPACETRACK_PASS     – Space-Track.org password
 *   ANTHROPIC_API_KEY   – Anthropic API key for AI analysis
 *   NASA_API_KEY        – NASA API key (for DONKI space weather)
 *   PORT                – Server port (default 3001)
 *   REDIS_URL           – Optional Redis connection string
 */

import express        from 'express';
import cors           from 'cors';
import helmet         from 'helmet';
import rateLimit      from 'express-rate-limit';
import dotenv         from 'dotenv';
import debrisRoutes   from './routes/debris.js';
import aiRoutes       from './routes/ai.js';
import alertsRoutes   from './routes/alerts.js';

dotenv.config();

const app  = express();
const PORT = process.env.PORT ?? 3001;
app.get("/", (req, res) => {
  res.json({
    status: "OrbitGuard Backend Running 🚀",
    version: "1.0.0"
  });
});

// ─── Middleware ──────────────────────────────────────────────────────────────

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' }));
app.use(express.json({ limit: '2mb' }));

// Rate limiting – space-track.org enforces their own limits too
app.use('/api/', rateLimit({
  windowMs: 60_000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — slow down', retryAfter: 60 },
}));

// Request logging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ─── Routes ──────────────────────────────────────────────────────────────────

app.use('/api/debris',  debrisRoutes);
app.use('/api/ai',      aiRoutes);
app.use('/api/alerts',  alertsRoutes);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      spacetrack: !!process.env.SPACETRACK_USER,
      gemini:     !!process.env.GEMINI_API_KEY,
      nasa:       !!process.env.NASA_API_KEY,
    },
  });
});

// ─── Error handler ───────────────────────────────────────────────────────────

app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status ?? 500).json({ error: err.message ?? 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n🛡  OrbitGuard backend running on http://localhost:${PORT}`);
  console.log(`   Space-Track: ${process.env.SPACETRACK_USER ? '✓ configured' : '✗ not configured'}`);
  console.log(`   Gemini:      ${process.env.GEMINI_API_KEY ? '✓ configured' : '✗ not configured'}`);
  console.log(`   NASA API:    ${process.env.NASA_API_KEY ? '✓ configured' : '✗ not configured'}\n`);
});

export default app;
