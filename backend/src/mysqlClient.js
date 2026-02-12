import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE || 'chouhan_crm',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+00:00' // Store dates in UTC
});

console.log('[MySQL Config] Database:', process.env.MYSQL_DATABASE || 'chouhan_crm');
console.log('[MySQL Config] Host:', process.env.MYSQL_HOST || 'localhost');

// Test connection
pool.getConnection()
    .then(connection => {
        console.log('✅ MySQL connection successful');
        connection.release();
    })
    .catch(err => {
        console.error('❌ MySQL connection failed:', err.message);
    });

export default pool;
