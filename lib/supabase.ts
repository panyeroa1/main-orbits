import { createClient } from '@supabase/supabase-js';

// Using credentials provided by the user
const supabaseUrl = process.env.SUPABASE_URL || 'https://ipuptwbhepvbpigtvjya.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_X55lv04o-sD9IuOzJUrrFQ_cGZ9qMEB';

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials missing. Please check your configuration.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);