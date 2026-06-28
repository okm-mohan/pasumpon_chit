async function loadMembers() {

    const response =
        await fetch(
            "/api/member-analysis"
        );

    const data =
        await response.json();

    const tbody =
        document.getElementById(
            "memberTable"
        );

    tbody.innerHTML = "";

    data.rows.forEach(row => {

        tbody.innerHTML += `

        <tr>

            <td>${row.member_code}</td>

            <td>${row.member_name}</td>

            <td>${row.mobile}</td>

            <td>${row.pandu_count}</td>

            <td>
                ₹${row.pandu_count * 100}
            </td>

            <td>

                <button>

                    Ledger

                </button>

            </td>

        </tr>

        `;
    });

    document.getElementById(
        "totalMembers"
    ).innerText =
        data.rows.length;
}

document.addEventListener(
    "DOMContentLoaded",
    loadMembers
);