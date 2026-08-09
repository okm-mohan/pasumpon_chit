"""Seed realistic, idempotent 2026 demo data into the local Pasumpon MySQL DB.

This script only creates records using the `SM26` member-code prefix and never
changes or removes the user's existing operational records.
"""

from datetime import date
from decimal import Decimal

from sqlalchemy import text

from app.database import engine


MEMBERS = [
    ("SM26001", "Arun Kumar", "9876501001", "Pasumpon Nagar", "Kallupatti", "Engineer", "Meena Kumar"),
    ("SM26002", "Kavitha Selvam", "9876501002", "Anna Nagar", "Usilampatti", "Teacher", "Selvam"),
    ("SM26003", "Prakash M", "9876501003", "Gandhi Street", "Thirumangalam", "Farmer", "Lakshmi"),
    ("SM26004", "Nandhini Devi", "9876501004", "Kamarajar Road", "Madurai", "Tailor", "Ramesh"),
    ("SM26005", "Vignesh Raja", "9876501005", "Market Road", "Melur", "Driver", "Kalaivani"),
    ("SM26006", "Revathi M", "9876501006", "Temple Street", "Tirupparankundram", "Nurse", "Muthukumar"),
    ("SM26007", "Sakthivel P", "9876501007", "New Colony", "Vadipatti", "Electrician", "Saroja"),
    ("SM26008", "Priya Dharshini", "9876501008", "Lake View", "Madurai", "Accountant", "Dharshan"),
    ("SM26009", "Karthikeyan S", "9876501009", "Bharathi Nagar", "Alanganallur", "Shop Owner", "Mahalakshmi"),
    ("SM26010", "Malathi R", "9876501010", "Railway Feeder Road", "Madurai", "Homemaker", "Ravi"),
    ("SM26011", "Dinesh Babu", "9876501011", "MGR Street", "Peraiyur", "Mechanic", "Keerthana"),
    ("SM26012", "Tamilselvi K", "9876501012", "South Car Street", "Thirumangalam", "Weaver", "Kannan"),
    ("SM26013", "Suresh Kumar", "9876501013", "KK Nagar", "Madurai", "Sales Executive", "Uma"),
    ("SM26014", "Aishwarya V", "9876501014", "Vivekananda Street", "Melur", "Beautician", "Vimal"),
    ("SM26015", "Manikandan R", "9876501015", "Old Bus Stand", "Usilampatti", "Farmer", "Devi"),
    ("SM26016", "Geetha Priya", "9876501016", "Indira Nagar", "Madurai", "Designer", "Praveen"),
    ("SM26017", "Saravanan K", "9876501017", "Mariyamman Kovil St", "Vadipatti", "Trader", "Kokila"),
    ("SM26018", "Rajalakshmi M", "9876501018", "East Street", "Kallupatti", "Teacher", "Murugan"),
    ("SM26019", "Balamurugan K", "9876501019", "VOC Nagar", "Madurai", "Supervisor", "Vasanthi"),
    ("SM26020", "Jothi S", "9876501020", "Gandhiji Road", "Melur", "Tailor", "Selvaraj"),
    ("SM26021", "Senthil Nathan", "9876501021", "Sivagangai Road", "Madurai", "Technician", "Shanthi"),
    ("SM26022", "Maheswari P", "9876501022", "Kamaraj Salai", "Thirumangalam", "Homemaker", "Pandian"),
    ("SM26023", "Ramesh G", "9876501023", "Meenakshi Street", "Alanganallur", "Carpenter", "Sangeetha"),
    ("SM26024", "Deepika R", "9876501024", "Collector Office Road", "Madurai", "Student", "Rajesh"),
    ("SM26025", "Gokul Krishna", "9876501025", "Bypass Road", "Peraiyur", "Business", "Sathya"),
]

PHOTOS = ["/static/images/a1.jpg", "/static/images/a2.jpg", "/static/images/a3.jpg", "/static/images/g1.jpg", "/static/images/g2.jpg", "/static/images/g3.jpg", "/static/images/g4.jpg", "/static/images/g5.jpg", "/static/images/g6.jpg", "/static/images/v1.jpg", "/static/images/v2.jpg", "/static/images/v3.jpg", "/static/images/v4.jpg"]
PAYMENT_DATES = [date(2026, m, 7 if m % 2 else 9) for m in range(1, 9)]


def money(value):
    return Decimal(str(value)).quantize(Decimal("0.01"))


def add_account(conn, txn_date, txn_type, category, amount, module, reference_id, remarks):
    conn.execute(text("""
        INSERT INTO accounts_transactions
        (transaction_date, transaction_type, category, amount, payment_mode, reference_module, reference_id, remarks)
        SELECT :d, :t, :c, :a, 'CASH', :m, :r, :remarks
        WHERE NOT EXISTS (
          SELECT 1 FROM accounts_transactions
          WHERE reference_module=:m AND reference_id=:r AND category=:c AND transaction_date=:d
        )
    """), {"d": txn_date, "t": txn_type, "c": category, "a": money(amount), "m": module, "r": reference_id, "remarks": remarks})


def main():
    with engine.begin() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS ayul_santha_collections (
              id INT AUTO_INCREMENT PRIMARY KEY, ayul_santha_id INT NOT NULL,
              collection_date DATE NOT NULL, interest_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
              principal_amount DECIMAL(14,2) NOT NULL DEFAULT 0,
              payment_mode VARCHAR(20) DEFAULT 'CASH', remarks VARCHAR(500) NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """))

        # A 2026 group is normally already present; create it only if not.
        group = conn.execute(text("SELECT id FROM pandu_groups WHERE pandu_year=2026 AND status='ACTIVE' ORDER BY id LIMIT 1")).scalar()
        if not group:
            group = conn.execute(text("""
                INSERT INTO pandu_groups(group_code, group_name, pandu_year, monthly_due, total_amount, duration_months, start_date, status, chit_amount)
                VALUES ('2026', 'Pandu2026', 2026, 100, 1200, 12, '2026-01-01', 'ACTIVE', 1200)
            """)).lastrowid

        member_ids = {}
        for index, (code, name, mobile, address, village, occupation, nominee) in enumerate(MEMBERS):
            member_id = conn.execute(text("SELECT id FROM members WHERE member_code=:code"), {"code": code}).scalar()
            if not member_id:
                member_id = conn.execute(text("""
                    INSERT INTO members(member_code, member_name, mobile, whatsapp_no, address, aadhaar_no, photo, join_date, status,
                      area, village, pincode, nominee_name, nominee_mobile, relationship, reference_name, occupation)
                    VALUES (:code,:name,:mobile,:mobile,:address,:aadhaar,:photo,'2026-01-02','ACTIVE',:area,:village,'6250XX',:nominee,:nominee_mobile,'Spouse','Pasumpon community',:occupation)
                """), {"code": code, "name": name, "mobile": mobile, "address": address, "aadhaar": f"XXXX XXXX {1000 + index:04d}",
                      "photo": PHOTOS[index % len(PHOTOS)], "area": address, "village": village, "nominee": nominee,
                      "nominee_mobile": f"987651{index + 1000:04d}"[-10:], "occupation": occupation}).lastrowid
            member_ids[code] = member_id

        # Twenty-two members join Pandu. Every third member is irregular and pays only selected months.
        for index, member in enumerate(MEMBERS[:22]):
            code = member[0]
            member_id = member_ids[code]
            units = 1 + (index % 4)
            due = 100 * units
            assignment = conn.execute(text("SELECT id FROM pandu_assignments WHERE member_id=:member AND group_id=:group"), {"member": member_id, "group": group}).scalar()
            if not assignment:
                assignment = conn.execute(text("""
                    INSERT INTO pandu_assignments(member_id,group_id,pandu_count,join_date,qr_code,group_chit_amount,status,total_amount,paid_amount,balance_amount,settlement_amount,group_monthly_due,duration_months,is_settled)
                    VALUES (:member,:group,:units,'2026-01-02',:qr,:chit,'ACTIVE',:total,0,:total,:settlement,:due,12,0)
                """), {"member": member_id, "group": group, "units": units, "qr": f"P26-{code}", "chit": 1200 * units, "total": 1200 * units, "settlement": 1300 * units, "due": due}).lastrowid
            paid = Decimal("0")
            allowed_months = range(1, 9) if index % 3 else [1, 2, 4, 6, 8]
            for month in allowed_months:
                receipt = f"P26-{code[-3:]}-{month:02d}"
                exists = conn.execute(text("SELECT id FROM collections WHERE receipt_no=:receipt"), {"receipt": receipt}).scalar()
                amount = due if not (index % 5 == 0 and month == 6) else due // 2
                if not exists:
                    conn.execute(text("""
                        INSERT INTO collections(receipt_no,member_id,group_id,assignment_id,collection_month,collection_year,amount,collection_date,payment_mode,remarks,entered_by,total_amount,status)
                        VALUES (:receipt,:member,:group,:assignment,:month,2026,:amount,:date,:mode,:remarks,'seed',:amount,'PAID')
                    """), {"receipt": receipt, "member": member_id, "group": group, "assignment": assignment, "month": month,
                          "amount": amount, "date": PAYMENT_DATES[month - 1], "mode": "CASH" if month % 2 else "GPAY",
                          "remarks": "Regular monthly Pandu payment" if index % 3 else "Late / irregular monthly Pandu payment"})
                    add_account(conn, PAYMENT_DATES[month - 1], "CREDIT", "Pandu Collection", amount, "PANDU", assignment, f"Pandu collection – {member[1]}")
                paid += money(amount)
            conn.execute(text("UPDATE pandu_assignments SET paid_amount=:paid,balance_amount=:balance WHERE id=:id"), {"paid": paid, "balance": money(1200 * units) - paid, "id": assignment})

        # Kanthu: 12 short-term loans; selected borrowers make full, partial and late collections.
        for index, member in enumerate(MEMBERS[:12]):
            member_id = member_ids[member[0]]
            principal = 5000 + index * 2500
            interest = money(principal * Decimal("0.10"))
            issue_date = date(2026, 1 + (index % 7), 4 + (index % 5))
            kanthu_no = f"KAN-2026-S{index + 1:03d}"
            loan_id = conn.execute(text("SELECT id FROM kanthu_master WHERE kanthu_no=:no"), {"no": kanthu_no}).scalar()
            if not loan_id:
                loan_id = conn.execute(text("""
                    INSERT INTO kanthu_master(kanthu_no,member_id,issue_date,principal_amount,interest_percent,interest_amount,net_paid_amount,payment_mode,reference_no,total_collected,balance_amount,due_year,status,remarks,financial_year)
                    VALUES (:no,:member,:date,:principal,10,:interest,:net,'CASH',:reference,0,:principal,2026,'ACTIVE','2026 sample Kanthu issue',2026)
                """), {"no": kanthu_no, "member": member_id, "date": issue_date, "principal": principal, "interest": interest, "net": principal - interest, "reference": f"SAMPLE-{index + 1:03d}"}).lastrowid
                conn.execute(text("INSERT INTO kanthu_transactions(kanthu_id,transaction_date,transaction_type,amount,remarks) VALUES (:id,:date,'ISSUE',:amount,'Net amount issued after first-month interest')"), {"id": loan_id, "date": issue_date, "amount": principal - interest})
                add_account(conn, issue_date, "EXPENSE", "Kanthu Issue", principal - interest, "KANTHU", loan_id, f"Kanthu issued – {member[1]}")
            collection_plan = {0: [principal], 1: [interest, principal // 2], 2: [principal // 3], 3: [], 4: [principal // 4, principal // 4], 5: [principal], 6: [interest], 7: [principal // 2], 8: [], 9: [principal // 3], 10: [principal], 11: [principal // 2]}[index]
            collected = Decimal("0")
            for seq, amount in enumerate(collection_plan):
                txn_date = date(2026, min(8, issue_date.month + seq + 1), min(20, 10 + seq))
                marker = f"Seed collection {seq + 1}"
                exists = conn.execute(text("SELECT id FROM kanthu_transactions WHERE kanthu_id=:id AND transaction_type='COLLECTION' AND remarks=:remarks"), {"id": loan_id, "remarks": marker}).scalar()
                if not exists:
                    conn.execute(text("INSERT INTO kanthu_transactions(kanthu_id,transaction_date,transaction_type,amount,remarks) VALUES (:id,:date,'COLLECTION',:amount,:remarks)"), {"id": loan_id, "date": txn_date, "amount": amount, "remarks": marker})
                    add_account(conn, txn_date, "CREDIT", "Kanthu Collection", amount, "KANTHU", loan_id, f"Kanthu return – {member[1]}")
                collected += money(amount)
            balance = max(Decimal("0"), money(principal) - collected)
            conn.execute(text("UPDATE kanthu_master SET total_collected=:paid,balance_amount=:balance,status=:status,closed_date=:closed WHERE id=:id"), {"paid": collected, "balance": balance, "status": "CLOSED" if not balance else "ACTIVE", "closed": date(2026, 8, 1) if not balance else None, "id": loan_id})

        # Ayul Santha: eight long-term loans with monthly interest; some pay interest late and two return part of principal.
        for index, member in enumerate(MEMBERS[8:16]):
            member_id = member_ids[member[0]]
            principal = 20000 + index * 5000
            monthly_interest = money(principal * Decimal("0.02"))
            issue_date = date(2026, 1 + index, 12)
            ayul_id = conn.execute(text("SELECT id FROM ayul_santha_master WHERE member_id=:member AND issue_date=:date"), {"member": member_id, "date": issue_date}).scalar()
            if not ayul_id:
                ayul_id = conn.execute(text("INSERT INTO ayul_santha_master(member_id,issue_date,principal_amount,monthly_interest_amount,total_interest_received,balance_principal,status) VALUES (:member,:date,:principal,:interest,0,:principal,'ACTIVE')"), {"member": member_id, "date": issue_date, "principal": principal, "interest": monthly_interest}).lastrowid
                add_account(conn, issue_date, "EXPENSE", "Ayul Santha Issue", principal, "AYUL_SANTHA", ayul_id, f"Ayul Santha issued – {member[1]}")
            total_interest = Decimal("0")
            total_principal = Decimal("0")
            months = range(issue_date.month + 1, 9) if issue_date.month < 8 else []
            for month in months:
                if index % 3 == 0 and month in (4, 6):
                    continue
                interest_paid = monthly_interest
                principal_paid = (5000 if index in (2, 5) and month == 7 else 0)
                collection_date = date(2026, month, 15 if index % 2 else 8)
                exists = conn.execute(text("SELECT id FROM ayul_santha_collections WHERE ayul_santha_id=:id AND collection_date=:date"), {"id": ayul_id, "date": collection_date}).scalar()
                if not exists:
                    conn.execute(text("INSERT INTO ayul_santha_collections(ayul_santha_id,collection_date,interest_amount,principal_amount,payment_mode,remarks) VALUES (:id,:date,:interest,:principal,'CASH',:remarks)"), {"id": ayul_id, "date": collection_date, "interest": interest_paid, "principal": principal_paid, "remarks": "Monthly interest payment" if not principal_paid else "Interest payment with partial principal return"})
                    add_account(conn, collection_date, "CREDIT", "Ayul Santha Interest Income", interest_paid, "AYUL_SANTHA", ayul_id, f"Ayul interest – {member[1]}")
                    if principal_paid:
                        add_account(conn, collection_date, "CREDIT", "Ayul Santha Principal Return", principal_paid, "AYUL_SANTHA", ayul_id, f"Ayul principal return – {member[1]}")
                total_interest += interest_paid
                total_principal += money(principal_paid)
            conn.execute(text("UPDATE ayul_santha_master SET total_interest_received=:interest,balance_principal=:balance WHERE id=:id"), {"interest": total_interest, "balance": money(principal) - total_principal, "id": ayul_id})

    with engine.connect() as conn:
        totals = {
            table: conn.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
            for table in ("members", "pandu_assignments", "collections", "kanthu_master", "kanthu_transactions", "ayul_santha_master", "ayul_santha_collections")
        }
        new_members = conn.execute(text("SELECT COUNT(*) FROM members WHERE member_code LIKE 'SM26%'")) .scalar()
        pandu_dates = conn.execute(text("SELECT MIN(collection_date), MAX(collection_date) FROM collections WHERE receipt_no LIKE 'P26-%'")) .one()
    print("Seed completed: 25 members and linked 2026 Pandu, Kanthu, Ayul Santha demo records added.")
    print(f"New members: {new_members}; totals: {totals}; Pandu dates: {pandu_dates[0]} to {pandu_dates[1]}")


if __name__ == "__main__":
    main()
