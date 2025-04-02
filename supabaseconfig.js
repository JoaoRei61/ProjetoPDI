import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const SUPABASE_URL = "https://rfioeawxmvhqgedqftkt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmaW9lYXd4bXZocWdlZHFmdGt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk1NDM2MTksImV4cCI6MjA1NTExOTYxOX0.SPGvJdMYgXYQ8knduzRRBuLtO8LoWQeCcXSthiczFqI";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: {
      getItem: SecureStore.getItemAsync,
      setItem: SecureStore.setItemAsync,
      removeItem: SecureStore.deleteItemAsync,
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;
