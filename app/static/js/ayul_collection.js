let acMemberId = null;
let acLoans = [];
const acMoney = value => `₹${Number(value || 0).toLocaleString('en-IN', {maximumFractionDigits: 2})}`;
const acSafe = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[character]));

document.addEventListener('DOMContentLoaded', () => {
  const today = new Date();
  document.getElementById('acCurrentDate').textContent = today.toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'numeric'});
  document.getElementById('acYear').textContent = today.getFullYear();
  document.getElementById('acCollectionDate').value = today.toISOString().slice(0,10);
  document.getElementById('ayulCollectionSearch').addEventListener('input', acSearch);
  document.getElementById('ayulCollectionClear').addEventListener('click', acClearSearch);
  document.getElementById('acLoanSelect').addEventListener('change', acUpdateLoan);
  document.getElementById('acPaymentForm').addEventListener('submit', acSaveCollection);
  document.addEventListener('click', event => {if (!event.target.closest('.kc-search-card')) acCloseDropdown();});
});

async function acSearch() {
  const input = document.getElementById('ayulCollectionSearch'); const dropdown = document.getElementById('ayulCollectionDropdown'); const query = input.value.trim();
  if (!query) return acCloseDropdown();
  try {
    const members = await (await fetch(`/api/ayul-santha/member-search?q=${encodeURIComponent(query)}`)).json();
    dropdown.innerHTML = members.length ? members.map(member => `<button class="kc-member-option" type="button" data-id="${member.id}"><span class="kc-member-result-copy"><strong>${acSafe(member.member_code)} - ${acSafe(member.member_name)}</strong><span>${acSafe(member.mobile || 'No mobile')} - Aadhaar ${acSafe(member.aadhaar_masked || '-')}</span></span><span class="${Number(member.has_active_ayul) ? 'ac-ayul-badge' : 'ac-no-ayul-badge'}">${Number(member.has_active_ayul) ? 'Ayul Santha member' : 'No Ayul Santha'}</span></button>`).join('') : '<div class="kc-no-results">No matching members found.</div>';
    dropdown.querySelectorAll('.kc-member-option').forEach(button => button.onclick = () => acSelectMember(Number(button.dataset.id)));
    dropdown.classList.add('show');
  } catch { dropdown.innerHTML='<div class="kc-no-results">Unable to search members. Please try again.</div>'; dropdown.classList.add('show'); }
}
function acCloseDropdown(){document.getElementById('ayulCollectionDropdown').classList.remove('show');}
function acClearSearch(){const input=document.getElementById('ayulCollectionSearch');input.value='';acCloseDropdown();input.focus();}
async function acSelectMember(memberId) {
  acMemberId=memberId; acCloseDropdown();
  try {
    const [memberResponse, loansResponse, collectionResponse] = await Promise.all([fetch(`/api/member/${memberId}`),fetch(`/api/member-active-ayul-santha/${memberId}`),fetch(`/api/member-ayul-collections/${memberId}`)]);
    const member=await memberResponse.json(); acLoans=await loansResponse.json(); const collections=await collectionResponse.json();
    document.getElementById('ayulCollectionSearch').value=member.member_name || '';
    document.getElementById('acMemberName').textContent=member.member_name || 'Selected member';
    document.getElementById('acMemberMeta').textContent=`${member.member_code || '-'} - ${member.mobile || 'No mobile'} - Aadhaar ${member.aadhaar_masked || '-'}`;
    document.getElementById('acMemberPill').innerHTML='<i class="bi bi-patch-check-fill"></i> Member selected';
    acRenderLoans(); acRenderCollections(collections); acEnablePayment(acLoans.length > 0);
  } catch { alert('Unable to load this member’s Ayul Santha details.'); }
}
function acRenderLoans(){
  const principal=acLoans.reduce((sum,loan)=>sum+Number(loan.principal_amount||0),0), interest=acLoans.reduce((sum,loan)=>sum+Number(loan.total_interest_received||0),0), balance=acLoans.reduce((sum,loan)=>sum+Number(loan.balance_principal||0),0);
  document.getElementById('acActiveLoans').textContent=acLoans.length; document.getElementById('acPrincipalIssued').textContent=acMoney(principal); document.getElementById('acInterestReceived').textContent=acMoney(interest); document.getElementById('acBalancePrincipal').textContent=acMoney(balance);
  const body=document.getElementById('acLoansBody');
  body.innerHTML=acLoans.length?acLoans.map(loan=>`<tr><td><strong>${acSafe(loan.ayul_no)}</strong></td><td>${acSafe(loan.issue_date)}</td><td>${acMoney(loan.principal_amount)}</td><td class="kc-paid">${acMoney(loan.total_interest_received)}</td><td class="kc-balance">${acMoney(loan.balance_principal)}</td><td><button class="kc-collect-loan" type="button" data-id="${loan.id}">Collect</button></td></tr>`).join(''):'<tr class="kc-empty"><td colspan="6"><i class="bi bi-wallet2"></i><strong>No active Ayul Santha loans</strong><span>This member has no active balance available for collection.</span></td></tr>';
  body.querySelectorAll('.kc-collect-loan').forEach(button=>button.onclick=()=>{document.getElementById('acLoanSelect').value=button.dataset.id;acUpdateLoan();document.getElementById('acPaymentCard').scrollIntoView({behavior:'smooth',block:'nearest'});});
  const select=document.getElementById('acLoanSelect'); select.innerHTML=acLoans.length?acLoans.map(loan=>`<option value="${loan.id}">${acSafe(loan.ayul_no)} - Balance ${acMoney(loan.balance_principal)}</option>`).join(''):'<option value="">No active loans</option>'; if(acLoans.length){select.value=String(acLoans[0].id);acUpdateLoan();}
}
function acRenderCollections(items){document.getElementById('acCollectionsList').innerHTML=items.length?items.map(item=>`<div class="kc-log-row"><div><strong>${acSafe(item.ayul_no)}</strong><span>${acSafe(item.collection_date)}${item.remarks?` - ${acSafe(item.remarks)}`:''}</span></div><b>${acMoney(Number(item.interest_amount)+Number(item.principal_amount))}</b></div>`).join(''):'<span class="kc-muted">No collection recorded yet.</span>';}
function acEnablePayment(enabled){['acLoanSelect','acInterestAmount','acPrincipalAmount','acCollectionDate','acPaymentMode','acRemarks','saveAyulCollection'].forEach(id=>document.getElementById(id).disabled=!enabled);}
function acUpdateLoan(){const loan=acLoans.find(item=>String(item.id)===document.getElementById('acLoanSelect').value);document.getElementById('acInterestDue').textContent=acMoney(loan?.monthly_interest_amount);document.getElementById('acLoanBalance').textContent=acMoney(loan?.balance_principal);document.getElementById('acInterestAmount').value=loan?.monthly_interest_amount||'';document.getElementById('acPrincipalAmount').max=loan?.balance_principal||'';}
async function acSaveCollection(event){event.preventDefault();const loan=acLoans.find(item=>String(item.id)===document.getElementById('acLoanSelect').value),interest=Number(document.getElementById('acInterestAmount').value)||0,principal=Number(document.getElementById('acPrincipalAmount').value)||0;if(!loan||(interest+principal)<=0)return alert('Choose a loan and enter a collection amount.');const button=document.getElementById('saveAyulCollection');button.disabled=true;button.innerHTML='<span class="spinner-border spinner-border-sm"></span> Saving...';try{const response=await fetch('/api/ayul-santha/collection',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ayul_santha_id:loan.id,collection_date:document.getElementById('acCollectionDate').value,interest_amount:interest,principal_amount:principal,payment_mode:document.getElementById('acPaymentMode').value,remarks:document.getElementById('acRemarks').value.trim()})}),result=await response.json();if(!result.success)throw new Error(result.message);const modal=document.getElementById('acSuccessModal');modal.classList.add('show');window.setTimeout(()=>{modal.classList.remove('show');acSelectMember(acMemberId);},1500);document.getElementById('acPrincipalAmount').value='';}catch(error){alert(error.message||'Unable to save collection.');}finally{button.disabled=false;button.innerHTML='<i class="bi bi-check2-circle"></i> Save collection';}}
