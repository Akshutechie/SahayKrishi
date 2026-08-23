import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AppContext = createContext();

export function AppProvider({ children }) {
  // --- STATE ---
  const [farmers, setFarmers] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [listings, setListings] = useState([]);
  const [bids, setBids] = useState([]);
    const [fpoUsers, setFpoUsers] = useState([]);
  
  // Current user stays in localStorage to persist login session across reloads
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const item = window.localStorage.getItem('currentUser_v2');
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    window.localStorage.setItem('currentUser_v2', JSON.stringify(currentUser));
  }, [currentUser]);

  // --- SUPABASE INITIAL FETCH ---
  useEffect(() => {
    const fetchCloudData = async () => {
      try {
          const results = await Promise.all([
            supabase.from('farmers').select('*'),
            supabase.from('buyers').select('*'),
            supabase.from('listings').select('*'),
            supabase.from('bids').select('*'),
            supabase.from('fpo_users').select('*')
          ]);

          const fErr = results[0].error;
          const bErr = results[1].error;

          if (fErr) throw fErr;
          if (bErr) throw bErr;

          setFarmers(results[0].data || []);
          setBuyers(results[1].data || []);
          if (results[2].data) setListings(results[2].data);
          if (results[3].data) setBids(results[3].data);
          if (results[4].data) setFpoUsers(results[4].data);

      } catch (error) {
        console.error("Supabase Connection Error:", error);
        // Do not use mock data if fetch fails
        setFarmers([]);
        setBuyers([]);
      }
    };
    
    
    fetchCloudData();

    // --- SUPABASE REALTIME SUBSCRIPTIONS ---
    const listingsSub = supabase
      .channel('custom-listings-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, (payload) => {
        console.log('Realtime listing update:', payload);
        fetchCloudData(); // Automatically refresh data without page reload
      })
      .subscribe();

    const bidsSub = supabase
      .channel('custom-bids-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bids' }, (payload) => {
        console.log('Realtime bid update:', payload);
        fetchCloudData(); // Automatically refresh data without page reload
      })
      .subscribe();

        window.globalSyncChannel = supabase
      .channel('global-sync')
      .on('broadcast', { event: 'sync-data' }, (payload) => {
        console.log('Broadcast sync received!');
        fetchCloudData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(listingsSub);
      supabase.removeChannel(bidsSub);
      if (window.globalSyncChannel) supabase.removeChannel(window.globalSyncChannel);
    };
  }, []);

  // --- ACTIONS (Optimistic UI + Supabase Writes) ---
  
  const loginFarmer = (phone) => {
    const foundFarmer = farmers.find(f => f.phone === phone);
    if (foundFarmer) {
      if (foundFarmer.is_blocked) return 'blocked';
      setCurrentUser({ ...foundFarmer, role: 'farmer' });
      return 'success';
    }
    return 'not_found';
  };

  const loginBuyer = (id) => {
    const foundBuyer = buyers.find(b => b.id === id);
    if (foundBuyer) {
      if (foundBuyer.is_blocked) return 'blocked';
      setCurrentUser({ ...foundBuyer, role: 'buyer' });
      return 'success';
    }
    return 'not_found';
  };

  const loginFPO = (username, password) => {
    const foundAdmin = fpoUsers.find(u => u.username === username && u.password === password);
    if (foundAdmin) {
      setCurrentUser({ id: username, role: 'fpo', name: 'FPO Admin' });
      return 'success';
    }
    return 'not_found';
  };

  const logout = () => setCurrentUser(null);

  const addListing = async (newListing) => {
    setListings([...listings, newListing]); // Optimistic UI
    await supabase.from('listings').insert([newListing]);
    if (window.globalSyncChannel) { window.globalSyncChannel.send({ type: 'broadcast', event: 'sync-data', payload: {} }); }
  };

  const removeListing = async (listingId) => {
    setListings(listings.filter(l => l.id !== listingId));
    await supabase.from('listings').delete().eq('id', listingId);
  };

  const addBid = async (newBid) => {
    setBids([...bids, newBid]);
    await supabase.from('bids').insert([newBid]);
    if (window.globalSyncChannel) { window.globalSyncChannel.send({ type: 'broadcast', event: 'sync-data', payload: {} }); }
  };

  const addBuyerDemand = async (newDemand) => {
    setBuyers([...buyers, newDemand]);
    await supabase.from('buyers').insert([newDemand]);
    if (window.globalSyncChannel) { window.globalSyncChannel.send({ type: 'broadcast', event: 'sync-data', payload: {} }); }
  };

  const removeBuyerDemand = async (demandId) => {
    setBuyers(buyers.map(b => 
      b.id === demandId 
        ? { ...b, requiredCrop: null, quantityRequired: null, targetPrice: null } 
        : b
    ));
    await supabase.from('buyers').update({ requiredCrop: null, quantityRequired: null, targetPrice: null }).eq('id', demandId);
    if (window.globalSyncChannel) { window.globalSyncChannel.send({ type: 'broadcast', event: 'sync-data', payload: {} }); }
  };

  const addFarmer = async (newFarmer) => {
    setFarmers([...farmers, newFarmer]);
    await supabase.from('farmers').insert([newFarmer]);
  };

  const deleteFarmer = async (farmerId) => {
    setFarmers(farmers.filter(f => f.id !== farmerId));
    await supabase.from('farmers').delete().eq('id', farmerId);
  };

  const toggleBlockFarmer = async (farmerId, currentStatus) => {
    const newStatus = !currentStatus;
    setFarmers(farmers.map(f => f.id === farmerId ? { ...f, is_blocked: newStatus } : f));
    await supabase.from('farmers').update({ is_blocked: newStatus }).eq('id', farmerId);
  };

  const addBuyer = async (newBuyer) => {
    setBuyers([...buyers, newBuyer]);
    await supabase.from('buyers').insert([newBuyer]);
  };

  const deleteBuyer = async (buyerId) => {
    setBuyers(buyers.filter(b => b.id !== buyerId));
    await supabase.from('buyers').delete().eq('id', buyerId);
  };

  const toggleBlockBuyer = async (buyerId, currentStatus) => {
    const newStatus = !currentStatus;
    setBuyers(buyers.map(b => b.id === buyerId ? { ...b, is_blocked: newStatus } : b));
    await supabase.from('buyers').update({ is_blocked: newStatus }).eq('id', buyerId);
  };

  const updateFarmerCrops = async (cropsString) => {
    if (!currentUser || currentUser.role !== 'farmer') return;
    
    // Update current user
    setCurrentUser({ ...currentUser, primaryCrops: cropsString });
    
    // Update global farmers list
    setFarmers(farmers.map(f => 
      f.id === currentUser.id ? { ...f, primaryCrops: cropsString } : f
    ));
    
    // Push to Supabase
    await supabase.from('farmers').update({ primaryCrops: cropsString }).eq('id', currentUser.id);
  };

  
  const updateBidStatus = async (bidId, newStatus) => {
    setBids(bids.map(bid => bid.id === bidId ? { ...bid, status: newStatus } : bid));
    await supabase.from('bids').update({ status: newStatus }).eq('id', bidId);
    
    if (newStatus === 'Accepted (Sold)') {
      const acceptedBid = bids.find(b => b.id === bidId);
      if (acceptedBid) {
        const listing = listings.find(l => l.id === acceptedBid.listingId || (l.crop === acceptedBid.crop && l.farmerName === acceptedBid.farmerName));
        if (listing) {
            const newQty = Number(listing.quantity) - Number(acceptedBid.quantity);
            const finalStatus = newQty <= 0 ? 'Sold Out' : 'Active';
            setListings(listings.map(l => l.id === listing.id ? { ...l, quantity: newQty, status: finalStatus } : l));
            await supabase.from('listings').update({ quantity: newQty, status: finalStatus }).eq('id', listing.id);
        }
      }
    }
    
    if (window.globalSyncChannel) { window.globalSyncChannel.send({ type: 'broadcast', event: 'sync-data', payload: {} }); }
  };

  return (
    <AppContext.Provider value={{
      farmers, setFarmers,
      buyers, setBuyers,
      currentUser, loginFarmer, loginBuyer, loginFPO, logout,
      listings, addListing, removeListing,
      bids, addBid, updateBidStatus,
      addBuyerDemand, removeBuyerDemand,
      updateFarmerCrops,
      addFarmer, deleteFarmer, toggleBlockFarmer, addBuyer, deleteBuyer, toggleBlockBuyer
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
