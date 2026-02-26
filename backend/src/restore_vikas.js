import pool from './mysqlClient.js';

async function restoreLead() {
    try {
        const query = `
            INSERT INTO leads 
            (id, customer_name, mobile, email, source_website, interested_project, status, lead_date, last_remark) 
            VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            'Vikas', // customer_name
            '8319148297', // mobile
            'vikas.36montane@gmail.com', // email
            'website', // source_website
            'General Inquiry', // interested_project
            'New Lead', // status
            '2026-02-25 09:00:00', // lead_date
            'Captured from React App: www.chouhangroup.com' // last_remark
        ];

        const [result] = await pool.execute(query, values);
        console.log('Successfully restored Vikas lead!', result);
    } catch (error) {
        console.error('Failed to restore lead:', error);
    } finally {
        process.exit(0);
    }
}

restoreLead();
