import express from 'express';
import { getTenantDb } from '../db';

const router = express.Router();

router.get('/', (req: any, res) => {
  try {
    const companyId = req.user.company_id;
    if (!companyId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No company linked to this user' });
    }

    const targetCompanyId = companyId || req.query.company_id;
    const db = getTenantDb(Number(targetCompanyId));
    
    const payments = db.prepare(`
      SELECT p.*, c.commit_number, c.description as commitment_description 
      FROM payments p
      JOIN commitments c ON p.commitment_id = c.id
      ORDER BY p.payment_date DESC
    `).all();
    
    res.json(payments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req: any, res) => {
  try {
    const companyId = req.user.company_id;
    if (!companyId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No company linked to this user' });
    }

    const targetCompanyId = companyId || req.body.company_id;
    const db = getTenantDb(Number(targetCompanyId));
    const { commitment_id, amount, method, payment_date } = req.body;

    // Start transaction
    db.prepare('BEGIN TRANSACTION').run();

    try {
      // 1. Insert payment
      const stmt = db.prepare(`
        INSERT INTO payments (commitment_id, amount, method, payment_date)
        VALUES (?, ?, ?, ?)
      `);
      stmt.run(commitment_id, amount, method, payment_date);

      // 2. Check total paid for this commitment
      const commitment = db.prepare('SELECT amount FROM commitments WHERE id = ?').get(commitment_id) as any;
      const totalPaid = db.prepare('SELECT SUM(amount) as total FROM payments WHERE commitment_id = ?').get(commitment_id) as any;

      // 3. Update status if fully paid
      if (totalPaid.total >= commitment.amount) {
        db.prepare('UPDATE commitments SET status = ? WHERE id = ?').run('مكتمل', commitment_id);
      }

      db.prepare('COMMIT').run();
      res.json({ success: true });
    } catch (err: any) {
      db.prepare('ROLLBACK').run();
      throw err;
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
