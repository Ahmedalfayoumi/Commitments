import express from 'express';
import bcrypt from 'bcryptjs';
import { getMasterDb } from '../db';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const db = getMasterDb();
    const users = db.prepare(`
      SELECT u.*, c.name_en as company_name 
      FROM users u 
      LEFT JOIN companies c ON u.company_id = c.id
      ORDER BY u.id DESC
    `).all();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const db = getMasterDb();
    const { username, password, company_id, role } = req.body;
    
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    const stmt = db.prepare(`
      INSERT INTO users (username, password, company_id, role)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(username, hashedPassword, company_id, role || 'user');
    res.json({ id: result.lastInsertRowid });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const db = getMasterDb();
    const { username, password, company_id, role, is_active } = req.body;
    const { id } = req.params;
    
    let query = 'UPDATE users SET username = ?, company_id = ?, role = ?, is_active = ?';
    const params = [username, company_id, role, is_active === undefined ? 1 : is_active];
    
    if (password) {
      query += ', password = ?';
      params.push(bcrypt.hashSync(password, 10));
    }
    
    query += ' WHERE id = ?';
    params.push(id);
    
    db.prepare(query).run(...params);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const db = getMasterDb();
    const { id } = req.params;
    const userId = Number(id);
    const currentUser: any = (req as any).user;

    console.log(`Deleting user with ID: ${userId}, requested by: ${currentUser?.username}`);
    
    // Prevent deleting self
    if (currentUser && currentUser.id === userId) {
      return res.status(400).json({ error: 'لا يمكنك حذف حسابك الخاص' });
    }

    // Check if user exists
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // Prevent deleting the main admin
    if (user.username === 'admin') {
      return res.status(400).json({ error: 'لا يمكن حذف حساب المسؤول الرئيسي' });
    }
    
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    console.log(`Delete result:`, result);
    
    res.json({ success: true });
  } catch (error: any) {
    console.error(`Error deleting user:`, error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
