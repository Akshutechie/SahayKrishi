import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Lock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import BrandLogo from '../components/BrandLogo';

export default function FarmerLogin() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { loginFarmer } = useAppContext();
  
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    // Hardcoded OTP requirement
    if (otp !== '1111') {
      setError('Invalid OTP. Please enter 1111.');
      return;
    }

    const status = loginFarmer(phone);
    if (status === 'success') {
      navigate('/farmer');
    } else if (status === 'blocked') {
      setError('Your account has been suspended by the FPO Manager.');
    } else {
      setError('Phone number not registered. (Hint: use 9876543210)');
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

      <div className="glass-card" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 style={{ textAlign: 'center', color: 'var(--farmer-dark)', marginBottom: '0.5rem' }}>
          {t('login_farmer_title')}
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
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>{t('phone_number')}</label>
            <div style={{ position: 'relative' }}>
              <Phone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="tel" 
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '2rem', position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>OTP (1111)</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                placeholder="OTP"
                maxLength="4"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-farmer" style={{ width: '100%', padding: '0.75rem', fontSize: '1.1rem' }}>
            {t('verify_login')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Don't have an account? <span style={{ color: 'var(--farmer-primary)', cursor: 'pointer', fontWeight: '600' }}>Contact your FPO Manager</span>
        </p>
      </div>
    </div>
  );
}
