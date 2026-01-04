from fastapi import FastAPI, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta
from bson import ObjectId
from jose import jwt, JWTError
from pymongo import MongoClient
from dotenv import load_dotenv, find_dotenv
from openpyxl import Workbook
from pydantic import BaseModel, EmailStr
import bcrypt
import resend
import tempfile
import os
import logging
# ================= INIT =================
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(find_dotenv())
app = FastAPI()
logging.basicConfig(level=logging.INFO)
# ================= CONFIG =================
import os
from typing import Dict
from fastapi import FastAPI
import resend

resend.api_key = os.getenv("RESEND_API_KEY")
MONGO_URI = os.getenv("MONGO_URI")
JWT_SECRET = os.getenv("JWT_SECRET") or "dev_change_me_jwt_secret"
JWT_REFRESH_SECRET = os.getenv("JWT_REFRESH_SECRET") or "dev_change_me_jwt_refresh_secret"
ACCESS_EXP = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 15))
REFRESH_EXP = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))
FRONTEND_URL = os.getenv("FRONTEND_URL") or "http://127.0.0.1:8000"
EMAIL_FROM = os.getenv("EMAIL_FROM",'Resend<onboarding@resend.dev>')

# resend.api_key = os.getenv("RESEND_API_KEY")

client = MongoClient(MONGO_URI)
db = client.expense_app
users_col = db.users
tx_col = db.transactions

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# ================= CORS =================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:3000",
        "https://marvelous-pastelito-f03022.netlify.app",
          "http://127.0.0.1:4173",
  "http://localhost:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= SCHEMAS =================
class RegisterSchema(BaseModel):
    email: EmailStr
    password: str

class LoginSchema(BaseModel):
    email: EmailStr
    password: str

# ================= PASSWORD =================
def hash_password(password: str) -> str:
    password = password[:72]
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password[:72].encode(), hashed.encode())

# ================= JWT =================
def create_token(data: dict, secret: str, exp: timedelta):
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + exp
    return jwt.encode(payload, secret, algorithm="HS256")

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user = users_col.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(401, "User not found")
        return user
    except JWTError:
        raise HTTPException(401, "Invalid token")

# ================= AUTH =================
@app.post("/register")
def register(data: RegisterSchema):
    if users_col.find_one({"email": data.email}):
        raise HTTPException(400, "Email already exists")
    if len(data.password) < 6:
        raise HTTPException(400, "Password too short")

    users_col.insert_one({
        "email": data.email,
        "password": hash_password(data.password),
        "created": datetime.utcnow()
    })
    return {"ok": True}

@app.post("/login")
def login(data: LoginSchema):
    user = users_col.find_one({"email": data.email})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(401, "Invalid credentials")

    access = create_token(
        {"sub": str(user["_id"])},
        JWT_SECRET,
        timedelta(minutes=ACCESS_EXP)
    )

    refresh = create_token(
        {"sub": str(user["_id"])},
        JWT_REFRESH_SECRET,
        timedelta(days=REFRESH_EXP)
    )

    return {
        "access_token": access,
        "refresh_token": refresh
    }

@app.post("/refresh")
def refresh_token(token: str = Body(...)):
    try:
       
        payload = jwt.decode(token, JWT_REFRESH_SECRET, algorithms=["HS256"])
        access = create_token(
            {"sub": payload["sub"]},
            JWT_SECRET,
            timedelta(minutes=ACCESS_EXP)
        )
        return {"access_token": access}
    except JWTError:
        raise HTTPException(401, "Invalid refresh token")

# ================= FORGOT PASSWORD =================
@app.post("/forgot-password")
def forgot(email: EmailStr = Body(...)):
     
    user = users_col.find_one({"email": email})
    if not user:
        return {"ok": True}

    token = create_token(
        {"sub": str(user["_id"])},
        JWT_SECRET,
        timedelta(minutes=15)
    )

    link = f"{FRONTEND_URL}/reset-password?token={token}"
    print(link)
 
    try:
        # resend.Emails.send({
        #     "from": EMAIL_FROM,
        #     "to": email,
        #     "subject": "Reset Password",
        #     "html": f"<a href='{link}'>Reset Password</a>"
        # })
        params: resend.Emails.SendParams = {
        "from":"Acme <onboarding@resend.dev>",
        "to": [email],
        "subject": "Expenses",
         "html": f"<a href='{link}'>Reset Password</a>",
            }
        email: resend.Emails.SendResponse = resend.Emails.send(params)
        return email
        
        print("✅ Email sent")
    except Exception as e:
        print("❌ Email error:", e)


    return {"ok": email}

@app.post("/reset-password")
def reset(token: str = Body(...), password: str = Body(...)):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        users_col.update_one(
            {"_id": ObjectId(payload["sub"])},
            {"$set": {"password": hash_password(password)}}
        )
        return {"ok": True}
    except JWTError:
        raise HTTPException(400, "Invalid token")
 
# ================= TRANSACTIONS =================
from datetime import datetime

from datetime import datetime

@app.post("/transaction")
def create_transaction(amount: float, type: str, description: str,user=Depends(get_current_user), created_at: str = None):
    # parse created_at if provided, else use now
    if created_at:
        try:
            created_at_dt = datetime.fromisoformat(created_at)
        except ValueError:
            return {"error": "Invalid date format. Use YYYY-MM-DDTHH:MM"}
    else:
        created_at_dt = datetime.utcnow()  # default to now

    tx = {
        "amount": amount,
        "type": type,
        "description": description,
        "user_id": user["_id"],
        "created_at": created_at_dt
    }

    result = tx_col.insert_one(tx)
    return {"status": "success", "transaction": {
        "id": str(result.inserted_id),
        "amount": tx["amount"],
        "type": tx["type"],
        "description": tx["description"],
        "user_id": str(tx["user_id"]),
        "created_at": tx["created_at"].isoformat()
    }}



from fastapi import Depends
from bson import ObjectId

from bson import ObjectId

@app.get("/transactions")
def get_transactions(user=Depends(get_current_user)):
    txs = list(
        tx_col.find({"user_id": user["_id"]}).sort("created_at", -1)
    )

    return [
        {
            "id": str(t["_id"]),
            "amount": t["amount"],
            "type": t["type"],
            "description": t.get("description", ""),
            "created_at": t["created_at"],
        }
        for t in txs
    ]



@app.put("/transaction/{tx_id}")
def update_transaction(
    tx_id: str,
    amount: float,
    type: str,
    description: str,
    user=Depends(get_current_user),
):
    result = tx_col.update_one(
        {"_id": ObjectId(tx_id), "user_id": user["_id"]},
        {"$set": {
            "amount": amount,
            "type": type,
            "description": description,
        }}
    )

    if result.matched_count == 0:
        raise HTTPException(404, "Transaction not found")

    return {"ok": True}


@app.delete("/transaction/{tx_id}")
def delete_transaction(tx_id: str, user=Depends(get_current_user)):
    result = tx_col.delete_one(
        {"_id": ObjectId(tx_id), "user_id": user["_id"]}
    )

    if result.deleted_count == 0:
        raise HTTPException(404, "Transaction not found")

    return {"ok": True}


# ================= SUMMARY =================
def build_summary(user_id, monthly=False):
    txs = list(tx_col.find({"user_id": user_id}))
    today = datetime.utcnow()
    today_date = today.date()

    def calc(ts, t):
        return sum(x["amount"] for x in ts if x["type"] == t)

    if monthly:
        # Get transactions from current month
        month_txs = [t for t in txs if t["created_at"].year == today.year and t["created_at"].month == today.month]
        return {
            "period": f"{today.strftime('%B %Y')}",
            "income": calc(month_txs, "income"),
            "expense": calc(month_txs, "expense"),
            "entries": month_txs
        }
    else:
        # Get today's transactions
        today_txs = [t for t in txs if t["created_at"].date() == today_date]
        return {
            "today": {
                "income": calc(today_txs, "income"),
                "expense": calc(today_txs, "expense")
            },
            "entries": today_txs
        }

# ================= EXCEL =================
def create_excel(summary, monthly=False):
    wb = Workbook()
    ws = wb.active
    
    if monthly:
        ws.append(["Monthly Report - " + summary.get("period", "")])
        ws.append([])
        ws.append(["Income", summary["income"]])
        ws.append(["Expense", summary["expense"]])
        ws.append(["Net", summary["income"] - summary["expense"]])
        ws.append([])
        ws.append(["Date", "Type", "Amount", "Description"])
        for entry in summary["entries"]:
            ws.append([
                entry["created_at"].strftime("%Y-%m-%d %H:%M"),
                entry["type"],
                entry["amount"],
                entry.get("description", "")
            ])
    else:
        ws.append(["Income", "Expense"])
        ws.append([summary["today"]["income"], summary["today"]["expense"]])
    
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx")
    wb.save(tmp.name)
    return tmp.name

@app.get("/download-excel")
def download(monthly: bool = False, user=Depends(get_current_user)):
    path = create_excel(build_summary(user["_id"], monthly=monthly), monthly=monthly)
    filename = "monthly-summary.xlsx" if monthly else "daily-summary.xlsx"
    return FileResponse(path, filename=filename)

@app.post("/send-summary")
def send_summary(monthly: bool = False, user=Depends(get_current_user)):
    path = create_excel(build_summary(user["_id"], monthly=monthly), monthly=monthly)
    import base64

    with open(path, "rb") as f:
        encoded = base64.b64encode(f.read()).decode()

    report_type = "Monthly" if monthly else "Daily"
    params: resend.Emails.SendParams = {
        "from": "Expense App <onboarding@resend.dev>",
        "to": user["email"],
        "subject": f"Your {report_type} Expense Summary",
        "html": f"<p>Please find attached your {report_type.lower()} expense summary.</p>",
        "attachments": [
            {
                "filename": f"expense-summary-{report_type.lower()}.xlsx",
                "content": encoded,
            }
        ],
    }
    email: resend.Emails.SendResponse = resend.Emails.send(params)

    os.remove(path)
    return {"ok": True}



@app.post("/send-emails")
def send_mail() -> Dict:
    params: resend.Emails.SendParams = {
        "from":"Acme <onboarding@resend.dev>",
        "to": ['buggaramvignesh@gmail.com'],
        "subject": "Expenses",
        "html": "<strong>it works!</strong>",
    }
    email: resend.Emails.SendResponse = resend.Emails.send(params)
    return email

# ================= RUN =================
if __name__ == "__main__":
    logging.info(JWT_REFRESH_SECRET,EMAIL_FROM)
    print(EMAIL_FROM)
    import uvicorn
    uvicorn.run("main:app", port=8000)
