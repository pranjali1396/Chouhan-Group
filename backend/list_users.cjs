
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listUsers() {
    const { data, error } = await supabase.from('users').select('id, name, local_id');
    if (error) console.error(error);
    else console.log(JSON.stringify(data, null, 2));
}

listUsers();
