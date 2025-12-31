from fastapi import FastAPI, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Transaction, Base
import os
Base.metadata.create_all(bind=engine)
from email.message import EmailMessage
import smtplib
from openpyxl import Workbook
from fastapi import Body
import tempfile
import os
# from . import (SMTP_HOST,SMTP_PASSWORD,SMTP_PORT,SMTP_USERNAME,EMAIL_FROM)
app = FastAPI()
import logging
# Email settings
from dotenv import load_dotenv
load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
EMAIL_FROM = os.getenv("EMAIL_FROM")


logging.basicConfig(level=logging.INFO)

# ================= CORS =================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= DB =================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ================= DEVICE ID =================
def get_device_id(x_device_id: str = Header(...)):
    return x_device_id



# ================= ADD TRANSACTION =================
@app.post("/transaction")
def add_transaction(
    amount: float,
    type: str,
    device_id: str = Depends(get_device_id),
    db: Session = Depends(get_db),
):
    tx = Transaction(
        device_id=device_id,
        amount=amount,
        type=type,
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx

# ================= SUMMARY =================

def create_excel_summary(summary):
    wb = Workbook()
    ws = wb.active
    ws.title = "Expense Summary"

    ws.append(["Category", "Income", "Expense"])

    ws.append(["Today", summary["today"]["income"], summary["today"]["expense"]])
    ws.append(["This Month", summary["month"]["income"], summary["month"]["expense"]])
    ws.append(["Savings", summary["savings"], ""])

    ws.append([])
    ws.append(["Today's Entries"])
    ws.append(["Type", "Amount"])

    for e in summary["today_entries"]:
        ws.append([e["type"], e["amount"]])

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx")
    wb.save(tmp.name)
    return tmp.name


def send_expense_summary_email(to_email: str, excel_path: str):
    msg = EmailMessage()
    msg["From"] = os.getenv("EMAIL_FROM")
    msg["To"] = to_email
    msg["Subject"] = "Your Expense Summary 📊"
    msg.set_content("Please find attached your expense summary.")
    try:
        with open(excel_path, "rb") as f:
            msg.add_attachment(
                f.read(),
                maintype="application",
                subtype="vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                filename="expense_summary.xlsx",
            )
    except:

        with smtplib.SMTP(SMTP_HOST, int(SMTP_PORT)) as server:
            server.starttls()
            server.login(SMTP_USERNAME,SMTP_PASSWORD)
            server.send_message(msg)
    finally:
         with smtplib.SMTP(SMTP_HOST, int(SMTP_PORT)) as server:
            server.starttls()
            server.login(SMTP_USERNAME,SMTP_PASSWORD)
            server.send_message(msg)


@app.get("/summary")
def get_summary(
    device_id: str = Depends(get_device_id),
    db: Session = Depends(get_db),
):
    now = datetime.utcnow()

    transactions = (
        db.query(Transaction)
        .filter(Transaction.device_id == device_id)
        .all()
    )

    today_income = today_expense = 0
    month_income = month_expense = 0
    today_entries = []

    for t in transactions:
        if t.created_at.date() == now.date():
            today_entries.append({
                "id": t.id,
                "amount": t.amount,
                "type": t.type,
            })

            if t.type == "income":
                today_income += t.amount
            else:
                today_expense += t.amount

        if t.created_at.month == now.month and t.created_at.year == now.year:
            if t.type == "income":
                month_income += t.amount
            else:
                month_expense += t.amount

    return {
        "today": {
            "income": today_income,
            "expense": today_expense,
        },
        "month": {
            "income": month_income,
            "expense": month_expense,
        },
        "savings": month_income - month_expense,
        "today_entries": today_entries,
    }

@app.post("/send-summary")
def send_summary(
    email: str = Body(..., embed=True),
    device_id: str = Depends(get_device_id),
    db: Session = Depends(get_db),
):
    now = datetime.utcnow()

    transactions = (
        db.query(Transaction)
        .filter(Transaction.device_id == device_id)
        .all()
    )

    today_income = today_expense = 0
    month_income = month_expense = 0
    today_entries = []

    for t in transactions:
        if t.created_at.date() == now.date():
            today_entries.append({
                "amount": t.amount,
                "type": t.type,
            })
            if t.type == "income":
                today_income += t.amount
            else:
                today_expense += t.amount

        if t.created_at.month == now.month and t.created_at.year == now.year:
            if t.type == "income":
                month_income += t.amount
            else:
                month_expense += t.amount

    summary = {
        "today": {"income": today_income, "expense": today_expense},
        "month": {"income": month_income, "expense": month_expense},
        "savings": month_income - month_expense,
        "today_entries": today_entries,
    }

    excel_path = create_excel_summary(summary)
    send_expense_summary_email(email, excel_path)

    os.remove(excel_path)

    return {"ok": True, "message": "Summary emailed successfully"}

# ================= DELETE =================
@app.delete("/transaction/{tx_id}")
def delete_transaction(
    tx_id: int,
    device_id: str = Depends(get_device_id),
    db: Session = Depends(get_db),
):
    tx = (
        db.query(Transaction)
        .filter(Transaction.id == tx_id, Transaction.device_id == device_id)
        .first()
    )
    if tx:
        db.delete(tx)
        db.commit()
    return {"ok": True}

# ================= UPDATE =================
@app.put("/transaction/{tx_id}")
def update_transaction(
    tx_id: int,
    amount: float,
    type: str,
    device_id: str = Depends(get_device_id),
    db: Session = Depends(get_db),
):
    tx = (
        db.query(Transaction)
        .filter(Transaction.id == tx_id, Transaction.device_id == device_id)
        .first()
    )
    if tx:
        tx.amount = amount
        tx.type = type
        db.commit()
    return {"ok": True}

# ================= RUN =================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
