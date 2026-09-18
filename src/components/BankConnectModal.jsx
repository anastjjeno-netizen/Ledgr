import { useState } from 'react';
import { X, Smartphone, Building, CheckCircle2 } from 'lucide-react';
import { importBankTransactions } from '../lib/db';

export default function BankConnectModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [consentId, setConsentId] = useState(null);
  const [approvalUrl, setApprovalUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleRequestConsent = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/aa/consent/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, bankId: 'iob' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setConsentId(data.consentId);
      setApprovalUrl(data.url);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyApproval = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/aa/consent/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consentId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      // Once approved, fetch data immediately
      await handleFetchData();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleFetchData = async () => {
    try {
      const res = await fetch('/api/aa/fi/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consentId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      await importBankTransactions(data.transactions);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setStep(1);
    setPhone('');
    setApprovalUrl(null);
    setConsentId(null);
    setError(null);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="text-title" style={{ fontSize: '20px' }}>Connect Bank Account</h3>
          <button onClick={resetAndClose} className="btn" style={{ padding: '4px', border: 'none', background: 'transparent' }}>
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="card" style={{ backgroundColor: 'var(--bg-critical)', borderColor: 'var(--color-critical)' }}>
            <p className="text-body" style={{ color: 'var(--color-critical)' }}>{error}</p>
          </div>
        )}

        {step === 1 && (
          <div className="flex-col gap-4">
            <div className="card flex items-center gap-3">
              <Building className="text-brand" />
              <div>
                <p className="text-body" style={{ fontWeight: 600 }}>Indian Overseas Bank (IOB)</p>
                <p className="text-meta">Account Aggregator Framework</p>
              </div>
            </div>

            <div className="flex-col gap-1">
              <label className="text-meta">Phone Number linked to Bank</label>
              <div className="flex items-center gap-2 input-field">
                <Smartphone size={20} className="text-meta" />
                <input 
                  type="tel" 
                  className="w-full" 
                  style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-body)' }}
                  placeholder="e.g., 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <button 
              className="btn btn-primary w-full" 
              onClick={handleRequestConsent}
              disabled={loading || phone.length < 10}
            >
              {loading ? 'Initiating...' : 'Request Consent OTP'}
            </button>
            <p className="text-meta text-center" style={{ fontSize: '12px' }}>
              By continuing, you agree to share read-only data via the Account Aggregator network.
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="flex-col gap-4">
            <p className="text-body">A consent request has been generated for <b>{phone}</b>.</p>
            <p className="text-meta">Please click the button below to review and approve the request on the official Account Aggregator portal.</p>
            
            <a 
              href={approvalUrl} 
              target="_blank" 
              rel="noreferrer"
              className="btn text-center"
              style={{ backgroundColor: 'var(--brand-tint)', color: 'var(--brand-indigo)', textDecoration: 'none', padding: '12px', fontWeight: 600, borderRadius: '8px' }}
            >
              Open Approval Window
            </a>

            <div style={{ margin: '16px 0', borderBottom: '1px solid var(--border-card)' }}></div>

            <p className="text-meta" style={{ fontSize: '13px' }}>Once you have approved the request in the new window, return here and click below.</p>

            <button 
              className="btn btn-primary w-full" 
              onClick={handleVerifyApproval}
              disabled={loading}
            >
              {loading ? 'Verifying & Fetching...' : 'I have approved it'}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="flex-col items-center gap-4 text-center py-4">
            <CheckCircle2 size={48} className="text-success" />
            <div>
              <p className="text-heading" style={{ marginBottom: '4px' }}>Bank Connected!</p>
              <p className="text-body">Your transactions from Indian Overseas Bank have been successfully imported.</p>
            </div>
            <button className="btn btn-primary w-full" onClick={() => { resetAndClose(); window.location.reload(); }}>
              View Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
