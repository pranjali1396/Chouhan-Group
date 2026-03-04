
import mysqlPool from '../src/mysqlClient.js';

async function init() {
    try {
        console.log('Creating attendance table...');
        await mysqlPool.query(`
            CREATE TABLE IF NOT EXISTS attendance (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                date DATE NOT NULL,
                clock_in DATETIME NOT NULL,
                clock_out DATETIME,
                location_in TEXT,
                status VARCHAR(50),
                INDEX idx_attendance_user_date (user_id, date),
                INDEX idx_attendance_date (date),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ Attendance table created or already exists.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating attendance table:', error);
        process.exit(1);
    }
}

init();
