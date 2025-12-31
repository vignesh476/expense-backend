from fastapi import FastAPI, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from sqlalchemy.orm import Session

from database import SessionLocal, engine
from models import Transaction, Base

Base.metadata.create_all(bind=engine)

app = FastAPI()

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
