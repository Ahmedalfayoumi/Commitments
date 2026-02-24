import express from 'express';
import { getTenantDb } from '../db';

const router = express.Router();

router.get('/stats', (req: any, res) => {
  try {
    const companyId = req.user.company_id;
    if (!companyId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No company linked to this user' });
    }

    const targetCompanyId = companyId || req.query.company_id;
    if (!targetCompanyId) {
      return res.status(400).json({ error: 'company_id is required' });
    }

    const db = getTenantDb(Number(targetCompanyId));

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_count,
        SUM(CASE WHEN status = 'نشط' THEN 1 ELSE 0 END) as active_count,
        SUM(CASE WHEN status = 'مكتمل' THEN 1 ELSE 0 END) as completed_count,
        SUM(amount) as total_amount
      FROM commitments
    `).get() as any;

    res.json({
      active_count: stats.active_count || 0,
      completed_count: stats.completed_count || 0,
      total_amount: stats.total_amount || 0,
      total_count: stats.total_count || 0
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
