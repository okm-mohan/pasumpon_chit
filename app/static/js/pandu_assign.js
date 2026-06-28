// ======================================
// MEMBER SEARCH
// ======================================

const searchBox =
document.getElementById("memberSearch");

const resultBox =
document.getElementById("searchResults");

if(searchBox){

searchBox.addEventListener("keyup", async ()=>{

    const q = searchBox.value;

    if(q.length < 2){

        resultBox.innerHTML = "";
        return;
    }

    const response =
    await fetch(
        `/api/assign-member-search?q=${q}`
    );

    const data =
    await response.json();

    let html = "";

    data.forEach(member=>{

        html += `
        <div
        class="member-item"
        onclick="selectMember(
            ${member.id},
            '${member.member_code}',
            '${member.member_name}',
            '${member.mobile}',
            '${member.aadhaar_no || ""}',
            '${member.photo || "/static/images/user.png"}'
        )">

            <strong>
                ${member.member_name}
            </strong><br>

            ${member.mobile}

        </div>
        `;

    });

    resultBox.innerHTML = html;

});

}


// ======================================
// MEMBER SELECT
// ======================================

function selectMember(
    id,
    code,
    name,
    mobile,
    aadhaar,
    photo
){

document.getElementById(
"member_id"
).value=id;

document.getElementById(
"memberCode"
).innerText=code;

document.getElementById(
"memberName"
).innerText=name;

document.getElementById(
"memberMobile"
).innerText=mobile;

document.getElementById(
"memberAadhaar"
).innerText=aadhaar;

document.getElementById(
"memberPhoto"
).src=photo;

}


// ======================================
// CALCULATIONS
// ======================================

const groupSelect =
document.getElementById("groupSelect");

const panduCount =
document.getElementById("panduCount");

function calculate(){

const option =
groupSelect.options[
groupSelect.selectedIndex
];

const monthly =
Number(
option.dataset.monthly
);

const chit =
Number(
option.dataset.chit
);

const duration =
Number(
option.dataset.duration
);

const count =
Number(
panduCount.value || 1
);

document.getElementById(
"monthlyDue"
).innerText =
(monthly * count).toFixed(2);

document.getElementById(
"chitAmount"
).innerText =
(chit * count).toFixed(2);

document.getElementById(
"durationMonths"
).innerText =
duration;

document.getElementById(
"totalAmount"
).innerText =
(chit * count).toFixed(2);

}

if(groupSelect){

groupSelect.addEventListener(
"change",
calculate
);

}

if(panduCount){

panduCount.addEventListener(
"keyup",
calculate
);

panduCount.addEventListener(
"change",
calculate
);

}

calculate();

const settlementAmount =
    (monthly * count) + monthly;

document.getElementById(
    "settlementAmount"
).innerText =
    settlementAmount.toFixed(2);