document.addEventListener("DOMContentLoaded", () => {
    const money = new Intl.NumberFormat("en-IN", { style:"currency", currency:"INR", maximumFractionDigits:0 });
    const number = new Intl.NumberFormat("en-IN");
    const setText = (id,value) => { const element=document.getElementById(id); if(element) element.textContent=value; };
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    Promise.allSettled([
        fetch("/api/pandu-dashboard").then(response => { if(!response.ok) throw new Error(); return response.json(); }),
        fetch(`/api/pandu-collection-summary?year=${window.PANDU_YEAR}`).then(response => { if(!response.ok) throw new Error(); return response.json(); }),
        fetch("/api/pandu-details/recent").then(response => { if(!response.ok) throw new Error(); return response.json(); }),
        fetch("/api/pandu-details/summary").then(response => { if(!response.ok) throw new Error(); return response.json(); })
    ]).then(([dashboardResult, monthlyResult, recentResult, detailResult]) => {
        if(dashboardResult.status === "fulfilled") {
            const data=dashboardResult.value;
            setText("panduTotalAmount",money.format(data.total_amount||0));
            setText("panduCollected",money.format(data.collected_amount||0));
            setText("panduBalance",money.format(data.balance_amount||0));
            setText("panduMembers",number.format(data.total_members||0));
            setText("panduProgressLabel",`${Number(data.percentage||0).toFixed(1)}% of annual target collected`);
            setText("panduMonthCollection",money.format(data.current_month||0));
            setText("panduTodayCollection",money.format(data.today_collection||0));
            setText("panduPaidMembers",number.format(data.paid_members||0));
            setText("panduPendingMembers",number.format(data.pending_members||0));
        }
        if(detailResult.status === "fulfilled") setText("panduUnits",`${number.format(detailResult.value.total_installments||0)} active Pandu units`);
        renderChart(monthlyResult.status === "fulfilled" ? monthlyResult.value : []);
        renderRecent(recentResult.status === "fulfilled" ? recentResult.value : []);
    });

    const track=document.getElementById("panduMonthTrack");
    const currentMonth=new Date().getMonth();
    if(track) track.innerHTML=monthNames.map((month,index)=>`<span class="${index<currentMonth?"past":index===currentMonth?"current":""}">${month}</span>`).join("");

    function renderChart(rows) {
        const canvas=document.getElementById("panduCollectionChart");
        if(!canvas || typeof Chart === "undefined") return;
        new Chart(canvas,{type:"bar",data:{labels:monthNames,datasets:[{label:"Expected",data:rows.map(row=>Number(row.expected)||0),backgroundColor:"#edf0f5",borderRadius:5,barThickness:10},{label:"Collected",data:rows.map(row=>Number(row.collected)||0),backgroundColor:"#d99a20",borderRadius:5,barThickness:10}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"top",align:"end",labels:{usePointStyle:true,boxWidth:7,font:{size:9}}}},scales:{x:{grid:{display:false},ticks:{font:{size:9},color:"#8491a5"}},y:{beginAtZero:true,grid:{color:"#eef1f5"},ticks:{font:{size:9},color:"#8491a5",callback:value=>`₹${Number(value).toLocaleString("en-IN")}`}}}}});
    }

    function renderRecent(rows) {
        const body=document.getElementById("panduRecentRows");
        if(!body) return;
        if(!rows.length) { body.innerHTML='<tr><td colspan="4" class="pandu-empty">No collections have been recorded yet.</td></tr>'; return; }
        body.innerHTML=rows.slice(0,6).map(row=>`<tr><td><span class="receipt-chip">${escapeHtml(row.receipt_no||"—")}</span></td><td><strong>${escapeHtml(row.member_name||"—")}</strong></td><td>${escapeHtml(row.collection_date||"—")}</td><td class="text-end"><strong>${money.format(Number(row.amount)||0)}</strong></td></tr>`).join("");
    }
    function escapeHtml(value) { return String(value).replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]); }
});
