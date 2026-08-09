let reportRows = [], currentPage = 1;
const PAGE_SIZE = 10;
const money = value => `₹${Number(value || 0).toLocaleString('en-IN',{maximumFractionDigits:0})}`;
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));

document.addEventListener('DOMContentLoaded', () => {
  const today = new Date(), from = new Date(today); from.setDate(today.getDate() - 30);
  document.getElementById('fromDate').value = formatInputDate(from);
  document.getElementById('toDate').value = formatInputDate(today);
  document.getElementById('loadReport').addEventListener('click', loadReport);
  loadReport();
});
function formatInputDate(date){ const offset=date.getTimezoneOffset(); return new Date(date.getTime()-offset*60000).toISOString().slice(0,10); }
async function loadReport(){
  const fromDate=document.getElementById('fromDate').value,toDate=document.getElementById('toDate').value;
  if(!fromDate||!toDate||fromDate>toDate){alert('Choose a valid From and To date.');return;}
  const button=document.getElementById('loadReport');button.disabled=true;button.innerHTML='<i class="bi bi-arrow-repeat"></i> Loading…';
  try{const response=await fetch(`/api/datewise-collection-list?from_date=${encodeURIComponent(fromDate)}&to_date=${encodeURIComponent(toDate)}`,{cache:'no-store'});if(!response.ok)throw new Error();reportRows=await response.json();currentPage=1;renderSummary();renderTable();}catch{document.getElementById('reportBody').innerHTML='<tr><td colspan="8" class="dw-empty">Unable to load collection records.</td></tr>';}finally{button.disabled=false;button.innerHTML='<i class="bi bi-search"></i> View report';}
}
function renderSummary(){
  const total=reportRows.reduce((sum,row)=>sum+Number(row.amount||0),0),members=new Set(reportRows.map(row=>row.member_id));
  const pandu=reportRows.filter(row=>row.module==='Pandu').reduce((sum,row)=>sum+Number(row.amount||0),0);
  set('totalCollection',money(total));set('totalMembers',members.size);set('panduCollection',money(pandu));set('lendingCollection',money(total-pandu));set('receiptCount',`${reportRows.length} receipt${reportRows.length===1?'':'s'}`);set('finalTotal',money(total));
}
function renderTable(){
  const totalPages=Math.max(1,Math.ceil(reportRows.length/PAGE_SIZE));currentPage=Math.min(currentPage,totalPages);
  const rows=reportRows.slice((currentPage-1)*PAGE_SIZE,currentPage*PAGE_SIZE),body=document.getElementById('reportBody');
  body.innerHTML=rows.length?rows.map((row,index)=>`<tr><td>${(currentPage-1)*PAGE_SIZE+index+1}</td><td><b>${formatDate(row.collection_date)}</b></td><td><span class="receipt">${escapeHtml(row.receipt_no)}</span></td><td><strong>${escapeHtml(row.member_name)}</strong><small>${escapeHtml(row.member_code)}</small></td><td><span class="module ${row.module==='Pandu'?'pandu':row.module==='Kanthu'?'kanthu':'ayul'}">${escapeHtml(row.module)}</span></td><td>${escapeHtml(row.detail||'—')}</td><td><span class="mode">${escapeHtml(row.payment_mode||'CASH')}</span></td><td class="right amount">${money(row.amount)}</td></tr>`).join(''):'<tr><td colspan="8" class="dw-empty">No collections found in this date range.</td></tr>';
  set('pageInfo',reportRows.length?`Showing ${(currentPage-1)*PAGE_SIZE+1}–${Math.min(currentPage*PAGE_SIZE,reportRows.length)} of ${reportRows.length} collections`:'Showing 0 records');
  const pages=document.getElementById('pagination');pages.innerHTML=Array.from({length:totalPages},(_,i)=>`<button type="button" class="${currentPage===i+1?'active':''}" data-page="${i+1}">${i+1}</button>`).join('');pages.querySelectorAll('button').forEach(button=>button.onclick=()=>{currentPage=Number(button.dataset.page);renderTable();});
}
function formatDate(value){const [year,month,day]=String(value).split('-');return `${day}-${month}-${year}`;}
function set(id,value){const el=document.getElementById(id);if(el)el.textContent=value;}
