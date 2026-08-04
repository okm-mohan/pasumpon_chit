// Consolidated Date-wise Pandu Collection Report
window.onload = function () {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    document.getElementById('fromDate').value = firstDay.toISOString().split('T')[0];
    document.getElementById('toDate').value = today.toISOString().split('T')[0];
    loadReport();
};

async function loadReport() {
    const fromDate = document.getElementById('fromDate').value;
    const toDate = document.getElementById('toDate').value;
    if (!fromDate || !toDate) { alert('Select From Date and To Date'); return; }

    const response = await fetch(`/api/datewise-collection-list?from_date=${fromDate}&to_date=${toDate}`);
    const data = await response.json();
    let totalCollection = 0, cashCollection = 0, upiCollection = 0;
    const members = new Set();
    const dailyCollections = new Map();

    data.forEach(row => {
        const amount = Number(row.amount || 0);
        totalCollection += amount;
        members.add(row.member_id);
        if (row.payment_mode === 'Cash') cashCollection += amount; else upiCollection += amount;
        if (!dailyCollections.has(row.collection_date)) {
            dailyCollections.set(row.collection_date, { transactions: 0, members: new Set(), cash: 0, upi: 0, total: 0 });
        }
        const day = dailyCollections.get(row.collection_date);
        day.transactions += 1;
        day.members.add(row.member_id);
        day.total += amount;
        if (row.payment_mode === 'Cash') day.cash += amount; else day.upi += amount;
    });

    let serial = 1;
    let html = '';
    dailyCollections.forEach((day, date) => {
        html += `<tr><td>${serial++}</td><td><strong>${date}</strong></td><td>${day.transactions}</td><td>${day.members.size}</td><td class="amount">₹${day.cash.toLocaleString('en-IN')}</td><td class="amount">₹${day.upi.toLocaleString('en-IN')}</td><td class="amount"><strong>₹${day.total.toLocaleString('en-IN')}</strong></td></tr>`;
    });
    if (!data.length) html = '<tr><td colspan="7">No Collection Records Found</td></tr>';
    document.getElementById('reportBody').innerHTML = html;
    document.getElementById('totalCollection').textContent = `₹${totalCollection.toLocaleString('en-IN')}`;
    document.getElementById('cashCollection').textContent = `₹${cashCollection.toLocaleString('en-IN')}`;
    document.getElementById('upiCollection').textContent = `₹${upiCollection.toLocaleString('en-IN')}`;
    document.getElementById('totalMembers').textContent = members.size;
}
