// app/static/js/pandu_collection_summary.js

async function loadReport(){

    const year = document.getElementById("year").value;

    const response =
        await fetch(`/api/collection-summary?year=${year}`);

    const data = await response.json();

    let html = "";

    data.forEach(row => {

        html += `
        <tr>
            <td>${row.month}</td>
            <td>₹${row.expected.toLocaleString()}</td>
            <td>₹${row.collected.toLocaleString()}</td>
            <td>₹${row.pending.toLocaleString()}</td>
        </tr>`;
    });

    document.getElementById("reportBody").innerHTML = html;
}

loadReport();