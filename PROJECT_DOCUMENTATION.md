# 📚 Expense Tracker - College Project Documentation

## Project Title
**Personal Expense Tracker with Trip Split Calculator**

## Submitted By
[Your Name]  
[Roll Number]  
[College Name]  
[Course & Semester]

## Tech Stack
```
Backend: Python + Django REST Framework + MongoDB
Frontend: React.js + Tailwind CSS
Database: MongoDB (NoSQL)
Authentication: JWT Tokens
Deployment: Local Server (Heroku optional)
```

## 🎯 Project Objective
Create a **full-stack web application** for:
1. Track daily **income/expenses**
2. Generate **daily/monthly summaries** 
3. **Split trip expenses** among friends
4. **Excel reports** & **email notifications**

## 📋 Features

### 1. User Authentication
- Register/Login with email/password
- **Guest mode** (no signup needed)
- Forgot password + reset via email
- JWT token authentication

### 2. Transaction Management
```
✅ Add Income/Expense
✅ View transaction history  
✅ Daily/Monthly summaries
✅ Excel download (Daily/Monthly)
```

### 3. Trip Expense Split
```
✅ Create trip with name/dates
✅ Add participants
✅ Add expenses (who paid what)
✅ Auto settlement calculator
✅ "A pays ₹X to B" suggestions
✅ Trip Excel export
```

### 4. Reports & Emails
- Summary emails (daily/monthly)
- Forgot password emails
- Excel attachments

## 🏗️ System Architecture

```
Frontend (React) → API Calls → Backend (Django) → MongoDB
                           ↓
                     Excel/PDF Reports
                           ↓  
                       Email Service
```

**Database Tables**:
```
1. users: email, password, is_guest, nickname
2. transactions: user_id, amount, type, description, date
3. trips: user_id, trip_name, participants[], expenses[]
```

## 🚀 Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB (local or MongoDB Atlas)

### Backend Setup (Django)
```bash
# 1. Install Python dependencies
pip install -r backend/requirements.txt

# 2. Navigate to backend
cd backend

# 3. Create database tables
python manage.py makemigrations
python manage.py migrate

# 4. Create admin user
python manage.py createsuperuser

# 5. Start server
python manage.py runserver
```
**Backend URL**: http://localhost:8000

### Frontend Setup (React)
```bash
# 1. Create React app (if not exists)
npx create-react-app frontend
cd frontend

# 2. Install packages
npm install axios react-router-dom lucide-react

# 3. Start frontend
npm start
```
**Frontend URL**: http://localhost:3000

## 🔧 API Documentation

### Authentication
```
POST /api/auth/register/
POST /api/auth/login/
POST /api/auth/guest-login/
POST /api/auth/forgot-password/
POST /api/auth/reset-password/
```

### Transactions
```
POST /api/transactions/     # Create
GET  /api/transactions/     # List
GET  /api/transactions/summary/?monthly=true
GET  /api/transactions/download-excel/
```

### Trips
```
POST /api/trips/                    # Create trip
POST /api/trips/{id}/participant/   # Add person
POST /api/trips/{id}/expense/       # Add expense  
GET  /api/trips/{id}/settlement/    # Calculate split
GET  /api/trips/{id}/export/        # Excel export
```

## 📱 Frontend Screens
1. **Login/Register** page
2. **Dashboard** (summary cards)
3. **Transactions** list + add form
4. **Trips** list + split calculator
5. **Reports** page (Excel download)

## 💾 Database Design (ER Diagram Text)
```
User (1) ---< Transactions (*)
User (1) ---< Trips (*)
Trip ---< Participants (embedded)
Trip ---< Expenses (embedded) 
```

## 🔄 How Trip Settlement Works
```
Algorithm:
1. Total Expense ÷ Participants = Per Person Share
2. Balance = Paid Amount - Share  
3. Largest Debtor pays Largest Creditor (greedy)
4. Generate payment lines: "Ram pays ₹500 to Shyam"
```

**Example**:
```
Trip Total: ₹3000, 3 people
Ram paid ₹1500, Shyam ₹1000, Geeta ₹500
Per person: ₹1000
Settlement:
- Ram receives ₹500 
- Shyam receives ₹0  
- Geeta pays ₹500 to Ram
```

## 📧 Email Integration
**Service**: Brevo (Sendinblue)
```
- Forgot password reset links
- Daily/Weekly summary with Excel
- HTML templates with buttons
```

## 📊 Screenshots (Add your screenshots here)
```
[Login Screen]     [Dashboard]     [Trip Split]
[Add Expense]     [Summary]       [Excel Export]
```

## 📈 Future Enhancements
- [ ] Mobile App (React Native)
- [ ] Charts (Chart.js)
- [ ] Categories/Tags for expenses
- [ ] Recurring transactions
- [ ] Multi-currency support

## 📚 Learning Outcomes
1. **Full-stack development** (Python + JS)
2. **REST API** design with Django DRF
3. **MongoDB** NoSQL modeling
4. **JWT Authentication** implementation
5. **File generation** (Excel reports)
6. **Email services** integration
7. **Responsive UI** with React

## 🎓 Technologies Learned
```
Python: Django, DRF, djongo
JavaScript: React, Axios, Tailwind
Database: MongoDB
Tools: VS Code, Git, Postman
```

---

**Project demonstrates complete full-stack development with modern authentication, NoSQL database, reporting and group expense splitting - perfect for college submission!** 🎓✨

