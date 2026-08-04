document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('ayulMemberSearch');
  const dropdown = document.getElementById('ayulMemberDropdown');
  const hint = document.getElementById('ayulSearchHint');
  const selectedMember = document.getElementById('ayulSelectedMember');
  const issueButton = document.getElementById('ayulIssueButton');
  const principal = document.getElementById('ayulPrincipal');
  const interest = document.getElementById('ayulInterestAmount');
  const interestRate = document.getElementById('ayulInterestRate');
  const payable = document.getElementById('ayulPrincipalPayable');
  const monthlyInterest = document.getElementById('ayulMonthlyInterest');
  let selectedMemberId = null;
  document.getElementById('ayulIssueDate').value = new Date().toISOString().split('T')[0];

  input.addEventListener('input', async () => {
    const query = input.value.trim();
    if (!query) {
      dropdown.classList.remove('show');
      return;
    }

    try {
      const response = await fetch(`/api/member-search?q=${encodeURIComponent(query)}`);
      const members = await response.json();
      dropdown.innerHTML = members.length
        ? members.map(member => `<button type="button"><strong>${member.member_code} - ${member.member_name}</strong><span>${member.mobile || 'No mobile'} - Aadhaar ${member.aadhaar_masked || '-'}</span></button>`).join('')
        : '<div class="aw-no-result">No matching member found.</div>';

      dropdown.querySelectorAll('button').forEach((button, index) => {
        button.onclick = () => {
          const member = members[index];
          selectedMemberId = member.id;
          input.value = member.member_name;
          hint.textContent = `Selected member: ${member.member_name} (${member.member_code})`;
          selectedMember.textContent = member.member_name;
          issueButton.disabled = false;
          issueButton.innerHTML = '<i class="bi bi-check2-circle"></i> Issue Ayul Santha';
          dropdown.classList.remove('show');
        };
      });
      dropdown.classList.add('show');
    } catch (error) {
      dropdown.innerHTML = '<div class="aw-no-result">Member search is temporarily unavailable.</div>';
      dropdown.classList.add('show');
    }
  });

  document.getElementById('ayulClearSearch').onclick = () => {
    input.value = '';
    hint.textContent = 'Start typing to search community members.';
    dropdown.classList.remove('show');
    input.focus();
  };
  document.addEventListener('click', event => {
    if (!event.target.closest('.aw-member-search')) dropdown.classList.remove('show');
  });

  const formatAmount = value => `₹${Number(value || 0).toLocaleString('en-IN')}`;
  const calculateInterest = () => {
    const calculated = (Number(principal.value) || 0) * (Number(interestRate.value) || 0) / 100;
    interest.value = calculated ? calculated.toFixed(2) : '';
    payable.textContent = formatAmount(principal.value);
    monthlyInterest.textContent = formatAmount(calculated);
  };
  principal.addEventListener('input', calculateInterest);
  interestRate.addEventListener('input', calculateInterest);

  issueButton.addEventListener('click', async () => {
    const principalAmount = Number(principal.value);
    if (!selectedMemberId || principalAmount <= 0) {
      alert('Select a member and enter a valid principal amount.');
      return;
    }

    issueButton.disabled = true;
    issueButton.innerHTML = '<i class="bi bi-arrow-repeat"></i> Saving issue...';
    try {
      const response = await fetch('/api/ayul-santha/issue', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          member_id: selectedMemberId,
          issue_date: document.getElementById('ayulIssueDate').value,
          principal_amount: principalAmount,
          monthly_interest_rate: Number(interestRate.value) || 0,
          monthly_interest_amount: Number(interest.value) || 0,
          remarks: document.getElementById('ayulRemarks').value
        })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.detail || result.message || 'Unable to issue Ayul Santha.');
      const successModal = document.getElementById('ayulSuccessModal');
      successModal.classList.add('show');
      successModal.setAttribute('aria-hidden', 'false');
      window.setTimeout(() => window.location.reload(), 1800);
    } catch (error) {
      alert(error.message || 'Unable to issue Ayul Santha.');
      issueButton.disabled = false;
      issueButton.innerHTML = '<i class="bi bi-check2-circle"></i> Issue Ayul Santha';
    }
  });
});
