import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function exportData() {
    try {
        console.log('🚀 Starting Supabase data export...\n');
        const rootDir = process.cwd();

        // Export users
        console.log('📊 Exporting users...');
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*');

        if (usersError) {
            console.error('❌ Error exporting users:', usersError);
        } else {
            const filePath = path.join(rootDir, 'users_export.json');
            fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
            console.log(`✅ Exported ${users?.length || 0} users to ${filePath}\n`);
        }

        // Export leads
        console.log('📊 Exporting leads...');
        const { data: leads, error: leadsError } = await supabase
            .from('leads')
            .select('*');

        if (leadsError) {
            console.error('❌ Error exporting leads:', leadsError, leadsError.details, leadsError.hint);
        } else {
            const filePath = path.join(rootDir, 'leads_export.json');
            fs.writeFileSync(filePath, JSON.stringify(leads, null, 2));
            console.log(`✅ Exported ${leads?.length || 0} leads to ${filePath}\n`);
        }

        // Export notifications
        console.log('📊 Exporting notifications...');
        const { data: notifications, error: notificationsError } = await supabase
            .from('notifications')
            .select('*');

        if (notificationsError) {
            console.error('❌ Error exporting notifications:', notificationsError);
        } else {
            const filePath = path.join(rootDir, 'notifications_export.json');
            fs.writeFileSync(filePath, JSON.stringify(notifications, null, 2));
            console.log(`✅ Exported ${notifications?.length || 0} notifications to ${filePath}\n`);
        }

        console.log('✅ All data exported successfully!');
    } catch (error) {
        console.error('❌ Export CRITICAL FAILURE:', error);
        console.error(error.stack);
    }
}

exportData();
