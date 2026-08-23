import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AppContext = createContext();

export function AppProvider({ children }) {
  // --- STATE ---
  const [farmers, setFarmers] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [inventory, setInventory] = useState([]);
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
            supabase.from('fpo_users').select('*'),
            supabase.from('inventory').select('*')
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
          if (results[5]?.data) setInventory(results[5].data);

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

  const addInventory = async (newItem) => {
    setInventory([...inventory, newItem]);
    await supabase.from('inventory').insert([newItem]);
    if (window.globalSyncChannel) { window.globalSyncChannel.send({ type: 'broadcast', event: 'sync-data', payload: {} }); }
  };

  const removeInventory = async (id) => {
    setInventory(inventory.filter(i => i.id !== id));
    await supabase.from('inventory').delete().eq('id', id);
  };

  const addListing = async (newListing) => {
    setListings([...listings, newListing]); // Optimistic UI
    await supabase.from('listings').insert([newListing]);
    
    // Inventory is no longer deducted here. It remains pending until a bid is accepted.
    if (window.globalSyncChannel) { window.globalSyncChannel.send({ type: 'broadcast', event: 'sync-data', payload: {} }); }
  };

  const removeListing = async (listingId) => {
    // No need to refund inventory because it was never deducted from the database.
    setListings(listings.filter(l => l.id !== listingId));
    await supabase.from('listings').delete().eq('id', listingId);
  };

  const addBid = async (newBid) => {
    setBids([...bids, newBid]);
    // Inventory is no longer deducted here.
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
    const targetBid = bids.find(b => b.id === bidId);
    
    if (newStatus === 'Accepted (Sold)' && targetBid) {
      // 1. Deduct Listing Quantity (if applicable - only if it is a true listing bid, not a Direct Sale)
      let listing = null;
      if (targetBid.listingId && !targetBid.listingId.startsWith('DIRECT_INV:')) {
          listing = listings.find(l => l.id === targetBid.listingId);
      }
      
      if (listing) {
          if (Number(targetBid.quantity) > Number(listing.quantity)) {
              return { success: false, message: `Insufficient Listing Quantity! The buyer requested ${targetBid.quantity}kg but you only have ${listing.quantity}kg remaining.` };
          }
          const newQty = Number(listing.quantity) - Number(targetBid.quantity);
          const finalStatus = newQty <= 0 ? 'Sold Out' : 'Active';
          setListings(listings.map(l => l.id === listing.id ? { ...l, quantity: newQty, status: finalStatus } : l));
          await supabase.from('listings').update({ quantity: newQty, status: finalStatus }).eq('id', listing.id);
      }
      
      // 2. Deduct Inventory (for both Direct Sales and Listings)
      let invId = null;
      if (targetBid.listingId && targetBid.listingId.startsWith('DIRECT_INV:')) {
          invId = targetBid.listingId.split('DIRECT_INV:')[1];
      } else if (listing && listing.id) {
          const match = listing.id.match(/_INV:(.+)$/);
          if (match) invId = match[1];
      } else if (targetBid.inventoryId) {
          invId = targetBid.inventoryId;
      }

      if (invId) {
          const invItem = inventory.find(i => i.id === invId);
          if (invItem) {
              const newInvQty = Math.max(0, Number(invItem.quantity) - Number(targetBid.quantity));
              setInventory(inventory.map(i => i.id === invId ? { ...i, quantity: newInvQty } : i));
              await supabase.from('inventory').update({ quantity: newInvQty }).eq('id', invId);
          }
      }
      
      // 3. Decrement Buyer's Global Demand matching the specific crop
      const buyerObj = buyers.find(b => b.name === targetBid.buyer && b.requiredCrop === targetBid.crop);
      if (buyerObj && buyerObj.quantityRequired) {
          const newDemandQty = Math.max(0, Number(buyerObj.quantityRequired) - Number(targetBid.quantity));
          if (newDemandQty === 0) {
              setBuyers(buyers.map(b => b.id === buyerObj.id ? { ...b, requiredCrop: null, quantityRequired: null, targetPrice: null } : b));
              await supabase.from('buyers').update({ requiredCrop: null, quantityRequired: null, targetPrice: null }).eq('id', buyerObj.id);
          } else {
              setBuyers(buyers.map(b => b.id === buyerObj.id ? { ...b, quantityRequired: newDemandQty } : b));
              await supabase.from('buyers').update({ quantityRequired: newDemandQty }).eq('id', buyerObj.id);
          }
      }
    }
    // Note: If newStatus is 'Rejected', we DO NOTHING to inventory because we never deducted it!
    
    setBids(bids.map(bid => bid.id === bidId ? { ...bid, status: newStatus } : bid));
    await supabase.from('bids').update({ status: newStatus }).eq('id', bidId);
    
    if (window.globalSyncChannel) { window.globalSyncChannel.send({ type: 'broadcast', event: 'sync-data', payload: {} }); }
    return { success: true };
  };

  return (
    <AppContext.Provider value={{
      farmers, setFarmers,
      buyers, setBuyers,
      currentUser, loginFarmer, loginBuyer, loginFPO, logout,
      listings, addListing, removeListing,
      inventory, addInventory, removeInventory,
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
