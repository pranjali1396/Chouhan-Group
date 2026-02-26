import mysql from 'mysql2/promise';

async function checkDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Sidpra@1301',
        });

        console.log('✅ Connected to MySQL');

        const [rows] = await connection.execute("SHOW DATABASES LIKE 'chouhan_crm'");
        if (rows.length > 0) {
            console.log('✅ Database chouhan_crm exists!');
        } else {
            console.log('❌ Database chouhan_crm DOES NOT EXIST. We need to create it.');

            console.log('Creating database...');
            await connection.execute('CREATE DATABASE chouhan_crm');
            console.log('✅ Database created!');
        }

        await connection.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkDatabase();
