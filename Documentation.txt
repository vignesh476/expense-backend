
# Expense Tracker – College Project Documentation

## Project Title  
**Personal Expense Tracker with Trip Split Calculator**


## Project Objective  
The objective of this project is to build a **full-stack web application** that helps users manage their personal finances. The system allows users to track daily income and expenses, generate summaries for specific time periods, and split trip expenses among friends. Additionally, the application supports Excel report generation and email notifications, making it a complete solution for personal expense management.

---

## Tech Stack  
The project is developed using the following technologies:  
- **Backend:** Python with Django REST Framework  
- **Frontend:** React.js with Tailwind CSS  
- **Database:** MongoDB (NoSQL)  
- **Authentication:** JWT Tokens  
- **Deployment:** Local server (Heroku optional)

---

## Features  

### 1. User Authentication  
The system provides secure login and registration using email and password. It also supports guest mode, password reset via email, and JWT-based authentication.

### 2. Transaction Management  
Users can add income or expense records, view transaction history, and generate daily or monthly summaries. Reports can be downloaded in Excel format.

### 3. Trip Expense Split  
The application allows users to create trips, add participants, and record expenses. A settlement calculator automatically suggests who should pay whom, and trip reports can be exported to Excel.

### 4. Reports and Emails  
The system sends summary emails (daily or monthly) and password reset emails. Excel reports can be attached to these emails.

---

## System Architecture  
The architecture follows a client-server model:  
- The **frontend** (React) communicates with the **backend** (Django REST Framework) via API calls.  
- The backend interacts with **MongoDB** for data storage.  
- Reports are generated in Excel/PDF format and can be sent via email services.  

**Database Schema (MongoDB via djongo):**
```
users collection:
- _id, email, password, is_guest, nickname, created

transactions collection:
- _id, user_id, amount, type("income"|"expense"), description, created_at

trips collection:
- _id, user_id, trip_name, participants[], expenses[], created
  ↓ embedded
  participants: [{name: "Ram"}]
  expenses: [{paid_by: "Ram", amount: 500, description: "Food"}]
```


---

## Installation and Setup  

### Prerequisites  
- Python 3.10+  
- Node.js 18+  
- MongoDB (local or Atlas)

### Backend Setup (Django API)  
1. Install dependencies: `pip install -r backend/requirements.txt`  
2. Navigate: `cd backend`  
3. Create database: `python manage.py makemigrations && python manage.py migrate`  
4. Create admin: `python manage.py createsuperuser`  
5. Start server: `python manage.py runserver`  
   - **API URL**: http://localhost:8000
   - **Admin**: http://localhost:8000/admin/


### Frontend (React - Optional/Next Phase)
**Backend-first project** - React frontend can be built using above APIs:
```bash
npx create-react-app frontend
cd frontend
npm install axios react-router-dom
npm start
```
**Connect**: Set `REACT_APP_API_URL=http://localhost:8000/api`


---

## 🔌 API Endpoints (Test with Postman)

### Authentication (`/api/auth/`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register/` | Create account |
| POST | `/login/` | Get JWT token |
| POST | `/guest-login/` | Guest access |
| POST | `/forgot-password/` | Send reset email |
| POST | `/reset-password/` | Reset via token |

### Transactions (`/api/transactions/`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Add transaction | JWT |
| GET | `/` | List transactions | JWT |
| PUT/DELETE | `/{id}/` | Update/Delete | JWT |
| GET | `/summary/?monthly=true` | Daily/Monthly summary | JWT |
| GET | `/download-excel/` | Excel export | JWT |

### Trips (`/api/trips/`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create trip | JWT |
| GET | `/{id}/` | View trip | JWT |
| POST | `/{id}/participant/` | Add person | JWT |
| POST | `/{id}/expense/` | Add expense | JWT |
| GET | `/{id}/settlement/` | Split calculation | JWT |
| GET | `/{id}/export/` | Trip Excel | JWT |


---

## Frontend Screens  
The application includes the following user interfaces:  
1. Login/Register page  
2. Dashboard with summary cards  
3. Transactions list and add form  
4. Trips list with split calculator  
5. Reports page with Excel download  

---

## Trip Settlement Algorithm  
The settlement works by dividing the total trip expense equally among participants. Each person’s balance is calculated as the amount they paid minus their share. A greedy algorithm then generates payment suggestions, such as “Ram pays ₹500 to Shyam.”  

**Example:**  
- Trip Total: ₹3000, 3 participants  
- Ram paid ₹1500, Shyam ₹1000, Geeta ₹500  
- Each person’s share: ₹1000  
- Settlement: Geeta pays ₹500 to Ram  

---

## Email Integration  
The project uses **Brevo (Sendinblue)** for email services. Emails include password reset links, daily/weekly summaries, and Excel attachments. HTML templates are used for better formatting.

---

## Future Enhancements  
- Mobile app using React Native  
- Charts and visualizations with Chart.js  
- Categories and tags for expenses  
- Recurring transactions  
- Multi-currency support  

---

## Learning Outcomes  
Through this project, the following skills were gained:  
- Full-stack development with Python and JavaScript  
- REST API design using Django REST Framework  
- NoSQL database modeling with MongoDB  
- JWT authentication implementation  
- File generation and email integration  
- Responsive UI development with React  

---

## Technologies Learned  
- **Python:** Django, DRF, Djongo  
- **JavaScript:** React, Axios, Tailwind CSS  
- **Database:** MongoDB  
- **Tools:** VS Code, Git, Postman  

---

## Conclusion  
This project demonstrates a complete full-stack application with modern authentication, NoSQL database integration, reporting features, and group expense splitting. It is a practical and production-ready solution, making it an ideal submission for a college-level project.

