import { useContext, useEffect, useState, useMemo } from 'react';
import { Eye, EyeOff, TrendingUp } from 'lucide-react';
import { PrivacyContext } from '../lib/PrivacyContext';
import { db, seedDemoData } from '../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

export default function Home() {
  const { isPrivacyMode, togglePrivacyMode } = useContext(PrivacyContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    seedDemoData().then(() => setLoading(false));
  }, []);

  const budgetRecord = useLiveQuery(() => db.budgets.toArray());
  const transactions = useLiveQuery(() => 
    db.transactions.orderBy('timestamp').reverse().toArray()
  );
  const categories = useLiveQuery(() => db.categories.toArray());

  const formatMoney = (amount) => {
    if (isPrivacyMode) return '₹••••';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const { spent, currentBudget, remaining, progressPercent, stateColor, topCategories } = useMemo(() => {
    if (!transactions || !budgetRecord || !categories) {
      return { spent: 0, currentBudget: 0, remaining: 0, progressPercent: 0, stateColor: 'bg-healthy', topCategories: [] };
    }
    
    let totalSpent = 0;
    const catMap = {};

    transactions.forEach(tx => {
      if (tx.direction === 'Spent' && !tx.is_transfer && !tx.exclude_from_budget) {
        totalSpent += tx.amount_inr;
        catMap[tx.category_id] = (catMap[tx.category_id] || 0) + tx.amount_inr;
      }
    });

    const budget = budgetRecord[0]?.base_budget || 20000; // Mock derived value + adjustments
    const remain = budget - totalSpent;
    const percent = Math.min((totalSpent / budget) * 100, 100);
    
    let color = 'bg-healthy';
    if (percent >= 70 && percent < 85) color = 'bg-mindful';
    else if (percent >= 85 && percent < 100) color = 'bg-near-limit';
    else if (percent >= 100) color = 'bg-exceeded';

    const sortedCats = Object.keys(catMap)
      .map(catId => {
        const catInfo = categories.find(c => c.id === parseInt(catId));
        return {
          id: catId,
          name: catInfo?.name || 'Unknown',
          amount: catMap[catId]
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);

    return { spent: totalSpent, currentBudget: budget, remaining: remain, progressPercent: percent, stateColor: color, topCategories: sortedCats };
  }, [transactions, budgetRecord, categories]);

  if (loading) return null;

  return (
    <div className="flex-col gap-4">
      <header className="flex justify-between items-center" style={{ marginBottom: '16px' }}>
        <div>
          <h1 className="text-title">September</h1>
          <p className="text-meta">Demo Mode</p>
        </div>
        <button className="btn btn-secondary" onClick={togglePrivacyMode} style={{ padding: '8px', minHeight: 'auto' }}>
          {isPrivacyMode ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </header>

      <section className="card">
        <p className="text-meta">Monthly Budget</p>
        <div className="flex items-center gap-2" style={{ margin: '8px 0' }}>
          <h2 className={`text-money ${isPrivacyMode ? 'privacy-mask' : ''}`}>
            {formatMoney(spent)}
          </h2>
          <span className="text-secondary">spent</span>
        </div>
        
        <div style={{ background: 'var(--border-card)', height: '8px', borderRadius: '4px', overflow: 'hidden', margin: '16px 0' }}>
          <div className={stateColor} style={{ 
            height: '100%', 
            width: `${progressPercent}%`,
            transition: 'width 0.3s ease, background-color 0.3s ease'
          }}></div>
        </div>

        <div className="flex justify-between items-center text-body">
          <span className="text-success">{formatMoney(remaining)} remaining</span>
          <span className="text-meta">of {formatMoney(currentBudget)}</span>
        </div>
      </section>

      {topCategories.length > 0 && (
        <section style={{ marginTop: '24px' }}>
          <h3 className="text-heading" style={{ marginBottom: '12px' }}>Top Categories</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            {topCategories.map(cat => (
              <div key={cat.id} className="card flex-col justify-between" style={{ padding: '12px' }}>
                <span className="text-meta">{cat.name}</span>
                <span className={`text-body ${isPrivacyMode ? 'privacy-mask' : ''}`} style={{ fontWeight: 600, marginTop: '8px' }}>
                  {formatMoney(cat.amount)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={{ marginTop: '24px' }}>
        <h3 className="text-heading" style={{ marginBottom: '12px' }}>Insights</h3>
        <div className="card flex items-center gap-4">
          <TrendingUp className="text-brand" size={24} />
          <p className="text-body">
            {topCategories[0] ? `${topCategories[0].name} is your top expense this month.` : "Keep tracking to see insights."}
          </p>
        </div>
      </section>

      <section style={{ marginTop: '24px' }}>
        <h3 className="text-heading" style={{ marginBottom: '12px' }}>Recent Activity</h3>
        <div className="flex-col gap-2">
          {transactions?.slice(0, 5).map(tx => (
            <div key={tx.id} className="card flex justify-between items-center" style={{ padding: '12px 16px' }}>
              <div>
                <p className="text-body" style={{ fontWeight: 500 }}>{tx.merchant_normalized}</p>
                <p className="text-meta">{new Date(tx.timestamp).toLocaleDateString()}</p>
              </div>
              <span className={`text-body ${isPrivacyMode ? 'privacy-mask' : ''} ${tx.direction === 'Spent' ? '' : 'text-success'}`}>
                {tx.direction === 'Spent' ? '-' : '+'}{formatMoney(tx.amount_inr)}
              </span>
            </div>
          ))}
          {!transactions?.length && <p className="text-meta text-center">No transactions yet.</p>}
        </div>
      </section>
    </div>
  );
}
