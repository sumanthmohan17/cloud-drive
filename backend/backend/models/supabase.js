import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lmzwtgecvsgjsvpaahgf.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxtend0Z2VjdnNnanN2cGFhaGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NjQ1NDgsImV4cCI6MjA4MDQ0MDU0OH0.zSoJRvCFzdkspwwFMFN749zyCMvDTAI5rP9aPs2UQfE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
