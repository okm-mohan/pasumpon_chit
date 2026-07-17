document.addEventListener("DOMContentLoaded", () => {
    const currency = new Intl.NumberFormat("en-IN", {
        style: "currency", currency: "INR", maximumFractionDigits: 0
    });
    const number = new Intl.NumberFormat("en-IN");

    const setText = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    };

    setText("dashboardDate", new Intl.DateTimeFormat("en-IN", {
        weekday: "short", day: "2-digit", month: "short", year: "numeric"
    }).format(new Date()));

    Promise.allSettled([
        fetch("/api/dashboard-summary").then(response => {
            if (!response.ok) throw new Error("Dashboard summary unavailable");
            return response.json();
        }),
        fetch("/api/kanthu-dashboard").then(response => {
            if (!response.ok) throw new Error("Kanthu summary unavailable");
            return response.json();
        }),
        fetch("/api/accounts/current-balance").then(response => {
            if (!response.ok) throw new Error("Account balance unavailable");
            return response.json();
        }),
        fetch("/api/reports/today-collections").then(response => {
            if (!response.ok) throw new Error("Collections unavailable");
            return response.json();
        })
    ]).then(([dashboardResult, kanthuResult, accountsResult, collectionsResult]) => {
        if (dashboardResult.status === "fulfilled") {
            const data = dashboardResult.value;
            setText("totalMembers", number.format(data.total_members || 0));
            setText("todayCollection", currency.format(data.today_collection || 0));
            setText("monthCollection", currency.format(data.month_collection || 0));
            setText("pendingMembers", number.format(data.pending_members || 0));
            const progress = Math.min(((data.total_members || 0) / 400) * 100, 100);
            const progressBar = document.getElementById("memberProgress");
            if (progressBar) progressBar.style.width = `${progress}%`;
            setText("memberProgressText", `${Math.round(progress)}% of the 400-member community goal`);
        }

        if (kanthuResult.status === "fulfilled") {
            setText("activeKanthu", number.format(kanthuResult.value.portfolio?.active || 0));
            setText("kanthuOutstanding", currency.format(kanthuResult.value.summary?.outstanding || 0));
        }

        if (accountsResult.status === "fulfilled") {
            setText("currentBalance", currency.format(accountsResult.value.balance || 0));
        }

        const table = document.getElementById("recentCollections");
        if (table && collectionsResult.status === "fulfilled") {
            const rows = (collectionsResult.value.rows || []).slice(0, 6);
            if (!rows.length) {
                table.innerHTML = '<tr><td colspan="4" class="empty-state">No collections recorded today.</td></tr>';
            } else {
                table.innerHTML = rows.map(row => `
                    <tr>
                        <td><span class="receipt-pill">${escapeHtml(row.receipt_no || "—")}</span></td>
                        <td><strong>${escapeHtml(row.member_name || "—")}</strong><br>${escapeHtml(row.member_code || "")}</td>
                        <td><span class="payment-pill">${escapeHtml(row.payment_mode || "—")}</span></td>
                        <td class="text-end"><strong>${currency.format(Number(row.amount) || 0)}</strong></td>
                    </tr>`).join("");
            }
        } else if (table) {
            table.innerHTML = '<tr><td colspan="4" class="empty-state">Unable to load recent collections.</td></tr>';
        }
    });

    function escapeHtml(value) {
        return String(value).replace(/[&<>'"]/g, character => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
        })[character]);
    }
});
