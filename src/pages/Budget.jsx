import { useContext, useState, useMemo } from 'react';
import { PrivacyContext } from '../lib/PrivacyContext';
import { db } from '../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { AlertCircle, PlusCircle } from 'lucide-react';

export default function Budget() {
  const { isPrivacyMode } = useContext(PrivacyContext);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('other');

  const budgetRecord = useLiveQuery(() => db.budgets.toArray());
  const adjustmentsRaw = useLiveQuery(() => db.budget_adjustments?.toArray());
  const adjustments = useMemo(() => adjustmentsRaw || [], [adjustmentsRaw]);
  const transactions = useLiveQuery(() => db.transactions.toArray());

  const { spent, currentBudget, remaining, progressPercent, stateColor } = useMemo(() => {
    if (!transactions || !budgetRecord) return { spent: 0, currentBudget: 0, remaining: 0, progressPercent: 0, stateColor: 'bg-healthy' };
    
    let totalSpent = 0;
    transactions.forEach(tx => {
      if (tx.direction === 'Spent' && !tx.is_transfer && !tx.exclude_from_budget) {
        totalSpent += tx.amount_inr;
      }
    });

    const baseBudget = budgetRecord[0]?.base_budget || 20000;
    const totalAdjustments = adjustments.reduce((acc, curr) => acc + curr.amount, 0);
    const budget = baseBudget + totalAdjustments;
    
    const remain = budget - totalSpent;
    const percent = Math.min((totalSpent / budget) * 100, 100);
    
    let color = 'bg-healthy';
    if (percent >= 70 && percent < 85) color = 'bg-mindful';
    else if (percent >= 85 && percent < 100) color = 'bg-near-limit';
    else if (percent >= 100) color = 'bg-exceeded';

    return { spent: totalSpent, currentBudget: budget, remaining: remain, progressPercent: percent, stateColor: color };
  }, [transactions, budgetRecord, adjustments]);

  const formatMoney = (amount) => {
    if (isPrivacyMode) return '₹••••';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustAmount || isNaN(adjustAmount)) return;
    
    await db.budget_adjustments.add({
      month: '2026-09',
      amount: parseFloat(adjustAmount),
      type: 'one-time',
      reason: adjustReason,
      date: Date.now()
    });
    
    setAdjustAmount('');
    setShowAdjustModal(false);
  };

  return (
    <div className="flex-col gap-4 relative">
      <h1 className="text-title">Budget</h1>

      <section className="card">
        <div className="flex justify-between items-center" style={{ marginBottom: '16px' }}>
          <p className="text-meta">Monthly Limit</p>
          <span className={`text-body ${isPrivacyMode ? 'privacy-mask' : ''}`} style={{ fontWeight: 600 }}>
            {formatMoney(currentBudget)}
          </span>
        </div>
        
        <div style={{ background: 'var(--border-card)', height: '12px', borderRadius: '6px', overflow: 'hidden', margin: '16px 0' }}>
          <div className={stateColor} style={{ 
            height: '100%', 
            width: `${progressPercent}%`,
            transition: 'width 0.3s ease, background-color 0.3s ease'
          }}></div>
        </div>

        <div className="flex justify-between items-center text-body" style={{ marginTop: '12px' }}>
          <div>
            <span className={`text-money ${isPrivacyMode ? 'privacy-mask' : ''}`} style={{ fontSize: '24px' }}>
              {formatMoney(spent)}
            </span>
            <span className="text-secondary" style={{ marginLeft: '8px' }}>spent</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className={remaining < 0 ? 'text-danger' : 'text-success'} style={{ fontWeight: 600 }}>
              {formatMoney(Math.abs(remaining))}
            </span>
            <p className="text-meta">{remaining < 0 ? 'over budget' : 'remaining'}</p>
          </div>
        </div>
      </section>

      {progressPercent >= 85 && (
        <div className="card flex items-start gap-3" style={{ backgroundColor: 'var(--brand-tint)', borderColor: 'var(--brand-indigo)' }}>
          <AlertCircle className="text-brand" size={20} style={{ marginTop: '2px', flexShrink: 0 }} />
          <div>
            <h4 className="text-body" style={{ fontWeight: 600 }}>Near your limit</h4>
            <p className="text-meta" style={{ marginTop: '4px', color: 'var(--text-primary)' }}>
              You have used {Math.round(progressPercent)}% of your tracking limit. Would you like to adjust it?
            </p>
            <button 
              className="btn btn-primary" 
              style={{ marginTop: '12px', padding: '8px 16px', minHeight: 'auto', fontSize: '14px' }}
              onClick={() => setShowAdjustModal(true)}
            >
              Adjust Budget
            </button>
          </div>
        </div>
      )}

      <section style={{ marginTop: '24px' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: '12px' }}>
          <h3 className="text-heading">Adjustments History</h3>
          {!showAdjustModal && progressPercent < 85 && (
            <button className="btn text-brand flex items-center gap-1" style={{ padding: 0, minHeight: 'auto' }} onClick={() => setShowAdjustModal(true)}>
              <PlusCircle size={18} /> Add
            </button>
          )}
        </div>
        
        <div className="flex-col gap-2">
          {adjustments.map(adj => (
            <div key={adj.id} className="card flex justify-between items-center" style={{ padding: '12px 16px' }}>
              <div>
                <p className="text-body" style={{ fontWeight: 500, textTransform: 'capitalize' }}>{adj.reason}</p>
                <p className="text-meta">{new Date(adj.date).toLocaleDateString()}</p>
              </div>
              <span className={`text-body text-success ${isPrivacyMode ? 'privacy-mask' : ''}`}>
                +{formatMoney(adj.amount)}
              </span>
            </div>
          ))}
          {adjustments.length === 0 && (
            <p className="text-meta text-center" style={{ padding: '16px 0' }}>No adjustments this month.</p>
          )}
        </div>
      </section>

      {showAdjustModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
            <h3 className="text-heading" style={{ marginBottom: '16px' }}>Adjust Budget</h3>
            <p className="text-meta" style={{ marginBottom: '24px' }}>
              This is a self-approved tracking adjustment. It does not move money or approve a bank transaction.
            </p>
            
            <form onSubmit={handleAdjustSubmit} className="flex-col gap-4">
              <div>
                <label className="text-meta" style={{ display: 'block', marginBottom: '8px' }}>Amount to add (₹)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={adjustAmount}
                  onChange={e => setAdjustAmount(e.target.value)}
                  placeholder="e.g. 2000"
                  required
                />
              </div>
              
              <div>
                <label className="text-meta" style={{ display: 'block', marginBottom: '8px' }}>Reason (Optional)</label>
                <select 
                  className="input-field" 
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                >
                  <option value="emergency">Emergency</option>
                  <option value="travel">Travel</option>
                  <option value="festival">Festival</option>
                  <option value="medical">Medical</option>
                  <option value="family">Family</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex gap-2" style={{ marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary w-full" onClick={() => setShowAdjustModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary w-full">Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
