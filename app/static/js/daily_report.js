async function loadDailyCollections() {

    const selectedDate =

        document.getElementById(
            "reportDateFilter"
        ).value;

    if(!selectedDate){

        alert(
            "Select Date"
        );

        return;
    }

    const response =

        await fetch(

            `/api/reports/daily-collections?report_date=${selectedDate}`

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
}

function printReport(){

    window.print();
}

async function exportPDF(){

    const report =
        document.getElementById(
            "reportContainer"
        );

    const canvas =
        await html2canvas(
            report,
            {
                scale: 2
            }
        );

    const imgData =
        canvas.toDataURL(
            "image/png"
        );

    const {
        jsPDF
    } = window.jspdf;

    const pdf =
        new jsPDF(
            "p",
            "mm",
            "a4"
        );

    const pdfWidth =
        pdf.internal.pageSize.getWidth();

    const pdfHeight =
        (
            canvas.height *
            pdfWidth
        ) /
        canvas.width;

    pdf.addImage(
        imgData,
        "PNG",
        0,
        0,
        pdfWidth,
        pdfHeight
    );

    pdf.save(
        "Daily_Collection_Report.pdf"
    );
}

function exportExcel(){

    alert(
        "Excel Export Coming Soon"
    );
}

function shareReport(){

    if(navigator.share){

        navigator.share({

            title:
                "Daily Collection Report",

            text:
                "Pasumpon Chit Daily Report",

            url:
                window.location.href

        });

    }else{

        alert(
            "Share Not Supported"
        );
    }
}