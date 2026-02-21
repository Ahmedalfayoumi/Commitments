import express from 'express';
import { getTenantDb } from '../db.js';

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
    const { commit_number, due_date, account, description, amount, status } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO commitments (commit_number, due_date, account, description, amount, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(commit_number, due_date, account, description, amount, status || 'نشط');
    res.json({ id: result.lastInsertRowid });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
