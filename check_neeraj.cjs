
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkUser() {
    const { data, error } = await supabase.from('users').select('*').ilike('name', '%Neeraj%');
    if (error) console.error(error);
    else console.log(JSON.stringify(data, null, 2));
}

checkUser();
