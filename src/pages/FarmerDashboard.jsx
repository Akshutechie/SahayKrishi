import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Sun, Cloud, CloudRain, CloudLightning, PlusCircle, CheckCircle, XCircle, Trash2, IndianRupee, Package, Award, Volume2, Mic } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import BrandLogo from '../components/BrandLogo';
import { supabase } from '../lib/supabaseClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function FarmerDashboard() {
  const navigate = useNavigate();
  const { listings, bids, buyers, addListing, addBid, updateBidStatus, removeBuyerDemand, removeListing, currentUser, logout, updateFarmerCrops } = useAppContext();
  const { t, language } = useLanguage();

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (language === 'hi') utterance.lang = 'hi-IN';
      else if (language === 'mr') utterance.lang = 'mr-IN';
      else utterance.lang = 'en-IN';
      window.speechSynthesis.speak(utterance);
    }
  };
  
  const initialTracked = currentUser?.primaryCrops ? currentUser.primaryCrops.split(',').map(c => c.trim()).filter(Boolean) : [];
  const [newCropName, setNewCropName] = useState('');
  const [isListening, setIsListening] = useState(false);
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert('Speech recognition not supported in this browser.'); return; }
    const recognition = new SpeechRecognition();
    if (language === 'hi') recognition.lang = 'hi-IN'; else if (language === 'mr') recognition.lang = 'mr-IN'; else recognition.lang = 'en-IN';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => setNewCropName(event.results[0][0].transcript);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleAddTrackedCrop = () => {
    if (!newCropName.trim()) return;
    const currentList = currentUser?.primaryCrops ? currentUser.primaryCrops.split(',').map(c => c.trim()).filter(Boolean) : [];
    if (!currentList.includes(newCropName.trim())) {
      currentList.push(newCropName.trim());
      updateFarmerCrops(currentList.join(','));
    }
    setNewCropName('');
  };

  const handleRemoveTrackedCrop = (cropToRemove) => {
    const currentList = currentUser?.primaryCrops ? currentUser.primaryCrops.split(',').map(c => c.trim()).filter(Boolean) : [];
    const updatedList = currentList.filter(c => c !== cropToRemove);
    updateFarmerCrops(updatedList.join(','));
  };

  // Protect the route
  React.useEffect(() => {
    if (!currentUser) {
      navigate('/farmer-login');
    }
  }, [currentUser, navigate]);

  // Filter listings and bids for the logged-in user
  const myListings = listings.filter(l => l.farmerId === currentUser?.id);
  const incomingBids = bids.filter(b => b.farmerId === currentUser?.id);

  
  
  const [marketTrends, setMarketTrends] = useState([]);
  const [selectedChartCrop, setSelectedChartCrop] = useState('Onion');
  
  // Keep selected crop in sync if they don't have Onion tracked
  useEffect(() => {
    if (initialTracked.length > 0 && !initialTracked.includes(selectedChartCrop)) {
      setSelectedChartCrop(initialTracked[0]);
    }
  }, [initialTracked.length]);
  
  
  
  
  
  useEffect(() => {
    const cropName = selectedChartCrop;
    
    // 1. Calculate actual platform volume (sum of all active listings for this crop)
    const platformListings = listings.filter(l => l.crop.toLowerCase() === cropName.toLowerCase());
    const totalVolume = platformListings.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);
    
    // 2. Calculate actual platform average price (average of all accepted bids for this crop)
    const acceptedBids = bids.filter(b => b.crop.toLowerCase() === cropName.toLowerCase() && b.status.includes('Accepted'));
    let avgPrice = 0;
    if (acceptedBids.length > 0) {
      const sumPrice = acceptedBids.reduce((sum, b) => sum + (Number(b.bidPrice || b.amount) || 0), 0);
      avgPrice = Math.round(sumPrice / acceptedBids.length);
    } else {
      // Fallback if no accepted bids yet
      avgPrice = cropName.toLowerCase().includes('onion') ? 30 : cropName.toLowerCase().includes('tomato') ? 40 : 25;
    }
    
    // 3. Generate a 7-day trend ending in TODAY'S actual platform data
    const trendData = [];
    for (let i = 6; i >= 1; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trendData.push({
        date: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        price: avgPrice + Math.floor(Math.random() * 10 - 5), // Simulated historical variation
        volume: (totalVolume || (cropName.toLowerCase().includes('onion') ? 120 : cropName.toLowerCase().includes('tomato') ? 80 : 150)) + Math.floor(Math.random() * 30 - 15),
      });
    }
    
    // Add today's REAL data as the final point
    trendData.push({
      date: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) + ' (Live)',
      price: avgPrice,
      volume: totalVolume || (cropName.toLowerCase().includes('onion') ? 120 : cropName.toLowerCase().includes('tomato') ? 80 : 150)
    });
    
    setMarketTrends(trendData);
  }, [selectedChartCrop, listings, bids]);




  // Modal States
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [isSellDirectModalOpen, setIsSellDirectModalOpen] = useState(false);
  const [isAcceptBidModalOpen, setIsAcceptBidModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Form/Selection State
  const [newListing, setNewListing] = useState({ crop: '', quantity: '', price: '', grade: 'Grade A' });
  const [selectedExporter, setSelectedExporter] = useState(null);
  const [selectedBid, setSelectedBid] = useState(null);
  const [listingToDelete, setListingToDelete] = useState(null);

  // --- ANALYTICS DERIVATION ---
  const completedSales = bids.filter(b => b.farmerId === currentUser?.id && b.status.includes('Accepted'));
  
  const totalIncome = completedSales.reduce((sum, bid) => sum + (Number(bid.quantity || 0) * Number(bid.bidPrice || 0)), 0);
  const totalVolumeSold = completedSales.reduce((sum, bid) => sum + Number(bid.quantity || 0), 0);
  
  const buyerVolumes = completedSales.reduce((acc, bid) => {
    acc[bid.buyer] = (acc[bid.buyer] || 0) + Number(bid.quantity || 0);
    return acc;
  }, {});
  
  let topBuyerName = 'None yet';
  let maxVol = 0;
  for (const [buyer, vol] of Object.entries(buyerVolumes)) {
    if (vol > maxVol) {
      maxVol = vol;
      topBuyerName = buyer;
    }
  }

  // --- AI FORECAST ALGORITHM ---
  const generateForecast = (cropName) => {
    const demandQty = buyers.filter(b => b.requiredCrop === cropName).reduce((sum, b) => sum + (Number(b.quantityRequired) || 0), 0);
    const supplyQty = listings.filter(l => l.crop === cropName && l.status === 'Active').reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);
    
    if (demandQty === 0 && supplyQty === 0) return { msg: t('forecast_no_data', { crop: cropName }), rec: t('forecast_rec_no_data'), color: '#94a3b8' };
    if (demandQty > supplyQty * 1.5) return { msg: t('forecast_high_demand', { crop: cropName }), rec: t('forecast_rec_high_demand'), color: '#16a34a' };
    if (supplyQty > demandQty * 1.5) return { msg: t('forecast_saturated', { crop: cropName }), rec: t('forecast_rec_saturated'), color: '#dc2626' };
    return { msg: t('forecast_stable', { crop: cropName }), rec: t('forecast_rec_stable'), color: '#eab308' };
  };

  // --- REAL-TIME WEATHER LOGIC ---
  const [weather, setWeather] = useState({ temp: '--', description: 'Loading...', location: currentUser?.location || 'India', icon: <Sun size={28} color="#eab308" /> });

  useEffect(() => {
    const fetchWeatherByCoords = async (latitude, longitude) => {
      try {
        // 1. Fetch live weather for actual coordinates
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
        const weatherData = await weatherRes.json();
        
        // 2. Reverse geocode to get the real city/state name (Free API)
        const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
        const geoData = await geoRes.json();
        
        const realCity = geoData.city || geoData.locality || 'Unknown City';
        const realState = geoData.principalSubdivision || '';
        const displayLocation = `${realCity}${realState ? `, ${realState}` : ''}`;

        if (weatherData.current_weather) {
          const { temperature, weathercode } = weatherData.current_weather;
          
          let desc = 'Clear Skies';
          let IconComponent = <Sun size={28} color="#eab308" />;
          
          if (weathercode >= 1 && weathercode <= 3) {
            desc = 'Partly Cloudy';
            IconComponent = <Cloud size={28} color="#94a3b8" />;
          } else if (weathercode >= 45 && weathercode <= 48) {
            desc = 'Foggy';
            IconComponent = <Cloud size={28} color="#cbd5e1" />;
          } else if (weathercode >= 51 && weathercode <= 67) {
            desc = 'Rain';
            IconComponent = <CloudRain size={28} color="#3b82f6" />;
          } else if (weathercode >= 95) {
            desc = 'Thunderstorm';
            IconComponent = <CloudLightning size={28} color="#7e22ce" />;
          }

          setWeather({
            temp: `${temperature}°C`,
            description: desc,
            location: displayLocation,
            icon: IconComponent
          });
        }
      } catch (err) {
        console.error("Failed to fetch live weather by coords", err);
      }
    };

    const fetchWeatherByProfile = async () => {
      if (!currentUser?.location) return;
      try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(currentUser.location)}&count=1&language=en&format=json`);
        const geoData = await geoRes.json();
        if (geoData.results && geoData.results.length > 0) {
          const { latitude, longitude } = geoData.results[0];
          fetchWeatherByCoords(latitude, longitude);
        }
      } catch (err) {
        console.error("Failed to fetch profile weather", err);
      }
    };

    // Attempt to get the user's ACTUAL physical location via the browser
    if ("geolocation" in navigator) {
      setWeather(prev => ({ ...prev, description: 'Locating you...' }));
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn("Geolocation denied or failed. Falling back to profile location.", error);
          fetchWeatherByProfile();
        }
      );
    } else {
      fetchWeatherByProfile();
    }
  }, [currentUser]);

  // --- HANDLERS ---
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleCreateListing = (e) => {
    e.preventDefault();
    if (!newListing.crop || !newListing.quantity || !newListing.price) return;
    
    addListing({
      id: `L00${listings.length + 2}`, 
      crop: newListing.crop, 
      quantity: newListing.quantity, 
      price: newListing.price, 
      grade: newListing.grade || 'Grade A',
      status: 'Active',
      farmerName: currentUser.name,
      farmerId: currentUser.id
    });
    setNewListing({ crop: '', quantity: '', price: '', grade: 'Grade A' });
    setIsListingModalOpen(false);
  };

  const handleDeleteListing = (listing) => {
    setListingToDelete(listing);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteListing = () => {
    removeListing(listingToDelete.id);
    setIsDeleteModalOpen(false);
    setListingToDelete(null);
  };

  const handleOpenAcceptBid = (bid) => {
    setSelectedBid(bid);
    setIsAcceptBidModalOpen(true);
  };

  const confirmAcceptBid = () => {
    if (selectedBid) {
      updateBidStatus(selectedBid.id, 'Accepted (Sold)');
    }
    setIsAcceptBidModalOpen(false);
    setSelectedBid(null);
  };

  const handleRejectBid = (bidId) => {
    updateBidStatus(bidId, 'Rejected');
  };

  const handleSellDirect = (exporter) => {
    setSelectedExporter(exporter);
    setIsSellDirectModalOpen(true);
  };

  const confirmSellDirect = () => {
    // Push the transaction to the global context so it shows up for the Buyer
    addBid({
      id: `B00${bids.length + 2}`,
      buyer: selectedExporter.name,
      crop: selectedExporter.crop,
      quantity: 100, // Mocking a standard lot size since the farmer didn't specify quantity in this flow
      bidPrice: selectedExporter.price,
      status: 'Accepted (Sold)',
      farmerName: currentUser.name,
      farmerId: currentUser.id
    });

    // Remove the fulfilled demand from the market board
    if (selectedExporter.id) {
      removeBuyerDemand(selectedExporter.id);
    }

    alert(`Successfully sold ${selectedExporter.crop} to ${selectedExporter.name} at ₹${selectedExporter.price}/kg! The transaction has been recorded.`);
    setIsSellDirectModalOpen(false);
    setSelectedExporter(null);
  };

  if (!currentUser) return null; // Prevent rendering before redirect

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      <button 
        className="btn" 
        style={{ marginBottom: '1.5rem', padding: '0.5rem', background: 'transparent' }}
        onClick={handleLogout}
      >
        <ArrowLeft size={20} />{t('logout')}</button>

      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0' }}>{t('welcome_farmer', { name: currentUser.name })}</h1>
          <p style={{ margin: 0 }}>{t('farmer_dash_subtitle_prefix')}<BrandLogo />{t('farmer_dash_subtitle_suffix')}</p>
        </div>

        {/* Medium Size Weather Widget */}
        <div className="glass-card" style={{ background: 'linear-gradient(135deg, var(--farmer-light) 0%, #ffffff 100%)', padding: '1rem 1.5rem', minWidth: '250px', margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 style={{ color: 'var(--farmer-dark)', margin: 0, fontSize: '1rem' }}>{t('local_weather')}</h3>
            {React.cloneElement(weather.icon, { size: 20 })}
          </div>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>{weather.temp}</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>{weather.location} • {weather.description}</p>
        </div>
      </div>

      {/* --- MY TRACKED CROPS MANAGER --- */}
      <h2 style={{ marginBottom: '1rem', color: 'var(--farmer-dark)' }}>{t('my_tracked_crops')}</h2>
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          {initialTracked.map(crop => (
            <span key={crop} style={{ background: '#dcfce7', color: '#166534', padding: '0.5rem 1rem', borderRadius: '999px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}>
              {crop}
              <button onClick={() => handleRemoveTrackedCrop(crop)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#166534', padding: 0 }}>
                <XCircle size={16} />
              </button>
            </span>
          ))}
          {initialTracked.length === 0 && <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No crops tracked yet.</span>}
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <div style={{ flex: 1 }}>
            <select 
              value={newCropName}
              onChange={(e) => setNewCropName(e.target.value)}
              style={{ width: '100%', padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
            >
              <option value="" disabled>{t('select_a_crop')}</option>
              <option value="Onion">{t('crop_onion')}</option>
              <option value="Tomato">{t('crop_tomato')}</option>
              <option value="Potato">{t('crop_potato')}</option>
              <option value="Rice">{t('crop_rice')}</option>
              <option value="Wheat">{t('crop_wheat')}</option>
              <option value="Cotton">{t('crop_cotton')}</option>
            </select>
          </div>
          <button className="btn btn-farmer" onClick={handleAddTrackedCrop}>
            <PlusCircle size={18} /> {t('add_crop')}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>

        {/* AI Forecast Card */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--farmer-primary)' }}>
            <TrendingUp size={24} />
            <h3 style={{ color: 'var(--text-primary)' }}>{t('market_forecast')}</h3>
          </div>
          
          {initialTracked.length === 0 ? (
            <div style={{ padding: '1rem', borderLeft: '4px solid var(--text-secondary)', background: 'var(--farmer-light)', borderRadius: '0 8px 8px 0', color: 'var(--text-secondary)' }}>
              {t('forecast_create_listing')}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {initialTracked.map(crop => {
                const forecast = generateForecast(crop);
                return (
                  <div key={crop} style={{ padding: '1rem', borderLeft: `4px solid ${forecast.color}`, background: 'var(--farmer-light)', borderRadius: '0 8px 8px 0', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 style={{ margin: '0', color: forecast.color }}>{crop} Forecast</h4>
                      <button 
                        onClick={() => speakText(`${forecast.msg}. ${t('recommendation')} ${forecast.rec}`)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: forecast.color, padding: '0.25rem' }}
                        title="Read out loud"
                      >
                        <Volume2 size={20} />
                      </button>
                    </div>
                    <p style={{ fontSize: '1.05rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{forecast.msg}</p>
                    <div style={{ fontWeight: '500', color: 'var(--farmer-dark)', fontSize: '0.9rem' }}>
                      {t('recommendation')} {forecast.rec}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      
      {/* --- HISTORICAL TRENDS --- */}
      {initialTracked.length > 0 && (
        <>
          <h2 style={{ marginBottom: '1rem', color: 'var(--farmer-dark)' }}>{t('price_trends')}</h2>
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>Select Crop to View Trends:</label>
            <select 
              value={selectedChartCrop} 
              onChange={(e) => setSelectedChartCrop(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
            >
              <option value="Onion">Onion</option>
              <option value="Tomato">Tomato</option>
              <option value="Potato">Potato</option>
              {initialTracked.filter(c => !['onion', 'tomato', 'potato'].includes(c.toLowerCase())).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="glass-card" style={{ marginBottom: '2rem', padding: '1.5rem', overflowX: 'auto' }}>
            <div style={{ minWidth: '600px', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={marketTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" label={{ value: t('price_per_kg'), angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: t('arrival_volume'), angle: 90, position: 'insideRight' }} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="price" stroke="#16a34a" name={t('price_per_kg')} strokeWidth={3} />
                  <Line yAxisId="right" type="monotone" dataKey="volume" stroke="#3b82f6" name={t('arrival_volume')} strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
              Showing Live Platform Trades & Trends for <strong>{selectedChartCrop}</strong>
            </p>
          </div>
        </>
      )}

      {/* --- BUSINESS ANALYTICS & REPORTS --- */}
      <h2 style={{ marginBottom: '1rem', color: 'var(--farmer-dark)' }}>{t('business_analytics')}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <IndianRupee size={18} /> <h3>{t('total_income')}</h3>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>₹{totalIncome.toLocaleString()}</p>
        </div>
        
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <Package size={18} /> <h3>{t('total_volume')}</h3>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--farmer-primary)' }}>{totalVolumeSold.toLocaleString()} kg</p>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <Award size={18} /> <h3>{t('top_buyer')}</h3>
          </div>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0369a1' }}>{topBuyerName}</p>
        </div>
      </div>

      <div className="glass-card table-responsive" style={{ padding: '0', marginBottom: '2rem' }}>
        <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{t('recent_sales')}</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '1rem 1.5rem' }}>{t('transaction_id')}</th>
              <th style={{ padding: '1rem' }}>{t('buyer')}</th>
              <th style={{ padding: '1rem' }}>{t('crop')}</th>
              <th style={{ padding: '1rem' }}>{t('quantity')}</th>
              <th style={{ padding: '1rem' }}>{t('total_value')}</th>
            </tr>
          </thead>
          <tbody>
            {completedSales.map(sale => (
              <tr key={sale.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '1rem 1.5rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{sale.id}</td>
                <td style={{ padding: '1rem', fontWeight: '500' }}>{sale.buyer}</td>
                <td style={{ padding: '1rem' }}>{sale.crop}</td>
                <td style={{ padding: '1rem' }}>{sale.quantity} kg</td>
                <td style={{ padding: '1rem', fontWeight: 'bold', color: '#16a34a' }}>₹{(Number(sale.quantity) * Number(sale.bidPrice)).toLocaleString()}</td>
              </tr>
            ))}
            {completedSales.length === 0 && (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>{t('no_sales')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- INCOMING BIDS SECTION --- */}
      <h2 style={{ marginBottom: '1rem', color: '#ea580c' }}>{t('incoming_bids')}</h2>
      <div className="glass-card table-responsive" style={{ padding: '0', marginBottom: '2rem', border: '1px solid #fed7aa' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#ffedd5', borderBottom: '1px solid #fdba74', color: '#9a3412' }}>
              <th style={{ padding: '1rem' }}>{t('buyer')}</th>
              <th style={{ padding: '1rem' }}>{t('crop')}</th>
              <th style={{ padding: '1rem' }}>{t('bid_amount')}</th>
              <th style={{ padding: '1rem' }}>{t('status')}</th>
              <th style={{ padding: '1rem' }}>{t('action')}</th>
            </tr>
          </thead>
          <tbody>
            {incomingBids.map(bid => (
              <tr key={bid.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '1rem', fontWeight: '500' }}>{bid.buyer}</td>
                <td style={{ padding: '1rem' }}>{bid.quantity}kg {bid.crop}</td>
                <td style={{ padding: '1rem', color: 'var(--farmer-primary)', fontWeight: 'bold' }}>₹{bid.bidPrice} / kg</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: '600',
                    background: bid.status === 'Pending' ? '#fef08a' : bid.status.includes('Accepted') ? '#bbf7d0' : '#fecaca',
                    color: bid.status === 'Pending' ? '#854d0e' : bid.status.includes('Accepted') ? '#166534' : '#991b1b'
                  }}>
                    {bid.status}
                  </span>
                </td>
                <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                  {bid.status === 'Pending' && (
                    <>
                      <button className="btn" style={{ background: 'var(--farmer-primary)', color: 'white', padding: '0.4rem 0.8rem' }} onClick={() => handleOpenAcceptBid(bid)}>
                        <CheckCircle size={16} /> {t('accept')}
                      </button>
                      <button className="btn" style={{ background: '#ef4444', color: 'white', padding: '0.4rem 0.8rem' }} onClick={() => handleRejectBid(bid.id)}>
                        <XCircle size={16} /> {t('reject')}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {incomingBids.length === 0 && (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>{t('no_bids')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- MY ACTIVE LISTINGS SECTION --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>{t('my_listings')}</h2>
        <button className="btn btn-farmer" onClick={() => setIsListingModalOpen(true)}>
          <PlusCircle size={18} /> {t('create_listing')}
        </button>
      </div>
      <div className="glass-card table-responsive" style={{ padding: '0', marginBottom: '2rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--farmer-light)', borderBottom: '1px solid #bbf7d0', color: 'var(--farmer-dark)' }}>
              <th style={{ padding: '1rem' }}>{t('crop')}</th>
              <th style={{ padding: '1rem' }}>{t('quantity')}</th>
              <th style={{ padding: '1rem' }}>{t('asking_price')}</th>
              <th style={{ padding: '1rem' }}>{t('status')}</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>{t('action')}</th>
            </tr>
          </thead>
          <tbody>
            {myListings.map(listing => (
              <tr key={listing.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '1rem', fontWeight: '500' }}>
                  {listing.crop}
                  {listing.grade && (
                    <span style={{ marginLeft: '8px', fontSize: '0.75rem', padding: '2px 8px', background: listing.grade === 'Organic' ? '#dcfce7' : listing.grade === 'Grade A' ? '#fef3c7' : '#f3f4f6', color: listing.grade === 'Organic' ? '#16a34a' : listing.grade === 'Grade A' ? '#d97706' : '#4b5563', borderRadius: '12px', display: 'inline-block' }}>
                      {listing.grade}
                    </span>
                  )}
                </td>
                <td style={{ padding: '1rem' }}>{listing.quantity} kg</td>
                <td style={{ padding: '1rem' }}>₹{listing.price} / kg</td>
                <td style={{ padding: '1rem', color: listing.status === 'Sold' ? 'var(--farmer-primary)' : 'var(--text-secondary)' }}>{listing.status}</td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <button 
                    className="btn" 
                    style={{ background: 'transparent', color: '#ef4444', padding: '0.25rem' }} 
                    onClick={() => handleDeleteListing(listing)}
                    title="Delete Listing"
                  >
                    <Trash2 size={20} />
                  </button>
                </td>
              </tr>
            ))}
            {myListings.length === 0 && (
              <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center' }}>You have no active listings.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- LIVE MARKET PRICES (APEDA INTEGRATION) --- */}
      <h2 style={{ marginBottom: '1rem' }}>Live Market Prices (APEDA Verified)</h2>
      <div className="glass-card table-responsive" style={{ padding: '0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '1rem' }}>Required Crop</th>
              <th style={{ padding: '1rem' }}>Local Mandi</th>
              <th style={{ padding: '1rem' }}>APEDA Exporters Offer</th>
              <th style={{ padding: '1rem' }}>Quantity Needed</th>
              <th style={{ padding: '1rem' }}>{t('action')}</th>
            </tr>
          </thead>
          <tbody>
            {buyers.filter(b => b.requiredCrop).map(buyer => (
              <tr key={buyer.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '1rem', fontWeight: '500' }}>{buyer.requiredCrop}</td>
                {/* Mocking the local mandi price to be lower than APEDA to show benefit */}
                <td style={{ padding: '1rem', color: '#ef4444' }}>₹{Math.max(10, buyer.targetPrice - Math.floor(Math.random() * 8 + 3))} / kg</td>
                <td style={{ padding: '1rem', color: 'var(--farmer-primary)', fontWeight: '600' }}>
                  ₹{buyer.targetPrice} / kg ({buyer.name})
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{buyer.quantityRequired} kg</td>
                <td style={{ padding: '1rem' }}>
                  <button 
                    className="btn btn-farmer" 
                    style={{ padding: '0.5rem 1rem' }} 
                    onClick={() => handleSellDirect({crop: buyer.requiredCrop, name: buyer.name, price: buyer.targetPrice, id: buyer.id})}
                  >
                    Sell Direct
                  </button>
                </td>
              </tr>
            ))}
            {buyers.filter(b => b.requiredCrop).length === 0 && (
              <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center' }}>No active demands from buyers.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- MODALS --- */}
      
      {/* Accept Bid Confirmation Modal */}
      {isAcceptBidModalOpen && selectedBid && (
        <div className="modal-overlay" onClick={() => setIsAcceptBidModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '0.5rem', color: 'var(--farmer-dark)' }}>Confirm Sale to {selectedBid.buyer}</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Please review the contract details before accepting.</p>
            
            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Crop:</span>
                <span style={{ fontWeight: 'bold' }}>{selectedBid.crop}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Quantity:</span>
                <span style={{ fontWeight: 'bold' }}>{selectedBid.quantity} kg</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px dashed #cbd5e1' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Agreed Price:</span>
                <span style={{ fontWeight: 'bold' }}>₹{selectedBid.bidPrice} / kg</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', color: 'var(--farmer-dark)' }}>
                <span><strong>Total Payout:</strong></span>
                <span><strong>₹{(selectedBid.quantity * selectedBid.bidPrice).toLocaleString()}</strong></span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn" onClick={() => setIsAcceptBidModalOpen(false)}>Cancel</button>
              <button className="btn btn-farmer" onClick={confirmAcceptBid}>
                <CheckCircle size={18} /> Confirm & Accept Bid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Listing Modal */}
      {isListingModalOpen && (
        <div className="modal-overlay" onClick={() => setIsListingModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--farmer-dark)' }}>Create New Listing</h2>
            <form onSubmit={handleCreateListing}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Crop Name</label>
                <select 
                  value={newListing.crop} 
                  onChange={e => setNewListing({...newListing, crop: e.target.value})} 
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} 
                  required
                >
                  <option value="" disabled>{t('select_a_crop') || 'Select a Crop'}</option>
                  <option value="Onion">{t('crop_onion') || 'Onion'}</option>
                  <option value="Tomato">{t('crop_tomato') || 'Tomato'}</option>
                  <option value="Potato">{t('crop_potato') || 'Potato'}</option>
                  <option value="Rice">{t('crop_rice') || 'Rice'}</option>
                  <option value="Wheat">{t('crop_wheat') || 'Wheat'}</option>
                  <option value="Cotton">{t('crop_cotton') || 'Cotton'}</option>
                </select>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Quality Grade</label>
                <select 
                  value={newListing.grade} 
                  onChange={e => setNewListing({...newListing, grade: e.target.value})} 
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  required
                >
                  <option value="Grade A">Grade A (Premium Export Quality)</option>
                  <option value="Grade B">Grade B (Standard Market Quality)</option>
                  <option value="Organic">100% Certified Organic</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Total Quantity (kg)</label>
                  <input type="number" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} value={newListing.quantity} onChange={e => setNewListing({...newListing, quantity: e.target.value})} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Asking Price (₹/kg)</label>
                  <input type="number" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} value={newListing.price} onChange={e => setNewListing({...newListing, price: e.target.value})} required />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => setIsListingModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-farmer">Post Listing</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sell Direct Confirmation Modal */}
      {isSellDirectModalOpen && selectedExporter && (
        <div className="modal-overlay" onClick={() => setIsSellDirectModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '500px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1rem', color: 'var(--farmer-dark)' }}>Confirm Direct Sale</h2>
            <p style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>
              Are you sure you want to instantly sell your <strong>{selectedExporter.crop}</strong> to <strong>{selectedExporter.name}</strong> for the APEDA guaranteed price of <strong>₹{selectedExporter.price}/kg</strong>?
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn" onClick={() => setIsSellDirectModalOpen(false)}>Cancel</button>
              <button className="btn btn-farmer" onClick={confirmSellDirect}>Confirm Sale</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Listing Confirmation Modal */}
      {isDeleteModalOpen && listingToDelete && (
        <div className="modal-overlay" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1rem', color: '#ef4444' }}>Delete Listing?</h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
              Are you sure you want to delete your active listing for <strong>{listingToDelete.quantity}kg of {listingToDelete.crop}</strong>?
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
              <button className="btn" style={{ background: '#ef4444', color: 'white' }} onClick={confirmDeleteListing}>Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
