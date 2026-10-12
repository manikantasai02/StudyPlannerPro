# 🌿 StudyPlanner Pro

A modern, distraction-free study management and productivity web application designed to help students plan subjects, track deadlines, analyze learning habits, and maintain deep focus.

🔗 **Live Website**: [https://studyplannerpro-web.onrender.com](https://studyplannerpro-web.onrender.com)

---

## 📖 About The Project

**StudyPlanner Pro** originated from a simple C-based CLI task tracking program and was redesigned into a full-fledged, aesthetic web application. It combines task management with study science principles like the **Pomodoro technique**, visual progress analytics, deadline alert mechanisms, and course material management.

### Design Philosophy
- **Aesthetic & Calming Palette**: Uses soothing cream backgrounds paired with earthy sage and deep green tones instead of harsh dark or glaring blue themes.
- **Privacy & Simplicity**: Zero external tracking or required 3rd-party API keys.
- **Fresh Account Guarantee**: Every newly registered user gets a completely clean workspace without dummy or pre-filled clutter. A dedicated demo account is provided for quick evaluation.

---

## ✨ Core Features

### 1. 📊 Interactive Dashboard & Overview
- **Greeting & Motivation**: Context-aware greetings with active study streak counter.
- **KPI Metrics**: Real-time counters for total tasks, completed tasks, overall completion rate, and high-priority pending items.
- **Weekly Goal Tracker**: Configurable weekly study target (in minutes) with an animated visual progress bar.
- **Activity Bar Chart**: 7-day study time distribution.
- **Upcoming Deadlines**: Highlights urgent tasks due within the next 7 days.
- **Subject Progress**: Subject-wise completion breakdown.

### 2. 📝 Comprehensive Task Management
- **Task Attributes**: Subject, topic, estimated duration (minutes), priority (High, Medium, Low), scheduled study date, deadlines, tags, and detailed notes.
- **Filtering & Search**: Instant search by subject or topic, filter by priority and status, and sort by deadline or priority.
- **Expandable Cards**: View task details, notes, and study history.
- **Document Attachments**: Upload and download study resources (PDF, DOCX, PPT, TXT, images) attached directly to specific tasks or subjects.

### 3. ⏱️ Focus Mode (Pomodoro Study Timer)
- **Preset Durations**: 15 min (Quick Sprint), 25 min (Pomodoro), 45 min (Deep Work), 60 min (Power Hour).
- **Task Association**: Link your active timer session to a specific task.
- **Circular Progress Timer**: Animated SVG timer showing elapsed and remaining minutes.
- **Session Auto-Logging**: Finished sessions automatically record actual study duration into your analytics.
- **Audio Feedback**: Subtle Web Audio completion chime when a session finishes.

### 4. 📈 In-Depth Analytics
- **Activity Trends**: Daily study minutes and focus session frequency across the week.
- **Subject Distribution**: Interactive pie chart displaying how your workload is split across subjects.
- **Completion Rates**: Detailed progress indicators per subject.
- **Streak Calculation**: Continuous daily streak counter celebrating consistent study days.

### 5. 📅 Weekly Planning Grid
- **7-Day Layout**: Visual day-by-day column view organizing tasks based on scheduled dates and deadlines.
- **Daily Mini Bars**: Visual indicator of daily study volume.
- **Unscheduled Tasks Tray**: Quick access to tasks that still need a planned date.

### 6. 🔔 Smart Alerts & Deadlines
- **Critical Alerts**: Flags overdue tasks immediately in high-contrast red cards.
- **Due Today & 3-Day Warnings**: Proactive reminders to prevent last-minute cramming.
- **High-Priority Tracker**: Keeps urgent academic requirements front and center.
- **Weekly Goal Warnings**: Alerts you mid-week if you're behind on your weekly study target.

### 7. ⚙️ User Profile & Customization
- **Custom Study Goals**: Set your target weekly study minutes (presets: 5h, 10h, 15h, 20h/week).
- **Alert Toggles**: Configure email, deadline, and weekly digest alert preferences.

---

## 🔑 Demo Account

If you want to explore the application pre-populated with sample tasks, analytics, and subjects:

| Field | Value |
|---|---|
| **URL** | [https://studyplannerpro-web.onrender.com/login](https://studyplannerpro-web.onrender.com/login) |
| **Email** | `demo@studyplanner.com` |
| **Password** | `demo1234` |
| **One-Click** | Click the **"Try Demo Account"** button on the sign-in screen |

> *Note: When you register a new account, it starts completely fresh and empty.*

---

## 🛠️ Technology Stack

- **Frontend**:
  - React 19 + Vite
  - React Router DOM (v7)
  - Recharts (Data visualization & charts)
  - Lucide React (Icons)
  - React Hot Toast (Notifications)
  - Date-fns (Date manipulations)
- **Backend**:
  - Node.js & Express
  - JSON-based persistent file storage (portable and self-contained)
  - Multer (Local document upload handler)
  - JWT (JSON Web Tokens) & BcryptJS (Secure password hashing)
  - CORS configured for production hosting
- **Deployment**:
  - **Render**: Frontend deployed as a Static Site, Backend deployed as a Web Service.

---

## 💻 Local Development Setup

### 1. Prerequisites
- Node.js (v18+)
- npm

### 2. Quick Start (Windows)
Double-click the [`start.bat`](file:///c:/OneDrive/Documents/PROJECTS/Study%20planner/start.bat) script in the root directory to launch both servers and open your browser automatically.

### 3. Manual Startup
**Backend**:
```bash
cd backend
npm install
node server.js
```
*Backend runs on `http://localhost:5000`.*

**Frontend**:
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*
