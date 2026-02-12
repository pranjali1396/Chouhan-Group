import mysql from 'mysql2/promise';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function importData() {
    let connection;

    try {
        console.log('🚀 Starting MySQL data import...\n');

        // Create connection
        connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST || 'localhost',
            user: process.env.MYSQL_USER || 'root',
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE || 'chouhan_crm',
            multipleStatements: true
        });

        console.log('✅ Connected to MySQL database\n');

        // Import users first (due to foreign key constraints)
        const usersFile = path.join(__dirname, '../users_export.json');
        if (fs.existsSync(usersFile)) {
            console.log('📊 Importing users...');
            const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));

            for (const user of users) {
                await connection.execute(
                    `INSERT INTO users (id, name, email, role, avatar_url, local_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           email = VALUES(email),
           role = VALUES(role),
           avatar_url = VALUES(avatar_url),
           local_id = VALUES(local_id),
           updated_at = VALUES(updated_at)`,
                    [
                        user.id,
                        user.name,
                        user.email,
                        user.role,
                        user.avatar_url,
                        user.local_id,
                        user.created_at,
                        user.updated_at
                    ]
                );
            }
            console.log(`✅ Imported ${users.length} users\n`);
        } else {
            console.log('⚠️  users_export.json not found, skipping...\n');
        }

        // Import leads
        const leadsFile = path.join(__dirname, '../leads_export.json');
        if (fs.existsSync(leadsFile)) {
            console.log('📊 Importing leads...');
            const leads = JSON.parse(fs.readFileSync(leadsFile, 'utf8'));

            for (const lead of leads) {
                await connection.execute(
                    `INSERT INTO leads (
            id, customer_name, mobile, email, status, assigned_salesperson_id,
            lead_date, last_activity_date, month, mode_of_enquiry, occupation,
            interested_project, interested_unit, temperature, visit_status,
            visit_date, next_follow_up_date, last_remark, booking_status,
            is_read, missed_visits_count, labels, budget, purpose, city,
            platform, source_website
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          customer_name = VALUES(customer_name),
          mobile = VALUES(mobile),
          email = VALUES(email),
          status = VALUES(status),
          assigned_salesperson_id = VALUES(assigned_salesperson_id),
          last_activity_date = VALUES(last_activity_date),
          month = VALUES(month),
          mode_of_enquiry = VALUES(mode_of_enquiry),
          occupation = VALUES(occupation),
          interested_project = VALUES(interested_project),
          interested_unit = VALUES(interested_unit),
          temperature = VALUES(temperature),
          visit_status = VALUES(visit_status),
          visit_date = VALUES(visit_date),
          next_follow_up_date = VALUES(next_follow_up_date),
          last_remark = VALUES(last_remark),
          booking_status = VALUES(booking_status),
          is_read = VALUES(is_read),
          missed_visits_count = VALUES(missed_visits_count),
          labels = VALUES(labels),
          budget = VALUES(budget),
          purpose = VALUES(purpose),
          city = VALUES(city),
          platform = VALUES(platform),
          source_website = VALUES(source_website)`,
                    [
                        lead.id,
                        lead.customer_name,
                        lead.mobile,
                        lead.email,
                        lead.status,
                        lead.assigned_salesperson_id,
                        lead.lead_date,
                        lead.last_activity_date,
                        lead.month,
                        lead.mode_of_enquiry,
                        lead.occupation,
                        lead.interested_project,
                        lead.interested_unit,
                        lead.temperature,
                        lead.visit_status,
                        lead.visit_date,
                        lead.next_follow_up_date,
                        lead.last_remark,
                        lead.booking_status,
                        lead.is_read,
                        lead.missed_visits_count,
                        lead.labels ? JSON.stringify(lead.labels) : null,
                        lead.budget,
                        lead.purpose,
                        lead.city,
                        lead.platform,
                        lead.source_website
                    ]
                );
            }
            console.log(`✅ Imported ${leads.length} leads\n`);
        } else {
            console.log('⚠️  leads_export.json not found, skipping...\n');
        }

        // Import notifications
        const notificationsFile = path.join(__dirname, '../notifications_export.json');
        if (fs.existsSync(notificationsFile)) {
            console.log('📊 Importing notifications...');
            const notifications = JSON.parse(fs.readFileSync(notificationsFile, 'utf8'));

            for (const notif of notifications) {
                await connection.execute(
                    `INSERT INTO notifications (id, type, message, lead_id, lead_data, target_role, target_user_id, created_at, is_read)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           type = VALUES(type),
           message = VALUES(message),
           lead_id = VALUES(lead_id),
           lead_data = VALUES(lead_data),
           target_role = VALUES(target_role),
           target_user_id = VALUES(target_user_id),
           is_read = VALUES(is_read)`,
                    [
                        notif.id,
                        notif.type,
                        notif.message,
                        notif.lead_id,
                        notif.lead_data ? JSON.stringify(notif.lead_data) : null,
                        notif.target_role,
                        notif.target_user_id,
                        notif.created_at,
                        notif.is_read
                    ]
                );
            }
            console.log(`✅ Imported ${notifications.length} notifications\n`);
        } else {
            console.log('⚠️  notifications_export.json not found, skipping...\n');
        }

        console.log('✅ All data imported successfully!');
        console.log('\n📊 Verification - Run these queries in MySQL Workbench:');
        console.log('   SELECT COUNT(*) FROM users;');
        console.log('   SELECT COUNT(*) FROM leads;');
        console.log('   SELECT COUNT(*) FROM notifications;');
    } catch (error) {
        console.error('❌ Import failed:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 MySQL connection closed');
        }
    }
}

importData();
