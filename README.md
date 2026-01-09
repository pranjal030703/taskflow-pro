# TaskFlow Pro 🚀

**A Full-Stack Kanban Board for managing tasks with real-time updates.**

🔴 **Live Demo:** [https://taskflow-pro-pranjal.vercel.app](https://taskflow-pro-pranjal.vercel.app)

![TaskFlow Pro Dashboard](https://github.com/user-attachments/assets/7aa30870-8f97-4eec-8a03-74a33b3fa2fb)

## 💡 About
TaskFlow Pro is a robust project management tool inspired by Trello. It allows users to organize tasks into "Todo", "In Progress", and "Done" columns using a seamless drag-and-drop interface.

Unlike simple todo apps, this project features a **secure backend** where each user has a private board, and changes are synced **instantly** across devices using WebSockets.

## ✨ Key Features
* **Drag & Drop:** Smooth task management powered by `react-beautiful-dnd`.
* **Authentication:** Secure Login/Register using JWT & Bcrypt.
* **Private Boards:** Data is isolated per user; User A cannot see User B's tasks.
* **Real-Time Sync:** Socket.io pushes updates instantly (no page refresh needed).
* **Mobile Responsive:** Fully optimized layout for phones and desktops.
* **Persistent Database:** All data stored securely in PostgreSQL (Render).

## 🛠️ Tech Stack
* **Frontend:** Next.js (React), Tailwind CSS, Axios
* **Backend:** Node.js, Express.js, Socket.io
* **Database:** PostgreSQL (hosted on Render)
* **Deployment:** Vercel (Frontend) + Render (Backend)

## 🔑 Recruiter / Demo Credentials
Want to test it out quickly? Use these guest credentials:
* **Email:** `demo@test.com`
* **Password:** `123456`

## 📦 How to Run Locally

1. **Clone the repo**
   ```bash
   git clone [https://github.com/pranjal030703/taskflow-pro.git](https://github.com/pranjal030703/taskflow-pro.git)
   cd taskflow-pro
