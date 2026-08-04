const kanthuMoney = value => `₹${Number(value || 0).toLocaleString('en-IN', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
let issuedPersons = [];

document.addEventListener('DOMContentLoaded', async () => {
  const search = document.getElementById('kanthuIssuedSearch');
  search.addEventListener('input', renderIssuedPersons);
  document.getElementById('clearKanthuIssuedSearch').addEventListener('click', () => { search.value = ''; renderIssuedPersons(); search.focus(); });
  try {
    const response = await fetch('/api/kanthu-dashboard', {cache: 'no-store'});
    const data = await response.json();
    document.getElementById('totalKanthu').textContent = kanthuMoney(data.summary.total_kanthu);
    document.getElementById('interestEarned').textContent = kanthuMoney(data.summary.interest);
    document.getElementById('totalCollection').textContent = kanthuMoney(data.summary.collection);
    document.getElementById('outstandingAmount').textContent = kanthuMoney(data.summary.outstanding);
  } catch (error) { console.error('Unable to load Kanthu dashboard', error); }
  loadIssuedPersons();
});

async function loadIssuedPersons() {
  const body = document.getElementById('kanthuIssuedRows');
  try { const response = await fetch('/api/kanthu-issued-persons', {cache: 'no-store'}); issuedPersons = await response.json(); renderIssuedPersons(); }
  catch { body.innerHTML = '<tr><td colspan="8" class="kanthu-table-empty">Unable to load issued Kanthu persons.</td></tr>'; }
}

function renderIssuedPersons() {
  const body = document.getElementById('kanthuIssuedRows');
  const query = (document.getElementById('kanthuIssuedSearch')?.value || '').trim().toLowerCase();
  const loans = issuedPersons.filter(loan => [loan.member_name, loan.member_code, loan.mobile, loan.aadhaar_no].some(value => String(value || '').toLowerCase().includes(query)));
  if (!issuedPersons.length) { body.innerHTML = '<tr><td colspan="8" class="kanthu-table-empty">No Kanthu loans have been issued yet.</td></tr>'; return; }
  if (!loans.length) { body.innerHTML = '<tr><td colspan="8" class="kanthu-table-empty">No issued Kanthu member matches this search.</td></tr>'; return; }
  body.innerHTML = loans.map(loan => `<tr><td class="kanthu-member-cell"><strong>${loan.member_name}</strong><small>${loan.member_code} · ${loan.mobile || 'No mobile'}</small></td><td>${loan.loan_count} ${loan.loan_count === 1 ? 'loan' : 'loans'}</td><td>${loan.latest_issue_date || '—'}</td><td class="amount kanthu-value issue">${kanthuMoney(loan.principal_amount)}</td><td class="amount kanthu-value interest">${kanthuMoney(loan.interest_amount)}</td><td class="amount kanthu-value return">${kanthuMoney(loan.total_collected)}</td><td class="amount kanthu-value balance">${kanthuMoney(loan.balance_amount)}</td><td><span class="kanthu-loan-status ${String(loan.status).toLowerCase()}">${loan.status === 'CLOSED' ? 'Closed' : 'Active'}</span></td></tr>`).join('');
}
