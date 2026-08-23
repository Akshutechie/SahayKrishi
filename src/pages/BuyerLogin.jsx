import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Lock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import BrandLogo from '../components/BrandLogo';

export default function BuyerLogin() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { loginBuyer } = useAppContext();
  
  const [buyerId, setBuyerId] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    // Hardcoded OTP requirement
    if (otp !== '2222') {
      setError('Invalid OTP. Please enter 2222.');
      return;
    }

    const status = loginBuyer(buyerId);
    if (status === 'success') {
      navigate('/buyer');
    } else if (status === 'blocked') {
      setError('Your corporate account has been suspended by the FPO Manager.');
    } else {
      setError('Buyer ID not registered. (Hint: use B001)');
    }
  };

  return (
    <div className="container flex-center" style={{ minHeight: '100vh', flexDirection: 'column' }}>
      
      <div style={{ width: '100%', maxWidth: '400px', marginBottom: '1rem' }}>
        <button 
          className="btn" 
          style={{ padding: '0.5rem', background: 'transparent' }}
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={20} /> {t('back_to_roles')}
        </button>
      </div>

      <div className="glass-card" style={{ maxWidth: '400px', width: '100%', borderTop: '4px solid #0ea5e9' }}>
        <div className="flex-center" style={{ marginBottom: '1rem', color: '#0ea5e9' }}>
          <Building2 size={40} />
        </div>
        <h2 style={{ textAlign: 'center', color: 'var(--buyer-dark)', marginBottom: '0.5rem' }}>
          {t('login_buyer_title')}
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          {t('welcome_back')} <BrandLogo />
        </p>

        {error && (
          <div style={{ background: '#fecaca', color: '#991b1b', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>{t('buyer_id')}</label>
            <div style={{ position: 'relative' }}>
              <Building2 size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                placeholder="e.g. B001"
                value={buyerId}
                onChange={(e) => setBuyerId(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '2rem', position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>{t('otp_hint')}</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                placeholder="Enter 4-digit OTP"
                maxLength="4"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-buyer" style={{ width: '100%', padding: '0.75rem', fontSize: '1.1rem' }}>
            {t('verify_login')}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {t('fpo_contact').split('? ')[0]}? <span style={{ fontWeight: '500', color: 'var(--buyer-primary)' }}>{t('fpo_contact').split('? ')[1]}</span>
        </div>

      </div>
    </div>
  );
}
