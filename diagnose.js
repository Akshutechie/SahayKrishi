import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://imvfwuyaktrdopsgocid.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltdmZ3dXlha3RyZG9wc2dvY2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0MDM1MzUsImV4cCI6MjEwMjk3OTUzNX0.miAmA6iN10Xiue8NtsFjug5jKHKpOHXQpnTFwuBxAaA';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkState() {
    console.log("Fetching bids...");
    const { data: bids, error: bErr } = await supabase.from('bids').select('*');
    if (bErr) console.error(bErr);
    else {
        bids.forEach(b => {
            console.log(`Bid ${b.id}: status=${b.status}, listingId=${b.listingId}, inventoryId=${b.inventoryId}, qty=${b.quantity}`);
        });
    }

    console.log("\nFetching inventory...");
    const { data: inventory, error: iErr } = await supabase.from('inventory').select('*');
    if (iErr) console.error(iErr);
    else {
        inventory.forEach(i => {
            console.log(`Inventory ${i.id}: crop=${i.crop}, qty=${i.quantity}`);
        });
    }
}
checkState();
