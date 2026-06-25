import { Router } from 'express';
import { getLatestTLEs, getConjunctionMessages } from '../services/spaceTrack.js';

const router = Router();
let cache = { data: null, fetchedAt: 0, ttl: 5 * 60_000 };

router.get('/catalog', async (req, res, next) => {
  try {
    if (cache.data && Date.now() - cache.fetchedAt < cache.ttl) {
      return res.json({ data: cache.data, cached: true });
    }
    const data = await getLatestTLEs({ limit: 200, altMin: 150, altMax: 2000 });
    cache = { data, fetchedAt: Date.now(), ttl: 5 * 60_000 };
    res.json({ data, cached: false, fetchedAt: new Date() });
  } catch (err) { next(err); }
});

router.get('/conjunctions', async (req, res, next) => {
  try {
    const data = await getConjunctionMessages({ days: 7 });
    res.json({ data, count: data.length });
  } catch (err) { next(err); }
});

export default router;