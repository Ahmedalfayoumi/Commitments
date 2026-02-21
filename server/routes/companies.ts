import express from 'express';
import { getMasterDb } from '../db.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const db = getMasterDb();
    const companies = db.prepare('SELECT * FROM companies ORDER BY created_at DESC').all();
    res.json(companies);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const db = getMasterDb();
    const { 
      name_en, name_ar, company_type, sectors, country, city,
      street, building_name, building_number, floor, office_number,
      phone, signatory_name, signatory_phone, logo, favicon
    } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO companies (
        name_en, name_ar, company_type, sectors, country, city,
        street, building_name, building_number, floor, office_number,
        phone, signatory_name, signatory_phone, logo, favicon
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      name_en, name_ar, company_type, sectors, country, city,
      street, building_name, building_number, floor, office_number,
      phone, signatory_name, signatory_phone, logo, favicon
    );
    res.json({ id: result.lastInsertRowid });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const db = getMasterDb();
    const { 
      name_en, name_ar, company_type, sectors, country, city,
      street, building_name, building_number, floor, office_number,
      phone, signatory_name, signatory_phone, logo, favicon
    } = req.body;
    const { id } = req.params;
    
    const stmt = db.prepare(`
      UPDATE companies 
      SET name_en = ?, name_ar = ?, company_type = ?, sectors = ?, country = ?, city = ?,
          street = ?, building_name = ?, building_number = ?, floor = ?, office_number = ?,
          phone = ?, signatory_name = ?, signatory_phone = ?, logo = ?, favicon = ?
      WHERE id = ?
    `);
    
    stmt.run(
      name_en, name_ar, company_type, sectors, country, city,
      street, building_name, building_number, floor, office_number,
      phone, signatory_name, signatory_phone, logo, favicon,
      id
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const db = getMasterDb();
    const { id } = req.params;
    const companyId = Number(id);
    console.log(`Deleting company with ID: ${companyId}`);
    
    // Check if company exists
    const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(companyId);
    if (!company) {
      return res.status(404).json({ error: 'الشركة غير موجودة' });
    }

    // Check if company has users
    const usersCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE company_id = ?').get(companyId) as any;
    if (usersCount.count > 0) {
      return res.status(400).json({ error: 'لا يمكن حذف الشركة لوجود مستخدمين مرتبطين بها. يرجى حذف المستخدمين أولاً.' });
    }
    
    const result = db.prepare('DELETE FROM companies WHERE id = ?').run(companyId);
    console.log(`Delete result:`, result);
    
    res.json({ success: true });
  } catch (error: any) {
    console.error(`Error deleting company:`, error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
