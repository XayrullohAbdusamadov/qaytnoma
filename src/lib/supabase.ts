import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dtpyfzzdfyxeklyrtuew.supabase.co';
const supabaseAnonKey = 'sb_publishable_ioYdiKVpVMddnYFH3bABDg_-J9EImd1';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
