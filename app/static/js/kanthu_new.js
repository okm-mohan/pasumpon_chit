let selectedMemberId = null;

// --------------------------
// PAGE LOAD
// --------------------------

document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("issue_date").value =
        new Date().toISOString().split("T")[0];

    document
        .getElementById("member_search")
        .addEventListener(
            "keyup",
            searchMembers
        );

    document
        .getElementById("kanthu_amount")
        .addEventListener(
            "input",
            calculateAmount
        );

    document
        .getElementById("interest_percent")
        .addEventListener(
            "input",
            calculateAmount
        );

    document
        .getElementById("saveKanthuBtn")
        .addEventListener(
            "click",
            saveKanthu
        );

});

async function searchMembers() {

    const keyword =
        document
            .getElementById("member_search")
            .value;

    if (keyword.length < 2)
        return;

    const response =
        await fetch(
            `/api/kanthu-member-search?search=${keyword}`
        );

    const members =
        await response.json();

    let html = "";

    members.forEach(member => {

        html += `

            <div
                class="search-item"
                onclick="selectMember(${member.id})">

                <div class="search-name">
                    ${member.member_name}
                </div>

                <div class="search-mobile">
                    ${member.mobile}
                </div>

            </div>

        `;

    });

    document
        .getElementById(
            "memberSearchResults"
        )
        .innerHTML = html;
}


async function selectMember(memberId) {

    selectedMemberId = memberId;

    const response =
        await fetch(
            `/api/member/${memberId}`
        );

    const member =
        await response.json();

    document.getElementById(
        "member_name"
    ).value =
        member.member_name || "";

    document.getElementById(
        "mobile"
    ).value =
        member.mobile || "";

    document.getElementById(
        "village"
    ).value =
        member.village || "";

    document.getElementById(
        "memberSearchResults"
    ).innerHTML = "";
}


function calculateAmount() {

    let amount =
        parseFloat(
            document.getElementById(
                "kanthu_amount"
            ).value
        ) || 0;

    let interest =
        parseFloat(
            document.getElementById(
                "interest_percent"
            ).value
        ) || 0;

    let interestAmount =
        amount * interest / 100;

    let netAmount =
        amount - interestAmount;

    document.getElementById(
        "interest_amount"
    ).innerHTML =
        "₹ " +
        interestAmount.toFixed(2);

    document.getElementById(
        "net_paid_amount"
    ).innerHTML =
        "₹ " +
        netAmount.toFixed(2);
}


async function saveKanthu() {

    if (!selectedMemberId) {

        alert(
            "Select Member"
        );

        return;
    }

    const payload = {

        member_id:
            selectedMemberId,

        issue_date:
            document.getElementById(
                "issue_date"
            ).value,

        principal_amount:
            document.getElementById(
                "kanthu_amount"
            ).value,

        interest_percent:
            document.getElementById(
                "interest_percent"
            ).value,

        remarks:
            document.getElementById(
                "remarks"
            ).value
    };

    const response =
        await fetch(
            "/api/kanthu/save",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(payload)
            }
        );

    const result =
        await response.json();

    if (result.success) {

        alert(
            "Kanthu Created\n\n" +
            result.kanthu_no
        );

        location.reload();

    } else {

        alert(
            result.message
        );
    }
}