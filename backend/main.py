from fastapi import FastAPI, Header, Depends, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from datetime import datetime
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Transaction, Base
from email.message import EmailMessage
from openpyxl import Workbook
from dotenv import load_dotenv
import smtplib
import tempfile
import os
import logging

# ================= INIT =================
load_dotenv()
logging.basicConfig(level=logging.INFO)

Base.metadata.create_all(bind=engine)
app = FastAPI()

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
EMAIL_FROM = os.getenv("EMAIL_FROM")

# ================= CORS =================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://marvelous-pastelito-f03022.netlify.app",
        "https://marvelous-pastelito-f03022.netlify.app/"
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
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
    description: str = "",
    device_id: str = Depends(get_device_id),
    db: Session = Depends(get_db),
):
    tx = Transaction(
        device_id=device_id,
        amount=amount,
        type=type,
        description=description,
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx

# ================= SUMMARY LOGIC =================
def build_summary(device_id: str, db: Session):
    now = datetime.utcnow()
    transactions = db.query(Transaction).filter(
        Transaction.device_id == device_id
    ).all()

    today_income = today_expense = 0
    month_income = month_expense = 0
    today_entries = []

    for t in transactions:
        if t.created_at.date() == now.date():
            today_entries.append({
                "amount": t.amount,
                "type": t.type,
                "description": t.description
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
        "today": {"income": today_income, "expense": today_expense},
        "month": {"income": month_income, "expense": month_expense},
        "savings": month_income - month_expense,
        "today_entries": today_entries,
    }

# ================= EXCEL CREATION =================
def create_excel(summary):
    wb = Workbook()
    ws = wb.active
    ws.title = "Expense Summary"

    ws.append(["Category", "Income", "Expense"])
    ws.append(["Today", summary["today"]["income"], summary["today"]["expense"]])
    ws.append(["This Month", summary["month"]["income"], summary["month"]["expense"]])
    ws.append(["Savings", summary["savings"], ""])

    ws.append([])
    ws.append(["Type", "Amount", "Description"])
    for e in summary["today_entries"]:
        ws.append([e["type"], e["amount"], e["description"]])

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx")
    wb.save(tmp.name)
    return tmp.name

# ================= EMAIL =================
def send_email(to_email: str, excel_path: str):
    msg = EmailMessage()
    msg["From"] = EMAIL_FROM
    msg["To"] = to_email
    msg["Subject"] = "Your Expense Summary 📊"
    msg.set_content("Attached is your expense summary.")

    with open(excel_path, "rb") as f:
        msg.add_attachment(
            f.read(),
            maintype="application",
            subtype="vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            filename="expense_summary.xlsx",
        )

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.send_message(msg)

# ================= API ENDPOINTS =================
@app.get("/summary")
def get_summary(
    device_id: str = Depends(get_device_id),
    db: Session = Depends(get_db),
):
    return build_summary(device_id, db)

@app.post("/send-summary")
def send_summary(
    email: str = Body(..., embed=True),
    device_id: str = Depends(get_device_id),
    db: Session = Depends(get_db),
):
    summary = build_summary(device_id, db)
    excel_path = create_excel(summary)

    send_email(email, excel_path)
    os.remove(excel_path)

    return {"ok": True, "message": "Email sent successfully"}

@app.get("/download-excel")
def download_excel(
    device_id: str = Depends(get_device_id),
    db: Session = Depends(get_db),
):
    summary = build_summary(device_id, db)
    excel_path = create_excel(summary)

    return FileResponse(
        excel_path,
        filename="expense_summary.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )

# ================= DELETE =================
@app.delete("/transaction/{tx_id}")
def delete_transaction(
    tx_id: int,
    device_id: str = Depends(get_device_id),
    db: Session = Depends(get_db),
):
    tx = db.query(Transaction).filter(
        Transaction.id == tx_id,
        Transaction.device_id == device_id,
    ).first()
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
    description: str = "",
    device_id: str = Depends(get_device_id),
    db: Session = Depends(get_db),
):
    tx = db.query(Transaction).filter(
        Transaction.id == tx_id,
        Transaction.device_id == device_id,
    ).first()
    if tx:
        tx.amount = amount
        tx.type = type
        tx.description = description
        db.commit()
    return {"ok": True}

# ================= RUN =================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", port=8000)