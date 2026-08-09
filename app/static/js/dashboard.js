document.addEventListener('DOMContentLoaded', () => {
  const money = value => `₹${Number(value || 0).toLocaleString('en-IN', {maximumFractionDigits: 0})}`;
  const number = value => Number(value || 0).toLocaleString('en-IN');
  const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };

  function updateClock() {
    const now = new Date();
    set('clockTime', now.toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:true}));
    set('clockDate', now.toLocaleDateString('en-IN', {weekday:'long', day:'2-digit', month:'short', year:'numeric'}));
    set('clockMonth', now.toLocaleDateString('en-IN', {month:'long', year:'numeric'}));
  }
  updateClock(); setInterval(updateClock, 1000);

  fetch('/api/executive-dashboard', {cache:'no-store'})
    .then(response => { if (!response.ok) throw new Error('Dashboard data unavailable'); return response.json(); })
    .then(data => renderDashboard(data))
    .catch(() => { document.getElementById('recentLedger').innerHTML = '<p>Unable to load dashboard data.</p>'; });

  function renderDashboard(data) {
    const o = data.overview || {};
    const monthTotal = Number(o.pandu_month || 0) + Number(o.kanthu_month || 0) + Number(o.ayul_month || 0);
    set('monthTotal', money(monthTotal)); set('companyBalance', money(o.company_balance)); set('heroCompanyBalance', money(o.company_balance));
    set('memberCount', number(o.members)); set('panduPending', number(o.pandu_pending));
    set('panduHealth', `Monthly collection ${money(o.pandu_month)}`); set('panduHealthAmount', money(o.pandu_month));
    set('kanthuHealth', `${number(o.active_kanthu)} active loan${Number(o.active_kanthu) === 1 ? '' : 's'}`); set('kanthuHealthAmount', money(o.kanthu_balance));
    set('ayulHealth', `${number(o.active_ayul)} active loan${Number(o.active_ayul) === 1 ? '' : 's'}`); set('ayulHealthAmount', money(o.ayul_balance));
    renderChart(data.monthly || []); renderLedger(data.recent || []);
  }

  function renderChart(rows) {
    const canvas = document.getElementById('collectionChart'); if (!canvas || !window.Chart) return;
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const labels = rows.map((row, index) => row.month_name || monthNames[Number(row.month_no || index + 1) - 1]);
    if (window.executiveCollectionChart) window.executiveCollectionChart.destroy();
    window.executiveCollectionChart = new Chart(canvas.getContext('2d'), {type:'bar', data:{labels, datasets:[
      {label:'Pandu',data:rows.map(row => Number(row.pandu || 0)),backgroundColor:'#2d6cec',borderRadius:6,borderSkipped:false},
      {label:'Kanthu',data:rows.map(row => Number(row.kanthu || 0)),backgroundColor:'#0cab86',borderRadius:6,borderSkipped:false},
      {label:'Ayul Santha',data:rows.map(row => Number(row.ayul || 0)),backgroundColor:'#ac5ae2',borderRadius:6,borderSkipped:false}
    ]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx => `${ctx.dataset.label}: ${money(ctx.raw)}`}}},scales:{x:{grid:{display:false},ticks:{color:'#72839b',font:{size:10,weight:'700'}}},y:{beginAtZero:true,grid:{color:'#edf1f6'},ticks:{color:'#8797ad',font:{size:9},callback:value => money(value)}}}}});
  }

  function renderLedger(rows) {
    const holder = document.getElementById('recentLedger');
    if (!rows.length) { holder.innerHTML = '<p>No recent company-account activity.</p>'; return; }
    holder.innerHTML = rows.map(row => {
      const incoming = row.transaction_type === 'CREDIT';
      const date = new Date(`${row.transaction_date}T00:00:00`).toLocaleDateString('en-IN',{day:'2-digit',month:'short'});
      return `<div class="ledger-item"><span class="ledger-icon ${incoming ? 'in' : 'out'}"><i class="bi bi-${incoming ? 'arrow-down-left' : 'arrow-up-right'}"></i></span><div><b>${escapeHtml(row.category || 'Ledger entry')}</b><small>${date} · ${escapeHtml(row.payment_mode || 'CASH')}</small></div><span class="ledger-amount ${incoming ? 'in' : 'out'}">${incoming ? '+' : '−'}${money(row.amount)}</span></div>`;
    }).join('');
  }
  function escapeHtml(v) { return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
});
