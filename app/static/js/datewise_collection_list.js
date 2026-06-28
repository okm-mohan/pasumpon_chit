// ----------------------------
// Date Wise Collection Report
// ----------------------------

window.onload = function () {

    const today = new Date();

    const firstDay =
        new Date(today.getFullYear(),
                 today.getMonth(),
                 1);

    document.getElementById("fromDate").value =
        firstDay.toISOString().split("T")[0];

    document.getElementById("toDate").value =
        today.toISOString().split("T")[0];

    loadReport();
};

// --------------------------------

async function loadReport(){

    const fromDate =
        document.getElementById("fromDate").value;

    const toDate =
        document.getElementById("toDate").value;

    if(!fromDate || !toDate){

        alert("Select From Date and To Date");

        return;
    }

    const response =
        await fetch(
            `/api/datewise-collection-list?from_date=${fromDate}&to_date=${toDate}`
        );

    const data =
        await response.json();

    let html = "";

    let totalCollection = 0;
    let cashCollection = 0;
    let upiCollection = 0;

    const members = new Set();

    let sno = 1;

    data.forEach(row => {

        totalCollection += Number(row.amount);

        members.add(row.member_id);

        if(row.payment_mode === "Cash"){

            cashCollection += Number(row.amount);

        }else{

            upiCollection += Number(row.amount);

        }

        html += `

        <tr>

            <td>${sno++}</td>

            <td>${row.collection_date}</td>

            <td>${row.receipt_no}</td>

            <td>${row.member_code}</td>

            <td>${row.member_name}</td>

            <td>${row.group_name}</td>

            <td class="amount">
                ₹${Number(row.amount).toLocaleString()}
            </td>

            <td>${row.payment_mode}</td>

        </tr>

        `;
    });

    if(data.length === 0){

        html = `

        <tr>

            <td colspan="8">

                No Collection Records Found

            </td>

        </tr>

        `;
    }

    document.getElementById("reportBody").innerHTML =
        html;

    document.getElementById("totalCollection").innerHTML =
        "₹" + totalCollection.toLocaleString();

    document.getElementById("cashCollection").innerHTML =
        "₹" + cashCollection.toLocaleString();

    document.getElementById("upiCollection").innerHTML =
        "₹" + upiCollection.toLocaleString();

    document.getElementById("totalMembers").innerHTML =
        members.size;
}