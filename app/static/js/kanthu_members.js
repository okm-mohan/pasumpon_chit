let selectedMember = null;

const searchBox =
document.getElementById("memberSearch");

searchBox.addEventListener("keyup", async () => {

let q = searchBox.value;

if(q.length < 2) return;

let res =
await fetch(
`/api/kanthu-member-search?search=${q}`
);

let data = await res.json();

let html = "";

data.forEach(m => {

html += `
<div class="search-item"
onclick="loadMember(${m.id})">

${m.member_name}
<br>
<small>${m.mobile}</small>

</div>
`;

});

document.getElementById(
"searchResults"
).innerHTML = html;

});

async function loadMember(memberId){

selectedMember = memberId;

document.getElementById(
"searchResults"
).innerHTML = "";

let member =
await fetch(`/api/member/${memberId}`);

member = await member.json();

document.getElementById(
"memberName"
).innerHTML = member.member_name;

document.getElementById(
"memberCode"
).innerHTML = member.member_code;

document.getElementById(
"memberMobile"
).innerHTML = member.mobile;

document.getElementById(
"memberVillage"
).innerHTML = member.village;

document.getElementById(
"memberInitial"
).innerHTML =
member.member_name.charAt(0);

loadSummary(memberId);
loadIssues(memberId);
loadCollections(memberId);

}

async function loadSummary(memberId){

let res =
await fetch(
`/api/member-kanthu-summary/${memberId}`
);

let data = await res.json();

document.getElementById(
"activeKanthus"
).innerHTML =
data.active_kanthus;

document.getElementById(
"totalGiven"
).innerHTML =
"₹" +
Number(data.total_given).toLocaleString();

document.getElementById(
"totalCollection"
).innerHTML =
"₹" +
Number(data.total_collected).toLocaleString();

document.getElementById(
"outstanding"
).innerHTML =
"₹" +
Number(data.outstanding).toLocaleString();

let percentage = 0;

if(data.total_given > 0){

percentage =
Math.round(
(data.total_collected /
data.total_given) * 100
);

}

document.getElementById(
"progressValue"
).innerHTML =
percentage + "%";

document.querySelector(".circle")
.style.background =
`conic-gradient(
#2563eb ${percentage*3.6}deg,
#e5e7eb 0deg
)`;

}

async function loadIssues(memberId){

let res =
await fetch(
`/api/member-kanthu-issues/${memberId}`
);

let rows = await res.json();

let html="";

rows.forEach(r=>{

html += `
<tr>

<td>${r.kanthu_no}</td>

<td>${r.issue_date}</td>

<td>₹${Number(r.principal_amount).toLocaleString()}</td>

<td>₹${Number(r.balance_amount).toLocaleString()}</td>

</tr>
`;

});

document.getElementById(
"issueTable"
).innerHTML = html;

}

async function loadCollections(memberId){

let res =
await fetch(
`/api/member-kanthu-collections/${memberId}`
);

let rows = await res.json();

let html="";

rows.forEach(r=>{

html += `
<tr>

<td>${r.transaction_date}</td>

<td>${r.kanthu_no}</td>

<td>₹${Number(r.amount).toLocaleString()}</td>

</tr>
`;

});

document.getElementById(
"collectionTable"
).innerHTML = html;

}


let deg = percentage * 3.6;

document.querySelector(".circle")
.style.setProperty(
"--progress",
deg + "deg"
);