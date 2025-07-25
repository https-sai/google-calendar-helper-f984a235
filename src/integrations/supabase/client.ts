// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://btisolrshtfydukknzox.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0aXNvbHJzaHRmeWR1a2tuem94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MDcxNDcsImV4cCI6MjA2ODM4MzE0N30.NqZMonR1EUUTeL2Cc9KW-PW3wwQPCvTucKiATCB6PLM";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});