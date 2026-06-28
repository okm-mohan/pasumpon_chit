async function loadMonthlyCollections() {

    const month =

        document.getElementById(
            "monthFilter"
        ).value;

    const year =

        document.getElementById(
            "yearFilter"
        ).value;

    const response = await fetch(

        `/api/reports/monthly-collections?month=${month}&year=${year}`

    );

    const data =
        await response.json();

    const tbody =
        document.getElementById(
            "reportBody"
        );

    tbody.innerHTML = "";

    let counter = 1;

    data.rows.forEach(row => {

        tbody.innerHTML += `

        <tr>

            <td>${counter++}</td>

            <td>${row.receipt_no}</td>

            <td>${row.collection_date}</td>

            <td>${row.member_code}</td>

            <td>${row.member_name}</td>

            <td class="amount">

                ₹${Number(row.amount)
                .toLocaleString("en-IN")}

            </td>

            <td>${row.payment_mode}</td>

        </tr>

        `;
    });

    const total =

        Number(
            data.total_amount
        ).toLocaleString(
            "en-IN"
        );

    document.getElementById(
        "totalAmount"
    ).innerText =
        "₹" + total;

    document.getElementById(
        "footerTotal"
    ).innerText =
        "₹" + total;

    document.getElementById(
        "totalReceipts"
    ).innerText =
        data.total_receipts;
}

