document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('settlementSearch');
  const dropdown = document.getElementById('settlementDropdown');
  const clear = document.getElementById('clearSettlementSearch');
  const settleButton = document.getElementById('settlePandu');
  const eligibleBody = document.getElementById('eligibleMembersBody');
  const eligibleCount = document.getElementById('eligibleMemberCount');
  let requestNumber = 0;
  let assignmentId = null;
  let payableAmount = 0;

  const updateClearButton = () => clear.classList.toggle('visible', Boolean(input.value));
  const hide = () => { dropdown.style.display = 'none'; input.setAttribute('aria-expanded', 'false'); };
  const show = () => { dropdown.style.display = 'block'; input.setAttribute('aria-expanded', 'true'); };
  const render = members => {
    dropdown.replaceChildren();
    if (!members.length) {
      dropdown.innerHTML = '<div class="member-item"><strong>No members found</strong><span>Try a different search term.</span></div>';
    } else {
      members.forEach(member => {
        const item = document.createElement('button');
        item.type = 'button'; item.className = 'member-item'; item.setAttribute('role', 'option');
        item.innerHTML = `<strong>${member.member_name}</strong><span>${member.member_code} · ${member.mobile || 'No mobile'}${member.aadhaar_masked ? ` · Aadhaar ${member.aadhaar_masked}` : ''}</span>`;
        item.addEventListener('click', () => selectMember(member));
        dropdown.appendChild(item);
      });
    }
    show();
  };
  const search = async () => {
    updateClearButton();
    const query = input.value.trim(); const currentRequest = ++requestNumber;
    if (!query) { hide(); return; }
    dropdown.innerHTML = '<div class="member-item"><strong>Searching members…</strong></div>'; show();
    try {
      const response = await fetch(`/api/member-search?q=${encodeURIComponent(query)}`, { cache: 'no-store' });
      if (!response.ok) throw new Error();
      const members = await response.json();
      if (currentRequest === requestNumber) render(members);
    } catch {
      if (currentRequest === requestNumber) { dropdown.innerHTML = '<div class="member-item"><strong>Unable to search members</strong><span>Please try again.</span></div>'; show(); }
    }
  };
  const selectMember = async member => {
    input.value = member.member_name;
    updateClearButton();
    hide();
    document.getElementById('settlementMemberLabel').textContent = `${member.member_name} (${member.member_code})`;
    document.getElementById('settlementStatus').textContent = 'Checking eligibility';
    document.getElementById('settlementStatus').className = 'settlement-status';
    try {
      const response = await fetch(`/api/member/${member.id}/pandu-settlement`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'No active Pandu assignment found.');
      const money = value => `₹${Number(value || 0).toLocaleString('en-IN')}`;
      assignmentId = data.assignment_id;
      payableAmount = data.settlement_amount || 0;
      document.getElementById('contributionLabel').textContent = `Total contribution (${money(data.group_monthly_due / data.pandu_count)} × ${data.pandu_count} × ${data.duration_months})`;
      document.getElementById('totalAmount').textContent = money(data.total_amount);
      document.getElementById('benefitAmount').textContent = money(payableAmount - data.total_amount);
      document.getElementById('paidAmount').textContent = money(data.paid_amount);
      document.getElementById('balanceAmount').textContent = money(data.balance_amount);
      document.getElementById('maturityAmount').textContent = money(payableAmount);
      const ready = Boolean(data.ready_to_settle);
      document.getElementById('payableNow').textContent = money(ready ? payableAmount : 0);
      document.getElementById('settlementStatus').textContent = ready ? 'Ready to settle' : 'Pending balance';
      document.getElementById('settlementStatus').className = `settlement-status ${ready ? 'ready' : 'pending'}`;
      document.getElementById('settlementRule').textContent = ready ? 'All dues are cleared. This maturity amount can be settled now.' : 'Clear the balance amount before settlement.';
      settleButton.disabled = !ready;
    } catch (error) {
      assignmentId = null;
      payableAmount = 0;
      settleButton.disabled = true;
      document.getElementById('payableNow').textContent = '₹0';
      document.getElementById('settlementStatus').textContent = 'Settlement unavailable';
      document.getElementById('settlementStatus').className = 'settlement-status pending';
      document.getElementById('settlementRule').textContent = error.message;
    }
  };
  const loadEligibleMembers = async () => {
    try {
      const response = await fetch('/api/pandu-settlement-eligible-members', { cache: 'no-store' });
      if (!response.ok) throw new Error();
      const members = await response.json();
      eligibleCount.textContent = `${members.length} ${members.length === 1 ? 'member' : 'members'}`;
      if (!members.length) {
        eligibleBody.innerHTML = '<tr><td colspan="5" class="eligible-empty">No members are currently eligible for settlement.</td></tr>';
        return;
      }
      const money = value => `₹${Number(value || 0).toLocaleString('en-IN')}`;
      eligibleBody.innerHTML = '';
      members.forEach(member => {
        const row = document.createElement('tr');
        row.innerHTML = `<td><span class="eligible-member-name">${member.member_name}</span><span class="eligible-member-code">${member.member_code}</span></td><td>${member.group_name}</td><td class="amount">${money(member.total_amount)}</td><td class="amount">${money(member.settlement_amount)}</td><td class="action"><button type="button" class="eligible-select">Select</button></td>`;
        row.querySelector('button').addEventListener('click', () => selectMember({ id: member.member_id, member_name: member.member_name, member_code: member.member_code }));
        eligibleBody.appendChild(row);
      });
    } catch {
      eligibleCount.textContent = 'Unavailable';
      eligibleBody.innerHTML = '<tr><td colspan="5" class="eligible-empty">Unable to load eligible members.</td></tr>';
    }
  };
  input.addEventListener('input', search);
  input.addEventListener('focus', () => { if (input.value.trim()) search(); });
  clear.addEventListener('click', () => { input.value = ''; updateClearButton(); hide(); input.focus(); });
  settleButton.addEventListener('click', async () => {
    if (!assignmentId || settleButton.disabled) return;
    settleButton.disabled = true;
    settleButton.querySelector('span').textContent = 'Processing…';
    try {
      const response = await fetch(`/api/pandu-settlement/${assignmentId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: payableAmount }) });
      const result = await response.json();
      if (!result.success) throw new Error(result.message || 'Settlement failed.');
      alert(result.message || 'Pandu settled successfully.');
      window.location.reload();
    } catch (error) {
      alert(error.message || 'Settlement failed.');
      settleButton.disabled = false;
      settleButton.querySelector('span').textContent = 'Settle Pandu';
    }
  });
  document.addEventListener('click', event => { if (!event.target.closest('.collection-search-field')) hide(); });
  updateClearButton();
  loadEligibleMembers();
});
