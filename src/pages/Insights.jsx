import { useMemo, useContext } from 'react';
import { PrivacyContext } from '../lib/PrivacyContext';
import { db } from '../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const formatMoney = (amount, isPrivacyMode) => {
  if (isPrivacyMode) return '₹••••';
  return `₹${amount.toLocaleString('en-IN')}`;
};

const CustomTooltip = ({ active, payload, isPrivacyMode }) => {
  if (active && payload && payload.length) {
    return (
      <div className="card" style={{ padding: '8px 12px' }}>
        <p className="text-body" style={{ fontWeight: 600 }}>{payload[0].name}</p>
        <p className={`text-money ${isPrivacyMode ? 'privacy-mask' : ''}`} style={{ fontSize: '18px' }}>
          {formatMoney(payload[0].value, isPrivacyMode)}
        </p>
      </div>
    );
  }
  return null;
};

export default function Insights() {
  const { isPrivacyMode } = useContext(PrivacyContext);
  
  const transactions = useLiveQuery(() => db.transactions.toArray());
  const categories = useLiveQuery(() => db.categories.toArray());

  const categoryData = useMemo(() => {
    if (!transactions || !categories) return [];
    const catMap = {};
    
    transactions.forEach(tx => {
      if (tx.direction === 'Spent' && !tx.is_transfer && !tx.exclude_from_budget) {
        catMap[tx.category_id] = (catMap[tx.category_id] || 0) + tx.amount_inr;
      }
    });

    return Object.keys(catMap)
      .map(catId => {
        const catInfo = categories.find(c => c.id === parseInt(catId));
        return {
          name: catInfo?.name || 'Unknown',
          value: catMap[catId],
          color: catInfo?.color || '#98A2B3'
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [transactions, categories]);

  return (
    <div className="flex-col gap-4">
      <h1 className="text-title">Insights</h1>

      <section className="card" style={{ paddingBottom: '24px' }}>
        <h3 className="text-heading" style={{ marginBottom: '16px' }}>Spending by Category</h3>
        
        {categoryData.length > 0 ? (
          <>
            <div style={{ height: '240px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip isPrivacyMode={isPrivacyMode} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex-col gap-2" style={{ marginTop: '16px' }}>
              {categoryData.map(cat => (
                <div key={cat.name} className="flex justify-between items-center text-body">
                  <div className="flex items-center gap-2">
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: cat.color }}></div>
                    <span>{cat.name}</span>
                  </div>
                  <span className={isPrivacyMode ? 'privacy-mask' : ''} style={{ fontWeight: 500 }}>
                    {formatMoney(cat.value, isPrivacyMode)}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-meta text-center" style={{ padding: '32px 0' }}>Not enough data to show insights.</p>
        )}
      </section>

      <section style={{ marginTop: '16px' }}>
        <h3 className="text-heading" style={{ marginBottom: '12px' }}>Largest Merchants</h3>
        <div className="flex-col gap-2">
          {transactions?.filter(t => t.direction === 'Spent' && !t.is_transfer)
            .sort((a, b) => b.amount_inr - a.amount_inr)
            .slice(0, 3)
            .map(tx => (
              <div key={tx.id} className="card flex justify-between items-center" style={{ padding: '12px 16px' }}>
                <div>
                  <p className="text-body" style={{ fontWeight: 500 }}>{tx.merchant_normalized}</p>
                  <p className="text-meta">{new Date(tx.timestamp).toLocaleDateString()}</p>
                </div>
                <span className={`text-body ${isPrivacyMode ? 'privacy-mask' : ''}`}>
                  {formatMoney(tx.amount_inr, isPrivacyMode)}
                </span>
              </div>
            ))
          }
        </div>
      </section>
    </div>
  );
}
