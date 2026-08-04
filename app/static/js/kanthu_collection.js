let kcMemberId = null;
let kcLoans = [];

const money = value => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const safe = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;', "'":'&#039;' }[char]));

document.addEventListener('DOMContentLoaded', () => {
  const search = document.getElementById('kanthuCollectionSearch');
  const date = new Date();
  document.getElementById('kcCurrentDate').textContent = date.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
  document.getElementById('kcYear').textContent = date.getFullYear();
  document.getElementById('kcCollectionDate').value = date.toISOString().slice(0, 10);
  search.addEventListener('input', searchKanthuMembers);
  search.addEventListener('keydown', event => { if (event.key === 'Escape') clearKanthuSearch(); });
  document.getElementById('clearKanthuSearch').addEventListener('click', clearKanthuSearch);
  document.getElementById('kcLoanSelect').addEventListener('change', updateLoanSelection);
  document.getElementById('kcPaymentForm').addEventListener('submit', saveKanthuCollection);
  document.addEventListener('click', event => { if (!event.target.closest('.kc-search-card')) closeDropdown(); });
});

async function searchKanthuMembers() {
  const query = document.getElementById('kanthuCollectionSearch').value.trim();
  const dropdown = document.getElementById('kanthuCollectionDropdown');
  if (!query) return closeDropdown();
  try {
    const response = await fetch(`/api/kanthu-member-search?search=${encodeURIComponent(query)}`);
    const members = await response.json();
    dropdown.innerHTML = members.length ? members.map(member => `<button type="button" class="kc-member-option" data-id="${member.id}"><span class="kc-member-result-copy"><strong>${safe(member.member_code)} · ${safe(member.member_name)}</strong><span>${safe(member.mobile || 'No mobile')} · Aadhaar ${safe(member.aadhaar_masked || '—')}</span></span>${!Number(member.has_active_kanthu) ? '<span class="kc-no-kanthu-badge">No active Kanthu</span>' : '<span class="kc-active-kanthu-badge">Active Kanthu</span>'}</button>`).join('') : '<div class="kc-no-results">No matching members found.</div>';
    dropdown.querySelectorAll('.kc-member-option').forEach(option => option.addEventListener('click', () => selectKanthuMember(Number(option.dataset.id))));
    dropdown.classList.add('show');
    document.getElementById('kanthuCollectionSearch').setAttribute('aria-expanded', 'true');
  } catch (_) { dropdown.innerHTML = '<div class="kc-no-results">Unable to search members. Please try again.</div>'; dropdown.classList.add('show'); }
}

function closeDropdown() { document.getElementById('kanthuCollectionDropdown').classList.remove('show'); document.getElementById('kanthuCollectionSearch').setAttribute('aria-expanded', 'false'); }
function clearKanthuSearch() { const input = document.getElementById('kanthuCollectionSearch'); input.value = ''; closeDropdown(); input.focus(); }

async function selectKanthuMember(memberId) {
  kcMemberId = memberId;
  closeDropdown();
  const input = document.getElementById('kanthuCollectionSearch');
  try {
    const [memberResponse, loansResponse, collectionsResponse] = await Promise.all([fetch(`/api/member/${memberId}`), fetch(`/api/member-active-kanthus/${memberId}`), fetch(`/api/member-kanthu-collections/${memberId}`)]);
    const member = await memberResponse.json(); kcLoans = await loansResponse.json(); const collections = await collectionsResponse.json();
    input.value = member.member_name || '';
    document.getElementById('kcMemberName').textContent = member.member_name || 'Selected member';
    document.getElementById('kcMemberMeta').textContent = `${member.member_code || '—'} · ${member.mobile || 'No mobile'} · Aadhaar ${member.aadhaar_masked || '—'}`;
    document.getElementById('kcMemberPill').innerHTML = '<i class="bi bi-patch-check-fill"></i> Member selected';
    renderLoans(); renderCollections(collections); enablePayment(kcLoans.length > 0);
  } catch (_) { alert('Unable to load this member’s Kanthu details.'); }
}

function renderLoans() {
  const totalPrincipal = kcLoans.reduce((sum, loan) => sum + Number(loan.principal_amount || 0), 0);
  const totalCollected = kcLoans.reduce((sum, loan) => sum + Number(loan.total_collected || 0), 0);
  const totalBalance = kcLoans.reduce((sum, loan) => sum + Number(loan.balance_amount || 0), 0);
  document.getElementById('kcActiveLoans').textContent = kcLoans.length;
  document.getElementById('kcPrincipalIssued').textContent = money(totalPrincipal);
  document.getElementById('kcTotalCollected').textContent = money(totalCollected);
  document.getElementById('kcOutstanding').textContent = money(totalBalance);
  const body = document.getElementById('kcLoansBody');
  body.innerHTML = kcLoans.length ? kcLoans.map(loan => `<tr><td><strong>${safe(loan.kanthu_no)}</strong></td><td>${safe(loan.issue_date)}</td><td>${money(loan.principal_amount)}</td><td class="kc-paid">${money(loan.total_collected)}</td><td class="kc-balance">${money(loan.balance_amount)}</td><td><button type="button" class="kc-collect-loan" data-id="${loan.id}">Collect</button></td></tr>`).join('') : '<tr class="kc-empty"><td colspan="6"><i class="bi bi-wallet2"></i><strong>No active Kanthu loans</strong><span>This member has no balance available for collection.</span></td></tr>';
  body.querySelectorAll('.kc-collect-loan').forEach(button => button.addEventListener('click', () => { document.getElementById('kcLoanSelect').value = button.dataset.id; updateLoanSelection(); document.getElementById('kcPaymentCard').scrollIntoView({ behavior:'smooth', block:'nearest' }); }));
  const select = document.getElementById('kcLoanSelect');
  select.innerHTML = kcLoans.length ? '<option value="ALL">All active Kanthus · automatic allocation</option>' + kcLoans.map(loan => `<option value="${loan.id}">${safe(loan.kanthu_no)} · Balance ${money(loan.balance_amount)}</option>`).join('') : '<option value="">No active Kanthu loans</option>';
  if (kcLoans.length) {
    select.value = 'ALL';
    updateLoanSelection();
  }
}

function renderCollections(collections) { document.getElementById('kcCollectionsList').innerHTML = collections.length ? collections.slice(0, 5).map(item => `<div class="kc-log-row"><div><strong>${safe(item.kanthu_no)}</strong><span>${safe(item.transaction_date)}${item.remarks ? ` · ${safe(item.remarks)}` : ''}</span></div><b>${money(item.amount)}</b></div>`).join('') : '<span class="kc-muted">No collection recorded yet.</span>'; }
function enablePayment(enabled) { ['kcLoanSelect','kcCollectionAmount','kcCollectionDate','kcPaymentMode','kcRemarks','saveKanthuCollection'].forEach(id => document.getElementById(id).disabled = !enabled); }
function updateLoanSelection() {
  const selectedValue = document.getElementById('kcLoanSelect').value;
  const isAll = selectedValue === 'ALL';
  const loan = kcLoans.find(item => String(item.id) === selectedValue);
  const principal = isAll ? kcLoans.reduce((sum, item) => sum + Number(item.principal_amount || 0), 0) : loan?.principal_amount;
  const balance = isAll ? kcLoans.reduce((sum, item) => sum + Number(item.balance_amount || 0), 0) : loan?.balance_amount;
  document.getElementById('kcLoanPrincipal').textContent = money(principal);
  document.getElementById('kcLoanBalance').textContent = money(balance);
  document.getElementById('kcCollectionAmount').max = balance ? String(balance) : '';
  document.querySelector('.kc-amount-group small').textContent = isAll ? 'Payment will be adjusted to the oldest active Kanthu balance first.' : 'Partial payment is allowed up to the selected loan balance.';
  if (selectedValue) document.getElementById('kcCollectionAmount').focus();
}

async function saveKanthuCollection(event) {
  event.preventDefault(); const selectedValue = document.getElementById('kcLoanSelect').value; const amount = Number(document.getElementById('kcCollectionAmount').value); const isAll = selectedValue === 'ALL'; const loan = kcLoans.find(item => item.id === Number(selectedValue));
  const availableBalance = isAll ? kcLoans.reduce((sum, item) => sum + Number(item.balance_amount || 0), 0) : Number(loan?.balance_amount || 0);
  if ((!isAll && !loan) || !amount || amount <= 0) return alert('Choose a Kanthu loan and enter a valid collection amount.');
  if (amount > availableBalance) return alert(`Amount cannot exceed the balance of ${money(availableBalance)}.`);
  const button = document.getElementById('saveKanthuCollection'); button.disabled = true; button.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Saving…';
  try {
    let remaining = amount;
    const allocations = isAll ? [...kcLoans].sort((a, b) => String(a.issue_date).localeCompare(String(b.issue_date)) || Number(a.id) - Number(b.id)).map(item => { const paid = Math.min(remaining, Number(item.balance_amount)); remaining -= paid; return { id:item.id, amount:paid }; }).filter(item => item.amount > 0) : [{ id:loan.id, amount }];
    for (const allocation of allocations) {
      const response = await fetch('/api/kanthu/collection/save', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ kanthu_id:allocation.id, collection_date:document.getElementById('kcCollectionDate').value, amount:allocation.amount, payment_mode:document.getElementById('kcPaymentMode').value, remarks:document.getElementById('kcRemarks').value.trim() }) });
      const result = await response.json(); if (!result.success) throw new Error(result.message || 'Unable to save collection.');
    }
    alert('Kanthu collection saved successfully.'); selectKanthuMember(kcMemberId); document.getElementById('kcCollectionAmount').value = ''; document.getElementById('kcRemarks').value = '';
  } catch (error) { alert(error.message || 'Unable to save collection.'); } finally { button.disabled = false; button.innerHTML = '<i class="bi bi-check2-circle"></i> Save collection'; } }
