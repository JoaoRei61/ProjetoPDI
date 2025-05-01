import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const SUPABASE_URL = 'https://fajkkueiizgcfgbhgttz.supabase.co';
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhamtrdWVpaXpnY2ZnYmhndHR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyMzM3MjksImV4cCI6MjA1NzgwOTcyOX0.vUISyIarRxoArYdYmWHLPOCiqIZVxMd2OsuR1UIW1ck";

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
