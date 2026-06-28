let selectedAssignmentId = null;
let selectedSettlementAmount = 0;

/* ==========================================
   FORMAT MONEY
========================================== */

function money(value){

    return "₹" +
        Number(value || 0)
        .toLocaleString("en-IN");
}

/* ==========================================
   SEARCH MEMBERS
========================================== */

async function searchMembers(){

    const search =
        document.getElementById(
            "searchMember"
        ).value.trim();

    if(search === ""){

        alert(
            "Enter Member Name"
        );

        return;
    }

    try{

        const response =
            await fetch(

                `/api/pandu-settlement/search?search=${encodeURIComponent(search)}`

            );

        const data =
            await response.json();

        let html = "";

        if(data.length === 0){

            html = `

                <div class="alert alert-warning">

                    No Eligible Members Found

                </div>

            `;
        }
        else{

            data.forEach(row => {

                html += `

                    <div class="member-result">

                        <div class="member-info">

                            <h5>
                                ${row.member_name}
                            </h5>

                            <small>

                                Mobile :
                                ${row.mobile || '-'}

                                |
                                Village :
                                ${row.village || '-'}

                            </small>

                        </div>

                        <button

                            class="btn btn-primary"

                            onclick='loadMember(${JSON.stringify(row)})'>

                            Select

                        </button>

                    </div>

                `;
            });
        }

        document.getElementById(
            "memberResults"
        ).innerHTML = html;

    }
    catch(error){

        console.error(error);

        alert(
            "Error Loading Members"
        );
    }
}

/* ==========================================
   LOAD MEMBER
========================================== */

function loadMember(row){

    selectedAssignmentId =
        row.id;

    selectedSettlementAmount =
        row.settlement_amount;

    document.getElementById(
        "settlementSection"
    ).style.display = "block";

    document.getElementById(
        "memberName"
    ).innerHTML =
        row.member_name;

    document.getElementById(
        "memberMobile"
    ).innerHTML =
        row.mobile || "-";

    document.getElementById(
        "memberVillage"
    ).innerHTML =
        row.village || "-";

    document.getElementById(
        "totalAmount"
    ).innerHTML =
        money(
            row.total_amount
        );

    document.getElementById(
        "paidAmount"
    ).innerHTML =
        money(
            row.paid_amount
        );

    document.getElementById(
        "monthlyDue"
    ).innerHTML =
        money(
            row.group_monthly_due
        );

    document.getElementById(
        "bonusAmount"
    ).innerHTML =
        money(
            row.group_monthly_due
        );

    document.getElementById(
        "settlementAmount"
    ).innerHTML =
        money(
            row.settlement_amount
        );

    window.scrollTo({

        top:
        document.getElementById(
            "settlementSection"
        ).offsetTop - 100,

        behavior:"smooth"

    });
}

/* ==========================================
   PROCESS SETTLEMENT
========================================== */

async function processSettlement(){

    if(
        selectedAssignmentId === null
    ){

        alert(
            "Select Member First"
        );

        return;
    }

    const remarks =
        document.getElementById(
            "remarks"
        ).value;

    const confirmSettlement =
        confirm(

            `Process Settlement Amount ${money(selectedSettlementAmount)} ?`

        );

    if(!confirmSettlement){

        return;
    }

    try{

        const response =
            await fetch(

                `/api/pandu-settlement/${selectedAssignmentId}`,

                {

                    method:"POST",

                    headers:{
                        "Content-Type":
                        "application/json"
                    },

                    body:JSON.stringify({

                        amount:
                        selectedSettlementAmount,

                        remarks:
                        remarks

                    })

                }

            );

        const result =
            await response.json();

        if(result.success){

            alert(

                "Settlement Processed Successfully"

            );

            document.getElementById(
                "remarks"
            ).value = "";

            document.getElementById(
                "settlementSection"
            ).style.display = "none";

            document.getElementById(
                "memberResults"
            ).innerHTML = "";

            document.getElementById(
                "searchMember"
            ).value = "";

            selectedAssignmentId = null;

            selectedSettlementAmount = 0;
        }
        else{

            alert(

                result.message ||
                "Settlement Failed"

            );
        }

    }
    catch(error){

        console.error(error);

        alert(

            "Error Processing Settlement"

        );
    }
}

/* ==========================================
   ENTER KEY SEARCH
========================================== */

document.addEventListener(

    "DOMContentLoaded",

    function(){

        document
        .getElementById(
            "searchMember"
        )
        .addEventListener(

            "keypress",

            function(e){

                if(
                    e.key === "Enter"
                ){

                    searchMembers();
                }

            }

        );

    }

);

let memberModal;

function openMemberSearch(){

    memberModal =
        new bootstrap.Modal(

            document.getElementById(
                "memberSearchModal"
            )

        );

    memberModal.show();

    setTimeout(()=>{

        document
        .getElementById(
            "memberSearchInput"
        )
        .focus();

    },300);
}

document.addEventListener(

    "DOMContentLoaded",

    function(){

        document
        .getElementById(
            "memberSearchInput"
        )
        .addEventListener(

            "keyup",

            searchMembersLive

        );

    }

);

async function searchMembersLive(){

    const q =
        document
        .getElementById(
            "memberSearchInput"
        )
        .value.trim();

    if(q.length < 2){

        document
        .getElementById(
            "memberSearchResults"
        )
        .innerHTML = "";

        return;
    }

    const response =
        await fetch(
            `/api/member-search?q=${q}`
        );

    const members =
        await response.json();

    let html = "";

    members.forEach(m=>{

        html += `

            <div
                class="search-member-card"

                onclick="selectMember(${m.id})">

                <div>

                    <span class="member-code">

                        ${m.member_code}

                    </span>

                </div>

                <h5 class="mt-2">

                    ${m.member_name}

                </h5>

                <small>

                    📱 ${m.mobile || '-'}

                </small>

                <br>

                <small>

                    📍 ${m.village || '-'}

                </small>

            </div>

        `;
    });

    document
    .getElementById(
        "memberSearchResults"
    )
    .innerHTML = html;
}

async function selectMember(memberId){

    memberModal.hide();

    await loadSettlementMember(
        memberId
    );
}

async function loadSettlementMember(
    memberId
){

    const res =
        await fetch(

            `/api/settlement-member/${memberId}`

        );

    const row =
        await res.json();

    loadMember(row);
}

async function loadSettlementMember(memberId){

    console.log("Selected Member ID:", memberId);

    const res =
        await fetch(
            `/api/settlement-member/${memberId}`
        );

    const row =
        await res.json();

    console.log("API Result:", row);

    loadMember(row);
}

document.addEventListener("DOMContentLoaded", function () {

    let selectedSettlementId = null;

    const modalElement = document.getElementById("settlementModal");
    const settlementModal = new bootstrap.Modal(modalElement);

    /* =========================================
       SEARCH
    ========================================= */

    const searchBox = document.getElementById("searchSettlement");

    if (searchBox) {

        searchBox.addEventListener("keyup", function () {

            const value = this.value.toLowerCase();

            document.querySelectorAll("tbody tr").forEach(row => {

                const text = row.innerText.toLowerCase();

                row.style.display =
                    text.includes(value)
                        ? ""
                        : "none";

            });

        });

    }

    /* =========================================
       STATUS FILTER
    ========================================= */

    const statusFilter =
        document.getElementById("statusFilter");

    if (statusFilter) {

        statusFilter.addEventListener("change", function () {

            const status =
                this.value.toLowerCase();

            document.querySelectorAll("tbody tr")
                .forEach(row => {

                    if (!status) {

                        row.style.display = "";
                        return;
                    }

                    const badge =
                        row.querySelector(".badge");

                    if (!badge) return;

                    const rowStatus =
                        badge.innerText
                            .trim()
                            .toLowerCase();

                    row.style.display =
                        rowStatus === status
                            ? ""
                            : "none";

                });

        });

    }

    /* =========================================
       OPEN SETTLEMENT MODAL
    ========================================= */

    document.addEventListener("click", function (e) {

        const btn =
            e.target.closest(".settlement-btn");

        if (!btn) return;

        selectedSettlementId =
            btn.dataset.id;

        document.getElementById(
            "modalMemberName"
        ).value =
            btn.dataset.name;

        document.getElementById(
            "modalTotal"
        ).value =
            "₹" + btn.dataset.total;

        document.getElementById(
            "modalPaid"
        ).value =
            "₹" + btn.dataset.paid;

        document.getElementById(
            "modalBalance"
        ).value =
            "₹" + btn.dataset.balance;

        document.getElementById(
            "modalSettlement"
        ).value =
            "₹" + btn.dataset.settlement;

        settlementModal.show();

    });

    /* =========================================
       COMPLETE SETTLEMENT
    ========================================= */

    const completeBtn =
        document.getElementById(
            "completeSettlementBtn"
        );

    if (completeBtn) {

        completeBtn.addEventListener(
            "click",
            function () {

                const remarks =
                    document.getElementById(
                        "settlementRemarks"
                    ).value;

                if (!confirm(
                    "Are you sure you want to complete settlement?"
                )) {
                    return;
                }

                fetch(
                    "/complete-settlement",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            assignment_id:
                                selectedSettlementId,

                            remarks:
                                remarks

                        })

                    }
                )

                .then(res => res.json())

                .then(data => {

                    if (data.success) {

                        alert(
                            "Settlement Completed Successfully"
                        );

                        location.reload();

                    } else {

                        alert(
                            data.message ||
                            "Failed"
                        );

                    }

                })

                .catch(error => {

                    console.error(error);

                    alert(
                        "Server Error"
                    );

                });

            }
        );

    }

});