// ==========================================
// PASUMPON CHIT ERP
// MEMBERS LIST
// ==========================================

let selectedMemberId = 0;
let panduCount = 1;
let currentPandu = null;

// ==========================================
// PAGE LOAD
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    initializePage();

});

// ==========================================
// INITIALIZE
// ==========================================

function initializePage() {

    initializeSearch();

    initializeButtons();

}

// ==========================================
// SEARCH
// ==========================================

function initializeSearch() {

    const searchBox = document.getElementById("searchBox");

    const statusFilter = document.getElementById("statusFilter");

    const table = document.getElementById("memberTable");

    const clearSearch = document.getElementById("clearSearch");

    const searchField = searchBox?.closest(".member-search-field");

    const pageSizeSelect = document.getElementById("memberPageSize");

    const previousPage = document.getElementById("previousMemberPage");

    const nextPage = document.getElementById("nextMemberPage");

    const pageNumbers = document.getElementById("memberPageNumbers");

    if (!table) return;

    const rows = Array.from(table.querySelectorAll("tbody tr"));

    let currentPage = 1;

    let pageSize = Number(pageSizeSelect?.value || 10);

    function renderTable(resetPage = false) {

        const keyword = searchBox.value.trim().toLowerCase();

        const status = statusFilter.value.toLowerCase();

        const filteredRows = rows.filter(row => {

            const text = row.dataset.search || row.innerText.toLowerCase();

            const badge = row.querySelector(".member-status-pill");

            const rowStatus = badge
                ? badge.innerText.toLowerCase()
                : "";

            return text.includes(keyword) && (status === "" || rowStatus.includes(status));

        });

        if (resetPage) currentPage = 1;

        const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));

        currentPage = Math.min(currentPage, pageCount);

        const startIndex = (currentPage - 1) * pageSize;

        const endIndex = Math.min(startIndex + pageSize, filteredRows.length);

        const pageRows = new Set(filteredRows.slice(startIndex, endIndex));

        rows.forEach(row => {

            row.style.display = pageRows.has(row) ? "" : "none";

        });

        const resultCount = document.getElementById("resultCount");

        const visibleCount = document.getElementById("visibleMemberCount");

        const emptyState = document.getElementById("memberEmptyState");

        if (resultCount) resultCount.textContent = `${filteredRows.length} record${filteredRows.length === 1 ? "" : "s"}`;

        if (visibleCount) {

            visibleCount.textContent = filteredRows.length
                ? `Showing ${startIndex + 1}–${endIndex} of ${filteredRows.length}`
                : "Showing 0 members";

        }

        if (emptyState) emptyState.hidden = filteredRows.length !== 0;

        searchField?.classList.toggle("has-value", keyword.length > 0);

        renderPagination(pageCount);

    }

    function renderPagination(pageCount) {

        if (previousPage) previousPage.disabled = currentPage <= 1;

        if (nextPage) nextPage.disabled = currentPage >= pageCount;

        if (!pageNumbers) return;

        pageNumbers.innerHTML = "";

        getVisiblePages(pageCount, currentPage).forEach(page => {

            if (page === "ellipsis") {

                const ellipsis = document.createElement("span");

                ellipsis.className = "page-ellipsis";

                ellipsis.textContent = "…";

                pageNumbers.appendChild(ellipsis);

                return;

            }

            const button = document.createElement("button");

            button.type = "button";

            button.textContent = page;

            button.className = page === currentPage ? "active" : "";

            button.setAttribute("aria-label", `Page ${page}`);

            if (page === currentPage) button.setAttribute("aria-current", "page");

            button.addEventListener("click", () => {

                currentPage = page;

                renderTable();

            });

            pageNumbers.appendChild(button);

        });

    }

    function getVisiblePages(pageCount, activePage) {

        if (pageCount <= 5) {

            return Array.from({ length: pageCount }, (_, index) => index + 1);

        }

        const pages = new Set([1, pageCount, activePage - 1, activePage, activePage + 1]);

        const sorted = Array.from(pages).filter(page => page > 0 && page <= pageCount).sort((a, b) => a - b);

        const result = [];

        sorted.forEach((page, index) => {

            if (index > 0 && page - sorted[index - 1] > 1) result.push("ellipsis");

            result.push(page);

        });

        return result;

    }

    searchBox?.addEventListener("input", () => renderTable(true));

    statusFilter?.addEventListener("change", () => renderTable(true));

    pageSizeSelect?.addEventListener("change", () => {

        pageSize = Number(pageSizeSelect.value);

        renderTable(true);

    });

    previousPage?.addEventListener("click", () => {

        if (currentPage > 1) {

            currentPage--;

            renderTable();

        }

    });

    nextPage?.addEventListener("click", () => {

        currentPage++;

        renderTable();

    });

    clearSearch?.addEventListener("click", () => {

        searchBox.value = "";

        searchBox.focus();

        renderTable(true);

    });

    renderTable();

}

// ==========================================
// BUTTONS
// ==========================================

function initializeButtons() {

    initializeJoinButtons();

    initializeCountButtons();

}
// ==========================================
// JOIN PANDU BUTTON
// ==========================================

function initializeJoinButtons() {

    document.querySelectorAll(".join-pandu-btn").forEach(btn => {

        btn.addEventListener("click", function () {

            selectedMemberId = this.dataset.memberId;

            document.getElementById("memberName").value =
                this.dataset.memberName;

            console.log("Member ID =", selectedMemberId);
            console.log("Member Name =", this.dataset.memberName);

            panduCount = 1;

            document.getElementById("panduCount").value = 1;

            clearSummary();

            loadCurrentPandu();

        });

    });

}


// ==========================================
// LOAD CURRENT YEAR PANDU
// ==========================================
async function loadCurrentPandu() {

    //console.log("Loading Current Pandu...");

    try {

        const response = await fetch("/api/current-pandu");

        console.log("Response Status:", response.status);

        const data = await response.json();

        console.log("Data:", data);

        if (!data.success) {

            alert("No Active Pandu Group Found.");
            return;

        }

        currentPandu = data;

        const groupId = document.getElementById("groupId");

        if (groupId) {
            groupId.value = data.id;
        }

        const title = document.getElementById("joinPanduTitle");

        if (title) {
            title.innerHTML =
                `<i class="bi bi-person-plus-fill"></i> Join Pandu - ${data.group_name}`;
        }

        const sub = document.getElementById("joinPanduSubTitle");

        // if(sub){
        //     sub.innerHTML =
        //     `Pandu Year : ${data.pandu_year}`;
        // }

        calculateAmount();

        const modal = new bootstrap.Modal(
            document.getElementById("joinPanduModal")
        );

        modal.show();

    }
    catch (err) {

        console.error(err);

        alert(err);

    }

}


// ==========================================
// COUNT BUTTONS
// ==========================================

function initializeCountButtons() {

    const plus =
        document.getElementById("plusBtn");

    const minus =
        document.getElementById("minusBtn");

    plus?.addEventListener("click", function () {

        panduCount++;

        document.getElementById("panduCount").value =
            panduCount;

        calculateAmount();

    });

    minus?.addEventListener("click", function () {

        if (panduCount == 1)
            return;

        panduCount--;

        document.getElementById("panduCount").value =
            panduCount;

        calculateAmount();

    });

}
// ==========================================
// CALCULATE AMOUNT
// ==========================================
function calculateAmount() {

    if (!currentPandu)
        return;

    const monthlyDue =
        Number(currentPandu.monthly_due) * panduCount;

    const yearlyDue =
        monthlyDue * 12;

    const totalLiability =
        Number(currentPandu.chit_amount) * panduCount;

    const settlement =
        yearlyDue + monthlyDue;

    // Assignment Summary

    document.getElementById("monthlyDue").innerHTML =
        "₹ " + monthlyDue.toLocaleString("en-IN");

    document.getElementById("yearlyDue").innerHTML =
        "₹ " + yearlyDue.toLocaleString("en-IN");

    document.getElementById("durationValue").innerHTML =
        currentPandu.duration_months + " Months";

    document.getElementById("summaryCount").innerHTML =
        panduCount;

    document.getElementById("totalLiability").innerHTML =
        "₹ " + totalLiability.toLocaleString("en-IN");

    document.getElementById("settlementAmount").innerHTML =
        "₹ " + settlement.toLocaleString("en-IN");

}

// ==========================================
// CLEAR SUMMARY
// ==========================================
function clearSummary() {

    currentPandu = null;

    document.getElementById("monthlyDue").innerHTML = "₹0";

    document.getElementById("yearlyDue").innerHTML = "₹0";

    document.getElementById("durationValue").innerHTML = "0 Months";

    document.getElementById("summaryCount").innerHTML = "1";

    document.getElementById("totalLiability").innerHTML = "₹0";

    document.getElementById("settlementAmount").innerHTML = "₹0";

}

// ==========================================
// JOIN PANDU
// ==========================================
// ==========================================
// JOIN PANDU
// ==========================================

async function saveJoinPandu() {

    if (!currentPandu) {

        alert("Current Year Pandu not loaded.");
        return;

    }

    const btn = document.getElementById("joinPanduBtn");

    btn.disabled = true;

    btn.innerHTML =
        '<span class="spinner-border spinner-border-sm"></span> Joining...';

    try {

        const formData = new FormData();

        formData.append("member_id", selectedMemberId);
        formData.append("group_id", currentPandu.id);
        formData.append("pandu_count", panduCount);

        const response = await fetch("/pandu/assign/save", {

            method: "POST",

            body: formData

        });

        const result = await response.json();

        console.log(result);

        if (result.success) {

            alert("Member Joined Successfully.");

            const modal =
                bootstrap.Modal.getInstance(
                    document.getElementById("joinPanduModal")
                );

            if (modal)
                modal.hide();

            location.reload();

        }
        else {

            alert(result.message || "Unable to Join Pandu.");

        }

    }
    catch (err) {

        console.error(err);

        alert("Server Error : " + err.message);

    }
    finally {

        btn.disabled = false;

        btn.innerHTML =
            '<i class="bi bi-check-circle-fill"></i> Join Pandu';

    }

}
// ==========================================
// JOIN BUTTON
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    const joinBtn =
        document.getElementById("joinPanduBtn");

    if (joinBtn) {

        joinBtn.addEventListener("click", saveJoinPandu);

    }

});


// ==========================================
// EXPORT MEMBERS
// ==========================================

function exportMembers() {

    window.location.href = "/members/export";

}


// ==========================================
// PRINT MEMBERS
// ==========================================

function printMembers() {

    window.print();

}
