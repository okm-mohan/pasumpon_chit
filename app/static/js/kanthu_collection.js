let selectedMemberId = null;
let selectedKanthuId = null;

document.addEventListener("DOMContentLoaded", () => {

    document.getElementById(
        "collection_date"
    ).value =
        new Date()
        .toISOString()
        .split("T")[0];

    document
        .getElementById("member_search")
        .addEventListener(
            "keyup",
            searchMembers
        );

    document
        .getElementById("saveCollectionBtn")
        .addEventListener(
            "click",
            saveCollection
        );

});


async function searchMembers() {

    const keyword =
        document
            .getElementById(
                "member_search"
            )
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

    const memberResponse =
        await fetch(
            `/api/member/${memberId}`
        );

    const member =
        await memberResponse.json();

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

    loadKanthus(memberId);
}


async function loadKanthus(memberId) {

    const response =
        await fetch(
            `/api/member-active-kanthus/${memberId}`
        );

    const kanthus =
        await response.json();

    let html = "";

    if (kanthus.length === 0) {

        html = `
            <tr>
                <td colspan="6"
                    class="text-center">
                    No Active Kanthu
                </td>
            </tr>
        `;
    }

    kanthus.forEach(k => {

        html += `

        <tr>

            <td>${k.kanthu_no}</td>

            <td>${k.issue_date}</td>

            <td>₹ ${Number(
                k.principal_amount
            ).toLocaleString()}</td>

            <td>₹ ${Number(
                k.total_collected
            ).toLocaleString()}</td>

            <td class="text-danger fw-bold">
                ₹ ${Number(
                    k.balance_amount
                ).toLocaleString()}
            </td>

            <td>

                <button
                    class="btn-collect"
                    onclick="selectKanthu(${k.id})">

                    Collect

                </button>

            </td>

        </tr>

        `;
    });

    document.getElementById(
        "kanthuTableBody"
    ).innerHTML = html;
}


function selectKanthu(id) {

    selectedKanthuId = id;

    const row =
        event.target.closest("tr");

    document.getElementById(
        "kanthu_no"
    ).value =
        row.cells[0].innerText;

    document.getElementById(
        "principal_amount"
    ).value =
        row.cells[2].innerText;

    document.getElementById(
        "balance_amount"
    ).value =
        row.cells[4].innerText;

    document.getElementById(
        "display_balance"
    ).innerHTML =
        row.cells[4].innerText;
}


async function saveCollection() {

    if (!selectedKanthuId) {

        alert("Select Kanthu");

        return;
    }

    const payload = {

        kanthu_id:
            selectedKanthuId,

        collection_date:
            document.getElementById(
                "collection_date"
            ).value,

        amount:
            parseFloat(
                document.getElementById(
                    "collection_amount"
                ).value
            ),

        payment_mode:
            document.getElementById(
                "payment_mode"
            ).value,

        remarks:
            document.getElementById(
                "remarks"
            ).value
    };

    const response =
        await fetch(
            "/api/kanthu/collection/save",
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
            "Collection Saved"
        );

        location.reload();

    } else {

        alert(
            result.message
        );
    }
}