import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, PlusCircle, IndianRupee, Package, Award } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';

export default function BuyerDashboard() {
  const navigate = useNavigate();
  const { listings, bulkListings, farmers, bids, buyers, addBuyerDemand, addBid, updateBidStatus, currentUser, logout } = useAppContext();
  const { t } = useLanguage();

  // Protect the route
  React.useEffect(() => {
    if (!currentUser || currentUser.role !== 'buyer') {
      navigate('/buyer-login');
    }
  }, [currentUser, navigate]);
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [isDemandModalOpen, setIsDemandModalOpen] = useState(false);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  
  // Form/Selection State
  const [newDemand, setNewDemand] = useState({ crop: '', quantity: '', targetPrice: '' });
  const [selectedListing, setSelectedListing] = useState(null);
  const [bidOffer, setBidOffer] = useState({ price: '', quantity: '' });

  const filteredListings = listings.filter(l => 
    l.status === 'Active' && (
      l.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      l.crop.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Filter bids and demands for this buyer dynamically
  const mySentBids = bids.filter(b => b.buyer === currentUser?.name);
  const myDemands = buyers.filter(b => b.name === currentUser?.name && b.requiredCrop);

  // --- ANALYTICS DERIVATION ---
  const completedPurchases = mySentBids.filter(bid => bid.status.includes('Accepted'));
  
  const totalExpenditure = completedPurchases.reduce((sum, bid) => sum + (Number(bid.quantity || 0) * Number(bid.bidPrice || 0)), 0);
  const totalProcured = completedPurchases.reduce((sum, bid) => sum + Number(bid.quantity || 0), 0);
  
  const supplierVolumes = completedPurchases.reduce((acc, bid) => {
    acc[bid.farmerName] = (acc[bid.farmerName] || 0) + Number(bid.quantity || 0);
    return acc;
  }, {});
  
  let topSupplierName = 'None yet';
  let maxVol = 0;
  for (const [farmer, vol] of Object.entries(supplierVolumes)) {
    if (vol > maxVol) {
      maxVol = vol;
      topSupplierName = farmer;
    }
  }

  // --- HANDLERS ---
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  const getMarketPulse = (cropName) => {
    if (!cropName) return null;
    const safeCrop = cropName.toLowerCase();
    const activeListings = listings.filter(l => l.crop.toLowerCase() === safeCrop && l.status === 'Active');
    
    
    const totalQty = activeListings.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);
                     
    if (totalQty === 0) return { qty: 0, avgPrice: 0 };
    
    const sumPrice = activeListings.reduce((sum, l) => sum + ((Number(l.price) || 0) * (Number(l.quantity) || 0)), 0);
    const avgPrice = Math.round(sumPrice / totalQty);
    
    return { qty: totalQty, avgPrice };
  };
  const pulse = getMarketPulse(newDemand.crop);

  const handlePostDemand = (e) => {
    e.preventDefault();
    if (!newDemand.crop || !newDemand.quantity || !newDemand.targetPrice) return;
    
    addBuyerDemand({
      id: `B00${Math.floor(Math.random() * 1000)}`,
      name: currentUser.name,
      type: currentUser.type,
      requiredCrop: newDemand.crop,
      quantityRequired: newDemand.quantity,
      targetPrice: newDemand.targetPrice,
      location: currentUser.location
    });
    
    setNewDemand({ crop: '', quantity: '', targetPrice: '' });
    setIsDemandModalOpen(false);
    alert('Demand posted successfully! FPOs and Farmers can now see your requirement.');
  };

  const handleOpenBid = (listing) => {
    setSelectedListing(listing);
    setBidOffer({ price: listing.price, quantity: listing.quantity }); // default to asking price and max quantity
    setIsBidModalOpen(true);
  };

  const handleSendBid = (e) => {
    e.preventDefault();
    if (!selectedListing || !bidOffer.price || !bidOffer.quantity) return;

    if (Number(bidOffer.quantity) > Number(selectedListing.quantity)) {
        alert(`You cannot bid for more than the available ${selectedListing.quantity}kg!`);
        return;
    }

    addBid({
      id: `B00${Math.random().toString(36).substr(2, 6)}`,
      buyer: currentUser.name,
      crop: selectedListing.crop,
      quantity: bidOffer.quantity,
      bidPrice: bidOffer.price,
      status: 'Pending',
      farmerName: selectedListing.farmerName,
      farmerId: selectedListing.farmerId,
      listingId: selectedListing.id
    });

    setIsBidModalOpen(false);
    setSelectedListing(null);
    setBidOffer({ price: '', quantity: '' });
    alert(`Bid of ₹${bidOffer.price}/kg for ${bidOffer.quantity}kg sent to ${selectedListing.farmerName}!`);
  };

  if (!currentUser || currentUser.role !== 'buyer') return null;

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      <button 
        className="btn" 
        style={{ marginBottom: '1.5rem', padding: '0.5rem', background: 'transparent' }}
        onClick={handleLogout}
      >
        <ArrowLeft size={20} />{t('logout')}</button>

      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ color: 'var(--buyer-dark)' }}>{t('procurement_dash')}</h1>
          <p>{currentUser.name} ({currentUser.id})</p>
        </div>
        <button className="btn btn-buyer" onClick={() => setIsDemandModalOpen(true)}>
          <PlusCircle size={20} /> {t('post_demand')}
        </button>
      </div>

      {/* Analytics Cards */}
      {/* --- PROCUREMENT ANALYTICS & REPORTS --- */}
      <h2 style={{ marginBottom: '1rem', color: 'var(--buyer-dark)' }}>Procurement Analytics & Reports</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <IndianRupee size={18} /> <h3>Total Expenditure</h3>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>₹{totalExpenditure.toLocaleString()}</p>
        </div>
        
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <Package size={18} /> <h3>Volume Procured</h3>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--buyer-primary)' }}>{totalProcured.toLocaleString()} kg</p>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <Award size={18} /> <h3>Top Supplier</h3>
          </div>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0369a1' }}>{topSupplierName}</p>
        </div>
      </div>

      <div className="glass-card table-responsive" style={{ padding: '0', marginBottom: '2rem' }}>
        <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Recent Procurement History</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '1rem 1.5rem' }}>Transaction ID</th>
              <th style={{ padding: '1rem' }}>Supplier (Farmer)</th>
              <th style={{ padding: '1rem' }}>{t('crop')}</th>
              <th style={{ padding: '1rem' }}>{t('quantity')}</th>
              <th style={{ padding: '1rem' }}>Total Cost</th>
            </tr>
          </thead>
          <tbody>
            {completedPurchases.map(sale => (
              <tr key={sale.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '1rem 1.5rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{sale.id}</td>
                <td style={{ padding: '1rem', fontWeight: '500' }}>{sale.farmerName}</td>
                <td style={{ padding: '1rem' }}>{sale.crop}</td>
                <td style={{ padding: '1rem' }}>{sale.quantity} kg</td>
                <td style={{ padding: '1rem', fontWeight: 'bold', color: '#dc2626' }}>₹{((Number(sale.quantity) || 0) * (Number(sale.bidPrice) || 0)).toLocaleString()}</td>
              </tr>
            ))}
            {completedPurchases.length === 0 && (
              <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No completed purchases yet. Your successful transactions will appear here.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- MY ACTIVE DEMANDS --- */}
      <h2 style={{ marginBottom: '1rem', color: 'var(--buyer-dark)' }}>My Active Demands</h2>
      <div className="glass-card table-responsive" style={{ padding: '0', marginBottom: '2rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--buyer-light)', borderBottom: '1px solid #bfdbfe', color: 'var(--buyer-dark)' }}>
              <th style={{ padding: '1rem' }}>{t('crop')}</th>
              <th style={{ padding: '1rem' }}>Quantity Needed</th>
              <th style={{ padding: '1rem' }}>Target Price</th>
              <th style={{ padding: '1rem' }}>{t('status')}</th>
                <th style={{ padding: '1rem' }}>Action</th>
              </tr>
          </thead>
          <tbody>
            {myDemands.map(demand => (
              <tr key={demand.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '1rem', fontWeight: '500' }}>{demand.requiredCrop}</td>
                <td style={{ padding: '1rem' }}>{demand.quantityRequired} kg</td>
                <td style={{ padding: '1rem' }}>₹{demand.targetPrice} / kg</td>
                <td style={{ padding: '1rem', color: 'var(--buyer-primary)' }}>Active</td>
              </tr>
            ))}
            {myDemands.length === 0 && (
              <tr><td colSpan="4" style={{ padding: '1rem', textAlign: 'center' }}>You have not posted any demands.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- MY SENT BIDS (CONTRACTS) --- */}
      <h2 style={{ marginBottom: '1rem', color: 'var(--buyer-dark)' }}>My Sent Bids & Contracts</h2>
      <div className="glass-card table-responsive" style={{ padding: '0', marginBottom: '2rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#e0e7ff', borderBottom: '1px solid #c7d2fe', color: '#3730a3' }}>
              <th style={{ padding: '1rem' }}>Farmer / Seller</th>
              <th style={{ padding: '1rem' }}>{t('crop')}</th>
              <th style={{ padding: '1rem' }}>Bid Amount</th>
              <th style={{ padding: '1rem' }}>{t('status')}</th>
                <th style={{ padding: '1rem' }}>Action</th>
              </tr>
          </thead>
          <tbody>
            {mySentBids.map(bid => (
              <tr key={bid.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '1rem', fontWeight: '500' }}>{bid.farmerName}</td>
                <td style={{ padding: '1rem' }}>{bid.quantity}kg {bid.crop}</td>
                <td style={{ padding: '1rem', color: 'var(--buyer-primary)', fontWeight: 'bold' }}>₹{bid.bidPrice} / kg</td>
                <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: '600',
                      background: bid.status.includes('Action') || bid.status === 'Pending' ? '#fef08a' : bid.status.includes('Accepted') ? '#bbf7d0' : '#fecaca',
                      color: bid.status.includes('Action') || bid.status === 'Pending' ? '#854d0e' : bid.status.includes('Accepted') ? '#166534' : '#991b1b'
                    }}>
                      {bid.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {bid.status === 'Action Required (Buyer)' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn" style={{ background: '#16a34a', color: 'white', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }} onClick={() => updateBidStatus(bid.id, 'Accepted (Sold)')}>Accept</button>
                        <button className="btn" style={{ background: '#ef4444', color: 'white', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }} onClick={() => updateBidStatus(bid.id, 'Rejected')}>Reject</button>
                      </div>
                    )}
                  </td>
              </tr>
            ))}
            {mySentBids.length === 0 && (
              <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center' }}>No bids sent yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      

      {/* --- FARMER DISCOVERY TABLE --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Sourcing & Discovery</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search crops, locations..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ padding: '0.5rem 1rem 0.5rem 2.5rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} 
            />
          </div>
        </div>
      </div>

      <div className="glass-card table-responsive" style={{ padding: '0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--buyer-light)', borderBottom: '1px solid #bfdbfe', color: 'var(--buyer-dark)' }}>
              <th style={{ padding: '1rem' }}>Seller Name</th>
              <th style={{ padding: '1rem' }}>Location</th>
              <th style={{ padding: '1rem' }}>{t('crop')}</th>
              <th style={{ padding: '1rem' }}>Quantity Available</th>
              <th style={{ padding: '1rem' }}>Asking Price</th>
              <th style={{ padding: '1rem' }}>{t('action')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredListings.map((listing) => {
              // Find location from the offline farmer database if it exists
              const farmerData = farmers.find(f => f.id === listing.farmerId);
              const location = farmerData ? farmerData.location : 'Verified';
              
              return (
                <tr key={listing.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '1rem', fontWeight: '500' }}>{listing.farmerName}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{location}</td>
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
                  <td style={{ padding: '1rem' }}>
                    <button className="btn btn-buyer" style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }} onClick={() => handleOpenBid(listing)}>
                      Send Bid
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredListings.length === 0 && (
              <tr>
                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No active listings found matching your search.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- MODALS --- */}

      {/* Post New Demand Modal */}
      {isDemandModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDemandModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--buyer-dark)' }}>Post New Demand</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Broadcast your requirement to all FPOs and Farmers.</p>
            <form onSubmit={handlePostDemand}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Required Crop</label>
                <select style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }} value={newDemand.crop} onChange={e => setNewDemand({...newDemand, crop: e.target.value})} required>
                  <option value="" disabled>Select a Crop</option>
                  <option value="Onion">Onion</option>
                  <option value="Tomato">Tomato</option>
                  <option value="Potato">Potato</option>
                  <option value="Rice">Rice</option>
                  <option value="Wheat">Wheat</option>
                  <option value="Cotton">Cotton</option>
                </select>
              </div>

                {pulse && newDemand.crop && (
                  <div style={{ padding: '0.75rem', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>💡</span> 
                    <span><strong>Market Pulse:</strong> There is currently <strong>{pulse.qty.toLocaleString()}kg</strong> of {newDemand.crop} available across the network at an average asking price of <strong>₹{pulse.avgPrice}/kg</strong>.</span>
                  </div>
                )}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Total Quantity Needed (kg)</label>
                <input type="number" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} value={newDemand.quantity} onChange={e => setNewDemand({...newDemand, quantity: e.target.value})} required />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Target Price (₹/kg)</label>
                <input type="number" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} value={newDemand.targetPrice} onChange={e => setNewDemand({...newDemand, targetPrice: e.target.value})} required />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => setIsDemandModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-buyer">Post Demand</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Bid Modal */}
      {isBidModalOpen && selectedListing && (
        <div className="modal-overlay" onClick={() => setIsBidModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--buyer-dark)' }}>Place Bid</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              You are sending a bid to <strong>{selectedListing.farmerName}</strong> for <strong>{selectedListing.quantity}kg of {selectedListing.crop}</strong>. 
              Their asking price is <strong>₹{selectedListing.price}/kg</strong>.
            </p>
            <form onSubmit={handleSendBid}>
                            <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                <div style={{ marginBottom: '0.5rem', width: '100%' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Quantity to Buy (Max {selectedListing.quantity}kg)</label>
                  <input 
                    type="number" 
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} 
                    value={bidOffer.quantity} 
                    onChange={e => setBidOffer({ ...bidOffer, quantity: e.target.value })} 
                    max={selectedListing.quantity}
                    required 
                  />
                </div>
                <div style={{ marginBottom: '1.5rem', width: '100%' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>Your Bid Price (₹/kg)</label>
                  <input 
                    type="number" 
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }} 
                    value={bidOffer.price} 
                    onChange={e => setBidOffer({ ...bidOffer, price: e.target.value })} 
                    required 
                  />
                </div>
              </div>
              
              <div className="stack-mobile" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.2rem', color: 'var(--buyer-dark)' }}>
                <span><strong>Total Contract Value:</strong></span>
                <span><strong>₹{((Number(bidOffer.price) || 0) * (Number(bidOffer.quantity) || 0)).toLocaleString()}</strong></span>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => setIsBidModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-buyer">Send Bid</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
