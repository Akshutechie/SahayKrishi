import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://imvfwuyaktrdopsgocid.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltdmZ3dXlha3RyZG9wc2dvY2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0MDM1MzUsImV4cCI6MjEwMjk3OTUzNX0.miAmA6iN10Xiue8NtsFjug5jKHKpOHXQpnTFwuBxAaA';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUpdate() {
    const { data, error } = await supabase.from('inventory').update({ quantity: 99 }).eq('id', 'INV3f2ofz');
    console.log("Error:", error);
    console.log("Data:", data);
}
testUpdate();
