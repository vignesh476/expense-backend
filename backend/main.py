from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime 
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Transaction, Base

Base.metadata.create_all(bind = engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",      # Vite local
        "http://127.0.0.1:5173",
        "https://695514499fd26366c8c9899f--marvelous-pastelito-f03022.netlify.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/transaction")
def add_transaction(amount:float, type:str):
    """created_at is in datetime.now format"""
    db: Session = next(get_db())
    tx = Transaction(amount= amount, type = type)
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx

@app.get("/summary")
def get_summary():
    db: Session = next(get_db())
    now = datetime.now()

    transactions = db.query(Transaction).all()

    today_income = today_expense = 0
    month_income = month_expense = 0
    today_entries = []

    for t in transactions:
        if t.created_at.date() == now.date():
            today_entries.append({
                "id": t.id,
                "amount": t.amount,
                "type": t.type
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

    savings = month_income - month_expense

    return {
        "today": {"income": today_income, "expense": today_expense},
        "month": {"income": month_income, "expense": month_expense},
        "savings": savings,
        "today_entries": today_entries
    }

@app.delete("/transaction/{tx_id}")
def delete_transaction(tx_id: int):
    db: Session = next(get_db())
    tx = db.query(Transaction).filter(Transaction.id == tx_id).first()
    if tx:
        db.delete(tx)
        db.commit()
    return {"ok": True}

@app.put("/transaction/{tx_id}")
def update_transaction(tx_id: int, amount: float, type: str):
    db: Session = next(get_db())
    tx = db.query(Transaction).filter(Transaction.id == tx_id).first()
    if tx:
        tx.amount = amount
        tx.type = type
        db.commit()
    return {"ok": True}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
