import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, PackagePlus, Building2, Activity, ShoppingCart, FileText, PlusCircle, Trash2, Ban } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';

export default function FPODashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { currentUser, farmers, buyers, bulkListings, addBulkListing, listings, bids, updateBidStatus, addBuyerDemand, addFarmer, deleteFarmer, addBuyer, deleteBuyer, toggleBlockFarmer, toggleBlockBuyer } = useAppContext();
  
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'fpo') {
      navigate('/fpo-login');
    }
  }, [currentUser, navigate]);

  const [activeTab, setActiveTab] = useState('overview'); // overview | market | transactions
  
  const [showDirectory, setShowDirectory] = useState(false);
  const [showBuyerDirectory, setShowBuyerDirectory] = useState(false);
  
  // Modal State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isDemandModalOpen, setIsDemandModalOpen] = useState(false);
  
  // Form State
  const [newBulk, setNewBulk] = useState({ crop: '', quantity: '', contributors: '', price: '' });
  const [newDemand, setNewDemand] = useState({ buyerId: '', crop: '', quantity: '', price: '' });
  const [newFarmer, setNewFarmer] = useState({ name: '', location: '', phone: '' });
  const [newBuyer, setNewBuyer] = useState({ name: '', type: 'APEDA Exporter', location: '' });

  // Filtered Data
  const activeDemands = buyers.filter(b => b.requiredCrop);
  const completedSales = bids.filter(b => b.status === 'Accepted (Sold)');
  const pendingBids = bids.filter(b => b.status === 'Pending' || b.status === 'Rejected');

  // --- HANDLERS ---
  const handleAddFarmer = (e) => {
    e.preventDefault();
    if (!newFarmer.name || !newFarmer.phone) return;
    addFarmer({
      id: `F0${farmers.length + 10}`,
      name: newFarmer.name,
      location: newFarmer.location,
      phone: newFarmer.phone,
      primaryCrops: ''
    });
    setNewFarmer({ name: '', location: '', phone: '' });
  };

  const handleAddBuyer = (e) => {
    e.preventDefault();
    if (!newBuyer.name || !newBuyer.type) return;
    addBuyer({
      id: `B0${buyers.length + 10}`,
      name: newBuyer.name,
      type: newBuyer.type,
      location: newBuyer.location
    });
    setNewBuyer({ name: '', type: 'APEDA Exporter', location: '' });
  };
  const handleCreateBulkListing = (e) => {
    e.preventDefault();
    if (!newBulk.crop || !newBulk.quantity || !newBulk.contributors || !newBulk.price) return;
    
    addBulkListing({
      id: `BLK00${Math.random().toString(36).substr(2, 6)}`,
      crop: newBulk.crop,
      quantity: newBulk.quantity,
      contributors: newBulk.contributors,
      price: newBulk.price,
      status: 'Awaiting Bids'
    });
    
    setNewBulk({ crop: '', quantity: '', contributors: '', price: '' });
    setIsBulkModalOpen(false);
    alert('Bulk listing successfully created and posted to APEDA Exporters!');
  };

  const handleCreateDemand = (e) => {
    e.preventDefault();
    const buyer = buyers.find(b => b.id === newDemand.buyerId);
    if (!buyer) return alert("Please select a valid corporate buyer.");

    addBuyerDemand({
      id: `D00${Math.floor(Math.random() * 10000)}`,
      name: buyer.name,
      type: buyer.type,
      location: buyer.location,
      requiredCrop: newDemand.crop,
      quantityRequired: newDemand.quantity,
      targetPrice: newDemand.price
    });
    
    setIsDemandModalOpen(false);
    setNewDemand({ buyerId: '', crop: '', quantity: '', price: '' });
    alert('Corporate demand successfully posted to the global market!');
  };

  const confirmAction = (actionName, callback) => {
    if (window.confirm(`Are you sure you want to ${actionName} this user?`)) {
      if (window.confirm(`This action is critical. Please confirm again that you want to ${actionName} this user.`)) {
        callback();
      }
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      <button 
        className="btn" 
        style={{ marginBottom: '1.5rem', padding: '0.5rem', background: 'transparent' }}
        onClick={() => navigate('/')}
      >
        <ArrowLeft size={20} /> Back to Login
      </button>

      <div className="dashboard-header">
        <h1 style={{ color: 'var(--fpo-dark)' }}>{t('fpo_hub')}</h1>
        <p>Global Marketplace Overview & Management</p>
      </div>

      {/* --- TAB NAVIGATION --- */}
      <div className="tab-nav-container">
        <button 
          onClick={() => setActiveTab('overview')}
          style={{ 
            background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold',
            color: activeTab === 'overview' ? 'var(--fpo-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'overview' ? '3px solid var(--fpo-primary)' : 'none',
            paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}
        >
          <Activity size={20} /> {t('directories')}
        </button>
        <button 
          onClick={() => setActiveTab('market')}
          style={{ 
            background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold',
            color: activeTab === 'market' ? '#16a34a' : 'var(--text-secondary)',
            borderBottom: activeTab === 'market' ? '3px solid #16a34a' : 'none',
            paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}
        >
          <ShoppingCart size={20} /> {t('live_market_fpo')}
        </button>
        <button 
          onClick={() => setActiveTab('transactions')}
          style={{ 
            background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold',
            color: activeTab === 'transactions' ? '#ea580c' : 'var(--text-secondary)',
            borderBottom: activeTab === 'transactions' ? '3px solid #ea580c' : 'none',
            paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}
        >
          <FileText size={20} /> {t('transactions')}
        </button>
      </div>

      {/* =========================================
          TAB 1: OVERVIEW & DIRECTORIES
          ========================================= */}
      {activeTab === 'overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="glass-card flex-center" style={{ flexDirection: 'column', gap: '1rem', border: '1px solid var(--fpo-light)' }}>
              <Users size={32} color="var(--fpo-primary)" />
              <h3 style={{ margin: 0 }}>{t('farmer_directory')}</h3>
              <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Manage profiles for {farmers.length} offline farmers in your network.</p>
              <button className="btn btn-fpo" style={{ width: '100%' }} onClick={() => setShowDirectory(true)}>View Members</button>
            </div>

            <div className="glass-card flex-center" style={{ flexDirection: 'column', gap: '1rem', border: '1px solid var(--fpo-light)' }}>
              <Building2 size={32} color="#0ea5e9" />
              <h3 style={{ margin: 0 }}>{t('buyer_directory')}</h3>
              <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>View {buyers.length} verified APEDA exporters and buyers.</p>
              <button className="btn" style={{ width: '100%', background: '#0284c7', color: 'white' }} onClick={() => setShowBuyerDirectory(true)}>View Buyers</button>
            </div>

            <div className="glass-card flex-center" style={{ flexDirection: 'column', gap: '1rem', border: '1px solid var(--fpo-light)' }}>
              <PackagePlus size={32} color="var(--fpo-primary)" />
              <h3 style={{ margin: 0 }}>{t('bulk_aggregator')}</h3>
              <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Pool small yields together to attract APEDA Exporters.</p>
              <button className="btn btn-fpo" style={{ width: '100%', background: 'var(--fpo-dark)' }} onClick={() => setIsBulkModalOpen(true)}>Create Bulk Listing</button>
            </div>
          </div>

          <h2 style={{ marginBottom: '1rem' }}>{t('active_bulk')} (Waiting for Buyers)</h2>
          <div className="glass-card table-responsive" style={{ padding: '0', marginBottom: '2rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--fpo-light)', borderBottom: '1px solid #d8b4fe', color: 'var(--fpo-dark)' }}>
                  <th style={{ padding: '1rem' }}>{t('crop')}</th>
                  <th style={{ padding: '1rem' }}>Aggregated Qty</th>
                  <th style={{ padding: '1rem' }}>Contributing Farmers</th>
                  <th style={{ padding: '1rem' }}>{t('status')}</th>
                </tr>
              </thead>
              <tbody>
                {bulkListings.map(listing => (
                  <tr key={listing.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '1rem', fontWeight: '500' }}>{listing.crop}</td>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{listing.quantity} kg</td>
                    <td style={{ padding: '1rem', color: '#16a34a', fontWeight: '600' }}>₹{listing.price} / kg</td>
                    <td style={{ padding: '1rem' }}>{listing.contributors} Farmers</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '0.25rem 0.75rem', background: '#fef3c7', color: '#b45309', borderRadius: '999px', fontSize: '0.85rem', fontWeight: '600' }}>
                        {listing.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {bulkListings.length === 0 && (
                  <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center' }}>No bulk listings active.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* =========================================
          TAB 2: LIVE MARKET
          ========================================= */}
      {activeTab === 'market' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ color: '#0369a1', margin: 0 }}>Global Corporate Demands</h2>
            <button className="btn" style={{ background: '#0284c7', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setIsDemandModalOpen(true)}>
              <PlusCircle size={18} /> Post New Demand
            </button>
          </div>
          <div className="glass-card table-responsive" style={{ padding: '0', marginBottom: '2rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#e0f2fe', borderBottom: '1px solid #7dd3fc', color: '#0369a1' }}>
                  <th style={{ padding: '1rem' }}>Buyer Name</th>
                  <th style={{ padding: '1rem' }}>Required Crop</th>
                  <th style={{ padding: '1rem' }}>Quantity Needed</th>
                  <th style={{ padding: '1rem' }}>Target Price</th>
                  <th style={{ padding: '1rem' }}>Location</th>
                </tr>
              </thead>
              <tbody>
                {activeDemands.map((buyer, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '1rem', fontWeight: '500' }}>{buyer.name}</td>
                    <td style={{ padding: '1rem' }}>{buyer.requiredCrop}</td>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{buyer.quantityRequired} kg</td>
                    <td style={{ padding: '1rem', color: '#16a34a', fontWeight: '600' }}>₹{buyer.targetPrice} / kg</td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{buyer.location}</td>
                  </tr>
                ))}
                {activeDemands.length === 0 && (
                  <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center' }}>No active demands at this time.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <h2 style={{ marginBottom: '1rem', color: '#16a34a' }}>Global Farmer Listings</h2>
          <div className="glass-card table-responsive" style={{ padding: '0', marginBottom: '2rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#dcfce7', borderBottom: '1px solid #86efac', color: '#166534' }}>
                  <th style={{ padding: '1rem' }}>Farmer Name</th>
                  <th style={{ padding: '1rem' }}>{t('crop')}</th>
                  <th style={{ padding: '1rem' }}>Quantity Available</th>
                  <th style={{ padding: '1rem' }}>Asking Price</th>
                  <th style={{ padding: '1rem' }}>{t('status')}</th>
                </tr>
              </thead>
              <tbody>
                {listings.map(listing => (
                  <tr key={listing.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '1rem', fontWeight: '500' }}>{listing.farmerName}</td>
                    <td style={{ padding: '1rem' }}>{listing.crop}</td>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{listing.quantity} kg</td>
                    <td style={{ padding: '1rem', color: 'var(--farmer-primary)', fontWeight: '600' }}>₹{listing.price} / kg</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '0.25rem 0.5rem', background: listing.status === 'Active' ? '#fef08a' : '#bbf7d0', color: listing.status === 'Active' ? '#854d0e' : '#166534', borderRadius: '4px', fontSize: '0.85rem', fontWeight: '600' }}>
                        {listing.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {listings.length === 0 && (
                  <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center' }}>No active farmer listings.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* =========================================
          TAB 3: CONTRACTS & TRANSACTIONS
          ========================================= */}
      {activeTab === 'transactions' && (
        <>
          <h2 style={{ marginBottom: '1rem', color: '#16a34a' }}>Completed Sales (Platform GMV)</h2>
          <div className="glass-card table-responsive" style={{ padding: '0', marginBottom: '2rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#dcfce7', borderBottom: '1px solid #86efac', color: '#166534' }}>
                  <th style={{ padding: '1rem' }}>Txn ID</th>
                  <th style={{ padding: '1rem' }}>Seller (Farmer)</th>
                  <th style={{ padding: '1rem' }}>Buyer (Corporate)</th>
                  <th style={{ padding: '1rem' }}>Crop & Quantity</th>
                  <th style={{ padding: '1rem' }}>Final Price</th>
                  <th style={{ padding: '1rem' }}>Total Value</th>
                </tr>
              </thead>
              <tbody>
                {completedSales.map(sale => (
                  <tr key={sale.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{sale.id}</td>
                    <td style={{ padding: '1rem', fontWeight: '500' }}>{sale.farmerName}</td>
                    <td style={{ padding: '1rem', fontWeight: '500' }}>{sale.buyer}</td>
                    <td style={{ padding: '1rem' }}>{sale.quantity}kg {sale.crop}</td>
                    <td style={{ padding: '1rem' }}>₹{sale.bidPrice}/kg</td>
                    <td style={{ padding: '1rem', fontWeight: 'bold', color: '#16a34a' }}>₹{((Number(sale.quantity) || 0) * (Number(sale.bidPrice) || 0)).toLocaleString()}</td>
                  </tr>
                ))}
                {completedSales.length === 0 && (
                  <tr><td colSpan="6" style={{ padding: '1rem', textAlign: 'center' }}>No completed sales yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <h2 style={{ marginBottom: '1rem', color: '#ea580c' }}>Live Bids & Negotiations</h2>
          <div className="glass-card table-responsive" style={{ padding: '0', marginBottom: '2rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#ffedd5', borderBottom: '1px solid #fdba74', color: '#9a3412' }}>
                  <th style={{ padding: '1rem' }}>Bid ID</th>
                  <th style={{ padding: '1rem' }}>From (Buyer)</th>
                  <th style={{ padding: '1rem' }}>To (Farmer)</th>
                  <th style={{ padding: '1rem' }}>Crop Offer</th>
                  <th style={{ padding: '1rem' }}>Bid Price</th>
                  <th style={{ padding: '1rem' }}>{t('status')} / Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingBids.map(bid => (
                  <tr key={bid.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{bid.id}</td>
                    <td style={{ padding: '1rem', fontWeight: '500' }}>{bid.buyer}</td>
                    <td style={{ padding: '1rem' }}>{bid.farmerName}</td>
                    <td style={{ padding: '1rem' }}>{bid.quantity}kg {bid.crop}</td>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>₹{bid.bidPrice}/kg</td>
                    <td style={{ padding: '1rem' }}>
                      {bid.farmerId === 'FPO' && bid.status === 'Pending' ? (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn" style={{ background: '#16a34a', color: 'white', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => updateBidStatus(bid.id, 'Accepted (Sold)')}>Accept</button>
                          <button className="btn" style={{ background: '#dc2626', color: 'white', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => updateBidStatus(bid.id, 'Rejected')}>Reject</button>
                        </div>
                      ) : (
                        <span style={{ 
                          padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: '600',
                          background: bid.status === 'Pending' ? '#fef08a' : '#fecaca',
                          color: bid.status === 'Pending' ? '#854d0e' : '#991b1b'
                        }}>
                          {bid.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {pendingBids.length === 0 && (
                  <tr><td colSpan="6" style={{ padding: '1rem', textAlign: 'center' }}>No active negotiations.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* =========================================
          MODALS (Hidden unless active)
          ========================================= */}

      {/* Farmer Directory Modal */}
      {showDirectory && (
        <div className="modal-overlay" onClick={() => setShowDirectory(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: 'var(--fpo-dark)' }}>Farmer Directory</h2>
              <button className="btn" style={{ padding: '0.5rem', background: '#f1f5f9', color: 'var(--text-primary)' }} onClick={() => setShowDirectory(false)}>Close</button>
            </div>
            
            {/* Add Farmer Form */}
            <form onSubmit={handleAddFarmer} className="stack-mobile" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'var(--fpo-light)', padding: '1rem', borderRadius: '8px' }}>
              <input type="text" placeholder="Name" style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} value={newFarmer.name} onChange={e => setNewFarmer({...newFarmer, name: e.target.value})} required />
              <input type="text" placeholder="Location" style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} value={newFarmer.location} onChange={e => setNewFarmer({...newFarmer, location: e.target.value})} required />
              <input type="tel" placeholder="Phone Number" style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} value={newFarmer.phone} onChange={e => setNewFarmer({...newFarmer, phone: e.target.value})} required />
              <button type="submit" className="btn btn-fpo" style={{ padding: '0.5rem 1rem' }}><PlusCircle size={18} /> Add</button>
            </form>

            <div className="glass-card table-responsive" style={{ padding: '0', boxShadow: 'none', border: '1px solid #e2e8f0', maxHeight: '400px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--fpo-light)', zIndex: 1 }}>
                  <tr style={{ borderBottom: '1px solid #d8b4fe', color: 'var(--fpo-dark)' }}>
                    <th style={{ padding: '1rem' }}>Farmer ID</th>
                    <th style={{ padding: '1rem' }}>Name</th>
                    <th style={{ padding: '1rem' }}>Location</th>
                    <th style={{ padding: '1rem' }}>Phone</th>
                    <th style={{ padding: '1rem' }}>{t('status')}</th>
                    <th style={{ padding: '1rem' }}>{t('action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...farmers].sort((a, b) => a.id.localeCompare(b.id)).map(farmer => (
                    <tr key={farmer.id} style={{ borderBottom: '1px solid #e2e8f0', opacity: farmer.is_blocked ? 0.6 : 1 }}>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{farmer.id}</td>
                      <td style={{ padding: '1rem', fontWeight: '500' }}>{farmer.name}</td>
                      <td style={{ padding: '1rem' }}>{farmer.location}</td>
                      <td style={{ padding: '1rem' }}>{farmer.phone}</td>
                      <td style={{ padding: '1rem' }}>
                        {farmer.is_blocked ? (
                          <span style={{ color: '#dc2626', fontWeight: '600', fontSize: '0.85rem' }}>Blocked</span>
                        ) : (
                          <span style={{ color: '#16a34a', fontWeight: '600', fontSize: '0.85rem' }}>Active</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <button onClick={() => confirmAction(farmer.is_blocked ? 'unblock' : 'block', () => toggleBlockFarmer(farmer.id, farmer.is_blocked))} style={{ background: 'none', border: 'none', color: farmer.is_blocked ? '#16a34a' : '#ea580c', cursor: 'pointer', padding: '0.25rem', marginRight: '0.5rem' }} title={farmer.is_blocked ? "Unblock" : "Block"}>
                          <Ban size={18} />
                        </button>
                        <button onClick={() => confirmAction('delete', () => deleteFarmer(farmer.id))} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '0.25rem' }} title="Delete">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Buyer Directory Modal */}
      {showBuyerDirectory && (
        <div className="modal-overlay" onClick={() => setShowBuyerDirectory(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: '#0369a1' }}>Verified Buyer Directory</h2>
              <button className="btn" style={{ padding: '0.5rem', background: '#f1f5f9', color: 'var(--text-primary)' }} onClick={() => setShowBuyerDirectory(false)}>Close</button>
            </div>
            
            {/* Add Buyer Form */}
            <form onSubmit={handleAddBuyer} className="stack-mobile" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: '#e0f2fe', padding: '1rem', borderRadius: '8px' }}>
              <input type="text" placeholder="Company Name" style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} value={newBuyer.name} onChange={e => setNewBuyer({...newBuyer, name: e.target.value})} required />
              <select style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} value={newBuyer.type} onChange={e => setNewBuyer({...newBuyer, type: e.target.value})} required>
                <option value="APEDA Exporter">APEDA Exporter</option>
                <option value="Wholesaler">Wholesaler</option>
                <option value="Processor">Processor</option>
                <option value="Retail Chain">Retail Chain</option>
              </select>
              <input type="text" placeholder="Location" style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} value={newBuyer.location} onChange={e => setNewBuyer({...newBuyer, location: e.target.value})} required />
              <button type="submit" className="btn" style={{ background: '#0284c7', color: 'white', padding: '0.5rem 1rem' }}><PlusCircle size={18} /> Add</button>
            </form>

            <div className="glass-card table-responsive" style={{ padding: '0', boxShadow: 'none', border: '1px solid #e2e8f0', maxHeight: '400px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#e0f2fe', zIndex: 1 }}>
                  <tr style={{ borderBottom: '1px solid #7dd3fc', color: '#0369a1' }}>
                    <th style={{ padding: '1rem' }}>Buyer ID</th>
                    <th style={{ padding: '1rem' }}>Company Name</th>
                    <th style={{ padding: '1rem' }}>Type</th>
                    <th style={{ padding: '1rem' }}>Location</th>
                    <th style={{ padding: '1rem' }}>{t('status')}</th>
                    <th style={{ padding: '1rem' }}>{t('action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...buyers].sort((a, b) => a.id.localeCompare(b.id)).map(buyer => (
                    <tr key={buyer.id} style={{ borderBottom: '1px solid #e2e8f0', opacity: buyer.is_blocked ? 0.6 : 1 }}>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{buyer.id}</td>
                      <td style={{ padding: '1rem', fontWeight: '500' }}>{buyer.name}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ padding: '0.25rem 0.5rem', background: '#f1f5f9', borderRadius: '4px', fontSize: '0.85rem' }}>{buyer.type}</span>
                      </td>
                      <td style={{ padding: '1rem' }}>{buyer.location}</td>
                      <td style={{ padding: '1rem' }}>
                        {buyer.is_blocked ? (
                          <span style={{ color: '#dc2626', fontWeight: '600', fontSize: '0.85rem' }}>Blocked</span>
                        ) : (
                          <span style={{ color: '#16a34a', fontWeight: '600', fontSize: '0.85rem' }}>Active</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <button onClick={() => confirmAction(buyer.is_blocked ? 'unblock' : 'block', () => toggleBlockBuyer(buyer.id, buyer.is_blocked))} style={{ background: 'none', border: 'none', color: buyer.is_blocked ? '#16a34a' : '#ea580c', cursor: 'pointer', padding: '0.25rem', marginRight: '0.5rem' }} title={buyer.is_blocked ? "Unblock" : "Block"}>
                          <Ban size={18} />
                        </button>
                        <button onClick={() => confirmAction('delete', () => deleteBuyer(buyer.id))} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '0.25rem' }} title="Delete">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create Bulk Listing Modal */}
      {isBulkModalOpen && (
        <div className="modal-overlay" onClick={() => setIsBulkModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--fpo-dark)' }}>Create Bulk Listing</h2>
            <form onSubmit={handleCreateBulkListing}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Crop Name & Grade</label>
                <input type="text" placeholder="e.g., Onion (Grade A)" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} value={newBulk.crop} onChange={e => setNewBulk({...newBulk, crop: e.target.value})} required />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Total Aggregated Quantity (kg)</label>
                <input type="number" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} value={newBulk.quantity} onChange={e => setNewBulk({...newBulk, quantity: e.target.value})} required />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Number of Contributing Farmers</label>
                <input type="number" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} value={newBulk.contributors} onChange={e => setNewBulk({...newBulk, contributors: e.target.value})} required />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Asking Price (₹/kg)</label>
                <input type="number" placeholder="e.g. 35" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} value={newBulk.price} onChange={e => setNewBulk({...newBulk, price: e.target.value})} required />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => setIsBulkModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-fpo">Post Bulk Listing</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post New Demand Modal */}
      {isDemandModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDemandModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1.5rem', color: '#0369a1' }}>Post Corporate Demand</h2>
            <form onSubmit={handleCreateDemand}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Select Buyer Entity</label>
                <select style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} value={newDemand.buyerId} onChange={e => setNewDemand({...newDemand, buyerId: e.target.value})} required>
                  <option value="">-- Choose Buyer --</option>
                  {Array.from(new Map(buyers.filter(b => !b.requiredCrop).map(b => [b.name, b])).values()).map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.type})</option>
                  ))}
                </select>
                <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>Only showing buyers without active demands.</small>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Required Crop</label>
                <input type="text" placeholder="e.g., Soybean" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} value={newDemand.crop} onChange={e => setNewDemand({...newDemand, crop: e.target.value})} required />
              </div>
              <div className="stack-mobile" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Quantity (kg)</label>
                  <input type="number" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} value={newDemand.quantity} onChange={e => setNewDemand({...newDemand, quantity: e.target.value})} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Target Price (₹)</label>
                  <input type="number" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} value={newDemand.price} onChange={e => setNewDemand({...newDemand, price: e.target.value})} required />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => setIsDemandModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn" style={{ background: '#0284c7', color: 'white' }}>Publish Demand</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
