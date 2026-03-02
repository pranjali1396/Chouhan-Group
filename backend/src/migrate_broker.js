import mysqlPool from './mysqlClient.js';

async function migrate() {
    try {
        console.log('Adding is_broker column to leads table...');
        await mysqlPool.query('ALTER TABLE leads ADD COLUMN is_broker VARCHAR(20) DEFAULT "No" AFTER platform');
        console.log('✅ Column is_broker added successfully!');
        process.exit(0);
    } catch (error) {
        if (error.code === 'ER_DUP_COLUMN_NAME') {
            console.log('ℹ️ Column is_broker already exists.');
            process.exit(0);
        } else {
            console.error('❌ Migration failed:', error);
            process.exit(1);
        }
    }
}

migrate();
