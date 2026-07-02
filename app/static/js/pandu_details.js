// ===========================================================
// PANDU DETAILS
// Premium Version
// ===========================================================

// -----------------------------------------------------------
// GLOBAL VARIABLES
// -----------------------------------------------------------

let members = [];
let filteredMembers = [];
let recentCollections = [];

let currentFilter = "ALL";
const PAGE_SIZE = 5;
let currentPage = 1;

// -----------------------------------------------------------
// FORMAT CURRENCY
// -----------------------------------------------------------

function money(value) {

    value = Number(value || 0);

    return "₹" + value.toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }
    );

}


// -----------------------------------------------------------
// ANIMATE COUNTER
// -----------------------------------------------------------

function animateValue(id, value, isMoney = false) {

    const element = document.getElementById(id);

    if (!element) return;

    value = Number(value || 0);

    let start = 0;

    const increment = Math.max(1, Math.ceil(value / 50));

    const timer = setInterval(() => {

        start += increment;

        if (start >= value) {

            start = value;

            clearInterval(timer);

        }

        if (isMoney) {

            element.textContent = money(start);

        } else {

            element.textContent = start.toLocaleString();

        }

    }, 15);

}



// -----------------------------------------------------------
// SHOW ERROR
// -----------------------------------------------------------

function showError(message) {

    console.error(message);

}



// -----------------------------------------------------------
// LOAD SUMMARY
// -----------------------------------------------------------

async function loadSummary() {

    try {

        const response = await fetch(
            "/api/pandu-details/summary"
        );

        if (!response.ok) {

            throw new Error("Unable to load summary");

        }

        const data = await response.json();

        animateValue(
            "totalMembers",
            data.total_members
        );

        animateValue(
            "totalAmount",
            data.total_amount,
            true
        );

        animateValue(
            "paidAmount",
            data.paid_amount,
            true
        );

        animateValue(
            "balanceAmount",
            data.balance_amount,
            true
        );

        animateValue(
            "todayCollection",
            data.today_collection,
            true
        );

        animateValue(
            "monthCollection",
            data.month_collection,
            true
        );

        animateValue(
            "totalInstallments",
            data.total_installments
        );

        const progress =
            Number(data.percentage || 0);

        document.getElementById(
            "collectionPercent"
        ).textContent =
            progress + "%";

        const progressBar =
            document.getElementById(
                "collectionBar"
            );

        progressBar.style.width =
            progress + "%";

        progressBar.textContent =
            progress + "%";

    }

    catch (error) {

        showError(error);

    }

}
// ===========================================================
// LOAD MEMBERS
// ===========================================================

async function loadMembers(search = "") {

    try {

        const response = await fetch(
            "/api/pandu-details/members?search=" +
            encodeURIComponent(search)
        );

        if (!response.ok) {

            throw new Error("Unable to load members");

        }

        members = await response.json();

        filteredMembers = [...members];

        renderMembers();

    }

    catch (error) {

        showError(error);

    }

}



// ===========================================================
// RENDER MEMBERS
// ===========================================================

function renderMembers() {

    const tbody = document.getElementById(
        "memberTableBody"
    );

    if (!tbody) return;

    tbody.innerHTML = "";

    let data = [...filteredMembers];



    // -----------------------------------------
    // FILTER
    // -----------------------------------------

    if (currentFilter === "PAID") {

        data = data.filter(
            x => x.status === "Paid"
        );

    }

    if (currentFilter === "PENDING") {

        data = data.filter(
            x => x.status === "Pending"
        );

    }

    if (currentFilter === "BALANCE") {

        data = data.filter(
            x => x.status === "Balance"
        );

    }



    if (data.length === 0) {

        tbody.innerHTML = `

        <tr>

            <td colspan="8" class="text-center py-5">

                No Members Found

            </td>

        </tr>

        `;

        updateFooter([]);

        return;

    }



    let html = "";



    data.slice(0, 5).forEach((member, index) => {

        let badge = "";

        if (member.status === "Paid") {

            badge =
                `<span class="status status-paid">
                    Paid
                </span>`;

        }

        else if (member.status === "Pending") {

            badge =
                `<span class="status status-pending">
                    Pending
                </span>`;

        }

        else {

            badge =
                `<span class="status status-balance">
                    Balance
                </span>`;

        }


        const totalMembers = data.length;

        const totalPages = Math.ceil(totalMembers / PAGE_SIZE);

        if (currentPage > totalPages) {
            currentPage = 1;
        }

        const start = (currentPage - 1) * PAGE_SIZE;

        const end = start + PAGE_SIZE;

        const pageData = data.slice(start, end);




        const initials =
            member.member_name
                .split(" ")
                .map(x => x.charAt(0))
                .join("")
                .substring(0, 2)
                .toUpperCase();



        html += `

<tr>

<td>

${index + 1}

</td>

<td>

<div class="member-name">

<div class="member-avatar">

${initials}

</div>

<div class="member-info">

<h6>

${member.member_name}

</h6>

<small>

${member.mobile}

</small>

</div>

</div>

</td>

<td class="text-center">

${member.pandu_count}

</td>

<td class="text-end money">

${money(member.total_amount)}

</td>

<td class="text-end money green">

${money(member.paid_amount)}

</td>

<td class="text-end money red">

${money(member.balance_amount)}

</td>

<td class="text-center">

${badge}

</td>

<td class="text-center">

<button
class="action-btn"
onclick="viewMember(${member.id})">

<i class="bi bi-eye-fill"></i>

</button>

</td>

</tr>

`;

    });



    tbody.innerHTML = html;



    updateFooter(data);

}



// ===========================================================
// UPDATE FOOTER
// ===========================================================

function updateFooter(data) {

    let paidMembers = 0;

    let pendingMembers = 0;

    let balanceAmount = 0;



    data.forEach(member => {

        balanceAmount += Number(
            member.balance_amount || 0
        );

        if (member.status === "Paid") {

            paidMembers++;

        }

        else {

            pendingMembers++;

        }

    });



    const footerMembers =
        document.getElementById(
            "footerMembers"
        );

    if (footerMembers) {

        footerMembers.textContent =
            data.length;

    }



    const paid =
        document.getElementById(
            "paidMembers"
        );

    if (paid) {

        paid.textContent =
            paidMembers;

    }



    const pending =
        document.getElementById(
            "pendingMembers"
        );

    if (pending) {

        pending.textContent =
            pendingMembers;

    }



    const balance =
        document.getElementById(
            "footerBalance"
        );

    if (balance) {

        balance.textContent =
            money(balanceAmount);

    }

}



// ===========================================================
// VIEW MEMBER
// ===========================================================

function viewMember(id) {

    window.location.href =
        "/members/view/" + id;

}
// ===========================================================
// SEARCH MEMBERS
// ===========================================================

function initializeSearch() {

    const searchBox = document.getElementById("searchMember");

    if (!searchBox) return;

    searchBox.addEventListener("keyup", function () {

        loadMembers(this.value.trim());

    });

}



// ===========================================================
// FILTER BUTTONS
// ===========================================================

function initializeFilters() {

    const buttons = document.querySelectorAll(
        ".filter-buttons .btn"
    );

    buttons.forEach(button => {

        button.addEventListener("click", function () {

            buttons.forEach(btn => {

                btn.classList.remove("active-filter");

            });

            this.classList.add("active-filter");

            const value =
                this.innerText.trim().toUpperCase();

            switch (value) {

                case "PAID":

                    currentFilter = "PAID";

                    break;

                case "PENDING":

                    currentFilter = "PENDING";

                    break;

                case "BALANCE":

                    currentFilter = "BALANCE";

                    break;

                default:

                    currentFilter = "ALL";

            }

            renderMembers();

        });

    });

}



// ===========================================================
// LOAD RECENT COLLECTIONS
// ===========================================================

async function loadRecentCollections() {

    try {

        const response = await fetch(
            "/api/pandu-details/recent"
        );

        if (!response.ok) {

            throw new Error(
                "Unable to load recent collections"
            );

        }

        recentCollections =
            await response.json();

        renderRecentCollections();

    }

    catch (error) {

        showError(error);

    }

}



// ===========================================================
// RENDER RECENT COLLECTIONS
// ===========================================================

function renderRecentCollections() {

    const tbody =
        document.getElementById(
            "recentCollectionBody"
        );

    if (!tbody) return;

    tbody.innerHTML = "";

    if (recentCollections.length === 0) {

        tbody.innerHTML = `

        <tr>

            <td colspan="4"
                class="text-center py-4">

                No Collections Found

            </td>

        </tr>

        `;

        return;

    }

    recentCollections.forEach(item => {

        tbody.innerHTML += `

<tr>

<td>

${item.receipt_no}

</td>

<td>

${item.member_name}

</td>

<td class="text-success fw-bold">

${money(item.amount)}

</td>

<td>

${item.collection_date}

</td>

</tr>

`;

    });

}



// ===========================================================
// EXPORT CSV
// ===========================================================

function exportExcel() {

    let csv = [];

    csv.push([
        "Member Name",
        "Mobile",
        "Pandu Count",
        "Total Amount",
        "Paid Amount",
        "Balance Amount",
        "Status"
    ].join(","));

    filteredMembers.forEach(member => {

        csv.push([

            member.member_name,

            member.mobile,

            member.pandu_count,

            member.total_amount,

            member.paid_amount,

            member.balance_amount,

            member.status

        ].join(","));

    });

    const blob = new Blob(

        [csv.join("\n")],

        {

            type: "text/csv"

        }

    );

    const url =
        window.URL.createObjectURL(blob);

    const a =
        document.createElement("a");

    a.href = url;

    a.download =
        "Pandu_Details.csv";

    a.click();

}



// ===========================================================
// PRINT
// ===========================================================

function printPage() {

    window.print();

}



// ===========================================================
// BUTTON EVENTS
// ===========================================================

function initializeButtons() {

    const buttons =
        document.querySelectorAll(
            ".footer-right .btn"
        );

    buttons.forEach(button => {

        if (button.innerText.includes("Export")) {

            button.onclick = exportExcel;

        }

        if (button.innerText.includes("Print")) {

            button.onclick = printPage;

        }

    });

}



// ===========================================================
// PAGE INITIALIZATION
// ===========================================================

document.addEventListener(

    "DOMContentLoaded",

    async function () {

        const year =
            document.getElementById(
                "currentYear"
            );

        if (year) {

            year.textContent =
                new Date().getFullYear();

        }

        initializeSearch();

        initializeFilters();

        initializeButtons();

        await loadSummary();

        await loadMembers();

        await loadRecentCollections();

    }

);
