import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Ensure these exist to fail fast during development if they are not set.
if (!supabaseUrl || !supabaseKey) {
    console.warn("Missing Supabase environment variables. Functionality will be degraded.");
}

export const supabase = createClient(supabaseUrl || "http://placeholder.com", supabaseKey || "placeholder_key");
