import { useContext, useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { PrivacyContext } from '../lib/PrivacyContext';
import { db } from '../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

export default function Transactions() {
  const { isPrivacyMode } = useContext(PrivacyContext);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All'); // All, Spent, Received, Transfers

  const transactions = useLiveQuery(() => 
    db.transactions.orderBy('timestamp').reverse().toArray()
  );

  const formatMoney = (amount) => {
    if (isPrivacyMode) return '₹••••';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const filteredTransactions = transactions?.filter(tx => {
    const matchesSearch = tx.merchant_normalized.toLowerCase().includes(search.toLowerCase());
    let matchesFilter = true;
    if (filter === 'Spent') matchesFilter = tx.direction === 'Spent' && !tx.is_transfer;
    if (filter === 'Received') matchesFilter = tx.direction === 'Received' && !tx.is_transfer;
    if (filter === 'Transfers') matchesFilter = tx.is_transfer;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex-col gap-4">
      <h1 className="text-title">History</h1>
      
      <div className="flex items-center gap-2">
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} className="text-secondary" style={{ position: 'absolute', left: '12px', top: '13px' }} />
          <input 
            type="text" 
            placeholder="Search merchants..." 
            className="input-field" 
            style={{ paddingLeft: '36px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-secondary">
          <Filter size={20} />
        </button>
      </div>

      <div className="flex gap-2" style={{ overflowX: 'auto', paddingBottom: '8px' }}>
        {['All', 'Spent', 'Received', 'Transfers'].map(f => (
          <button 
            key={f}
            className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 12px', minHeight: 'auto', fontSize: '14px', borderRadius: '16px' }}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="flex-col gap-2">
        {filteredTransactions?.map(tx => (
          <div key={tx.id} className="card flex justify-between items-center" style={{ padding: '12px 16px', cursor: 'pointer' }}>
            <div>
              <p className="text-body" style={{ fontWeight: 500 }}>{tx.merchant_normalized}</p>
              <p className="text-meta">{new Date(tx.timestamp).toLocaleDateString()} • {tx.payment_mode}</p>
            </div>
            <span className={`text-body ${isPrivacyMode ? 'privacy-mask' : ''} ${tx.direction === 'Spent' && !tx.is_transfer ? '' : (tx.is_transfer ? 'text-secondary' : 'text-success')}`}>
              {tx.direction === 'Spent' && !tx.is_transfer ? '-' : (tx.is_transfer ? '' : '+')}{formatMoney(tx.amount_inr)}
            </span>
          </div>
        ))}
        {filteredTransactions?.length === 0 && (
          <p className="text-meta text-center" style={{ marginTop: '24px' }}>No transactions found.</p>
        )}
      </div>
    </div>
  );
}
