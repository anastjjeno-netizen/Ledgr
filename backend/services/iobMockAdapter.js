export const generateIobMockData = () => {
  // Generate some realistic IOB style transactions.
  // Standard format returned by Account Aggregator JSON structures
  
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  
  return [
    {
      txnId: 'IOB100192837',
      type: 'DEBIT',
      amount: 150.00,
      narration: 'UPI/P2A/1123912/SWIGGY/HDFC',
      timestamp: now - (2 * dayMs),
      balance: 45000.50
    },
    {
      txnId: 'IOB100192838',
      type: 'CREDIT',
      amount: 55000.00,
      narration: 'NEFT-AXIS-SALARY-OCT',
      timestamp: now - (15 * dayMs),
      balance: 45150.50
    },
    {
      txnId: 'IOB100192839',
      type: 'DEBIT',
      amount: 2500.00,
      narration: 'UPI/P2M/9922883/RELIANCE FRESH',
      timestamp: now - (5 * dayMs),
      balance: 42650.50
    },
    {
      txnId: 'IOB100192840',
      type: 'DEBIT',
      amount: 800.00,
      narration: 'POS/4111/JIO PREPAID',
      timestamp: now - (7 * dayMs),
      balance: 41850.50
    }
  ];
};
