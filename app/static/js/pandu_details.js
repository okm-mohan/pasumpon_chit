let trendChart = null;
let donutChart = null;

/* ==========================================
   FORMAT MONEY
========================================== */

function formatMoney(value){

    return "₹" +
        Number(value || 0)
        .toLocaleString("en-IN");
}

/* ==========================================
   ANIMATE NUMBER
========================================== */

function animateValue(
    elementId,
    start,
    end,
    duration = 1200
){

    const obj =
        document.getElementById(elementId);

    let startTime = null;

    function step(timestamp){

        if(!startTime)
            startTime = timestamp;

        const progress =
            Math.min(
                (timestamp - startTime) / duration,
                1
            );

        const value =
            Math.floor(
                progress * (end - start) + start
            );

        obj.innerHTML =
            value.toLocaleString("en-IN");

        if(progress < 1){

            window.requestAnimationFrame(step);
        }
    }

    window.requestAnimationFrame(step);
}

/* ==========================================
   LOAD DASHBOARD
========================================== */

async function loadDashboard(){

    try{

        const response =
            await fetch(
                "/api/pandu-dashboard"
            );

        const data =
            await response.json();

        document.getElementById(
            "totalAmount"
        ).innerHTML =
            formatMoney(
                data.total_amount
            );

                    document.getElementById(
            "totalAmountCard"
        ).innerHTML =
            formatMoney(
                data.total_amount
            );
            

        document.getElementById(
            "collectedAmount"
        ).innerHTML =
            formatMoney(
                data.collected_amount
            );

        document.getElementById(
            "balanceAmount"
        ).innerHTML =
            formatMoney(
                data.balance_amount
            );

        animateValue(
            "totalMembers",
            0,
            data.total_members
        );

        animateValue(
            "paidMembers",
            0,
            data.paid_members
        );

        animateValue(
            "pendingMembers",
            0,
            data.pending_members
        );

        document.getElementById(
            "percentage"
        ).innerHTML =
            data.percentage + "%";

        document.getElementById(
            "monthCollection"
        ).innerHTML =
            formatMoney(
                data.current_month
            );

        document.getElementById(
            "todayCollection"
        ).innerHTML =
            formatMoney(
                data.today_collection
            );

        document.getElementById(
            "overviewMembers"
        ).innerHTML =
            data.total_members;

        document.getElementById(
            "overviewPaid"
        ).innerHTML =
            data.paid_members;

        document.getElementById(
            "overviewPending"
        ).innerHTML =
            data.pending_members;

        loadProgress(
            data.percentage
        );

        loadDonutChart(
            data.collected_amount,
            data.balance_amount
        );

    }
    catch(error){

        console.error(error);
    }
}

/* ==========================================
   PROGRESS BAR
========================================== */

function loadProgress(percent){

    const progressBar =
        document.getElementById(
            "progressBar"
        );

    const progressLabel =
        document.getElementById(
            "progressLabel"
        );

    progressBar.style.width = "0%";

    setTimeout(() => {

        progressBar.style.width =
            percent + "%";

        progressBar.innerHTML =
            percent + "%";

        progressLabel.innerHTML =
            percent + "%";

    },300);
}

/* ==========================================
   DONUT CHART
========================================== */

function loadDonutChart(
    collected,
    balance
){

    const ctx =
        document.getElementById(
            "donutChart"
        );

    if(donutChart){

        donutChart.destroy();
    }

    donutChart =
        new Chart(ctx,{

        type:"doughnut",

        data:{

            labels:[
                "Collected",
                "Balance"
            ],

            datasets:[{

                data:[
                    collected,
                    balance
                ],

                backgroundColor:[
                    "#10b981",
                    "#ef4444"
                ],

                borderWidth:0

            }]
        },

        options:{

            responsive:true,

            plugins:{

                legend:{

                    position:"bottom"
                }
            }
        }
    });
}

/* ==========================================
   MONTHLY TREND
========================================== */

function loadTrendChart(){

    const ctx =
        document.getElementById(
            "collectionChart"
        );

    if(trendChart){

        trendChart.destroy();
    }

    trendChart =
        new Chart(ctx,{

        type:"bar",

        data:{

            labels:[
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec"
            ],

            datasets:[{

                label:
                "Monthly Collection",

                data:[
                    50000,
                    60000,
                    70000,
                    85000,
                    90000,
                    95000,
                    100000,
                    85000,
                    65000,
                    75000,
                    95000,
                    120000
                ],

                borderRadius:10,

                backgroundColor:
                    "#2563eb"
            }]
        },

        options:{

            responsive:true,

            plugins:{

                legend:{
                    display:false
                }
            },

            scales:{

                y:{

                    beginAtZero:true
                }
            }
        }
    });
}

/* ==========================================
   RECENT COLLECTIONS
========================================== */

function loadRecentCollections(){

    const tbody =
        document.getElementById(
            "recentCollections"
        );

    tbody.innerHTML = `

        <tr>

            <td>RC001</td>

            <td>Kumar</td>

            <td>₹5,000</td>

            <td>Today</td>

        </tr>

        <tr>

            <td>RC002</td>

            <td>Ravi</td>

            <td>₹5,000</td>

            <td>Today</td>

        </tr>

        <tr>

            <td>RC003</td>

            <td>Selvam</td>

            <td>₹5,000</td>

            <td>Today</td>

        </tr>

    `;
}

/* ==========================================
   INIT
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    function(){

        loadDashboard();

        loadTrendChart();

        loadRecentCollections();

    }
);