import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sprout, Building2, Users, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import BrandLogo from '../components/BrandLogo';

export default function Login() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="container flex-center" style={{ minHeight: '100vh' }}>
      <div className="glass-card" style={{ maxWidth: '800px', width: '100%', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
          {t('welcome_title_prefix')}<BrandLogo />{t('welcome_title_suffix')}
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem' }}>
          {t('welcome_subtitle')}
        </p>

        <div className="grid-cols-2">
          {/* Farmer Card */}
          <div 
            className="glass-card" 
            style={{ cursor: 'pointer', borderColor: 'var(--farmer-light)' }}
            onClick={() => navigate('/farmer-login')}
          >
            <div className="flex-center" style={{ marginBottom: '1rem', color: 'var(--farmer-primary)' }}>
              <Sprout size={48} />
            </div>
            <h2 style={{ marginBottom: '0.5rem' }}>{t('login_farmer_title')}</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              {t('login_farmer_desc')}
            </p>
            <button className="btn btn-farmer" style={{ width: '100%' }}>{t('login_farmer_title')}</button>
          </div>

          {/* Buyer Card */}
          <div 
            className="glass-card" 
            style={{ cursor: 'pointer', borderColor: 'var(--buyer-light)' }}
            onClick={() => navigate('/buyer-login')}
          >
            <div className="flex-center" style={{ marginBottom: '1rem', color: 'var(--buyer-primary)' }}>
              <Building2 size={48} />
            </div>
            <h2 style={{ marginBottom: '0.5rem' }}>{t('login_buyer_title')}</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              {t('login_buyer_desc')}
            </p>
            <button className="btn btn-buyer" style={{ width: '100%' }}>{t('login_buyer_title')}</button>
          </div>

          {/* FPO Card */}
          <div 
            className="glass-card" 
            style={{ cursor: 'pointer', borderColor: 'var(--fpo-light)', gridColumn: '1 / -1', maxWidth: '400px', margin: '0 auto' }}
            onClick={() => navigate('/fpo-login')}
          >
            <div className="flex-center" style={{ marginBottom: '1rem', color: 'var(--fpo-primary)' }}>
              <Users size={48} />
            </div>
            <h2 style={{ marginBottom: '0.5rem' }}>{t('login_fpo_title')}</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              {t('login_fpo_desc')}
            </p>
            <button className="btn btn-fpo" style={{ width: '100%' }}>{t('login_fpo_title')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
