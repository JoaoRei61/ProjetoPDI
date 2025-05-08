import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://fajkkueiizgcfgbhgttz.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhamtrdWVpaXpnY2ZnYmhndHR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyMzM3MjksImV4cCI6MjA1NzgwOTcyOX0.vUISyIarRxoArYdYmWHLPOCiqIZVxMd2OsuR1UIW1ck"

const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;