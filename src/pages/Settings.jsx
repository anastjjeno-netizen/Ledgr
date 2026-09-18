import { useContext, useState, useEffect } from 'react';
import { PrivacyContext } from '../lib/PrivacyContext';
import { db, seedDemoData } from '../lib/db';
import BankConnectModal from '../components/BankConnectModal';
import { Building } from 'lucide-react';

export default function Settings() {
  const { isPrivacyMode, togglePrivacyMode } = useContext(PrivacyContext);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });
  const [showBankModal, setShowBankModal] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleResetData = async () => {
    if (confirm('Are you sure you want to reset all demo data? This cannot be undone.')) {
      await db.transactions.clear();
      await db.categories.clear();
      await db.budgets.clear();
      await db.budget_adjustments.clear();
      await seedDemoData();
      alert('Demo data reset successfully.');
      window.location.reload();
    }
  };

  return (
    <div className="flex-col gap-4">
      <h1 className="text-title">Settings</h1>

      <section className="card flex-col gap-4">
        <h3 className="text-heading">Appearance & Privacy</h3>
        
        <div className="flex justify-between items-center">
          <div>
            <p className="text-body" style={{ fontWeight: 500 }}>Privacy Mode</p>
            <p className="text-meta">Hide exact amounts by default</p>
          </div>
          <button 
            className={`btn ${isPrivacyMode ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 16px', minHeight: 'auto' }}
            onClick={togglePrivacyMode}
          >
            {isPrivacyMode ? 'On' : 'Off'}
          </button>
        </div>

        <div className="flex justify-between items-center" style={{ paddingTop: '16px', borderTop: '1px solid var(--border-card)' }}>
          <div>
            <p className="text-body" style={{ fontWeight: 500 }}>Theme</p>
            <p className="text-meta">Choose your app theme</p>
          </div>
          <select 
            className="input-field" 
            style={{ width: 'auto', padding: '6px 12px', minHeight: 'auto' }}
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </section>

      <section className="card flex-col gap-4" style={{ marginTop: '8px' }}>
        <h3 className="text-heading">Integrations</h3>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Building className="text-meta" />
            <div>
              <p className="text-body" style={{ fontWeight: 500 }}>Connect Bank Account</p>
              <p className="text-meta">Sync transactions via Account Aggregator</p>
            </div>
          </div>
          <button 
            className="btn btn-primary"
            style={{ padding: '6px 16px', minHeight: 'auto' }}
            onClick={() => setShowBankModal(true)}
          >
            Connect
          </button>
        </div>
      </section>

      <section className="card flex-col gap-4" style={{ marginTop: '8px' }}>
        <h3 className="text-heading text-danger">Data Management</h3>
        <p className="text-meta">Demo Mode relies on seeded fictional data.</p>
        
        <button 
          className="btn btn-secondary w-full text-danger" 
          style={{ borderColor: 'var(--color-danger)' }}
          onClick={handleResetData}
        >
          Reset Demo Data
        </button>
      </section>

      <BankConnectModal isOpen={showBankModal} onClose={() => setShowBankModal(false)} />
    </div>
  );
}
