const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const money = amount => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

window.onload = () => {
  const today = new Date();
  document.getElementById('monthlyPeriod').textContent = `January ${today.getFullYear()} – ${monthNames[today.getMonth()]} ${today.getFullYear()}`;
  loadMonthlyReport();
};

async function loadMonthlyReport() {
  const response = await fetch('/api/monthly-collection-summary', { cache: 'no-store' });
  const result = await response.json();
  const data = result.rows || [];
  let total = 0, cash = 0, upi = 0;
  let html = '';

  data.forEach((row, index) => {
    total += Number(row.total_collection);
    cash += Number(row.cash_collection);
    upi += Number(row.upi_collection);
    html += `<tr><td>${index + 1}</td><td><strong>${monthNames[row.month_number - 1]}</strong></td><td>${row.transactions}</td><td>${row.members}</td><td class="amount">${money(row.cash_collection)}</td><td class="amount">${money(row.upi_collection)}</td><td class="amount"><strong>${money(row.total_collection)}</strong></td></tr>`;
  });

  if (!data.length) html = '<tr><td colspan="7">No Collection Records Found</td></tr>';
  document.getElementById('reportBody').innerHTML = html;
  document.getElementById('totalCollection').textContent = money(total);
  document.getElementById('cashCollection').textContent = money(cash);
  document.getElementById('upiCollection').textContent = money(upi);
  document.getElementById('totalMembers').textContent = result.total_members || 0;
}
