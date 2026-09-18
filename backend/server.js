import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import aaRoutes from './routes/aa.js';
import { initDb } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize SQLite Database
initDb();

// Routes
app.use('/api/aa', aaRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Ledgr AA Backend' });
});

app.listen(PORT, () => {
  console.log(`Backend Server running on port ${PORT}`);
});
