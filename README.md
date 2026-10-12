# 📚 Study Planner

A full-featured web-based study planner with focus mode, analytics, weekly planning, alerts, and document uploads.

## 🎨 Design
- **Colors**: Cream background + dark/light green — calm, readable study palette
- **Font**: Inter (clean and modern)
- No external API keys required

---

## 🚀 Quick Start

### Option 1: Double-click `start.bat`
Opens both servers and your browser automatically.

### Option 2: Manual

**Backend** (Terminal 1):
```bash
cd backend
node server.js
```

**Frontend** (Terminal 2):
```bash
cd frontend
npm run dev
```

Open → **http://localhost:5173**

---

## 🔑 Accounts

| Account | Email | Password |
|---|---|---|
| **Demo** (has dummy data) | demo@studyplanner.com | demo1234 |
| **Your account** | Register with any email | Your choice |

> New accounts start completely fresh — no dummy data.

---

## ✨ Features

| Feature | Details |
|---|---|
| **Dashboard** | Greeting, 4 KPI cards, weekly goal bar, bar chart, deadlines, subject progress |
| **Tasks** | Add/edit/delete, filter by priority/status/sort, expandable cards |
| **Document Upload** | Upload PDF, DOC, PPT, images per task (20MB max, stored locally) |
| **Analytics** | Bar chart, line chart, pie chart, subject completion rates |
| **Weekly Plan** | 7-day grid showing tasks by scheduled/deadline date |
| **Alerts** | Overdue, due today, due in 3 days, high priority, weekly goal warnings |
| **Focus Mode** | SVG circle timer (15/25/45/60 min), task selector, session log, beep notification |
| **Settings** | Profile, weekly goal presets, alert toggles |

---

## 🗂️ Project Structure

```
Study planner/
├── start.bat              ← One-click launcher
├── backend/
│   ├── server.js          ← Express entry
│   ├── db.js              ← JSON file store (no DB install needed)
│   ├── data/              ← Auto-created JSON data files
│   ├── uploads/           ← Uploaded documents (per user)
│   ├── routes/
│   │   ├── auth.js
│   │   ├── tasks.js
│   │   └── analytics.js
│   └── middleware/auth.js
└── frontend/
    └── src/
        ├── pages/         ← Login, Register, Dashboard, Tasks,
        │                     Analytics, Weekly, Alerts, Focus, Settings
        ├── components/    ← Sidebar, Layout
        ├── context/       ← AuthContext
        └── api.js         ← Axios client
```

---

## 🛠️ Tech Stack

- **Frontend**: React 19 + Vite, React Router, Recharts, Lucide Icons, react-hot-toast
- **Backend**: Node.js + Express
- **Database**: JSON files (zero setup, no install required)
- **Auth**: JWT (7-day tokens)
- **File Upload**: Multer → local disk storage

---

## 📦 Deployment (Render)

1. Push to GitHub
2. **Backend**: New Web Service → root `backend/`, start command `node server.js`
3. **Frontend**: New Static Site → root `frontend/`, build `npm run build`, publish `dist/`
4. Add env var on backend: `JWT_SECRET=your_long_secret`, `FRONTEND_URL=https://your-frontend.onrender.com`
5. Update `VITE_API_URL` in frontend env to your backend URL
