import Dexie from 'dexie';

export const db = new Dexie('LedgrDatabase');

db.version(2).stores({
  transactions: '++id, amount_inr, direction, raw_description, merchant_normalized, category_id, timestamp, payment_mode, is_transfer, exclude_from_budget',
  categories: '++id, name, icon, color',
  budgets: '++id, month, base_budget',
  budget_adjustments: '++id, month, amount, type, reason, date'
});

export async function seedDemoData() {
  const count = await db.transactions.count();
  if (count > 0) return; // Already seeded

  await db.categories.bulkAdd([
    { id: 1, name: 'Food & Delivery', icon: 'pizza', color: '#F79009' },
    { id: 2, name: 'Groceries', icon: 'shopping-cart', color: '#12B76A' },
    { id: 3, name: 'Clothes & Shopping', icon: 'shopping-bag', color: '#465FFF' },
    { id: 4, name: 'Bills & Utilities', icon: 'zap', color: '#F04438' },
    { id: 5, name: 'Travel & Fuel', icon: 'car', color: '#9B51E0' },
    { id: 6, name: 'Salary', icon: 'briefcase', color: '#12B76A' },
    { id: 7, name: 'Transfers', icon: 'repeat', color: '#667085' },
    { id: 8, name: 'Other', icon: 'help-circle', color: '#667085' },
  ]);

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const txs = [
    { amount: 450, dir: 'Spent', desc: 'SWIGGY*BANGALORE', merch: 'Swiggy', cat: 1, daysAgo: 2, mode: 'UPI' },
    { amount: 1200, dir: 'Spent', desc: 'BLINKIT*GURGAON', merch: 'Blinkit', cat: 2, daysAgo: 5, mode: 'UPI' },
    { amount: 55000, dir: 'Received', desc: 'NEFT*SALARY*TECHCORP', merch: 'TechCorp Salary', cat: 6, daysAgo: 15, mode: 'Bank Transfer' },
    { amount: 2500, dir: 'Spent', desc: 'MYNTRA*FASHION', merch: 'Myntra', cat: 3, daysAgo: 1, mode: 'Card' },
    { amount: 800, dir: 'Spent', desc: 'ZOMATO*GURGAON', merch: 'Zomato', cat: 1, daysAgo: 4, mode: 'UPI' },
    { amount: 1500, dir: 'Spent', desc: 'BESCOM*BILL', merch: 'Electricity Bill', cat: 4, daysAgo: 10, mode: 'UPI' },
    { amount: 300, dir: 'Spent', desc: 'Namma Metro', merch: 'Metro', cat: 5, daysAgo: 3, mode: 'Card' },
    { amount: 150, dir: 'Spent', desc: 'UBER*TRIP', merch: 'Uber', cat: 5, daysAgo: 8, mode: 'UPI' },
    { amount: 5000, dir: 'Transferred', desc: 'UPI*TRANSFER*WIFE', merch: 'Self Transfer', cat: 7, daysAgo: 12, mode: 'UPI', is_transfer: true },
    { amount: 350, dir: 'Spent', desc: 'STARBUCKS*COFFEE', merch: 'Starbucks', cat: 1, daysAgo: 6, mode: 'Card' },
    { amount: 2000, dir: 'Spent', desc: 'AMAZON*PRIME', merch: 'Amazon', cat: 3, daysAgo: 14, mode: 'Card' },
    { amount: 400, dir: 'Spent', desc: 'ZEPTO*QUICK', merch: 'Zepto', cat: 2, daysAgo: 11, mode: 'UPI' },
    { amount: 900, dir: 'Spent', desc: 'UNKNOWN*MERCHANT', merch: 'Unknown', cat: 8, daysAgo: 7, mode: 'UPI' },
  ];

  await db.transactions.bulkAdd(
    txs.map(t => ({
      amount_inr: t.amount,
      direction: t.dir,
      raw_description: t.desc,
      merchant_normalized: t.merch,
      category_id: t.cat,
      timestamp: now - (t.daysAgo * dayMs),
      payment_mode: t.mode,
      is_transfer: t.is_transfer || false,
      exclude_from_budget: false
    }))
  );

  await db.budgets.add({
    month: '2026-09',
    base_budget: 20000
  });
}

export async function importBankTransactions(data) {
  // Map AA structure to our local structure
  const txs = data.map(t => {
    // Basic category heuristic
    let cat = 8; // Other
    if (t.narration.includes('SWIGGY') || t.narration.includes('ZOMATO')) cat = 1;
    else if (t.narration.includes('RELIANCE FRESH') || t.narration.includes('ZEPTO')) cat = 2;
    else if (t.narration.includes('SALARY')) cat = 6;
    
    return {
      amount_inr: t.amount,
      direction: t.type === 'CREDIT' ? 'Received' : 'Spent',
      raw_description: t.narration,
      merchant_normalized: t.narration.split('/')[3] || t.narration,
      category_id: cat,
      timestamp: t.timestamp,
      payment_mode: 'Bank Transfer',
      is_transfer: false,
      exclude_from_budget: false
    };
  });

  await db.transactions.bulkAdd(txs);
}
