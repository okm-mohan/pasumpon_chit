from fastapi import FastAPI, Request, Form
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from app.database import SessionLocal, engine
import time
from dateutil.relativedelta import relativedelta
from fastapi.responses import HTMLResponse
from fastapi import Query
from fastapi import UploadFile, File
import shutil
import os
from fastapi.responses import JSONResponse, FileResponse
from datetime import datetime

app = FastAPI()


from pydantic import BaseModel

class KanthuSaveRequest(BaseModel):
    member_id: int
    issue_date: str
    principal_amount: float
    interest_percent: float
    remarks: str = ""
    
    
# Static Files
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Templates
templates = Jinja2Templates(directory="app/templates")


# ----------------------------------
# LOGIN PAGE
# ----------------------------------


@app.get("/")
def login_page(request: Request):

    return templates.TemplateResponse(request=request, name="home_v2.html")


@app.get("/pandu", response_class=HTMLResponse)
def pandu(request: Request):

    return templates.TemplateResponse(
        request=request, name="pandu.html", context={"active_page": "dashboard"}
    )


# ----------------------------------
# LOGIN ACTION
# ----------------------------------


@app.get("/login")
def login_form(request: Request):

    return templates.TemplateResponse(request=request, name="login.html")


@app.post("/login")
def login(request: Request, username: str = Form(...), password: str = Form(...)):

    db = SessionLocal()

    try:

        query = text("""
            SELECT *
            FROM users
            WHERE username=:username
            AND password_hash=:password
            AND is_active=1
        """)

        result = db.execute(
            query, {"username": username, "password": password}
        ).fetchone()

        # SUCCESS LOGIN

        if result:

            return RedirectResponse(url="/dashboard", status_code=302)

        # FAILED LOGIN

        return templates.TemplateResponse(
            request=request,
            name="login.html",
            context={"request": request, "error": "❌ Invalid Username or Password"},
        )

    except Exception as e:

        return templates.TemplateResponse(
            request=request,
            name="login.html",
            context={"request": request, "error": f"System Error : {str(e)}"},
        )

    finally:

        db.close()


# ----------------------------------
# DASHBOARD
# ----------------------------------


@app.get("/dashboard")
def dashboard(request: Request):

    return templates.TemplateResponse(request=request, name="dashboard.html")


# ----------------------------------
# LOGOUT
# ----------------------------------


@app.get("/logout")
def logout():

    return RedirectResponse(url="/", status_code=302)


@app.get("/api/member-search")
def member_search(q: str):

    db = SessionLocal()

    try:

        query = text("""
            SELECT
                id,
                member_code,
                member_name,
                mobile
            FROM members m
            WHERE
                member_code LIKE :q
                OR member_name LIKE :q
                OR mobile LIKE :q
            LIMIT 20
        """)

        data = db.execute(query, {"q": f"%{q}%"}).mappings().all()

        return JSONResponse(content=[dict(row) for row in data])

    finally:

        db.close()


@app.get("/api/member/{member_id}")
def member_details(member_id: int):

    db = SessionLocal()

    try:

        sql = text("""
                SELECT
                m.id,
                m.member_code,
                m.member_name,
                m.mobile,
                m.address,

                g.group_name,

                pa.group_monthly_due AS monthly_due,

                pa.total_amount,
                pa.balance_amount,
                pa.settlement_amount AS maturity_amount,

                (
                    SELECT pa.pandu_count
                    FROM pandu_assignments pa
                    WHERE pa.member_id = m.id
                    AND pa.status = 'ACTIVE'
                    ORDER BY pa.id DESC
                    LIMIT 1
                ) AS pandu_count

            FROM members m

            LEFT JOIN pandu_assignments pa
            ON pa.member_id = m.id
            AND pa.status='ACTIVE'

            LEFT JOIN pandu_groups g
            ON g.id = pa.group_id

            WHERE m.id = :member_id
        """)

        row = db.execute(sql, {"member_id": member_id}).mappings().first()

        result = {}

        for k, v in dict(row).items():

            if hasattr(v, "as_tuple"):  # Decimal values
                result[k] = float(v)
            else:
                result[k] = v

        paid_months = result.get("paid_months", 0)

        result["pending_months"] = 12 - paid_months

        # result = dict(row)
        result = dict(row)
        result["pending_months"] = 12 - paid_months

        result = {}

        for k, v in dict(row).items():

            if hasattr(v, "as_tuple"):  # Decimal values
                result[k] = float(v)
            else:
                result[k] = v

        rows = db.execute(
            text("""
                    SELECT DISTINCT collection_month
                    FROM collections
                    WHERE member_id = :member_id
                    AND collection_year = YEAR(CURDATE())
                """),
            {"member_id": member_id},
        ).fetchall()

        paid_months = set()

        for row in rows:
            paid_months.add(row[0])

        current_month = datetime.now().month

        pending_months = 0

        for m in range(1, current_month + 1):
            if m not in paid_months:
                pending_months += 1

        result["pending_months"] = pending_months

        if result.get("last_payment_date"):
            result["last_payment_date"] = str(result["last_payment_date"])

            base_due = float(result["monthly_due"])

            # result["monthly_due"] = base_due * result["pandu_count"]
            if result.get("monthly_due") is not None:
                # result["monthly_due"] = float(result["monthly_due"])
                result["monthly_due"] = float(result["monthly_due"]) * int(
                    result["pandu_count"]
                )

            # result["base_due"] = base_due
            # duration = 12
            # result["maturity_amount"] = result["monthly_due"] * (duration + 1)
            if result.get("base_due") is not None:
                result["base_due"] = float(result["base_due"])

            if result.get("maturity_amount") is not None:
                result["maturity_amount"] = float(result["maturity_amount"])

            if result.get("chit_amount") is not None:
                result["chit_amount"] = float(result["chit_amount"])

            result["is_assigned"] = result.get("pandu_count") is not None

        return JSONResponse(content=result)

    finally:

        db.close()


@app.post("/api/save-collection")
def save_collection(
    member_id: int = Form(...),
    amount: float = Form(...),
    month: int = Form(...),
    year: int = Form(...),
    payment_mode: str = Form(...),
):

    today = datetime.now().day
    if today > 30:

        return JSONResponse(
            status_code=403,
            content={"success": False, "message": "Collection Entry Closed After 10th"},
        )

    db = SessionLocal()

    try:

        assignment = (
            db.execute(
                text("""

        SELECT
            id,
            group_id
        FROM pandu_assignments
        WHERE member_id = :member_id
        AND status = 'ACTIVE'
        ORDER BY id DESC
        LIMIT 1

    """),
                {"member_id": member_id},
            )
            .mappings()
            .first()
        )

        receipt_no = "RCPT" + str(int(time.time()))

        query = text("""
           INSERT INTO collections
(
    receipt_no,
    member_id,
    group_id,
    assignment_id,
    amount,
    collection_month,
    collection_year,
    collection_date,
    payment_mode
)
           VALUES
(
    :receipt_no,
    :member_id,
    :group_id,
    :assignment_id,
    :amount,
    :month,
    :year,
    CURDATE(),
    :payment_mode
)
        """)

        db.execute(
            query,
            {
                "receipt_no": receipt_no,
                "member_id": member_id,
                "group_id": assignment["group_id"],
                "assignment_id": assignment["id"],
                "amount": amount,
                "month": month,
                "year": year,
                "payment_mode": payment_mode,
            },
        )

        assignment = (
            db.execute(
                text("""

                SELECT id
                FROM pandu_assignments
                WHERE member_id = :member_id
                AND status = 'ACTIVE'
                ORDER BY id DESC
                LIMIT 1

            """),
                {"member_id": member_id},
            )
            .mappings()
            .first()
        )

        if assignment:

            db.execute(
                text("""

                UPDATE pandu_assignments

                SET

                    paid_amount =
                        paid_amount + :amount,

                    balance_amount =
                        balance_amount - :amount

                WHERE id = :assignment_id

            """),
                {"amount": amount, "assignment_id": assignment["id"]},
            )

            db.execute(
                text("""

                UPDATE pandu_assignments

                SET status='COMPLETED'

                WHERE id=:assignment_id

                AND balance_amount <= 0

            """),
                {"assignment_id": assignment["id"]},
            )



            db.execute(
                text("""
                    INSERT INTO accounts_transactions
                    (
                        transaction_date,
                        transaction_type,
                        category,
                        amount,
                        payment_mode,
                        reference_module,
                        reference_id,
                        remarks
                    )
                    VALUES
                    (
                        CURDATE(),
                        'CREDIT',
                        'Pandu Collection',
                        :amount,
                        :payment_mode,
                        'PANDU',
                        :collection_id,
                        :remarks
                    )
                """),
               {
    "amount": amount,
    "payment_mode": payment_mode.upper(),
    "collection_id": assignment["id"],
    "remarks": f"Receipt No : {receipt_no}"
}
            )


        db.commit()

        return {"success": True, "receipt_no": receipt_no}

    finally:

        db.close()


@app.get("/api/member-due/{member_id}")
def member_due_status(member_id: int):

    db = SessionLocal()

    try:

        sql = text("""
            SELECT
                collection_month,
                collection_year,
                amount,
                collection_date
            FROM collections
            WHERE member_id = :member_id
            ORDER BY
                collection_year,
                collection_month
        """)

        rows = db.execute(sql, {"member_id": member_id}).mappings().all()

        result = []

        for row in rows:

            item = dict(row)

            item["amount"] = float(item["amount"])

            item["collection_date"] = str(item["collection_date"])

            result.append(item)

        return JSONResponse(content=result)

    finally:

        db.close()


@app.get("/api/member-full-due/{member_id}")
def member_full_due(member_id: int):

    db = SessionLocal()

    try:

        group_sql = text("""

    SELECT

        g.start_date,
        g.duration_months,

        pa.group_monthly_due AS monthly_due,

        pa.pandu_count

    FROM pandu_assignments pa

    INNER JOIN pandu_groups g
        ON pa.group_id = g.id

    WHERE pa.member_id = :member_id

    AND pa.status = 'ACTIVE'

    ORDER BY pa.id DESC

    LIMIT 1

""")

        group = db.execute(group_sql, {"member_id": member_id}).mappings().first()

        if not group:
            return []

        paid_sql = text("""
            SELECT
                collection_month,
                collection_year,
                amount,
                collection_date
            FROM collections
            WHERE member_id = :member_id
        """)

        paid_rows = db.execute(paid_sql, {"member_id": member_id}).mappings().all()

        paid_map = {}

        for row in paid_rows:

            paid_map[(row["collection_month"], row["collection_year"])] = row

        result = []

        start_date = group["start_date"]

        current_month = datetime.now().month
        current_year = datetime.now().year

        for i in range(group["duration_months"]):

            month = start_date.month + i

            year = start_date.year + ((month - 1) // 12)

            month = ((month - 1) % 12) + 1

            month_name = [
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
                "Dec",
            ][month - 1]

            key = (month, year)

            if key in paid_map:

                status = "Paid"

                paid_amount = float(paid_map[key]["amount"])

                collection_date = str(paid_map[key]["collection_date"])

            else:

                if year < current_year or (
                    year == current_year and month <= current_month
                ):

                    status = "Not Paid"

                else:

                    status = "Pending"

                paid_amount = 0
                collection_date = "-"

            result.append(
                {
                    "month_name": f"{month_name}-{year}",
                    "due_amount": float(group["monthly_due"]),
                    "paid_amount": paid_amount,
                    "status": status,
                    "collection_date": collection_date,
                }
            )

        return JSONResponse(content=result)

    finally:

        db.close()


@app.get("/api/dashboard-summary")
def dashboard_summary():

    db = SessionLocal()

    try:

        total_members = db.execute(text("""
            SELECT COUNT(*) total
            FROM members
        """)).scalar()

        today_collection = db.execute(text("""
            SELECT IFNULL(SUM(amount),0)
            FROM collections
            WHERE DATE(collection_date)=CURDATE()
        """)).scalar()

        month_collection = db.execute(text("""
            SELECT IFNULL(SUM(amount),0)
            FROM collections
            WHERE MONTH(collection_date)=MONTH(CURDATE())
            AND YEAR(collection_date)=YEAR(CURDATE())
        """)).scalar()

        pending_members = db.execute(text("""
            SELECT COUNT(*) 
            FROM members m
            WHERE NOT EXISTS (
                SELECT 1
                FROM collections c
                WHERE c.member_id = m.id
                AND c.collection_month = MONTH(CURDATE())
                AND c.collection_year = YEAR(CURDATE())
            )
        """)).scalar()

        return {
            "today_collection": float(today_collection or 0),
            "month_collection": float(month_collection or 0),
            "total_members": int(total_members or 0),
            "pending_members": int(pending_members or 0),
        }

    finally:
        db.close()


@app.get("/reports")
def reports_home():
    return FileResponse("app/static/reports.html")


@app.get("/api/reports/today-collections")
def today_collections():

    db = SessionLocal()

    try:

        rows = db.execute(text("""

            SELECT

                c.receipt_no,
                c.collection_date,
                m.member_code,
                m.member_name,
                c.amount,
                c.payment_mode

            FROM collections c

            JOIN members m
                ON c.member_id = m.id

            WHERE DATE(c.collection_date)
                  = CURDATE()

            ORDER BY c.id DESC

        """)).mappings().all()

        total_amount = sum(float(r["amount"]) for r in rows)

        return {"rows": list(rows), "total_amount": total_amount}

    finally:
        db.close()


# ---------------------------------------------------------
@app.get("/api/reports/daily-collections")
def daily_collections(report_date: str = Query(...)):

    db = SessionLocal()

    try:

        rows = (
            db.execute(
                text("""

            SELECT

                c.receipt_no,
                c.collection_date,
                m.member_code,
                m.member_name,
                c.amount,
                c.payment_mode

            FROM collections c

            JOIN members m
                ON c.member_id = m.id

            WHERE DATE(c.collection_date) = :report_date

            ORDER BY c.id DESC

        """),
                {"report_date": report_date},
            )
            .mappings()
            .all()
        )

        total_amount = sum(float(r["amount"]) for r in rows)

        return {"rows": list(rows), "total_amount": total_amount}

    finally:

        db.close()


# --------------------------------------------------------------------
@app.get("/daily-report")
def daily_report():

    return FileResponse("app/static/daily_report.html")


# ----------------------------------------------------------------------------
@app.get("/monthly-report")
def monthly_report():

    return FileResponse("app/static/monthly_report.html")


@app.get("/api/reports/monthly-collections")
def monthly_collections(month: int = Query(...), year: int = Query(...)):

    db = SessionLocal()

    try:

        rows = (
            db.execute(
                text("""

           SELECT

    c.receipt_no,
    c.collection_date,
    m.member_code,
    m.member_name,
    c.amount,
    c.payment_mode

FROM collections c

JOIN members m
    ON c.member_id = m.id

WHERE
    c.collection_month = :month
    AND
    c.collection_year = :year

ORDER BY
    c.collection_date,
    c.id

        """),
                {"month": month, "year": year},
            )
            .mappings()
            .all()
        )

        total_amount = sum(float(r["amount"]) for r in rows)

        return {
            "rows": list(rows),
            "total_amount": total_amount,
            "total_receipts": len(rows),
        }

    finally:

        db.close()


@app.get("/reports/member-analysis")
async def member_analysis(request: Request):

    dashboard_data = {
        "total_members": 500,
        "active_members": 450,
        "full_paid": 300,
        "pending_members": 150,
        "collection_amount": 525000,
        "pending_amount": 110000,
    }

    return templates.TemplateResponse(
        request=request,
        name="reports/member_analysis.html",
        context={"dashboard": dashboard_data},
    )


# ----------------------------------------
# MEMBERS
# ----------------------------------------


@app.get("/members/add")
def add_member(request: Request):

    return templates.TemplateResponse(request=request, name="members.html")


@app.post("/members/save")
async def save_member(
    request: Request,
    member_name: str = Form(...),
    name_description: str = Form(""),
    aadhaar_no: str = Form(""),
    mobile: str = Form(""),
    whatsapp_no: str = Form(""),
    address: str = Form(""),
    area: str = Form(""),
    village: str = Form(""),
    pincode: str = Form(""),
    nominee_name: str = Form(""),
    nominee_mobile: str = Form(""),
    relationship: str = Form(""),
    reference_name: str = Form(""),
    occupation: str = Form(""),
    joining_amount: float = Form(0),
    status: str = Form("ACTIVE"),
    # pandu_count: int = Form(1),
    photo: UploadFile = File(None),
):

    db = SessionLocal()

    try:

        # Generate Member Code
        last_id = db.execute(text("SELECT IFNULL(MAX(id),0)+1 FROM members")).scalar()

        member_code = f"M{last_id:05d}"

        photo_path = None

        if photo and photo.filename:

            upload_dir = "app/static/uploads/members"

            os.makedirs(upload_dir, exist_ok=True)

            filename = f"{member_code}_{photo.filename}"

            filepath = os.path.join(upload_dir, filename)

            with open(filepath, "wb") as buffer:
                shutil.copyfileobj(photo.file, buffer)

            photo_path = f"/static/uploads/members/{filename}"

        sql = text("""
           INSERT INTO members
            (
                member_code,
                member_name,
                name_description,
                mobile,
                whatsapp_no,
                address,
                area,
                village,
                pincode,
                aadhaar_no,
                photo,
                nominee_name,
                nominee_mobile,
                relationship,
                reference_name,
                occupation,
                status,
                join_date
            )
            VALUES
            (
                :member_code,
                :member_name,
                :name_description,
                :mobile,
                :whatsapp_no,
                :address,
                :area,
                :village,
                :pincode,
                :aadhaar_no,
                :photo,
                :nominee_name,
                :nominee_mobile,
                :relationship,
                :reference_name,
                :occupation,
                :status,
                CURDATE()
            )
                    """)

        db.execute(
            sql,
            {
                "member_code": member_code,
                "member_name": member_name,
                "name_description": name_description,
                "mobile": mobile,
                "whatsapp_no": whatsapp_no,
                "address": address,
                "area": area,
                "village": village,
                "pincode": pincode,
                "aadhaar_no": aadhaar_no,
                "photo": photo_path,
                "nominee_name": nominee_name,
                "nominee_mobile": nominee_mobile,
                "relationship": relationship,
                "reference_name": reference_name,
                "occupation": occupation,
                "status": status,
            },
        )

        db.commit()

        return RedirectResponse(url="/members/add", status_code=302)

    finally:

        db.close()


@app.get("/members/list")
def members_list(request: Request):

    db = SessionLocal()

    try:

        members = db.execute(text("""
            SELECT
                id,
                member_code,
                member_name,
                mobile,
                aadhaar_no,
                photo,
                status
            FROM members
            ORDER BY id DESC
        """)).mappings().all()

        return templates.TemplateResponse(
            request=request, name="members_list.html", context={"members": members}
        )

    finally:
        db.close()


@app.get("/members/view/{member_id}")
def member_view(request: Request, member_id: int):

    db = SessionLocal()

    try:

        member = (
            db.execute(
                text("""
            SELECT *
            FROM members
            WHERE id = :id
        """),
                {"id": member_id},
            )
            .mappings()
            .first()
        )

        if not member:

            return RedirectResponse(url="/members/list", status_code=302)

        return templates.TemplateResponse(
            request=request, name="member_view.html", context={"member": member}
        )

    finally:

        db.close()


# ==========================================
# PANDU MEMBER ASSIGNMENT
# ==========================================


@app.get("/pandu/assign")
def pandu_assign(request: Request):

    db = SessionLocal()

    try:

        groups = db.execute(text("""
            SELECT
                id,
                group_name,
                monthly_due,
                chit_amount,
                duration_months
            FROM pandu_groups
            WHERE status='ACTIVE'
            ORDER BY group_name
        """)).mappings().all()

        assignments = db.execute(text("""
            SELECT

                pa.id,

                m.member_code,
                m.member_name,
                m.mobile,

                pg.group_name,

                pa.pandu_count,
                pa.total_amount,
                pa.paid_amount,
                pa.balance_amount,

                pa.status

            FROM pandu_assignments pa

            INNER JOIN members m
                ON pa.member_id = m.id

            INNER JOIN pandu_groups pg
                ON pa.group_id = pg.id

            ORDER BY pa.id DESC

        """)).mappings().all()

        return templates.TemplateResponse(
            request=request,
            name="pandu_assign.html",
            context={"groups": groups, "assignments": assignments},
        )

    finally:
        db.close()


# ==========================================
# MEMBER SEARCH
# ==========================================


@app.get("/api/assign-member-search")
def assign_member_search(q: str = ""):

    db = SessionLocal()

    try:

        rows = (
            db.execute(
                text("""
            SELECT

                id,
                member_code,
                member_name,
                mobile,
                aadhaar_no,
                photo

            FROM members

            WHERE

                member_name LIKE :q
                OR member_code LIKE :q
                OR mobile LIKE :q

            LIMIT 20

        """),
                {"q": f"%{q}%"},
            )
            .mappings()
            .all()
        )

        return JSONResponse(content=[dict(r) for r in rows])

    finally:
        db.close()


# ==========================================
# SAVE ASSIGNMENT
# ==========================================


@app.post("/pandu/assign/save")
def save_assignment(
    member_id: int = Form(...), group_id: int = Form(...), pandu_count: int = Form(...)
):

    db = SessionLocal()

    try:

        group = (
            db.execute(
                text("""

            SELECT

                monthly_due,
                chit_amount,
                duration_months

            FROM pandu_groups

            WHERE id=:id

        """),
                {"id": group_id},
            )
            .mappings()
            .first()
        )

        if not group:

            return RedirectResponse("/pandu/assign", status_code=302)

        group_monthly_due = float(group["monthly_due"]) * pandu_count
        group_chit_amount = float(group["chit_amount"])
        duration_months = int(group["duration_months"])

        total_amount = group_chit_amount * pandu_count

        paid_amount = 0

        balance_amount = total_amount
        settlement_amount = (group_monthly_due * 12) + group_monthly_due

        qr_code = f"M{member_id}-G{group_id}"

        db.execute(
            text("""

            INSERT INTO pandu_assignments(

                member_id,
                group_id,
                pandu_count,

                group_monthly_due,
                group_chit_amount,
                duration_months,

                total_amount,
                paid_amount,
                balance_amount,
                settlement_amount,

                join_date,
                qr_code,
                status

            )

            VALUES(

                :member_id,
                :group_id,
                :pandu_count,

                :group_monthly_due,
                :group_chit_amount,
                :duration_months,

                :total_amount,
                :paid_amount,
                :balance_amount,
                :settlement_amount,

                CURDATE(),
                :qr_code,
                'ACTIVE'

            )

        """),
            {
                "member_id": member_id,
                "group_id": group_id,
                "pandu_count": pandu_count,
                "group_monthly_due": group_monthly_due,
                "group_chit_amount": group_chit_amount,
                "duration_months": duration_months,
                "total_amount": total_amount,
                "paid_amount": paid_amount,
                "balance_amount": balance_amount,
                "settlement_amount": settlement_amount,
                "qr_code": qr_code,
            },
        )

        db.commit()

        return RedirectResponse("/pandu/assign", status_code=302)

    finally:

        db.close()


@app.get("/api/pandu-dashboard")
def pandu_dashboard():

    db = SessionLocal()

    try:

        total_amount = db.execute(text("""

            SELECT IFNULL(SUM(pa.total_amount),0)

            FROM pandu_assignments pa

            INNER JOIN pandu_groups pg
                ON pa.group_id = pg.id

            WHERE pg.status='ACTIVE' AND pg.group_code=YEAR(CURDATE())

        """)).scalar()

        collected_amount = db.execute(text("""

            SELECT IFNULL(SUM(pa.paid_amount),0)

            FROM pandu_assignments pa

            INNER JOIN pandu_groups pg
                ON pa.group_id = pg.id

            WHERE pg.status='ACTIVE' AND pg.group_code=YEAR(CURDATE())

        """)).scalar()

        balance_amount = db.execute(text("""

            SELECT IFNULL(SUM(pa.balance_amount),0)

            FROM pandu_assignments pa

            INNER JOIN pandu_groups pg
                ON pa.group_id = pg.id

            WHERE pg.status='ACTIVE' AND pg.group_code=YEAR(CURDATE())

        """)).scalar()

        total_members = db.execute(text("""

            SELECT COUNT(*)

            FROM pandu_assignments pa

            INNER JOIN pandu_groups pg
                ON pa.group_id = pg.id

            WHERE pg.status='ACTIVE' AND pg.group_code=YEAR(CURDATE())

        """)).scalar()

        paid_members = db.execute(text("""

            SELECT COUNT(*)

            FROM pandu_assignments pa

            INNER JOIN pandu_groups pg
                ON pa.group_id = pg.id

            WHERE pg.status='ACTIVE' AND pg.group_code=YEAR(CURDATE())
            AND pa.paid_amount > 0

        """)).scalar()

        pending_members = total_members - paid_members

        current_month = db.execute(text("""

            SELECT IFNULL(SUM(amount),0)

            FROM collections

            WHERE MONTH(collection_date)=MONTH(CURDATE())
            AND YEAR(collection_date)=YEAR(CURDATE())

        """)).scalar()

        today_collection = db.execute(text("""

            SELECT IFNULL(SUM(amount),0)

            FROM collections

            WHERE DATE(collection_date)=CURDATE()

        """)).scalar()

        percentage = 0

        if float(total_amount) > 0:

            percentage = round((float(collected_amount) / float(total_amount)) * 100, 2)

        return {
            "total_amount": float(total_amount),
            "collected_amount": float(collected_amount),
            "balance_amount": float(balance_amount),
            "total_members": int(total_members),
            "paid_members": int(paid_members),
            "pending_members": int(pending_members),
            "current_month": float(current_month),
            "today_collection": float(today_collection),
            "percentage": percentage,
        }

    finally:

        db.close()


@app.get("/pandu-groups")
def pandu_groups(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="pandu_details.html",
        context={"active_page": "pandu_groups"},
    )


@app.get("/pandu-settlement")
def pandu_settlement(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="pandu_settlement.html",
        context={"active_page": "pandu_settlement"},
    )


@app.get("/api/pandu-settlement/search")
def settlement_search(search: str = ""):

    db = SessionLocal()

    try:

        rows = (
            db.execute(
                text("""

            SELECT

                pa.id,

                m.member_name,

                m.mobile,

                m.village,

                pa.total_amount,

                pa.paid_amount,

                pa.balance_amount,

                pa.group_monthly_due,

                pa.duration_months,

                pa.is_settled

            FROM pandu_assignments pa

            JOIN members m
                ON pa.member_id = m.id

            WHERE

                m.member_name LIKE :search

                AND pa.is_settled = 0

        """),
                {"search": f"%{search}%"},
            )
            .mappings()
            .all()
        )

        result = []

        for row in rows:

            item = dict(row)

            item["settlement_amount"] = float(item["paid_amount"]) + float(
                item["group_monthly_due"]
            )

            result.append(item)

        return result

    finally:

        db.close()


@app.post("/api/pandu-settlement/{assignment_id}")
async def process_settlement(assignment_id: int, request: Request):

    data = await request.json()

    db = SessionLocal()

    try:

        db.execute(
            text("""

            UPDATE pandu_assignments

            SET

                settlement_amount=:amount,

                is_settled=1,

                settlement_date=CURDATE(),

                settlement_remarks=:remarks

            WHERE id=:id

        """),
            {"amount": data["amount"], "remarks": data["remarks"], "id": assignment_id},
        )




        row = db.execute(
            text("""
                SELECT balance_amount
                FROM pandu_assignments
                WHERE id=:id
            """),
            {"id": assignment_id}
        ).first()

        if row and float(row[0]) > 0:

            return {
                "success": False,
                "message":
                f"Cannot settle. Pending Amount ₹{row[0]}"
            }
    
    
    
        db.commit()

        return {"success": True, "message": "Settlement Completed"}

    finally:

        db.close()


@app.get("/api/member-search")
def member_search(q: str = ""):

    db = SessionLocal()

    try:

        rows = (
            db.execute(
                text("""

            SELECT

                id,

                member_code,

                member_name,

                mobile,

                village

            FROM members

            WHERE

                member_name LIKE :q

                OR member_code LIKE :q

                OR mobile LIKE :q

            ORDER BY member_name

            LIMIT 20

        """),
                {"q": f"%{q}%"},
            )
            .mappings()
            .all()
        )

        return [dict(x) for x in rows]

    finally:

        db.close()


@app.get("/api/settlement-member/{member_id}")
def settlement_member(member_id: int):

    db = SessionLocal()

    try:

        row = (
            db.execute(
                text("""

            SELECT

                pa.id,

                pa.total_amount,

                pa.paid_amount,

                pa.balance_amount,

                pa.group_monthly_due,

                pa.duration_months,

                m.member_name,

                m.mobile,

                m.village

            FROM pandu_assignments pa

            JOIN members m
                ON pa.member_id=m.id

            WHERE

                m.id=:id

                AND pa.is_settled=0

        """),
                {"id": member_id},
            )
            .mappings()
            .first()
        )

        if not row:

            return {}

        result = dict(row)

        result["settlement_amount"] = float(result["paid_amount"]) + float(
            result["group_monthly_due"]
        )

        return result

    finally:

        db.close()


from datetime import datetime


@app.get("/pandu_details")
async def pandu_details(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="pandu_details.html",
        context={"current_year": datetime.now().year},
    )


@app.get("/pending-members-list")
async def pending_members_list(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="reports/pandu_pending_members_list.html",
        context={"active_page": "pending_members"},
    )


@app.get("/pandu-pending-summary", response_class=HTMLResponse)
async def pandu_pending(request: Request):

    return templates.TemplateResponse(
        "reports/pandu_pending_summary.html",
        {
            "request": request,
            "pending_members": [],
            "total_members": 0,
            "total_pending_amount": 0,
            "current_month_due": 0,
            "critical_members": 0,
        },
    )

@app.get("/api/pending-members-list")
def pending_members_list(search: str = ""):

    db = SessionLocal()

    try:

        sql = text("""

            SELECT

                m.id,
                m.member_code,
                m.member_name,
                m.mobile,

                pg.group_name,

                pa.group_monthly_due,

                IFNULL(
                    (
                        SELECT COUNT(*)
                        FROM collections c
                        WHERE c.member_id = m.id
                        AND c.collection_year = YEAR(CURDATE())
                    ),
                    0
                ) AS paid_months

            FROM members m

            INNER JOIN pandu_assignments pa
                ON pa.member_id = m.id

            INNER JOIN pandu_groups pg
                ON pg.id = pa.group_id

            WHERE pa.status='ACTIVE'

            AND (
                m.member_name LIKE :search
                OR m.member_code LIKE :search
                OR m.mobile LIKE :search
            )

            ORDER BY m.member_name

        """)

        rows = db.execute(
            sql,
            {"search": f"%{search}%"}
        ).mappings().all()

        current_month = datetime.now().month

        result = []

        for row in rows:

            item = dict(row)

            pending_months = current_month - int(item["paid_months"])

            if pending_months < 0:
                pending_months = 0

            monthly_due = float(item["group_monthly_due"])

            item["pending_months"] = pending_months
            item["total_pending"] = monthly_due * pending_months

            result.append(item)

        return result

    finally:

        db.close()
        
        
@app.get("/api/member-year-due/{member_id}")
def member_year_due(member_id: int):

    db = SessionLocal()

    try:

        current_year = datetime.now().year

        rows = db.execute(text("""

            SELECT

                collection_month,
                amount

            FROM collections

            WHERE member_id = :member_id

            AND collection_year = :year

        """),
        {
            "member_id": member_id,
            "year": current_year
        }).mappings().all()

        paid_map = {}

        for r in rows:

            paid_map[r["collection_month"]] = float(r["amount"])

        monthly_due = db.execute(text("""

            SELECT group_monthly_due

            FROM pandu_assignments

            WHERE member_id=:member_id

            AND status='ACTIVE'

            LIMIT 1

        """),
        {
            "member_id": member_id
        }).scalar()

        monthly_due = float(monthly_due or 0)

        result = []

        for month in range(1,13):

            paid = paid_map.get(month,0)

            balance = monthly_due - paid

            result.append({

                "month":
                datetime(2025,month,1).strftime("%B"),

                "due": monthly_due,

                "paid": paid,

                "balance": balance,

                "status":
                "Paid" if paid > 0 else "Pending"

            })

        return result

    finally:

        db.close()


@app.get("/pending-members-print")
def pending_members_print(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="reports/pandu_pending_members_print.html"
    )
    
    
@app.get("/pandu-collection-summary")
async def collection_summary(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="reports/pandu_collection_summary.html",
        context={
            "active_page": "pandu-collection-summary"
        }
    )
    

    
    

@app.get("/api/pandu-collection-summary")
def collection_summary(year: int):

    db = SessionLocal()

    try:

        result = []

        for month in range(1, 13):

            expected = db.execute(text("""

                SELECT IFNULL(SUM(pa.group_monthly_due),0)

                FROM pandu_assignments pa

                WHERE pa.status='ACTIVE'

            """)).scalar()

            collected = db.execute(text("""

                SELECT IFNULL(SUM(amount),0)

                FROM collections

                WHERE collection_month=:month
                AND collection_year=:year

            """),
            {
                "month": month,
                "year": year
            }).scalar()

            expected = float(expected or 0)
            collected = float(collected or 0)

            result.append({
                "month": datetime(2025, month, 1).strftime("%B"),
                "expected": expected,
                "collected": collected,
                "pending": expected - collected
            })

        return result

    finally:

        db.close()
        
        

@app.get("/api/datewise-collection-list")
def api_datewise_collection_list(
    from_date: str,
    to_date: str
):

    db = SessionLocal()

    try:

        rows = db.execute(text("""

            SELECT

                c.id,
                c.member_id,
                c.receipt_no,

                DATE_FORMAT(
                    c.collection_date,
                    '%d-%m-%Y'
                ) AS collection_date,

                c.amount,
                c.payment_mode,

                m.member_code,
                m.member_name,

                IFNULL(pg.group_name,'-') AS group_name

            FROM collections c

            INNER JOIN members m
                ON m.id = c.member_id

            LEFT JOIN pandu_groups pg
                ON pg.id = c.group_id

            WHERE DATE(c.collection_date)
                  BETWEEN :from_date
                  AND :to_date

            ORDER BY
                c.collection_date,
                c.id

        """),
        {
            "from_date": from_date,
            "to_date": to_date
        }).mappings().all()

        result = []

        for row in rows:

            item = dict(row)

            item["amount"] = float(item["amount"])

            result.append(item)

        return result

    finally:

        db.close()
        

# ------------------------------------------
# DATE WISE COLLECTION REPORT SCREEN
# ------------------------------------------

@app.get("/datewise-collection-list")
async def datewise_collection_list(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="reports/datewise_collection_list.html",
        context={
            "active_page": "datewise_collection"
        }
    )

    
@app.get("/dashboard-live")
async def datewise_collection_list(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="dashboard.html",
        context={
            "active_page": "dashboard-live"
        }
    )
    

@app.post("/complete-settlement")
async def complete_settlement(data: dict):

    assignment_id = data.get("assignment_id")
    remarks = data.get("remarks")

    # update database

    return {
        "success": True
    }
    
from fastapi import Request
from fastapi.responses import HTMLResponse
from sqlalchemy import text
@app.get("/pandu-settlement-list", response_class=HTMLResponse)
async def pandu_settlement_list(request: Request):

    db = SessionLocal()

    try:

        settlements = db.execute(text("""

            SELECT

                pa.id,

                m.member_code,
                m.member_name,

                pg.group_name,

                pa.total_amount,
                pa.paid_amount,
                pa.balance_amount,
                pa.settlement_amount,

                pa.is_settled,
                pa.settlement_date

            FROM pandu_assignments pa

            INNER JOIN members m
                ON pa.member_id = m.id

            INNER JOIN pandu_groups pg
                ON pa.group_id = pg.id

            ORDER BY m.member_name

        """)).mappings().all()

        total_members = len(settlements)

        settled_members = len(
            [x for x in settlements if x["is_settled"] == 1]
        )

        pending_members = len(
            [x for x in settlements if x["is_settled"] == 0]
        )

        total_settlement_amount = sum(
            float(x["settlement_amount"] or 0)
            for x in settlements
        )

        return templates.TemplateResponse(
            request=request,
            name="reports/pandu_settlement_list.html",
            context={
                "active_page": "pandu_settlement",
                "settlements": settlements,
                "total_members": total_members,
                "settled_members": settled_members,
                "pending_members": pending_members,
                "total_settlement_amount": f"{total_settlement_amount:,.0f}",
            },
        )

    finally:

        db.close()

@app.get("/accounts/credits")
def credits_entry(request: Request):

    db = SessionLocal()

    try:

        categories = db.execute(text("""

            SELECT
                id,
                category_name

            FROM account_categories

            WHERE transaction_type='CREDIT'

            AND is_active=1

            ORDER BY category_name

        """)).mappings().all()

        transactions = db.execute(text("""

            SELECT *

            FROM accounts_transactions

            WHERE transaction_type='CREDIT'

            ORDER BY id DESC

            LIMIT 100

        """)).mappings().all()

        return templates.TemplateResponse(
            request=request,
            name="accounts/credits.html",
            context={
                "categories": categories,
                "transactions": transactions,
                "active_page": "credits"
            }
        )

    finally:
        db.close()
        
        
@app.post("/accounts/credits/save")
def save_credit(

    transaction_date: str = Form(...),
    category: str = Form(...),
    amount: float = Form(...),
    payment_mode: str = Form(...),
    remarks: str = Form("")

):

    db = SessionLocal()

    try:

        db.execute(
            text("""

                INSERT INTO accounts_transactions
                (
                    transaction_date,
                    transaction_type,
                    category,
                    amount,
                    payment_mode,
                    remarks
                )

                VALUES
                (
                    :transaction_date,
                    'CREDIT',
                    :category,
                    :amount,
                    :payment_mode,
                    :remarks
                )

            """),
            {
                "transaction_date": transaction_date,
                "category": category,
                "amount": amount,
                "payment_mode": payment_mode,
                "remarks": remarks
            }
        )

        db.commit()

        return RedirectResponse(
            "/accounts/credits",
            status_code=302
        )

    finally:
        db.close()
        
        

@app.get("/accounts/expenses")
def expenses_entry(request: Request):

    db = SessionLocal()

    try:

        categories = db.execute(text("""

            SELECT
                id,
                category_name

            FROM account_categories

            WHERE transaction_type='EXPENSE'

            AND is_active=1

            ORDER BY category_name

        """)).mappings().all()

        transactions = db.execute(text("""

            SELECT *

            FROM accounts_transactions

            WHERE transaction_type='EXPENSE'

            ORDER BY id DESC

            LIMIT 100

        """)).mappings().all()

        return templates.TemplateResponse(
            request=request,
            name="accounts/expenses.html",
            context={
                "categories": categories,
                "transactions": transactions,
                "active_page": "expenses"
            }
        )

    finally:
        db.close()
        

@app.post("/accounts/expenses/save")
def save_expense(

    transaction_date: str = Form(...),
    category: str = Form(...),
    amount: float = Form(...),
    payment_mode: str = Form(...),
    remarks: str = Form("")

):

    db = SessionLocal()

    try:

        db.execute(
            text("""

                INSERT INTO accounts_transactions
                (
                    transaction_date,
                    transaction_type,
                    category,
                    amount,
                    payment_mode,
                    remarks
                )

                VALUES
                (
                    :transaction_date,
                    'EXPENSE',
                    :category,
                    :amount,
                    :payment_mode,
                    :remarks
                )

            """),
            {
                "transaction_date": transaction_date,
                "category": category,
                "amount": amount,
                "payment_mode": payment_mode,
                "remarks": remarks
            }
        )

        db.commit()

        return RedirectResponse(
            "/accounts/expenses",
            status_code=302
        )

    finally:
        db.close()
        
        

@app.get("/api/accounts/daily-summary")
def daily_summary():

    db = SessionLocal()

    try:

        credits = db.execute(text("""

            SELECT IFNULL(SUM(amount),0)

            FROM accounts_transactions

            WHERE transaction_type='CREDIT'

            AND transaction_date=CURDATE()

        """)).scalar()

        expenses = db.execute(text("""

            SELECT IFNULL(SUM(amount),0)

            FROM accounts_transactions

            WHERE transaction_type='EXPENSE'

            AND transaction_date=CURDATE()

        """)).scalar()

        return {
            "credits": float(credits),
            "expenses": float(expenses),
            "net_income": float(credits) - float(expenses)
        }

    finally:
        db.close()
        
        
@app.get("/accounts/summary")
def accounts_summary(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="accounts/accounts_summary.html",
        context={
            "active_page": "accounts_summary"
        }
    )
    
@app.get("/api/accounts/summary")
def api_accounts_summary():

    db = SessionLocal()

    try:

        credits = db.execute(text("""

            SELECT IFNULL(SUM(amount),0)

            FROM accounts_transactions

            WHERE transaction_type='CREDIT'

            AND transaction_date=CURDATE()

        """)).scalar()

        expenses = db.execute(text("""

            SELECT IFNULL(SUM(amount),0)

            FROM accounts_transactions

            WHERE transaction_type='EXPENSE'

            AND transaction_date=CURDATE()

        """)).scalar()

        cash_credits = db.execute(text("""

            SELECT IFNULL(SUM(amount),0)

            FROM accounts_transactions

            WHERE transaction_type='CREDIT'
            AND payment_mode='CASH'
            AND transaction_date=CURDATE()

        """)).scalar()

        gpay_credits = db.execute(text("""

            SELECT IFNULL(SUM(amount),0)

            FROM accounts_transactions

            WHERE transaction_type='CREDIT'
            AND payment_mode='GPAY'
            AND transaction_date=CURDATE()

        """)).scalar()

        bank_credits = db.execute(text("""

            SELECT IFNULL(SUM(amount),0)

            FROM accounts_transactions

            WHERE transaction_type='CREDIT'
            AND payment_mode='BANK'
            AND transaction_date=CURDATE()

        """)).scalar()

        return {

            "credits": float(credits or 0),

            "expenses": float(expenses or 0),

            "profit": float(credits or 0)
                      - float(expenses or 0),

            "cash_credits": float(cash_credits or 0),

            "gpay_credits": float(gpay_credits or 0),

            "bank_credits": float(bank_credits or 0)

        }

    finally:

        db.close()    
        
        
@app.get("/accounts/credits-report")
def credits_report(
    request: Request,
    from_date: str = "",
    to_date: str = ""
):

    db = SessionLocal()

    try:

        if not from_date:
            from_date = datetime.now().strftime("%Y-%m-01")

        if not to_date:
            to_date = datetime.now().strftime("%Y-%m-%d")

        rows = db.execute(
            text("""

                SELECT

                    transaction_date,
                    category,
                    amount,
                    payment_mode,
                    remarks

                FROM accounts_transactions

                WHERE transaction_type='CREDIT'

                AND transaction_date
                    BETWEEN :from_date
                    AND :to_date

                ORDER BY
                    transaction_date DESC,
                    id DESC

            """),
            {
                "from_date": from_date,
                "to_date": to_date
            }
        ).mappings().all()

        total_amount = sum(
            float(x["amount"])
            for x in rows
        )

        return templates.TemplateResponse(
            request=request,
            name="accounts/credits_report.html",
            context={
                "rows": rows,
                "from_date": from_date,
                "to_date": to_date,
                "total_amount": total_amount,
                "active_page": "credits_report"
            }
        )

    finally:
        db.close()
        
        
@app.get("/accounts/expenses-report")
def expenses_report(
    request: Request,
    from_date: str = "",
    to_date: str = ""
):

    db = SessionLocal()

    try:

        if not from_date:
            from_date = datetime.now().strftime("%Y-%m-01")

        if not to_date:
            to_date = datetime.now().strftime("%Y-%m-%d")

        rows = db.execute(
            text("""

                SELECT

                    transaction_date,
                    category,
                    amount,
                    payment_mode,
                    remarks

                FROM accounts_transactions

                WHERE transaction_type='EXPENSE'

                AND transaction_date
                    BETWEEN :from_date
                    AND :to_date

                ORDER BY
                    transaction_date DESC,
                    id DESC

            """),
            {
                "from_date": from_date,
                "to_date": to_date
            }
        ).mappings().all()

        total_amount = sum(
            float(x["amount"])
            for x in rows
        )

        return templates.TemplateResponse(
            request=request,
            name="accounts/expenses_report.html",
            context={
                "rows": rows,
                "from_date": from_date,
                "to_date": to_date,
                "total_amount": total_amount,
                "active_page": "expenses_report"
            }
        )

    finally:
        db.close()
        
@app.get("/accounts/datewise-report")
def datewise_accounts_report(
    request: Request,
    from_date: str = "",
    to_date: str = ""
):

    db = SessionLocal()

    try:

        if not from_date:
            from_date = datetime.now().strftime("%Y-%m-01")

        if not to_date:
            to_date = datetime.now().strftime("%Y-%m-%d")

        rows = db.execute(
            text("""

                SELECT

                    transaction_date,

                    SUM(
                        CASE
                            WHEN transaction_type='CREDIT'
                            THEN amount
                            ELSE 0
                        END
                    ) AS credits,

                    SUM(
                        CASE
                            WHEN transaction_type='EXPENSE'
                            THEN amount
                            ELSE 0
                        END
                    ) AS expenses

                FROM accounts_transactions

                WHERE transaction_date
                    BETWEEN :from_date
                    AND :to_date

                GROUP BY transaction_date

                ORDER BY transaction_date DESC

            """),
            {
                "from_date": from_date,
                "to_date": to_date
            }
        ).mappings().all()

        total_credits = 0
        total_expenses = 0

        result = []

        for row in rows:

            credits = float(row["credits"] or 0)
            expenses = float(row["expenses"] or 0)

            profit = credits - expenses

            total_credits += credits
            total_expenses += expenses

            result.append({
                "transaction_date": row["transaction_date"],
                "credits": credits,
                "expenses": expenses,
                "profit": profit
            })

        return templates.TemplateResponse(
            request=request,
            name="accounts/datewise_accounts_report.html",
            context={
                "rows": result,
                "from_date": from_date,
                "to_date": to_date,
                "total_credits": total_credits,
                "total_expenses": total_expenses,
                "total_profit":
                    total_credits - total_expenses,
                "active_page":
                    "datewise_accounts_report"
            }
        )

    finally:
        db.close()
        
@app.get("/accounts/categorywise-expense-report")
def categorywise_expense_report(
    request: Request,
    from_date: str = "",
    to_date: str = ""
):

    db = SessionLocal()

    try:

        if not from_date:
            from_date = datetime.now().strftime("%Y-%m-01")

        if not to_date:
            to_date = datetime.now().strftime("%Y-%m-%d")

        rows = db.execute(
            text("""

                SELECT

                    category,

                    COUNT(*) AS total_entries,

                    SUM(amount) AS total_amount

                FROM accounts_transactions

                WHERE transaction_type='EXPENSE'

                AND transaction_date
                    BETWEEN :from_date
                    AND :to_date

                GROUP BY category

                ORDER BY total_amount DESC

            """),
            {
                "from_date": from_date,
                "to_date": to_date
            }
        ).mappings().all()

        grand_total = sum(
            float(x["total_amount"] or 0)
            for x in rows
        )

        return templates.TemplateResponse(
            request=request,
            name="accounts/categorywise_expense_report.html",
            context={
                "rows": rows,
                "grand_total": grand_total,
                "from_date": from_date,
                "to_date": to_date,
                "active_page":
                    "categorywise_expense_report"
            }
        )

    finally:
        db.close()
        
@app.get("/accounts/categorywise-income-report")
def categorywise_income_report(
    request: Request,
    from_date: str = "",
    to_date: str = ""
):

    db = SessionLocal()

    try:

        if not from_date:
            from_date = datetime.now().strftime("%Y-%m-01")

        if not to_date:
            to_date = datetime.now().strftime("%Y-%m-%d")

        rows = db.execute(
            text("""

                SELECT

                    category,

                    COUNT(*) AS total_entries,

                    SUM(amount) AS total_amount

                FROM accounts_transactions

                WHERE transaction_type='CREDIT'

                AND transaction_date
                    BETWEEN :from_date
                    AND :to_date

                GROUP BY category

                ORDER BY total_amount DESC

            """),
            {
                "from_date": from_date,
                "to_date": to_date
            }
        ).mappings().all()

        grand_total = sum(
            float(x["total_amount"] or 0)
            for x in rows
        )

        return templates.TemplateResponse(
            request=request,
            name="accounts/categorywise_income_report.html",
            context={
                "rows": rows,
                "grand_total": grand_total,
                "from_date": from_date,
                "to_date": to_date,
                "active_page":
                    "categorywise_income_report"
            }
        )

    finally:
        db.close()
        
@app.get("/accounts/monthly-summary")
def monthly_summary(
    request: Request,
    year: int = datetime.now().year
):

    db = SessionLocal()

    try:

        rows = db.execute(
            text("""

                SELECT

                    MONTH(transaction_date) AS month_no,

                    SUM(
                        CASE
                            WHEN transaction_type='CREDIT'
                            THEN amount
                            ELSE 0
                        END
                    ) AS credits,

                    SUM(
                        CASE
                            WHEN transaction_type='EXPENSE'
                            THEN amount
                            ELSE 0
                        END
                    ) AS expenses

                FROM accounts_transactions

                WHERE YEAR(transaction_date)=:year

                GROUP BY MONTH(transaction_date)

                ORDER BY MONTH(transaction_date)

            """),
            {"year": year}
        ).mappings().all()

        month_names = {
            1:"January",
            2:"February",
            3:"March",
            4:"April",
            5:"May",
            6:"June",
            7:"July",
            8:"August",
            9:"September",
            10:"October",
            11:"November",
            12:"December"
        }

        result = []

        total_credits = 0
        total_expenses = 0

        best_month = ""
        best_profit = 0

        for row in rows:

            credits = float(row["credits"] or 0)
            expenses = float(row["expenses"] or 0)
            profit = credits - expenses

            total_credits += credits
            total_expenses += expenses

            if profit > best_profit:
                best_profit = profit
                best_month = month_names[row["month_no"]]

            result.append({
                "month": month_names[row["month_no"]],
                "credits": credits,
                "expenses": expenses,
                "profit": profit
            })

        return templates.TemplateResponse(
            request=request,
            name="accounts/monthly_summary.html",
            context={
                "rows": result,
                "year": year,
                "total_credits": total_credits,
                "total_expenses": total_expenses,
                "total_profit":
                    total_credits - total_expenses,
                "best_month": best_month,
                "active_page": "monthly_summary"
            }
        )

    finally:
        db.close()
        
        
@app.get("/accounts/profit-summary")
def profit_summary(
    request: Request,
    year: int = datetime.now().year
):

    return templates.TemplateResponse(
        request=request,
        name="accounts/profit_summary.html",
        context={
            "year": year,
            "active_page": "profit_summary"
        }
    )
    
    
@app.get("/api/accounts/profit-summary")
def api_profit_summary():

    db = SessionLocal()

    try:

        total_credits = db.execute(text("""

            SELECT IFNULL(SUM(amount),0)

            FROM accounts_transactions

            WHERE transaction_type='CREDIT'

        """)).scalar()

        total_expenses = db.execute(text("""

            SELECT IFNULL(SUM(amount),0)

            FROM accounts_transactions

            WHERE transaction_type='EXPENSE'

        """)).scalar()

        cash_credits = db.execute(text("""

            SELECT IFNULL(SUM(amount),0)

            FROM accounts_transactions

            WHERE transaction_type='CREDIT'
            AND payment_mode='CASH'

        """)).scalar()

        gpay_credits = db.execute(text("""

            SELECT IFNULL(SUM(amount),0)

            FROM accounts_transactions

            WHERE transaction_type='CREDIT'
            AND payment_mode='GPAY'

        """)).scalar()

        bank_credits = db.execute(text("""

            SELECT IFNULL(SUM(amount),0)

            FROM accounts_transactions

            WHERE transaction_type='CREDIT'
            AND payment_mode='BANK'

        """)).scalar()

        top_income = db.execute(text("""

            SELECT
                category,
                SUM(amount) total

            FROM accounts_transactions

            WHERE transaction_type='CREDIT'

            GROUP BY category

            ORDER BY total DESC

            LIMIT 1

        """)).mappings().first()

        top_expense = db.execute(text("""

            SELECT
                category,
                SUM(amount) total

            FROM accounts_transactions

            WHERE transaction_type='EXPENSE'

            GROUP BY category

            ORDER BY total DESC

            LIMIT 1

        """)).mappings().first()

        return {

            "total_credits":
                float(total_credits or 0),

            "total_expenses":
                float(total_expenses or 0),

            "net_profit":
                float(total_credits or 0)
                - float(total_expenses or 0),

            "cash_credits":
                float(cash_credits or 0),

            "gpay_credits":
                float(gpay_credits or 0),

            "bank_credits":
                float(bank_credits or 0),

            "top_income":
                top_income["category"]
                if top_income else "-",

            "top_expense":
                top_expense["category"]
                if top_expense else "-"

        }

    finally:
        db.close()
        

# ==========================
# KANTHU DASHBOARD
# ==========================

from fastapi import Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

templates = Jinja2Templates(directory="app/templates")


@app.get("/kanthu", response_class=HTMLResponse)
async def kanthu_dashboard(request: Request):

    return templates.TemplateResponse(
    request=request,
    name="kanthu_dashboard.html",
    context={
        "active_page": "kanthu_dashboard"
    }
)


# ==========================
# NEW KANTHU
# ==========================

@app.get("/kanthu/new")
async def kanthu_new(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="kanthu_new.html",
        context={
            "active_page": "kanthu_new"
        }
    )


# ==========================
# KANTHU COLLECTION
# ==========================

@app.get("/kanthu/collection")
async def kanthu_collection(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="kanthu_collection.html",
        context={
            "active_page": "kanthu_collection"
        }
    )


# ==========================
# MEMBER STATUS
# ==========================

@app.get("/kanthu/members")
async def kanthu_members(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="kanthu_members.html",
        context={
            "active_page": "kanthu_members"
        }
    )

# ==========================
# REPORTS
# ==========================
   
@app.get("/api/kanthu-member-search")
def kanthu_member_search(search: str = ""):

    db = SessionLocal()

    try:

        rows = db.execute(
            text("""
                SELECT
                    id,
                    member_code,
                    member_name,
                    mobile,
                    village
                FROM members
                WHERE
                    member_name LIKE :search
                    OR member_code LIKE :search
                    OR mobile LIKE :search
                ORDER BY member_name
                LIMIT 20
            """),
            {"search": f"%{search}%"}
        ).mappings().all()

        return [dict(x) for x in rows]

    finally:
        db.close()
        
        
        
        
@app.get("/api/member/{member_id}")
async def get_member(member_id: int):

    with engine.connect() as conn:

        member = conn.execute(text("""
            SELECT
                id,
                member_no,
                member_name,
                mobile,
                village
            FROM members
            WHERE id = :id
        """), {
            "id": member_id
        }).mappings().first()

    return dict(member) if member else {}


@app.get("/api/member-kanthu-summary/{member_id}")
async def member_kanthu_summary(member_id: int):

    with engine.connect() as conn:

        summary = conn.execute(text("""
            SELECT

                COUNT(*) active_kanthus,

                IFNULL(
                    SUM(principal_amount),
                    0
                ) total_given,

                IFNULL(
                    SUM(total_collected),
                    0
                ) total_collected,

                IFNULL(
                    SUM(balance_amount),
                    0
                ) outstanding

            FROM kanthu_master

            WHERE member_id = :member_id
            AND status = 'ACTIVE'

        """), {
            "member_id": member_id
        }).mappings().first()

    return dict(summary)



@app.get("/api/accounts/current-balance")
async def current_balance():

    with engine.connect() as conn:

        credits = conn.execute(text("""
            SELECT IFNULL(
                SUM(amount),
                0
            )
            FROM accounts_transactions
            WHERE transaction_type='CREDIT'
        """)).scalar()

        debits = conn.execute(text("""
            SELECT IFNULL(
                SUM(amount),
                0
            )
            FROM accounts_transactions
            WHERE transaction_type='DEBIT'
        """)).scalar()

    balance = float(credits or 0) - float(debits or 0)

    return {
        "balance": balance
    }
    
    
@app.get("/api/kanthu/default-interest")
async def default_interest():

    with engine.connect() as conn:

        setting = conn.execute(text("""
            SELECT setting_value
            FROM app_settings
            WHERE setting_key='KANTHU_INTEREST_PERCENT'
        """)).scalar()

    return {
        "interest_percent": float(setting or 10)
    }
    
    
@app.get("/api/kanthu/generate-number")
async def generate_kanthu_no():

    year = datetime.now().year

    with engine.connect() as conn:

        last_no = conn.execute(text("""
            SELECT COUNT(*)
            FROM kanthu_master
            WHERE financial_year=:year
        """), {
            "year": year
        }).scalar()

    next_no = (last_no or 0) + 1

    kanthu_no = f"KAN-{year}-{next_no:05d}"

    return {
        "kanthu_no": kanthu_no
    }
    
    
from datetime import datetime
from sqlalchemy import text

@app.post("/api/kanthu/save")
async def save_kanthu(data: KanthuSaveRequest):

    try:

        principal_amount = float(data.principal_amount)

        interest_percent = float(data.interest_percent)

        interest_amount = (
            principal_amount *
            interest_percent
        ) / 100

        net_paid_amount = (
            principal_amount -
            interest_amount
        )

        current_year = datetime.now().year

        with engine.begin() as conn:

            # Generate Kanthu Number

            total_count = conn.execute(text("""
                SELECT COUNT(*)
                FROM kanthu_master
                WHERE financial_year = :year
            """), {
                "year": current_year
            }).scalar()

            next_no = (total_count or 0) + 1

            kanthu_no = (
                f"KAN-{current_year}-{next_no:05d}"
            )

            # Save Master

            result = conn.execute(text("""
                INSERT INTO kanthu_master (

                    kanthu_no,
                    member_id,
                    issue_date,

                    principal_amount,
                    interest_percent,
                    interest_amount,
                    net_paid_amount,

                    total_collected,
                    balance_amount,

                    due_year,
                    financial_year,

                    status,
                    remarks

                )
                VALUES (

                    :kanthu_no,
                    :member_id,
                    :issue_date,

                    :principal_amount,
                    :interest_percent,
                    :interest_amount,
                    :net_paid_amount,

                    0,
                    :balance_amount,

                    :due_year,
                    :financial_year,

                    'ACTIVE',
                    :remarks

                )
            """), {

                "kanthu_no": kanthu_no,

                "member_id": data.member_id,

                "issue_date": data.issue_date,

                "principal_amount": principal_amount,

                "interest_percent": interest_percent,

                "interest_amount": interest_amount,

                "net_paid_amount": net_paid_amount,

                "balance_amount": principal_amount,

                "due_year": current_year,

                "financial_year": current_year,

                "remarks": data.remarks

            })

            kanthu_id = result.lastrowid

            # Transaction Entry

            conn.execute(text("""
                INSERT INTO kanthu_transactions (

                    kanthu_id,
                    transaction_date,
                    transaction_type,
                    amount,
                    remarks

                )
                VALUES (

                    :kanthu_id,
                    :transaction_date,
                    'ISSUE',
                    :amount,
                    :remarks

                )
            """), {

                "kanthu_id": kanthu_id,

                "transaction_date":
                    data.issue_date,

                "amount":
                    principal_amount,

                "remarks":
                    "Kanthu Issued"

            })

        return {

            "success": True,

            "message":
                "Kanthu Created Successfully",

            "kanthu_id":
                kanthu_id,

            "kanthu_no":
                kanthu_no

        }

    except Exception as e:

        return {

            "success": False,

            "message": str(e)

        }
        
        
@app.get("/api/member-active-kanthus/{member_id}")
def member_active_kanthus(member_id: int):

    db = SessionLocal()

    try:

        rows = db.execute(
            text("""
                SELECT

                    id,
                    kanthu_no,

                    issue_date,

                    principal_amount,

                    total_collected,

                    balance_amount,

                    status

                FROM kanthu_master

                WHERE member_id = :member_id

                AND status = 'ACTIVE'

                ORDER BY id DESC
            """),
            {
                "member_id": member_id
            }
        ).mappings().all()

        result = []

        for row in rows:

            item = dict(row)

            item["principal_amount"] = float(
                item["principal_amount"] or 0
            )

            item["total_collected"] = float(
                item["total_collected"] or 0
            )

            item["balance_amount"] = float(
                item["balance_amount"] or 0
            )

            item["issue_date"] = str(
                item["issue_date"]
            )

            result.append(item)

        return result

    finally:

        db.close()
        
        
class KanthuCollectionRequest(BaseModel):

    kanthu_id: int

    collection_date: str

    amount: float

    payment_mode: str

    remarks: str = ""
    
    
@app.post("/api/kanthu/collection/save")
async def save_kanthu_collection(
    data: KanthuCollectionRequest
):

    db = SessionLocal()

    try:

        kanthu = db.execute(
            text("""
                SELECT

                    id,
                    kanthu_no,
                    balance_amount,
                    total_collected

                FROM kanthu_master

                WHERE id = :id
            """),
            {
                "id": data.kanthu_id
            }
        ).mappings().first()

        if not kanthu:

            return {
                "success": False,
                "message": "Kanthu Not Found"
            }

        balance_amount = float(
            kanthu["balance_amount"]
        )

        if data.amount > balance_amount:

            return {
                "success": False,
                "message":
                f"Collection exceeds balance ₹{balance_amount}"
            }

        # --------------------------------------------------
        # SAVE TRANSACTION
        # --------------------------------------------------

        db.execute(
            text("""
                INSERT INTO kanthu_transactions
                (
                    kanthu_id,
                    transaction_date,
                    transaction_type,
                    amount,
                    remarks
                )
                VALUES
                (
                    :kanthu_id,
                    :transaction_date,
                    'COLLECTION',
                    :amount,
                    :remarks
                )
            """),
            {
                "kanthu_id":
                    data.kanthu_id,

                "transaction_date":
                    data.collection_date,

                "amount":
                    data.amount,

                "remarks":
                    data.remarks
            }
        )

        # --------------------------------------------------
        # UPDATE MASTER
        # --------------------------------------------------

        db.execute(
            text("""
                UPDATE kanthu_master

                SET

                    total_collected =
                        total_collected + :amount,

                    balance_amount =
                        balance_amount - :amount

                WHERE id = :kanthu_id
            """),
            {
                "amount":
                    data.amount,

                "kanthu_id":
                    data.kanthu_id
            }
        )

        # --------------------------------------------------
        # AUTO CLOSE
        # --------------------------------------------------

        db.execute(
            text("""
                UPDATE kanthu_master

                SET status='CLOSED'

                WHERE id=:kanthu_id

                AND balance_amount <= 0
            """),
            {
                "kanthu_id":
                    data.kanthu_id
            }
        )

        # --------------------------------------------------
        # ACCOUNTS CREDIT ENTRY
        # --------------------------------------------------

        db.execute(
            text("""
                INSERT INTO accounts_transactions
                (
                    transaction_date,
                    transaction_type,
                    category,
                    amount,
                    payment_mode,
                    reference_module,
                    reference_id,
                    remarks
                )
                VALUES
                (
                    :transaction_date,
                    'CREDIT',
                    'Kanthu Collection',
                    :amount,
                    :payment_mode,
                    'KANTHU',
                    :reference_id,
                    :remarks
                )
            """),
            {
                "transaction_date":
                    data.collection_date,

                "amount":
                    data.amount,

                "payment_mode":
                    data.payment_mode,

                "reference_id":
                    data.kanthu_id,

                "remarks":
                    f"Kanthu Collection - {kanthu['kanthu_no']}"
            }
        )

        db.commit()

        return {

            "success": True,

            "message":
                "Collection Saved Successfully"
        }

    except Exception as e:

        db.rollback()

        return {

            "success": False,

            "message": str(e)
        }

    finally:

        db.close()
        
        
@app.get("/api/member-kanthu-issues/{member_id}")
def member_kanthu_issues(member_id: int):

    db = SessionLocal()

    try:

        rows = db.execute(
            text("""
                SELECT

                    id,

                    kanthu_no,

                    issue_date,

                    principal_amount,

                    total_collected,

                    balance_amount,

                    status

                FROM kanthu_master

                WHERE member_id = :member_id

                ORDER BY issue_date DESC
            """),
            {
                "member_id": member_id
            }
        ).mappings().all()

        result = []

        for row in rows:

            item = dict(row)

            item["issue_date"] = str(
                item["issue_date"]
            )

            item["principal_amount"] = float(
                item["principal_amount"] or 0
            )

            item["total_collected"] = float(
                item["total_collected"] or 0
            )

            item["balance_amount"] = float(
                item["balance_amount"] or 0
            )

            result.append(item)

        return result

    finally:

        db.close()
        
        
@app.get("/api/member-kanthu-collections/{member_id}")
def member_kanthu_collections(member_id: int):

    db = SessionLocal()

    try:

        rows = db.execute(
            text("""
                SELECT

                    kt.transaction_date,

                    km.kanthu_no,

                    kt.amount,

                    kt.remarks

                FROM kanthu_transactions kt

                INNER JOIN kanthu_master km
                    ON km.id = kt.kanthu_id

                WHERE

                    km.member_id = :member_id

                    AND

                    kt.transaction_type='COLLECTION'

                ORDER BY
                    kt.transaction_date DESC
            """),
            {
                "member_id": member_id
            }
        ).mappings().all()

        result = []

        for row in rows:

            item = dict(row)

            item["transaction_date"] = str(
                item["transaction_date"]
            )

            item["amount"] = float(
                item["amount"] or 0
            )

            result.append(item)

        return result

    finally:

        db.close()
        
        
@app.get("/api/member-kanthu-calendar/{member_id}")
def member_kanthu_calendar(member_id: int):

    db = SessionLocal()

    try:

        year = datetime.now().year

        result = []

        for month in range(1, 13):

            issue_count = db.execute(
                text("""
                    SELECT COUNT(*)

                    FROM kanthu_master

                    WHERE member_id = :member_id

                    AND YEAR(issue_date) = :year

                    AND MONTH(issue_date) = :month
                """),
                {
                    "member_id": member_id,
                    "year": year,
                    "month": month
                }
            ).scalar()

            collection_count = db.execute(
                text("""
                    SELECT COUNT(*)

                    FROM kanthu_transactions kt

                    INNER JOIN kanthu_master km
                        ON km.id = kt.kanthu_id

                    WHERE

                        km.member_id = :member_id

                        AND

                        kt.transaction_type='COLLECTION'

                        AND

                        YEAR(
                            kt.transaction_date
                        ) = :year

                        AND

                        MONTH(
                            kt.transaction_date
                        ) = :month
                """),
                {
                    "member_id": member_id,
                    "year": year,
                    "month": month
                }
            ).scalar()

            result.append({

                "month": month,

                "issue":
                    int(issue_count or 0),

                "collection":
                    int(collection_count or 0)

            })

        return result

    finally:

        db.close()
        
        
@app.get("/kanthu/member-status")
async def kanthu_member_status(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="kanthu_member_status.html",
        context={
            "active_page":
                "kanthu_member_status"
        }
    )
    
    
@app.get("/api/member-kanthu-summary/{member_id}")
def member_kanthu_summary(member_id: int):

    db = SessionLocal()

    try:

        row = db.execute(
            text("""
                SELECT

                    COUNT(
                        CASE
                            WHEN status='ACTIVE'
                            THEN 1
                        END
                    ) AS active_kanthus,

                    COALESCE(
                        SUM(principal_amount),
                        0
                    ) AS total_given,

                    COALESCE(
                        SUM(total_collected),
                        0
                    ) AS total_collected,

                    COALESCE(
                        SUM(balance_amount),
                        0
                    ) AS outstanding

                FROM kanthu_master

                WHERE member_id=:member_id
            """),
            {
                "member_id": member_id
            }
        ).mappings().first()

        return {

            "active_kanthus":
                int(row["active_kanthus"] or 0),

            "total_given":
                float(row["total_given"] or 0),

            "total_collected":
                float(row["total_collected"] or 0),

            "outstanding":
                float(row["outstanding"] or 0)
        }

    finally:

        db.close()  
        


@app.get("/api/member-calendar-summary/{member_id}")
        
def member_calendar_summary(
    member_id: int
):

    db = SessionLocal()

    try:

        result = []

        for month in range(1,13):

            issue_amount = db.execute(
                text("""
                    SELECT
                    COALESCE(
                        SUM(principal_amount),
                        0
                    )

                    FROM kanthu_master

                    WHERE

                    member_id=:member_id

                    AND

                    MONTH(issue_date)=:month
                """),
                {
                    "member_id":member_id,
                    "month":month
                }
            ).scalar()

            collection_amount = db.execute(
                text("""
                    SELECT
                    COALESCE(
                        SUM(kt.amount),
                        0
                    )

                    FROM kanthu_transactions kt

                    INNER JOIN kanthu_master km
                    ON km.id=kt.kanthu_id

                    WHERE

                    km.member_id=:member_id

                    AND

                    kt.transaction_type='COLLECTION'

                    AND

                    MONTH(
                        kt.transaction_date
                    )=:month
                """),
                {
                    "member_id":member_id,
                    "month":month
                }
            ).scalar()

            txn_count = db.execute(
                text("""
                    SELECT COUNT(*)

                    FROM kanthu_transactions kt

                    INNER JOIN kanthu_master km
                    ON km.id=kt.kanthu_id

                    WHERE

                    km.member_id=:member_id

                    AND

                    MONTH(
                        kt.transaction_date
                    )=:month
                """),
                {
                    "member_id":member_id,
                    "month":month
                }
            ).scalar()

            result.append({

                "month":month,

                "issue_amount":
                    float(issue_amount or 0),

                "collection_amount":
                    float(collection_amount or 0),

                "txn_count":
                    int(txn_count or 0)

            })

        return result

    finally:

        db.close()
        
        
        
@app.get(
    "/api/member-month-transactions/{member_id}/{month}"
)
def member_month_transactions(
    member_id: int,
    month: int
):

    db = SessionLocal()

    try:

        rows = db.execute(
            text("""
                SELECT

                    km.issue_date AS txn_date,

                    'ISSUE' AS txn_type,

                    km.kanthu_no,

                    km.principal_amount AS amount

                FROM kanthu_master km

                WHERE

                    km.member_id=:member_id

                    AND

                    MONTH(
                        km.issue_date
                    )=:month

                UNION ALL

                SELECT

                    kt.transaction_date,

                    'COLLECTION',

                    km.kanthu_no,

                    kt.amount

                FROM kanthu_transactions kt

                INNER JOIN kanthu_master km
                    ON km.id=kt.kanthu_id

                WHERE

                    km.member_id=:member_id

                    AND

                    kt.transaction_type='COLLECTION'

                    AND

                    MONTH(
                        kt.transaction_date
                    )=:month

                ORDER BY txn_date DESC
            """),
            {
                "member_id": member_id,
                "month": month
            }
        ).mappings().all()

        result = []

        for row in rows:

            result.append({

                "date":
                    str(row["txn_date"]),

                "type":
                    row["txn_type"],

                "kanthu_no":
                    row["kanthu_no"],

                "amount":
                    float(row["amount"] or 0)

            })

        return result

    finally:

        db.close()  
        
        
        


@app.get("/api/member-calendar-summary/{member_id}")
def member_calendar_summary(member_id: int):

    db = SessionLocal()

    try:

        rows = db.execute(text("""
            SELECT

                MONTH(issue_date) AS month,

                SUM(principal_amount) AS issue_amount,

                SUM(total_collected) AS collection_amount

            FROM kanthu_master

            WHERE member_id = :member_id

            GROUP BY MONTH(issue_date)

            ORDER BY MONTH(issue_date)

        """), {
            "member_id": member_id
        }).mappings().all()

        result = []

        for row in rows:

            result.append({
                "month": row["month"],
                "issue_amount": float(row["issue_amount"] or 0),
                "collection_amount": float(row["collection_amount"] or 0)
            })

        return result

    finally:
        db.close()        
        
        
@app.get("/api/member-month-transactions/{member_id}/{month}")
def member_month_transactions(
    member_id: int,
    month: int
):

    db = SessionLocal()

    try:

        rows = db.execute(text("""
            SELECT

                kt.transaction_date,

                kt.transaction_type,

                km.kanthu_no,

                kt.amount

            FROM kanthu_transactions kt

            INNER JOIN kanthu_master km
                ON km.id = kt.kanthu_id

            WHERE

                km.member_id = :member_id

                AND

                MONTH(kt.transaction_date)=:month

            ORDER BY
                kt.transaction_date DESC

        """), {
            "member_id": member_id,
            "month": month
        }).mappings().all()

        result = []

        for row in rows:

            result.append({
                "date": str(row["transaction_date"]),
                "type": row["transaction_type"],
                "kanthu_no": row["kanthu_no"],
                "amount": float(row["amount"] or 0)
            })

        return result

    finally:
        db.close()
        
        
@app.get("/api/kanthu-member-profile/{member_id}")
def kanthu_member_profile(member_id: int):

    db = SessionLocal()

    try:

        row = db.execute(text("""

            SELECT

                id,
                member_code,
                member_name,
                mobile,
                village,
                address,
                photo,
                join_date

            FROM members

            WHERE id=:member_id

        """),
        {
            "member_id": member_id
        }).mappings().first()

        if not row:
            return {}

        return dict(row)

    finally:
        db.close()
        

@app.get("/api/member-kanthu-timeline/{member_id}")
def member_timeline(member_id:int):

    db = SessionLocal()

    try:

        row = db.execute(text("""

            SELECT

                MIN(issue_date) issue_date,

                MAX(closed_date) maturity_date

            FROM kanthu_master

            WHERE member_id=:member_id

        """),
        {
            "member_id": member_id
        }).mappings().first()

        return dict(row)

    finally:
        db.close()
        
# ==========================================
# KANTHU OUTSTANDING REPORT
# ==========================================

@app.get("/kanthu/outstanding")
async def kanthu_outstanding(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="kanthu_outstanding.html",
        context={
            "active_page": "kanthu_outstanding"
        }
    )
    
    
@app.get("/api/kanthu/outstanding-summary")
def kanthu_outstanding_summary():

    db = SessionLocal()

    try:

        row = db.execute(text("""

            SELECT

                IFNULL(
                    SUM(principal_amount),
                    0
                ) total_given,

                IFNULL(
                    SUM(total_collected),
                    0
                ) total_collected,

                IFNULL(
                    SUM(balance_amount),
                    0
                ) total_balance,

                COUNT(*) total_kanthus

            FROM kanthu_master

            WHERE status='ACTIVE'

        """)).mappings().first()

        critical_count = db.execute(text("""

            SELECT COUNT(*)

            FROM kanthu_master

            WHERE status='ACTIVE'

            AND balance_amount > 50000

        """)).scalar()

        return {

            "total_given":
                float(row["total_given"]),

            "total_collected":
                float(row["total_collected"]),

            "total_balance":
                float(row["total_balance"]),

            "total_kanthus":
                int(row["total_kanthus"]),

            "critical_count":
                int(critical_count)

        }

    finally:

        db.close()
        
        
@app.get("/api/kanthu/outstanding-list")
def outstanding_list(search: str = ""):

    db = SessionLocal()

    try:

        rows = db.execute(text("""

            SELECT

                km.id,

                km.kanthu_no,

                km.principal_amount,

                km.total_collected,

                km.balance_amount,

                km.issue_date,

                m.member_name,

                m.mobile,

                m.village

            FROM kanthu_master km

            INNER JOIN members m
                ON km.member_id = m.id

            WHERE

                km.status='ACTIVE'

                AND

                (
                    m.member_name LIKE :search
                    OR m.mobile LIKE :search
                    OR km.kanthu_no LIKE :search
                )

            ORDER BY
                km.balance_amount DESC

        """),
        {
            "search":
                f"%{search}%"
        }).mappings().all()

        result = []

        for row in rows:

            item = dict(row)

            item["principal_amount"] = float(
                item["principal_amount"] or 0
            )

            item["total_collected"] = float(
                item["total_collected"] or 0
            )

            item["balance_amount"] = float(
                item["balance_amount"] or 0
            )

            item["issue_date"] = str(
                item["issue_date"]
            )

            if item["balance_amount"] >= 50000:

                item["status"] = "Critical"

            elif item["balance_amount"] > 0:

                item["status"] = "Pending"

            else:

                item["status"] = "Normal"

            result.append(item)

        return result

    finally:

        db.close()
        
@app.get("/api/kanthu/member-ledger/{member_id}")
def member_ledger(member_id: int):

    db = SessionLocal()

    try:

        rows = db.execute(text("""

            SELECT

                kt.transaction_date,

                km.kanthu_no,

                kt.transaction_type,

                kt.amount,

                kt.remarks

            FROM kanthu_transactions kt

            INNER JOIN kanthu_master km
                ON km.id = kt.kanthu_id

            WHERE km.member_id = :member_id

            ORDER BY
                kt.transaction_date DESC,
                kt.id DESC

        """),
        {
            "member_id":
                member_id
        }).mappings().all()

        result = []

        for row in rows:

            item = dict(row)

            item["transaction_date"] = str(
                item["transaction_date"]
            )

            item["amount"] = float(
                item["amount"] or 0
            )

            result.append(item)

        return result

    finally:

        db.close()



@app.get("/kanthu/reports")
async def kanthu_reports(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="kanthu_reports.html",
        context={
            "active_page": "kanthu_reports"
        }
    )