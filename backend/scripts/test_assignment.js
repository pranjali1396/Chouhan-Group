
const API_URL = 'http://localhost:5000/api/v1';

async function testAssignment() {
    console.log('--- Testing Lead Assignment ---');

    // 1. Create a dummy lead (via webhook endpoint for simplicity)
    console.log('Creating dummy lead...');
    const leadData = {
        customerName: 'Test Assignment User ' + Date.now(),
        mobile: '9999' + Math.floor(Math.random() * 1000000),
        source: 'test-script'
    };

    const createRes = await fetch(`${API_URL}/webhooks/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
    });

    const createResult = await createRes.json();
    console.log('Create Result:', createResult);

    if (!createResult.success) {
        console.error('Failed to create lead');
        return;
    }

    const leadId = createResult.leadId;
    console.log(`Lead Created with ID: ${leadId}`);

    // 2. Assign the lead
    console.log(`\nAssigning lead ${leadId} to user-5...`);
    const updateData = {
        assignedSalespersonId: 'user-5', // Simulating assignment to Salesperson
        status: 'New Lead'
    };

    const updateRes = await fetch(`${API_URL}/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
    });

    const updateResult = await updateRes.json();
    // console.log('Update Result:', JSON.stringify(updateResult, null, 2));

    if (updateResult.lead && updateResult.lead.assignedSalespersonId === 'user-5') {
        console.log('✅ Update successful! Lead is assigned to user-5');
    } else {
        console.error('❌ Update failed! Assigned ID mismatch.');
        console.log('Expected: user-5');
        console.log('Actual:', updateResult.lead?.assignedSalespersonId);
        console.log('Update Result:', JSON.stringify(updateResult, null, 2));
    }

    // 3. Check for Notification
    console.log(`\nChecking notifications for user-5...`);
    const notifRes = await fetch(`${API_URL}/notifications?userId=user-5&role=Salesperson`);
    const notifResult = await notifRes.json();

    console.log('Notifications Result:', notifResult);

    const found = notifResult.notifications.find(n => n.leadId === leadId);
    if (found) {
        console.log('✅ Notification FOUND in API response!');
        console.log('Notification:', found);
    } else {
        console.error('❌ Notification NOT FOUND in API response for user-5');
    }
}

testAssignment();
