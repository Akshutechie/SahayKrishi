import React from 'react';

export default function BrandLogo() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 'bold' }}>
      <img src="/logo.png" alt="SahayKrishi Logo" style={{ height: '1.2em', width: 'auto' }} />
      <span>
        <span style={{ color: 'rgb(50,98,56)' }}>Sahay</span>
        <span style={{ color: 'rgb(197,116,20)' }}>Krishi</span>
      </span>
    </span>
  );
}
