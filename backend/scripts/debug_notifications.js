import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from parent directory (backend root)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Connecting to Supabase:', SUPABASE_URL);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkNotifications() {
    console.log('\n--- Checking Notifications Table ---');
    const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching notifications:', error);
    } else {
        console.log(`Found ${notifications.length} recent notifications:`);
        notifications.forEach(n => {
            console.log(`- [${n.created_at}] ID: ${n.id}`);
            console.log(`  Type: ${n.type}, Target User: ${n.target_user_id}, Target Role: ${n.target_role}`);
            console.log(`  Message: ${n.message}`);
            console.log('---');
        });
    }
}

async function checkLeads() {
    console.log('\n--- Checking Recent Leads ---');
    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, customer_name, assigned_salesperson_id, status')
        .order('lead_date', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching leads:', error);
    } else {
        console.log(`Found ${leads.length} recent leads:`);
        leads.forEach(l => {
            console.log(`- Name: ${l.customer_name}, ID: ${l.id}`);
            console.log(`  Assigned To: ${l.assigned_salesperson_id}, Status: ${l.status}`);
        });
    }
}

async function main() {
    await checkNotifications();
    await checkLeads();
}

main();
