import express from 'express';
import { getMasterDb } from '../db';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const db = getMasterDb();
    const currencies = db.prepare('SELECT * FROM currencies ORDER BY code ASC').all();
    res.json(currencies);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const db = getMasterDb();
    const { code, name_ar, name_en, symbol } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO currencies (code, name_ar, name_en, symbol)
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run(code, name_ar, name_en, symbol);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:code', (req, res) => {
  try {
    const db = getMasterDb();
    const { name_ar, name_en, symbol } = req.body;
    const { code } = req.params;
    
    const stmt = db.prepare(`
      UPDATE currencies 
      SET name_ar = ?, name_en = ?, symbol = ?
      WHERE code = ?
    `);
    
    stmt.run(name_ar, name_en, symbol, code);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:code', (req, res) => {
  try {
    const db = getMasterDb();
    const { code } = req.params;
    
    // Check if any company uses this currency
    const companiesCount = db.prepare('SELECT COUNT(*) as count FROM companies WHERE currency_code = ?').get(code) as any;
    if (companiesCount.count > 0) {
      return res.status(400).json({ error: 'لا يمكن حذف العملة لأنها مستخدمة من قبل بعض الشركات' });
    }
    
    db.prepare('DELETE FROM currencies WHERE code = ?').run(code);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
