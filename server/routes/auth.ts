import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getMasterDb } from '../db';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const db = getMasterDb();
    
    const user: any = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, company_id: user.company_id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      token, 
      user: { 
        id: user.id, 
        username: user.username, 
        role: user.role, 
        company_id: user.company_id 
      } 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/register', (req, res) => {
  try {
    const db = getMasterDb();
    const { 
      // Company fields
      name_en, name_ar, company_type, sectors, country, city,
      street, building_name, building_number, floor, office_number,
      phone, signatory_name, signatory_phone, logo, favicon, currency_code,
      // User fields
      username, password
    } = req.body;

    // Start transaction
    db.exec('BEGIN TRANSACTION');

    try {
      // 1. Create Company
      const companyStmt = db.prepare(`
        INSERT INTO companies (
          name_en, name_ar, company_type, sectors, country, city,
          street, building_name, building_number, floor, office_number,
          phone, signatory_name, signatory_phone, logo, favicon, currency_code
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const companyResult = companyStmt.run(
        name_en, name_ar, company_type, sectors, country, city,
        street, building_name, building_number, floor, office_number,
        phone, signatory_name, signatory_phone, logo, favicon, currency_code || 'SAR'
      );
      
      const companyId = companyResult.lastInsertRowid;

      // 2. Create Admin User
      const hashedPassword = bcrypt.hashSync(password, 10);
      const userStmt = db.prepare(`
        INSERT INTO users (username, password, company_id, role, is_active)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      userStmt.run(username, hashedPassword, companyId, 'admin', 1);

      db.exec('COMMIT');
      res.json({ success: true, message: 'Company and admin user created successfully' });
    } catch (err: any) {
      db.exec('ROLLBACK');
      throw err;
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
