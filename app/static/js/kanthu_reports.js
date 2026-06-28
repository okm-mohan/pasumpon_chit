document.addEventListener(
"DOMContentLoaded",
function(){

loadChart();

loadDemoData();

}
);

function loadChart(){

const ctx =
document.getElementById(
'monthlyChart'
);

new Chart(ctx,{

type:'bar',

data:{

labels:[
'Jan','Feb','Mar',
'Apr','May','Jun',
'Jul','Aug','Sep',
'Oct','Nov','Dec'
],

datasets:[{

label:'Collection',

data:[
12000,
15000,
10000,
18000,
22000,
19000,
24000,
17000,
21000,
26000,
30000,
28000
]

}]

},

options:{

responsive:true,

plugins:{
legend:{
display:false
}
}

}

});

}

function loadDemoData(){

document.getElementById(
"totalGiven"
).innerHTML =
"₹25,00,000";

document.getElementById(
"totalCollected"
).innerHTML =
"₹18,50,000";

document.getElementById(
"outstanding"
).innerHTML =
"₹6,50,000";

document.getElementById(
"interestEarned"
).innerHTML =
"₹2,45,000";

document.getElementById(
"outstandingTable"
).innerHTML = `

<tr>
<td>Ramesh</td>
<td>KAN-00012</td>
<td>₹45,000</td>
</tr>

<tr>
<td>Suresh</td>
<td>KAN-00018</td>
<td>₹30,000</td>
</tr>

`;

document.getElementById(
"recentCollectionTable"
).innerHTML = `

<tr>
<td>24-Jun</td>
<td>Ramesh</td>
<td>₹5,000</td>
</tr>

<tr>
<td>24-Jun</td>
<td>Kumar</td>
<td>₹3,000</td>
</tr>

`;

}