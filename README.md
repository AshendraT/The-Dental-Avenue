# 🦷 The Dental Avenue - Appointment Management System

Full-stack Dental Clinic Application built with React (Vite) and Express (Node.js/MongoDB).

Deployed on Vercel with multi-service configuration.

---

## 🛠️ Technology Stack

- **Frontend**: React.js, Vite, Tailwind CSS, Lucide icons, Framer Motion
- **Backend**: Node.js, Express.js, JWT, bcryptjs, Nodemailer
- **Database**: MongoDB with Mongoose (Schemas: User, Doctor, Appointment, SlotHold, ContactMessage, Notification, AdminLog)
- **Security**: Helmet, CORS, Express-Rate-Limit, Mongo-Sanitize
- **Containerization**: Docker & Docker Compose
- **Documentation**: Swagger OpenAPI 3.0

---

## 📂 Project Structure

```
/dental-avenue
├── backend/
│   ├── src/
│   │   ├── config/          # Database & seeding scripts
│   │   ├── controllers/     # Route controller logic
│   │   ├── middleware/      # JWT guards & role authorization
│   │   ├── models/          # Mongoose database models
│   │   ├── routes/          # API route maps
│   │   ├── utils/           # Nodemailer email helpers
│   │   ├── app.js           # Express app middlewares & swagger ui
│   │   └── server.js        # Server listening port
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Common UI elements (Buttons, Cards, Modals)
│   │   ├── context/         # Auth, Theme, and Toast State providers
│   │   ├── pages/           # Landing, Booking, and Dashboards
│   │   ├── services/        # Fetch API wrapper
│   │   ├── App.jsx          # Route paths mapping
│   │   ├── index.css        # Tailwind baseline styling
│   │   └── main.jsx         # DOM mounting
│   ├── .env.example
│   ├── tailwind.config.js
│   ├── vite.config.js
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## 🚀 Setup & Execution Guide

### Method A: Running Locally (Node.js & MongoDB)

#### Prerequisites
- Node.js (v18+)
- MongoDB running locally on `mongodb://127.0.0.1:27017`

#### 1. Setup Backend
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Run database seed script (Seeds 4 Doctor profiles and 1 Administrator account)
npm run seed

# Start server in development mode
npm run dev
```
*Note: Backend server runs at [http://localhost:5000](http://localhost:5000).*

#### 2. Setup Frontend
```bash
# Navigate to frontend (in a separate terminal)
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
*Note: Dev client runs at [http://localhost:5173](http://localhost:5173).*

---

### Method B: Running via Docker Compose

Run the entire application (including database, backend, and frontend) with a single command:

```bash
# Compile and start containers
docker-compose up --build
```
This commands launches:
- **MongoDB** on `mongodb://localhost:27017`
- **Backend API Server** on [http://localhost:5000](http://localhost:5000)
- **Frontend Vite Server** on [http://localhost:5173](http://localhost:5173)

To seed the docker MongoDB instance with the default doctor profiles and admin login, run the seed command inside the backend container:
```bash
docker exec -it dental_avenue_backend npm run seed
```

---

## 📬 Simulated Email System

If SMTP parameters are left blank in `.env`, the system automatically falls back to **simulating email delivery**.
- Sent emails are logged directly into the backend terminal.
- The raw HTML output is saved inside `backend/temp_sent_emails.log` for out-of-the-box local testing.
- Fill out `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASS` in `backend/.env` to connect real services (e.g., Mailtrap, SendGrid, Gmail App Passwords).

---

## 📑 API & Swagger Documentation

Interactive Swagger API docs are available. Start the backend server and visit:
👉 **[http://localhost:5000/api-docs](http://localhost:5000/api-docs)**

---

## 🛡️ Key Features & Verification

1. **Smart Slot holds (Yellow state)**:
   - Go to Booking screen. Select a Doctor, date, and a Green (Available) slot.
   - Once clicked, the slot turns Yellow (Booking in Progress) for all other users.
   - A 5-minute countdown locks the slot. If not completed, it automatically expires and becomes Green again.
2. **Double Booking Prevention**:
   - The database has a compound partial unique index on active appointments.
   - If two requests attempt to book the same slot at the exact same millisecond, the first commits, and the second is immediately rejected with a race-condition warning.
3. **Admin Dashboard**:
   - Log in with `thedentalavenue.lk@gmail.com` to review analytics charts, approve bookings, toggle user block status, edit doctor availability slots, and download scheduling records.
