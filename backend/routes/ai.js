import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/analyze', async (req, res, next) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'Gemini API key not configured' });
    }
    const { objects = [], question = 'Summarize the current orbital risk situation.' } = req.body;
    const topObjects = objects
      .sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0))
      .slice(0, 15);
    const context = topObjects.map(o =>
      `${o.name} (NORAD ${o.norad}): alt=${o.altitude}km, inc=${o.inclination}°, risk=${(o.riskScore * 100).toFixed(1)}%, type=${o.type}`
    ).join('\n');

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are OrbitGuard's AI analyst for space situational awareness.
Analyze this orbital data and answer in 3-4 sentences max. Be technical and precise.

${context}

Question: ${question}`;

    const result = await model.generateContent(prompt);
    res.json({ analysis: result.response.text() });
  } catch (err) {
    next(err);
  }
});

router.post('/conjunction-assessment', async (req, res, next) => {
  try {
    const { primary, secondary, tca, missDistance, pc, relVelocity } = req.body;
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Conjunction alert:
Primary:   ${primary.name} (NORAD ${primary.norad})
Secondary: ${secondary.name} (NORAD ${secondary.norad})
TCA:       ${tca}
Miss dist: ${missDistance} m
Pc:        ${pc}
Rel vel:   ${relVelocity} m/s
Provide: (1) risk level, (2) recommended action, (3) consequence if no action.`;

    const result = await model.generateContent(prompt);
    res.json({ assessment: result.response.text() });
  } catch (err) {
    next(err);
  }
});

export default router;