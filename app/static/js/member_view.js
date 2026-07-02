let currentAssignmentId = null;

// -----------------------------------------------------
// Open Settlement Popup
// -----------------------------------------------------

async function openSettlementModal(memberId) {

    try {

        const response = await fetch(
            `/api/member/${memberId}/pandu-settlement`
        );

        const data = await response.json();

        if (!response.ok) {

            alert(data.message || "Unable to load settlement details.");

            return;
        }

        currentAssignmentId = data.assignment_id;

        // LEFT SIDE

        document.getElementById("st_member").innerHTML =
            data.member_name;

        document.getElementById("st_scheme").innerHTML =
            data.group_name;

        document.getElementById("st_count").innerHTML =
            data.pandu_count;

        document.getElementById("st_monthly").innerHTML =
            "₹ " + Number(data.group_monthly_due).toLocaleString();

        document.getElementById("st_total").innerHTML =
            "₹ " + Number(data.total_amount).toLocaleString();

        document.getElementById("st_paid").innerHTML =
            "₹ " + Number(data.paid_amount).toLocaleString();

        document.getElementById("st_balance").innerHTML =
            "₹ " + Number(data.balance_amount).toLocaleString();

        document.getElementById("st_paid_months").innerHTML =
            data.paid_months;

        document.getElementById("st_pending_months").innerHTML =
            data.pending_months;

        // RIGHT SIDE

        document.getElementById("st_settlement").innerHTML =
            "₹ " + Number(data.settlement_amount).toLocaleString();

        if (!data.ready_to_settle) {

            document.getElementById("btnSettle").disabled = true;

            document.getElementById("btnSettle").innerHTML =
                "Pending Balance Exists";

        } else {

            document.getElementById("btnSettle").disabled = false;

            document.getElementById("btnSettle").innerHTML =
                '<i class="bi bi-check-circle-fill"></i> Settle Pandu';

        }

        const modal =
            new bootstrap.Modal(
                document.getElementById("settlementModal")
            );

        modal.show();

    }
    catch (err) {

        console.error(err);

        alert("Unable to load settlement details.");

    }

}



// -----------------------------------------------------
// Settlement Button
// -----------------------------------------------------

document.addEventListener("DOMContentLoaded", function () {

    const btn = document.getElementById("btnSettle");

    if (!btn) return;

    btn.addEventListener("click", settlePandu);

});



// -----------------------------------------------------
// Settlement
// -----------------------------------------------------

async function settlePandu() {

    if (currentAssignmentId == null)
        return;

    if (!confirm("Confirm Pandu Settlement ?"))
        return;

    try {

        const response = await fetch(

            `/api/pandu-settlement/${currentAssignmentId}`,

            {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify({

                    remarks: "Pandu Settlement Completed"

                })

            }

        );

        const result = await response.json();

        if (result.success) {

            alert(result.message);

            location.reload();

        }

        else {

            alert(result.message);

        }

    }

    catch (err) {

        console.error(err);

        alert("System Error");

    }

}