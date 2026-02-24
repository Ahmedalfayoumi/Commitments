import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';
import { initMasterDb, getTenantDb } from './server/db';
import authRoutes from './server/routes/auth';
import companiesRoutes from './server/routes/companies';
import commitmentsRoutes from './server/routes/commitments';
import paymentsRoutes from './server/routes/payments';
import reportsRoutes from './server/routes/reports';
import usersRoutes from './server/routes/users';
import currenciesRoutes from './server/routes/currencies';

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to authenticate JWT
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Middleware to authorize admin only
const authorizeAdmin = (req: any, res: any, next: any) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admin only.' });
  }
};

async function startServer() {
  const app = express();
  
  app.use(cors());
  app.use(express.json());

  // Initialize master database
  initMasterDb();

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/companies', authenticateToken, authorizeAdmin, companiesRoutes);
  app.use('/api/commitments', authenticateToken, commitmentsRoutes);
  app.use('/api/payments', authenticateToken, paymentsRoutes);
  app.use('/api/reports', authenticateToken, reportsRoutes);
  app.use('/api/users', authenticateToken, authorizeAdmin, usersRoutes);
  app.use('/api/currencies', authenticateToken, currenciesRoutes);

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
