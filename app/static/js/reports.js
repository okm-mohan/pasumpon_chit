async function loadTodayCollections() {

    try {

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

    } catch(error){

        console.error(error);

        alert(
            "Unable to load report."
        );
    }
}

/* =========================
   BUTTONS
========================= */

function printReport(){

    window.print();
}

function exportPDF(){

    alert(
        "PDF Export Coming Soon"
    );
}

function exportExcel(){

    alert(
        "Excel Export Coming Soon"
    );
}

function shareReport(){

    if(
        navigator.share
    ){

        navigator.share({

            title:
                "Today's Collection Report",

            text:
                "Pasumpon Chit Report",

            url:
                window.location.href

        });

    }else{

        alert(
            "Share not supported."
        );
    }
}

/* =========================
   PAGE LOAD
========================= */

document.addEventListener(
    "DOMContentLoaded",
    function(){

        loadTodayCollections();

    }
);


async function exportPDF() {

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
        "Todays_Collection_Report.pdf"
    );
}