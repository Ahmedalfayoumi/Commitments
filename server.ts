import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { initMasterDb, getTenantDb } from './server/db.js';
import authRoutes from './server/routes/auth.js';
import companiesRoutes from './server/routes/companies.js';
import commitmentsRoutes from './server/routes/commitments.js';
import paymentsRoutes from './server/routes/payments.js';
import reportsRoutes from './server/routes/reports.js';

const PORT = 3000;

async function startServer() {
  const app = express();
  
  app.use(cors());
  app.use(express.json());

  // Initialize master database
  initMasterDb();

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/companies', companiesRoutes);
  app.use('/api/commitments', commitmentsRoutes);
  app.use('/api/payments', paymentsRoutes);
  app.use('/api/reports', reportsRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
