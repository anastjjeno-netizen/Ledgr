import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const SETU_BASE_URL = process.env.SETU_ENV === 'PRODUCTION' 
  ? 'https://fiu.setu.co' 
  : 'https://fiu-sandbox.setu.co';

const getHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'x-client-id': process.env.SETU_CLIENT_ID || 'dummy_client_id',
    'x-client-secret': process.env.SETU_CLIENT_SECRET || 'dummy_secret',
    'x-product-instance-id': process.env.SETU_PRODUCT_INSTANCE_ID || 'dummy_product_id',
  };
};

/**
 * Initiates a Consent Request on Setu AA Gateway
 */
const createConsentRequest = async (phone) => {
  try {
    const payload = {
      Detail: {
        consentStart: new Date().toISOString(),
        consentExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        Customer: {
          id: `${phone}@setu` // Assuming VUA is phone@setu or we request phone based consent
        },
        FIDataRange: {
          from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days back
          to: new Date().toISOString()
        },
        consentMode: "VIEW",
        consentTypes: ["TRANSACTIONS", "PROFILE", "SUMMARY"],
        fetchType: "ONETIME",
        Frequency: {
          value: 1,
          unit: "HOUR"
        },
        DataFilter: [
          {
            type: "TRANSACTIONAMOUNT",
            value: "5000",
            operator: ">="
          }
        ],
        DataLife: {
          value: 1,
          unit: "MONTH"
        },
        Purpose: {
          code: "101",
          refUri: "https://api.rebit.org.in/aa/purpose/101.xml",
          text: "Personal Finance Management",
          Category: {
            type: "string"
          }
        },
        fiTypes: ["DEPOSIT"]
      }
    };

    const response = await axios.post(`${SETU_BASE_URL}/consents`, payload, {
      headers: getHeaders()
    });

    return {
      consentId: response.data.id,
      url: response.data.url, // Setu returns a URL to redirect the user to approve
      status: response.data.status // typically 'PENDING'
    };
  } catch (error) {
    console.error('Error creating Setu consent request:', error.response?.data || error.message);
    // Return a dummy fallback for development if keys aren't set up yet
    if (!process.env.SETU_CLIENT_ID || process.env.SETU_CLIENT_ID === 'your_setu_client_id') {
      console.log('Falling back to mock consent (Setu keys not configured)');
      return {
        consentId: 'setu_mock_' + Math.random().toString(36).substr(2, 9),
        url: 'http://localhost:5173/mock-setu-approval', // fake URL
        status: 'PENDING'
      };
    }
    throw new Error('Failed to create Setu consent request');
  }
};

/**
 * Fetch Data Session
 */
const requestDataFetch = async (consentId) => {
  try {
    const payload = {
      consentId: consentId,
      DataRange: {
        from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        to: new Date().toISOString()
      },
      format: "json"
    };

    const response = await axios.post(`${SETU_BASE_URL}/sessions`, payload, {
      headers: getHeaders()
    });
    
    return response.data.id; // Session ID
  } catch (error) {
    console.error('Error creating Setu FI session:', error.response?.data || error.message);
    if (consentId.startsWith('setu_mock_')) return 'mock_session_id';
    throw new Error('Failed to create data session');
  }
};

/**
 * Get Decrypted Data from Session
 */
const fetchDecryptedData = async (sessionId) => {
  try {
    if (sessionId === 'mock_session_id') {
       // Mock response logic if keys aren't configured
       return {
         account: { bank: 'Indian Overseas Bank (Mocked via Setu)', mask: 'XXXX1234', type: 'SAVINGS' },
         transactions: [
           { txnId: 'ST1001', type: 'DEBIT', amount: 500, narration: 'Amazon Pay', date: new Date().toISOString() },
           { txnId: 'ST1002', type: 'CREDIT', amount: 20000, narration: 'Salary', date: new Date(Date.now() - 86400000).toISOString() }
         ]
       };
    }

    const response = await axios.get(`${SETU_BASE_URL}/sessions/${sessionId}`, {
      headers: getHeaders()
    });
    
    // In a real implementation, you would need to parse the encrypted JWS FI data 
    // using the Request Signing Keys you set up in Setu Bridge.
    // For simplicity of this skeleton, we assume the payload is already parsed JSON.
    const fiData = response.data.payload; 
    
    // Normalize to our frontend format
    return {
       account: { bank: 'Unknown Bank', mask: 'XXXX', type: 'SAVINGS' },
       transactions: fiData || []
    };
  } catch (error) {
    console.error('Error fetching Setu FI data:', error.response?.data || error.message);
    throw new Error('Failed to fetch financial data');
  }
};

export default {
  createConsentRequest,
  requestDataFetch,
  fetchDecryptedData
};
