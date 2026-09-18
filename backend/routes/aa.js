import express from 'express';
import { getDb } from '../db.js';
import setuAdapter from '../services/setuAdapter.js';

const router = express.Router();

// 1. Request Consent
router.post('/consent/request', async (req, res) => {
  const { phone, bankId } = req.body;
  
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  try {
    // Call Setu AA Gateway
    const setuResponse = await setuAdapter.createConsentRequest(phone);
    
    // Save to DB
    getDb().run(
      'INSERT INTO consents (id, phone, status, bank_id) VALUES (?, ?, ?, ?)',
      [setuResponse.consentId, phone, 'PENDING', bankId],
      (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        
        // In Setu, the user must be redirected to `setuResponse.url` to approve the consent via the Setu UI
        res.json({ 
          consentId: setuResponse.consentId, 
          status: 'PENDING', 
          message: 'Consent request initiated. Please redirect user to approve URL.',
          url: setuResponse.url 
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Approve Consent (In reality, Setu sends a webhook, or we poll Setu. For UX, we'll simulate the user clicking "I approved it")
router.post('/consent/approve', async (req, res) => {
  const { consentId } = req.body;
  
  if (!consentId) return res.status(400).json({ error: 'Consent ID is required' });

  // In a real flow, you might verify the status with Setu API `GET /consents/{consentId}` here
  // For now, we just update the local DB to active
  getDb().run(
    'UPDATE consents SET status = ? WHERE id = ?',
    ['ACTIVE', consentId],
    function(err) {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (this.changes === 0) return res.status(404).json({ error: 'Consent not found' });
      res.json({ consentId, status: 'ACTIVE' });
    }
  );
});

// 3. Fetch Data
router.post('/fi/fetch', async (req, res) => {
  const { consentId } = req.body;

  if (!consentId) return res.status(400).json({ error: 'Consent ID is required' });

  getDb().get('SELECT * FROM consents WHERE id = ?', [consentId], async (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row) return res.status(404).json({ error: 'Consent not found' });
    if (row.status !== 'ACTIVE') return res.status(403).json({ error: 'Consent not active' });

    try {
      // Request data session from Setu
      const sessionId = await setuAdapter.requestDataFetch(consentId);
      
      // Fetch decrypted data from session
      const data = await setuAdapter.fetchDecryptedData(sessionId);
      
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

export default router;
