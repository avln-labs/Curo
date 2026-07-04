/**
 * Medicines Routes
 *
 * GET /api/v1/medicines/search?q=para → Ranked autocomplete matches (max 8)
 *
 * Doctor-only: the formulary powers the prescription builder. Controlled
 * substances (Schedule H/H1/X) carry a `schedule` flag the UI must surface.
 */

import { Router } from 'express';
import { requireAuth, requireRole } from '../shared/middleware';
import { searchFormulary } from './formulary';

export const medicineRouter = Router();

medicineRouter.get('/search', requireAuth, requireRole('DOCTOR'), (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q : '';
  if (q.trim().length < 2) {
    return res.json({ success: true, data: [] });
  }
  const data = searchFormulary(q, 8);
  return res.json({ success: true, data });
});
