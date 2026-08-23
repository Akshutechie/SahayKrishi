import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { LanguageProvider } from './context/LanguageContext';
import LanguageSwitcher from './components/LanguageSwitcher';

// Pages
import Login from './pages/Login';
import FarmerLogin from './pages/FarmerLogin';
import BuyerLogin from './pages/BuyerLogin';
import FarmerDashboard from './pages/FarmerDashboard';
import BuyerDashboard from './pages/BuyerDashboard';
import FPODashboard from './pages/FPODashboard';
import FPOLogin from './pages/FPOLogin';

function App() {
  return (
    <AppProvider>
      <LanguageProvider>
        <BrowserRouter>
          <LanguageSwitcher />
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/farmer-login" element={<FarmerLogin />} />
            <Route path="/buyer-login" element={<BuyerLogin />} />
            <Route path="/fpo-login" element={<FPOLogin />} />
            <Route path="/farmer" element={<FarmerDashboard />} />
            <Route path="/buyer" element={<BuyerDashboard />} />
            <Route path="/fpo" element={<FPODashboard />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </AppProvider>
  );
}

export default App;
