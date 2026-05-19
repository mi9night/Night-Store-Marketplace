import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ogdlyckhqmnujnauqcgd.supabase.co';
const supabaseKey = 'sb_publishable_Snh9pEerzs3E1RwhWMfQgg_yw2jjVTw';

export const supabase = createClient(supabaseUrl, supabaseKey);