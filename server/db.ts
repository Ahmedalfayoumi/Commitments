import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'data');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let masterDb: Database.Database | null = null;
const tenantDbs: Record<string, Database.Database> = {};

export function initMasterDb() {
  if (masterDb) return masterDb;
  masterDb = new Database(path.join(DB_DIR, 'master.db'));
  
  masterDb.exec(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_en TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      company_type TEXT,
      sectors TEXT,
      country TEXT,
      city TEXT,
      street TEXT,
      building_name TEXT,
      building_number TEXT,
      floor TEXT,
      office_number TEXT,
      phone TEXT,
      signatory_name TEXT,
      signatory_phone TEXT,
      logo TEXT,
      favicon TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      company_id INTEGER,
      role TEXT DEFAULT 'user',
      is_active BOOLEAN DEFAULT 1,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    );
  `);

  return masterDb;
}

export function getMasterDb() {
  if (!masterDb) return initMasterDb();
  return masterDb;
}

export function initTenantDb(companyId: number) {
  const dbPath = path.join(DB_DIR, `tenant_${companyId}.db`);
  const db = new Database(dbPath);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS commitments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      commit_number TEXT UNIQUE NOT NULL,
      due_date DATE NOT NULL,
      account TEXT NOT NULL,
      description TEXT,
      amount DECIMAL(10, 2) NOT NULL,
      status TEXT DEFAULT 'نشط',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      commitment_id INTEGER NOT NULL,
      method TEXT NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      payment_date DATE NOT NULL,
      FOREIGN KEY (commitment_id) REFERENCES commitments(id)
    );
  `);

  tenantDbs[companyId] = db;
  return db;
}

export function getTenantDb(companyId: number) {
  if (!tenantDbs[companyId]) {
    return initTenantDb(companyId);
  }
  return tenantDbs[companyId];
}
