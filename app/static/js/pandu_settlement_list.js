document.addEventListener("DOMContentLoaded", function () {

  
const searchInput =
    document.getElementById("searchSettlement");

const statusFilter =
    document.getElementById("statusFilter");

function filterTable() {

    const searchText =
        searchInput.value.toLowerCase();

    const statusValue =
        statusFilter.value.toLowerCase();

    const rows =
        document.querySelectorAll(
            "table tbody tr"
        );

    rows.forEach(row => {

        const rowText =
            row.innerText.toLowerCase();

        const badge =
            row.querySelector(".badge");

        let rowStatus = "";

        if (badge) {

            rowStatus =
                badge.innerText
                    .trim()
                    .toLowerCase();
        }

        const searchMatch =
            rowText.includes(searchText);

        const statusMatch =
            !statusValue ||
            rowStatus === statusValue;

        if (searchMatch && statusMatch) {

            row.style.display = "";

        } else {

            row.style.display = "none";
        }

    });

}

if (searchInput) {

    searchInput.addEventListener(
        "keyup",
        filterTable
    );
}

if (statusFilter) {

    statusFilter.addEventListener(
        "change",
        filterTable
    );
}


});


document.addEventListener("DOMContentLoaded", function () {

    const searchInput =
        document.getElementById("searchSettlement");

    const rows =
        document.querySelectorAll(
            ".settlement-table-card tbody tr"
        );

    searchInput.addEventListener("input", function () {

        const searchText =
            this.value
                .trim()
                .toLowerCase();

        rows.forEach(row => {

            const memberCode =
                row.cells[1].textContent
                    .toLowerCase();

            const memberName =
                row.cells[2].textContent
                    .toLowerCase();

            const groupName =
                row.cells[3].textContent
                    .toLowerCase();

            if (
                memberCode.includes(searchText) ||
                memberName.includes(searchText) ||
                groupName.includes(searchText)
            ) {

                row.style.display = "";

            } else {

                row.style.display = "none";
            }

        });

    });

});


document.addEventListener("DOMContentLoaded", function () {


const searchInput = document.getElementById("searchSettlement");
const statusFilter = document.getElementById("statusFilter");

function filterTable() {

    const searchText = searchInput.value.trim().toLowerCase();
    const statusText = statusFilter.value.trim().toLowerCase();

    const rows = document.querySelectorAll(
        ".settlement-table-card tbody tr"
    );

    rows.forEach(row => {

        const memberCode =
            row.cells[1].textContent.toLowerCase();

        const memberName =
            row.cells[2].textContent.toLowerCase();

        const groupName =
            row.cells[3].textContent.toLowerCase();

        const statusBadge =
            row.querySelector(".badge");

        const rowStatus =
            statusBadge
                ? statusBadge.textContent.trim().toLowerCase()
                : "";

        const searchMatch =
            memberCode.includes(searchText) ||
            memberName.includes(searchText) ||
            groupName.includes(searchText);

        const statusMatch =
            statusText === "" ||
            rowStatus === statusText;

        row.style.display =
            (searchMatch && statusMatch)
                ? ""
                : "none";

    });

}

if (searchInput) {
    searchInput.addEventListener("input", filterTable);
}

if (statusFilter) {
    statusFilter.addEventListener("change", filterTable);
}


});


let selectedAssignmentId = null;

document.addEventListener("click", function (e) {

    const btn = e.target.closest(".settlement-btn");

    if (!btn) return;

    selectedAssignmentId = btn.dataset.id;

    document.getElementById(
        "confirmMemberName"
    ).innerText = btn.dataset.name;

    document.getElementById(
        "confirmAmount"
    ).innerText =
        "₹" + btn.dataset.settlement;

    const modal =
        new bootstrap.Modal(
            document.getElementById(
                "confirmSettlementModal"
            )
        );

    modal.show();

});


document.getElementById(
    "confirmSettlementBtn"
).addEventListener("click", async function () {

    const response = await fetch(
        "/api/pandu-settlement/" +
        selectedAssignmentId,
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                amount: 0,
                remarks:
                    "Settlement Completed"
            })
        }
    );

    const result =
        await response.json();

    if (result.success) {

        alert(
            "Pandu Settled Successfully"
        );

        location.reload();

    } else {

        alert(
            result.message ||
            "Settlement Failed"
        );
    }

});