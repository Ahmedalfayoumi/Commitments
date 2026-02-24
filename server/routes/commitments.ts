import express from 'express';
import { getTenantDb } from '../db';

const router = express.Router();

router.get('/', (req: any, res) => {
  try {
    const companyId = req.user.company_id;
    if (!companyId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No company linked to this user' });
    }
    
    // For admin, we might want to allow seeing all or require a company_id param
    const targetCompanyId = companyId || req.query.company_id;
    if (!targetCompanyId) {
      // If admin and no company_id, return empty array instead of error to prevent UI crash
      if (req.user.role === 'admin') {
        return res.json([]);
      }
      return res.status(400).json({ error: 'company_id is required' });
    }

    const db = getTenantDb(Number(targetCompanyId));
    
    let query = 'SELECT * FROM commitments';
    const params: any[] = [];

    // Filtering
    if (req.query.status) {
      query += ' WHERE status = ?';
      params.push(req.query.status);
    }

    // Sorting
    const sortBy = req.query.sortBy as string || 'created_at';
    const order = req.query.order as string || 'DESC';
    const allowedSortFields = ['due_date', 'created_at', 'amount', 'description', 'status'];
    
    if (allowedSortFields.includes(sortBy)) {
      query += ` ORDER BY ${sortBy} ${order === 'ASC' ? 'ASC' : 'DESC'}`;
    }

    const commitments = db.prepare(query).all(...params);
    res.json(commitments);
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
    if (!targetCompanyId) {
      return res.status(400).json({ error: 'company_id is required' });
    }

    const db = getTenantDb(Number(targetCompanyId));
    const { due_date, account, description, amount, status } = req.body;

    // Generate automatic commitment number: YYYY-MM-NNN based on due_date
    const dueDate = new Date(due_date);
    const year = dueDate.getFullYear();
    const month = String(dueDate.getMonth() + 1).padStart(2, '0');
    const prefix = `${year}-${month}-`;

    // Find the latest number for this month
    const latest = db.prepare('SELECT commit_number FROM commitments WHERE commit_number LIKE ? ORDER BY commit_number DESC LIMIT 1').get(`${prefix}%`) as { commit_number: string } | undefined;
    
    let nextNum = 1;
    if (latest) {
      const lastSeq = parseInt(latest.commit_number.split('-')[2]);
      if (!isNaN(lastSeq)) {
        nextNum = lastSeq + 1;
      }
    }
    
    const generatedCommitNumber = `${prefix}${String(nextNum).padStart(3, '0')}`;
    
    const stmt = db.prepare(`
      INSERT INTO commitments (commit_number, due_date, account, description, amount, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(generatedCommitNumber, due_date, account, description, amount, status || 'نشط');
    res.json({ id: result.lastInsertRowid });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/search/:number', (req: any, res) => {
  try {
    const companyId = req.user.company_id;
    if (!companyId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No company linked to this user' });
    }

    const targetCompanyId = companyId || req.query.company_id;
    const db = getTenantDb(Number(targetCompanyId));
    const { number } = req.params;

    const commitment = db.prepare('SELECT * FROM commitments WHERE commit_number = ?').get(number) as any;
    
    if (!commitment) {
      return res.status(404).json({ error: 'الالتزام غير موجود' });
    }

    // Get payments for this commitment
    const payments = db.prepare('SELECT * FROM payments WHERE commitment_id = ? ORDER BY payment_date DESC').all(commitment.id);
    const totalPaid = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
    
    res.json({
      ...commitment,
      payments,
      totalPaid,
      remainingAmount: commitment.amount - totalPaid
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', (req: any, res) => {
  try {
    const companyId = req.user.company_id;
    if (!companyId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No company linked to this user' });
    }

    const targetCompanyId = companyId || req.body.company_id;
    const db = getTenantDb(Number(targetCompanyId));
    const { id } = req.params;
    const { due_date, account, description, amount, status } = req.body;

    const stmt = db.prepare(`
      UPDATE commitments 
      SET due_date = ?, account = ?, description = ?, amount = ?, status = ?
      WHERE id = ?
    `);
    
    stmt.run(due_date, account, description, amount, status, id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req: any, res) => {
  try {
    const companyId = req.user.company_id;
    if (!companyId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No company linked to this user' });
    }

    const targetCompanyId = companyId || req.query.company_id;
    const db = getTenantDb(Number(targetCompanyId));
    const { id } = req.params;

    // Check if there are payments
    const payments = db.prepare('SELECT COUNT(*) as count FROM payments WHERE commitment_id = ?').get(id) as any;
    if (payments.count > 0) {
      return res.status(400).json({ error: 'لا يمكن حذف الالتزام لوجود دفعات مسجلة عليه. يرجى حذف الدفعات أولاً.' });
    }

    db.prepare('DELETE FROM commitments WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
