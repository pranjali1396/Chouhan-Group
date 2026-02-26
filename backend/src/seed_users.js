import mysql from 'mysql2/promise';

function generateIdFromName(name, role) {
    const str = `${role}-${name}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `${hex.substring(0, 8)}-${hex.substring(0, 4)}-${hex.substring(0, 4)}-${hex.substring(0, 4)}-${hex.substring(0, 12)}`;
}

const usersToInsert = [
    { name: 'Admin', role: 'Admin', avatarUrl: 'https://i.pravatar.cc/40?u=admin', email: 'admin@chouhangroup.com' },
    { name: 'Amit Naithani', role: 'Salesperson', avatarUrl: 'https://i.pravatar.cc/40?u=amit', email: 'amit@chouhangroup.com' },
    { name: 'Neeraj Tripathi', role: 'Salesperson', avatarUrl: 'https://i.pravatar.cc/40?u=neeraj', email: 'neeraj@chouhangroup.com' },
    { name: 'Pinki Sahu', role: 'Salesperson', avatarUrl: 'https://i.pravatar.cc/40?u=pinki', email: 'pinki@chouhangroup.com' },
    { name: 'Sher Singh', role: 'Salesperson', avatarUrl: 'https://i.pravatar.cc/40?u=sher', email: 'sher@chouhangroup.com' },
    { name: 'Umakant Sharma', role: 'Salesperson', avatarUrl: 'https://i.pravatar.cc/40?u=umakant', email: 'umakant@chouhangroup.com' },
    { name: 'Vimal Shrivastav', role: 'Salesperson', avatarUrl: 'https://i.pravatar.cc/40?u=vimal', email: 'vimal@chouhangroup.com' },
    { name: 'Parth Das', role: 'Salesperson', avatarUrl: 'https://i.pravatar.cc/40?u=parth', email: 'parth@chouhangroup.com' }
];

async function seedUsers() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Sidpra@1301',
            database: 'chouhan_crm'
        });

        console.log('✅ Connected to MySQL');

        for (const user of usersToInsert) {
            const id = generateIdFromName(user.name, user.role);
            // Check if user already exists
            const [rows] = await connection.execute('SELECT id FROM users WHERE email = ?', [user.email]);

            if (rows.length === 0) {
                await connection.execute(
                    'INSERT INTO users (id, name, email, role, avatar_url) VALUES (?, ?, ?, ?, ?)',
                    [id, user.name, user.email, user.role, user.avatarUrl]
                );
                console.log(`Inserted user: ${user.name}`);
            } else {
                console.log(`User already exists: ${user.name}`);
            }
        }

        console.log('✅ User seeding complete!');
        await connection.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

seedUsers();
