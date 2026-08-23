import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Lock, User } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import BrandLogo from '../components/BrandLogo';

export default function FPOLogin() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { loginFPO } = useAppContext();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    const result = loginFPO(username, password);
    
    if (result === 'success') {
      navigate('/fpo');
    } else {
      setError('Invalid username or password. Access denied.');
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

      <div className="glass-card" style={{ maxWidth: '400px', width: '100%', borderTop: '4px solid var(--fpo-primary)' }}>
        <div className="flex-center" style={{ marginBottom: '1rem', color: 'var(--fpo-primary)' }}>
          <Users size={48} />
        </div>
        
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
          {t('login_fpo_title')}
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          {t('welcome_back')} <BrandLogo />
        </p>

        {error && (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', border: '1px solid #f87171' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              {t('username')}
            </label>
            <div style={{ position: 'relative' }}>
              <User size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                placeholder="Enter FPO Username"
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              {t('password')}
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="password" 
                placeholder="Enter Password"
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-fpo" style={{ width: '100%', padding: '0.875rem', fontSize: '1.1rem' }}>
            {t('secure_login')}
          </button>
        </form>
      </div>
    </div>
  );
}
