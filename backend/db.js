import sqlite3 from 'sqlite3';

let db;

export const initDb = () => {
  db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
      console.error('Error opening database', err.message);
    } else {
      console.log('Connected to the SQLite database.');
      db.run(`CREATE TABLE IF NOT EXISTS consents (
        id TEXT PRIMARY KEY,
        phone TEXT,
        status TEXT,
        bank_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
    }
  });
};

export const getDb = () => db;
