import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    '\n[Supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set. ' +
      'Backend will fall back to in-memory leads only.\n'
  );
}

export const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          // We use service role key on the server – no persisted session needed
          persistSession: false,
        },
      })
    : null;



