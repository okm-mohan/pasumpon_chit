function money(value) {

    return "₹" + Number(value).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

}

async function loadDashboard() {

    try {

        const response = await fetch("/api/kanthu-dashboard");

        const data = await response.json();

        // ===============================
        // KPI Cards
        // ===============================

        document.getElementById("totalKanthu").textContent =
            money(data.summary.total_kanthu);

        document.getElementById("interestEarned").textContent =
            money(data.summary.interest);

        document.getElementById("totalCollection").textContent =
            money(data.summary.collection);

        document.getElementById("outstandingAmount").textContent =
            money(data.summary.outstanding);

        // ===============================
        // Portfolio
        // ===============================

        document.getElementById("activeLoans").textContent =
            data.portfolio.active;

        document.getElementById("partialLoans").textContent =
            data.portfolio.partial;

        document.getElementById("closedLoans").textContent =
            data.portfolio.closed;

        document.getElementById("riskLoans").textContent =
            data.portfolio.risk;

    }
    catch (error) {

        console.error("Dashboard Error :", error);

    }

}

document.addEventListener("DOMContentLoaded", function () {

    loadDashboard();

    loadOutstandingMembers();

});


// ==========================================
// Load Outstanding Members
// ==========================================

async function loadOutstandingMembers() {

    try {

        const response = await fetch("/api/kanthu-outstanding-members");

        const members = await response.json();

        const container = document.getElementById("outstandingMembers");

        container.innerHTML = "";

        members.forEach(member => {

            let initials = "";

            if (member.member_name) {

                initials = member.member_name
                    .split(" ")
                    .map(x => x[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase();

            }

            container.innerHTML += `

<div class="col-xl-4 col-lg-6">

<div class="loan-card">

<div class="loan-top">

<div class="member-avatar">

${initials}

</div>

<div>

<h5 class="mb-1">

${member.member_name}

</h5>

<small class="text-muted">

Kanthu No : ${member.kanthu_no}

</small>

</div>

</div>

<hr>

<div class="row text-center">

<div class="col-4">

<small>Loan</small>

<h6>${money(member.principal_amount)}</h6>

</div>

<div class="col-4">

<small>Collected</small>

<h6 class="text-success">

${money(member.total_collected)}

</h6>

</div>

<div class="col-4">

<small>Balance</small>

<h6 class="text-danger">

${money(member.balance_amount)}

</h6>

</div>

</div>

<div class="mt-3">

<div class="d-flex justify-content-between">

<small>Loan Progress</small>

<small>${member.progress}%</small>

</div>

<div class="progress mt-2">

<div class="progress-bar bg-success"

style="width:${member.progress}%">

</div>

</div>

</div>

<div class="row mt-4">

<div class="col-6">

<small class="text-muted">

Issue Date

</small>

<div class="fw-bold">

${member.issue_date}

</div>

</div>

<div class="col-6 text-end">

<span class="badge bg-danger">

Outstanding

</span>

</div>

</div>

<div class="d-grid gap-2 mt-4">

<button
class="btn btn-success collect-payment-btn"
data-id="${member.id}">

<i class="bi bi-cash-stack"></i>

Collect Payment

</button>

<button
class="btn btn-outline-primary view-details-btn"
data-id="${member.id}">

<i class="bi bi-eye-fill"></i>

View Details

</button>

</div>

</div>

</div>

`;

        });

    }

    catch (error) {

        console.error(error);

    }

}