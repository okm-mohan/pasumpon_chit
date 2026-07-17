/* ==========================================
   PANDU ERP - JAVASCRIPT
========================================== */

document.addEventListener("DOMContentLoaded", function () {


    initializeDate();
    checkCollectionRestriction();
    setupVoiceSearch();
    setupButtons();

    loadCollectionMonths();
    loadDashboardSummary();

});

/* ==========================================
   CURRENT DATE
========================================== */

function initializeDate() {

    const dateElement =
        document.getElementById("currentDate");

    if (dateElement) {

        const today = new Date();

        const formattedDate =
            today.toLocaleDateString(
                "en-GB"
            );

        dateElement.innerHTML =
            formattedDate;
    }
}

/* ==========================================
   ENTRY RESTRICTION
========================================== */

function checkCollectionRestriction() {

    const today = new Date();

    const day = today.getDate();

    const saveButton =
        document.querySelector(".save-btn");

    const restrictionBox =
        document.querySelector(
            ".restriction-box"
        );

    if (day > 30) {

        if (restrictionBox) {

            restrictionBox.innerHTML =
                `
                <i class="fas fa-lock"></i>
                Collection Entry Closed.
                Only Admin Can Enter After 10th.
                `;
        }

        if (saveButton) {

            saveButton.disabled = true;

            saveButton.style.opacity = "0.6";

            saveButton.style.cursor =
                "not-allowed";
        }
    }
}

/* ==========================================
   VOICE SEARCH
========================================== */

function setupVoiceSearch() {

    const voiceButton =
        document.querySelector(
            ".voice-btn"
        );

    const searchInput =
        document.querySelector(
            ".search-box input"
        );

    if (
        !voiceButton ||
        !searchInput
    ) {
        return;
    }

    if (
        !("webkitSpeechRecognition"
            in window)
    ) {

        voiceButton.title =
            "Voice Search Not Supported";

        return;
    }

    const recognition =
        new webkitSpeechRecognition();

    recognition.lang = "en-IN";

    recognition.continuous = false;

    recognition.interimResults = false;

    voiceButton.addEventListener(
        "click",
        function () {

            recognition.start();

            voiceButton.innerHTML =
                '<i class="fas fa-microphone-lines"></i>';

        }
    );

    recognition.onresult =
        function (event) {

            const speechText =
                event.results[0][0]
                    .transcript;

            searchInput.value =
                speechText;

            searchMember(
                speechText
            );

            voiceButton.innerHTML =
                '<i class="fas fa-microphone"></i>';
        };

    recognition.onerror =
        function () {

            voiceButton.innerHTML =
                '<i class="fas fa-microphone"></i>';
        };
}

/* ==========================================
   SEARCH MEMBER DEMO
========================================== */

function searchMember(keyword) {



    const searchBox =
        document.getElementById("searchMember");

    const dropdown =
        document.getElementById("memberDropdown");

    if (searchBox) {

        searchBox.addEventListener(
            "input",
            async function () {

                const keyword =
                    this.value.trim();

                if (keyword.length < 1) {

                    dropdown.style.display = "none";
                    return;
                }

                const response =
                    await fetch(
                        `/api/member-search?q=${keyword}`
                    );

                const members =
                    await response.json();

                selectedIndex = -1;
                dropdown.innerHTML = "";

                if (members.length === 0) {

                    dropdown.style.display = "none";
                    return;
                }

                members.forEach(member => {

                    const item =
                        document.createElement("div");

                    item.className =
                        "member-item";

                    item.textContent =
                        `${member.member_code} · ${member.member_name} · ${member.mobile}` +
                        (member.aadhaar_masked ? ` · Aadhaar ${member.aadhaar_masked}` : "");

                    item.onclick = function () {

                        searchBox.value =
                            member.member_name;

                        dropdown.style.display =
                            "none";

                        loadMember(member.id);
                    };

                    dropdown.appendChild(item);

                });

                dropdown.style.display =
                    "block";
            }
        );
    }



    // const searchBox =
    // document.getElementById("searchMember");

    // searchBox.addEventListener(
    //     "input",
    //     async function(){

    //         const keyword =
    //         this.value.trim();

    //         if(keyword.length < 2){

    //             document.getElementById(
    //                 "memberDropdown"
    //             ).style.display = "none";

    //             return;
    //         }

    //         const response =
    //         await fetch(
    //             `/api/member-search?q=${keyword}`
    //         );

    //         const members =
    //         await response.json();

    //         const dropdown =
    //         document.getElementById(
    //             "memberDropdown"
    //         );

    //         dropdown.innerHTML = "";

    //         if(members.length === 0){

    //             dropdown.style.display =
    //             "none";

    //             return;
    //         }

    //         members.forEach(member => {

    //             const item =
    //             document.createElement("div");

    //             item.className =
    //             "member-item";

    //             item.innerHTML = `
    //                 <strong>
    //                     ${member.member_code}
    //                 </strong>
    //                 -
    //                 ${member.member_name}
    //                 -
    //                 ${member.mobile}
    //             `;

    //             item.onclick =
    //             function(){

    //                 searchBox.value =
    //                 member.member_name;

    //                 dropdown.style.display =
    //                 "none";

    //                 loadMember(
    //                     member.id
    //                 );
    //             };

    //             dropdown.appendChild(
    //                 item
    //             );
    //         });

    //         dropdown.style.display =
    //         "block";
    //     }
    // );





    // keyword =
    //     keyword.toLowerCase();

    // if (
    //     keyword.includes("murugan")
    //     ||
    //     keyword.includes("m00125")
    // ) {

    //     showNotification(
    //         "Member Found : R. Murugan",
    //         "success"
    //     );

    // } else {

    //     showNotification(
    //         "Member Not Found",
    //         "error"
    //     );
    // }
}

/* ==========================================
   BUTTON EVENTS
========================================== */

function setupButtons() {

    const saveBtn =
        document.querySelector(
            ".save-btn"
        );

    const printBtn =
        document.querySelector(
            ".print-btn"
        );

    const clearBtn =
        document.querySelector(
            ".clear-btn"
        );

    if (saveBtn) {

        saveBtn.addEventListener(
            "click",
            saveCollection
        );
    }

    if (printBtn) {

        printBtn.addEventListener(
            "click",
            printReceipt
        );
    }

    if (clearBtn) {

        clearBtn.addEventListener(
            "click",
            clearForm
        );
    }
}

/* ==========================================
   SAVE COLLECTION
========================================== */

function saveCollection() {



    const paymentMode =
        document.getElementById(
            "paymentMode"
        ).value;

    formData.append(
        "payment_mode",
        document.getElementById("paymentMode").value
    );

    const amount =
        document.querySelector(
            'input[type="number"]'
        );

    if (
        !amount ||
        amount.value === ""
    ) {

        showNotification(
            "Enter Amount",
            "error"
        );

        return;
    }

    onclick = "savePayment()"

    showNotification(
        "Collection Saved Successfully",
        "success"
    );
}

/* ==========================================
   PRINT RECEIPT
========================================== */

function printReceipt() {

    window.print();
}

/* ==========================================
   CLEAR FORM
========================================== */

function clearForm() {

    const inputs =
        document.querySelectorAll(
            "input, textarea"
        );

    inputs.forEach(input => {

        if (
            input.type !== "date"
        ) {

            input.value = "";
        }

    });

    showNotification(
        "Form Cleared",
        "success"
    );
}

/* ==========================================
   NOTIFICATION
========================================== */

function showNotification(
    message,
    type
) {

    const oldNotification =
        document.querySelector(
            ".notification"
        );

    if (oldNotification) {

        oldNotification.remove();
    }

    const notification =
        document.createElement(
            "div"
        );

    notification.className =
        "notification";

    notification.innerHTML =
        message;

    notification.style.position =
        "fixed";

    notification.style.top =
        "20px";

    notification.style.right =
        "20px";

    notification.style.padding =
        "15px 25px";

    notification.style.borderRadius =
        "10px";

    notification.style.color =
        "white";

    notification.style.zIndex =
        "99999";

    notification.style.fontWeight =
        "600";

    notification.style.boxShadow =
        "0 5px 20px rgba(0,0,0,.2)";

    if (
        type === "success"
    ) {

        notification.style.background =
            "#16a34a";

    } else {

        notification.style.background =
            "#dc2626";
    }

    document.body.appendChild(
        notification
    );

    setTimeout(() => {

        notification.remove();

    }, 3000);
}

const searchInput =
    document.getElementById("searchMember");

if (searchInput) {

    searchInput.addEventListener(
        "change",
        async function () {

            const value =
                this.value.trim();

            if (!value) {
                return;
            }

            try {

                const response =
                    await fetch(
                        `/api/member-search?q=${value}`
                    );

                const data =
                    await response.json();

                if (data.length === 0) {

                    alert(
                        "Member Not Found"
                    );

                    return;
                }

                const member =
                    data[0];

                loadMember(
                    member.id
                );

            }
            catch (error) {

                console.log(error);
            }
        }
    );
}

async function loadMember(id) {

    document.getElementById("memberId").value = id;

    const response =
        await fetch(`/api/member/${id}`);

    const member =
        await response.json();

    const warningBox =
        document.getElementById("assignWarning");

    const paymentCard =
        document.querySelector(".payment-entry-card");

    const paymentControls = paymentCard
        ? paymentCard.querySelectorAll("input, select, textarea, button")
        : [];

    const memberStatusPill =
        document.getElementById("memberStatusPill");

    const memberStatusText =
        document.getElementById("memberStatusText");

    // Member not assigned

    if (
        member.pandu_count === null ||
        member.pandu_count === undefined ||
        member.pandu_count === 0
    ) {

        if (warningBox) {
            warningBox.style.display = "flex";
        }

        if (paymentCard) {
            paymentCard.classList.add("is-disabled");
        }

        paymentControls.forEach(control => control.disabled = true);
        document.getElementById("memberId").value = "";

        if (memberStatusPill) {
            memberStatusPill.classList.remove("awaiting-selection");
            memberStatusPill.classList.add("not-enrolled");
        }

        if (memberStatusText) {
            memberStatusText.textContent = "Not enrolled in Pandu";
        }

        document.getElementById("memberCode").textContent =
            member.member_code || "-";

        document.getElementById("memberName").textContent =
            member.member_name || "-";

        document.getElementById("memberMobile").textContent =
            member.mobile || "-";

        document.getElementById("memberGroup").textContent =
            "NOT ASSIGNED";

        document.getElementById("panduCount").textContent =
            "0";

        document.getElementById("memberDue").textContent =
            "₹0";

        document.getElementById("maturityAmount").textContent =
            "₹0";

        document.getElementById("lastPaymentDate").textContent = "-";
        document.getElementById("lastReceiptNo").textContent = "-";
        document.getElementById("pendingMonths").textContent = "0";
        document.getElementById("pendingDue").textContent = "₹0";
        document.getElementById("amount").value = "0";
        document.getElementById("totalPaid").textContent = "₹0";
        document.getElementById("totalDue").textContent = "₹0";
        document.getElementById("totalPending").textContent = "₹0";
        document.getElementById("dueTableBody").innerHTML = `
            <tr class="empty-due-row">
                <td colspan="6">
                    <i class="bi bi-person-x"></i>
                    <strong>No Pandu scheme assigned</strong>
                    <span>Enrol this member before recording a collection.</span>
                </td>
            </tr>
        `;

        return;
    }

    // Member assigned

    if (warningBox) {
        warningBox.style.display = "none";
    }

    if (paymentCard) {
        paymentCard.classList.remove("is-disabled");
    }

    paymentControls.forEach(control => control.disabled = false);

    if (memberStatusPill) {
        memberStatusPill.classList.remove("awaiting-selection");
        memberStatusPill.classList.remove("not-enrolled");
    }

    if (memberStatusText) {
        memberStatusText.textContent = "Active membership";
    }

    document.getElementById("memberCode").textContent =
        member.member_code || "-";

    document.getElementById("memberName").textContent =
        member.member_name || "-";

    document.getElementById("memberMobile").textContent =
        member.mobile || "-";

    document.getElementById("memberGroup").textContent =
        member.group_name || "-";

    document.getElementById("panduCount").textContent =
        member.pandu_count || 0;

    document.getElementById("memberDue").textContent =
        "₹" +
        Number(member.monthly_due || 0)
            .toLocaleString("en-IN");

    document.getElementById("amount").value =
        member.monthly_due || 0;

    document.getElementById("maturityAmount").textContent =
        "₹" +
        Number(member.maturity_amount || 0)
            .toLocaleString("en-IN");

    document.getElementById("lastPaymentDate").textContent =
        member.last_payment_date || "-";

    document.getElementById("lastReceiptNo").textContent =
        member.last_receipt_no || "-";

    document.getElementById("pendingMonths").textContent =
        member.pending_months || 0;

    const pendingMonths =
        parseInt(member.pending_months || 0);

    const monthlyDue =
        parseFloat(member.monthly_due || 0);

    document.getElementById("pendingDue").textContent =
        "₹" +
        (pendingMonths * monthlyDue)
            .toLocaleString("en-IN");

    loadDueStatus(id);

    loadDashboardSummary();
}

async function loadDueStatus(id) {

    const response =
        await fetch(
            `/api/member-full-due/${id}`
        );

    const rows =
        await response.json();

    const tbody =
        document.getElementById(
            "dueTableBody"
        );

    tbody.innerHTML = "";
    let totalPaid = 0;
    let totalDue = 0;
    let totalPending = 0;



    rows.forEach(row => {

        let statusClass = "";
        let rowClass = "";

        if (row.status === "Paid") {

            statusClass = "status-paid";
            rowClass = "row-paid";

        } else if (row.status === "Not Paid") {

            statusClass = "status-notpaid";
            rowClass = "row-notpaid";

        } else {

            statusClass = "status-pending";
            rowClass = "row-pending";
        }

        totalDue += Number(row.due_amount);
        totalPaid += Number(row.paid_amount);
        if (row.status !== "Paid") {
            totalPending += Number(row.due_amount);
        }


        tbody.innerHTML += `
        <tr class="${rowClass}">

            <td>${row.month_name}</td>

            <td>₹${row.due_amount}</td>

            <td>₹${row.paid_amount}</td>

            <td>
                <span class="${statusClass}">
                    ${row.status}
                </span>
            </td>

            <td>${row.collection_date}</td>

            <td>-</td>

        </tr>
        `;
    });

    document.getElementById(
        "totalPaid"
    ).textContent =
        "₹" +
        totalPaid.toLocaleString("en-IN");

    document.getElementById(
        "totalDue"
    ).textContent =
        "₹" +
        totalDue.toLocaleString("en-IN");

    document.getElementById(
        "totalPending"
    ).textContent =
        "₹" +
        totalPending.toLocaleString("en-IN");
}

function clearMemberSearch() {

    const searchBox =
        document.getElementById("searchMember");

    searchBox.value = "";
    document.getElementById("searchMember").value = null;
    document.getElementById("searchMember").setAttribute("value", "");

    clearMemberDetails();

    document.getElementById(
        "memberDropdown"
    ).style.display = "none";

    
    document.getElementById("pendingDue").textContent = "₹0";
    document.getElementById("pendingDue").textContent = "₹0";

    searchBox.focus();
}

function clearMemberDetails() {

    document.getElementById("memberId").value = "";

    document.getElementById("memberCode").textContent = "-";
    document.getElementById("memberName").textContent = "-";
    document.getElementById("memberMobile").textContent = "-";
    document.getElementById("memberGroup").textContent = "-";
    document.getElementById("panduCount").textContent = "-";
    //document.getElementById("memberAmount").textContent = "₹0";
    document.getElementById("memberDue").textContent = "₹0";
    document.getElementById("maturityAmount").textContent = "₹0";

    document.getElementById("lastPaymentDate").textContent = "-";
    document.getElementById("lastReceiptNo").textContent = "-";

    document.getElementById("pendingMonths").textContent = "0";
    document.getElementById("pendingDue").textContent = "₹0";
    document.getElementById("totalPaid").textContent = "₹0";
    document.getElementById("totalDue").textContent = "₹0";
    document.getElementById("totalPending").textContent = "₹0";

    const warningBox = document.getElementById("assignWarning");
    if (warningBox) warningBox.style.display = "none";

    const paymentCard = document.querySelector(".payment-entry-card");
    if (paymentCard) {
        paymentCard.classList.remove("is-disabled");
        paymentCard.querySelectorAll("input, select, textarea, button")
            .forEach(control => control.disabled = false);
    }

    const memberStatusPill = document.getElementById("memberStatusPill");
    if (memberStatusPill) {
        memberStatusPill.classList.remove("not-enrolled");
        memberStatusPill.classList.add("awaiting-selection");
    }

    const memberStatusText = document.getElementById("memberStatusText");
    if (memberStatusText) memberStatusText.textContent = "Awaiting selection";

    document.getElementById("dueTableBody").innerHTML = `
        <tr class="empty-due-row">
            <td colspan="6">
                <i class="bi bi-person-check"></i>
                <strong>Select a member to view due history</strong>
                <span>Monthly payment information will appear here.</span>
            </td>
        </tr>
    `;
}

// fetch(`/api/member-search?q=${keyword}`)
// .then(res => res.json())
// .then(data => {

//     if(data.length === 0){

//         clearMemberDetails();
//         return;
//     }

//     // existing member loading code

// });






function clearForm() {

    // Clear search box
    document.getElementById("searchMember").value = "";

    // Clear hidden member id
    document.getElementById("memberId").value = "";

    // Clear Member Details
    document.getElementById("memberCode").textContent = "-";
    document.getElementById("memberName").textContent = "-";
    document.getElementById("memberMobile").textContent = "-";
    document.getElementById("memberGroup").textContent = "-";
    //document.getElementById("memberAmount").textContent = "0";
    document.getElementById("memberDue").textContent = "₹0";

    // Clear Quick Info
    document.getElementById("lastPaymentDate").textContent = "-";
    document.getElementById("lastReceiptNo").textContent = "-";
    document.getElementById("pendingMonths").textContent = "0";

    // Clear Payment Entry
    document.getElementById("amount").value = "0";
    document.getElementById("paymentMode").selectedIndex = 0;

    // Clear Due Table
    document.getElementById("dueTableBody").innerHTML = `
        <tr>
            <td colspan="6" style="text-align:center;">
                No Member Selected
            </td>
        </tr>
    `;

    // Hide dropdown
    document.getElementById("memberDropdown").style.display = "none";

    showNotification(
        "Details Cleared",
        "success"
    );

    document.getElementById(
        "pendingDue"
    ).textContent = "₹0";
}






async function savePayment() {

    const amount =
        document.getElementById("amount").value;


    //---------------------------------------------
    const expectedAmount =
        Number(
            document.getElementById("memberDue")
                .textContent.replace(/[₹,]/g, "")
        );

    // if (Number(amount) !== expectedAmount) {

    //     alert(
    //         "Amount must be ₹" +
    //         expectedAmount
    //     );

    //     return;
    // }
    //-----------------------------------------------
    const paymentMode =
        document.getElementById(
            "paymentMode"
        ).value;


    const memberId =
        document.getElementById("memberId").value;

    if (!memberId) {

        alert("Select Member First");
        return;
    }


    const monthText =
        document.getElementById("collectionMonth").value;

    const monthMap = {
        "Jan-2026": 1,
        "Feb-2026": 2,
        "Mar-2026": 3,
        "Apr-2026": 4,
        "May-2026": 5,
        "Jun-2026": 6,
        "Jul-2026": 7,
        "Aug-2026": 8,
        "Sep-2026": 9,
        "Oct-2026": 10,
        "Nov-2026": 11,
        "Dec-2026": 12
    };

    const month =
        monthMap[monthText];

    const year = 2026;

    const formData = new FormData();

    formData.append(
        "member_id",
        memberId
    );

    formData.append(
        "amount",
        amount
    );

    formData.append(
        "month",
        month
    );

    formData.append(
        "year",
        year
    );

    formData.append(
        "payment_mode",
        paymentMode
    );

    try {

        const response =
            await fetch(
                "/api/save-collection",
                {
                    method: "POST",
                    body: formData
                }
            );

        const data =
            await response.json();

        if (data.success) {

            showSuccessPopup(
                data.receipt_no
            );

            loadDueStatus(memberId);

        } else {

            alert("Save Failed");
        }

    } catch (err) {

        console.error(err);

        alert(
            "Server Error"
        );
    }
}


document.addEventListener("DOMContentLoaded", () => {

    const searchBox =
        document.getElementById("searchMember");

    const dropdown =
        document.getElementById("memberDropdown");

    if (!searchBox || !dropdown) return;

    searchBox.addEventListener(
        "input",
        async function () {

            const keyword =
                this.value.trim();

            if (keyword.length < 1) {

                dropdown.style.display = "none";
                return;
            }

            try {

                const response =
                    await fetch(
                        `/api/member-search?q=${keyword}`
                    );

                const members =
                    await response.json();

                dropdown.innerHTML = "";

                if (members.length === 0) {

                    dropdown.style.display =
                        "none";

                    return;
                }

                members.forEach(member => {

                    const item =
                        document.createElement("div");

                    item.className =
                        "member-item";

                    item.textContent =
                        `${member.member_code} · ${member.member_name} · ${member.mobile}` +
                        (member.aadhaar_masked ? ` · Aadhaar ${member.aadhaar_masked}` : "");

                    item.onclick = () => {

                        searchBox.value =
                            member.member_name;

                        dropdown.style.display =
                            "none";

                        loadMember(member.id);
                    };

                    dropdown.appendChild(item);
                });

                dropdown.style.display =
                    "block";

            } catch (err) {

                console.log(err);
            }
        }
    );
});

let selectedIndex = -1;

function updateSelection(items) {

    items.forEach(item => {
        item.classList.remove("active");
    });

    if (selectedIndex >= 0 &&
        selectedIndex < items.length) {

        items[selectedIndex]
            .classList.add("active");

        items[selectedIndex]
            .scrollIntoView({
                block: "nearest"
            });
    }
}

const searchBox =
    document.getElementById("searchMember");

const dropdown =
    document.getElementById("memberDropdown");

searchBox.addEventListener(
    "keydown",
    function (e) {


        // If search box is empty
        if (this.value.trim() === "") {

            // Clear member details
            document.getElementById("memberCode").textContent = "-";
            document.getElementById("memberName").textContent = "-";
            document.getElementById("memberMobile").textContent = "-";
            document.getElementById("memberGroup").textContent = "-";
            // document.getElementById("memberAmount").textContent = "0";
            document.getElementById("memberDue").textContent = "₹0";

            // Clear hidden member id
            document.getElementById("memberId").value = "";

            // Clear due table
            document.getElementById("dueTableBody").innerHTML = "";

            // Reset payment form
            document.getElementById("amount").value = "0";

            // Hide dropdown
            document.getElementById("memberDropdown").style.display = "none";
        }

        const items =
            dropdown.querySelectorAll(
                ".member-item"
            );

        if (items.length === 0)
            return;

        if (e.key === "ArrowDown") {

            e.preventDefault();

            selectedIndex++;

            if (selectedIndex >= items.length) {
                selectedIndex = 0;
            }

            updateSelection(items);
        }

        else if (e.key === "ArrowUp") {

            e.preventDefault();

            selectedIndex--;

            if (selectedIndex < 0) {
                selectedIndex =
                    items.length - 1;
            }

            updateSelection(items);
        }

        else if (e.key === "Enter") {

            if (selectedIndex >= 0) {

                e.preventDefault();

                items[selectedIndex].click();
            }
        }
    }
);


async function loadDashboardSummary() {

    const response =
        await fetch("/api/dashboard-summary");

    const data =
        await response.json();

    document.getElementById(
        "todayCollection"
    ).textContent =
        "₹" + Number(data.today_collection)
            .toLocaleString("en-IN");

    document.getElementById(
        "totalMembers"
    ).textContent =
        data.total_members;

    document.getElementById(
        "pendingMembers"
    ).textContent =
        data.pending_members;

    document.getElementById(
        "monthCollection"
    ).textContent =
        "₹" + Number(data.month_collection)
            .toLocaleString("en-IN");
}


document.addEventListener("DOMContentLoaded", function () {

    initializeDate();
    checkCollectionRestriction();
    setupVoiceSearch();
    setupButtons();

    loadDashboardSummary();
});

function loadCollectionMonths() {

    const dropdown =
        document.getElementById("collectionMonth");

    if (!dropdown) return;

    dropdown.innerHTML = "";

    const year = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const months = [
        "Jan", "Feb", "Mar", "Apr",
        "May", "Jun", "Jul", "Aug",
        "Sep", "Oct", "Nov", "Dec"
    ];

    for (let i = 0; i <= currentMonth; i++) {

        const option =
            document.createElement("option");

        option.value =
            `${months[i]}-${year}`;

        option.textContent =
            `${months[i]}-${year}`;

        dropdown.appendChild(option);
    }

    dropdown.selectedIndex =
        currentMonth;
}


// const amountBox =
//     document.getElementById("amount");

// if (amountBox) {

//     amountBox.addEventListener(
//         "input",
//         function () {

//             let value =
//                 this.value.replace(/\D/g, "");

//             if (value === "") {

//                 this.value = "";
//                 return;
//             }

//             this.value =
//                 "₹" +
//                 Number(value)
//                 .toLocaleString("en-IN");
//         }
//     );
// }

function showSuccessPopup(receiptNo) {

    document.getElementById(
        "popupReceiptNo"
    ).textContent =
        "Receipt No : " + receiptNo;

    document.getElementById(
        "successPopup"
    ).style.display =
        "flex";
}

function closeSuccessPopup() {

    document.getElementById(
        "successPopup"
    ).style.display =
        "none";
}

function updateDateTime() {

    const now = new Date();

    const date =
        now.toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    const time =
        now.toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }
        );

    document.getElementById(
        "currentDate"
    ).textContent =
        `${date} | ${time}`;
}

updateDateTime();

setInterval(
    updateDateTime,
    1000
);
function goBack() {

    window.history.back();
}

async function loadTodayCollections() {

    const response =
        await fetch(
            "/api/reports/today-collections"
        );

    const data =
        await response.json();

    const tbody =
        document.getElementById(
            "reportBody"
        );

    tbody.innerHTML = "";

    data.rows.forEach(row => {

        tbody.innerHTML += `

        <tr>

            <td>${row.receipt_no}</td>

            <td>${row.collection_date}</td>

            <td>${row.member_code}</td>

            <td>${row.member_name}</td>

            <td>
                ₹${Number(row.amount)
                .toLocaleString("en-IN")}
            </td>

            <td>${row.payment_mode}</td>

        </tr>

        `;
    });

    document.getElementById(
        "totalAmount"
    ).textContent =
        "₹" +
        Number(data.total_amount)
            .toLocaleString("en-IN");
}

loadTodayCollections();

function goAssignPandu() {

    const memberId =
        document.getElementById(
            "memberId"
        ).value;

    window.location.href =
        "/pandu/assign";
}

function goAssignPandu() {

    const memberId =
        document.getElementById(
            "memberId"
        ).value;

    window.location.href =
        "/pandu/assign";
}
