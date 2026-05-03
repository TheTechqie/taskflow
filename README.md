# ⚡ TaskFlow — Project Management App

A full-stack, role-based project management platform built with **React + Node.js + MongoDB**.

![TaskFlow](https://img.shields.io/badge/Status-Active-brightgreen) ![React](https://img.shields.io/badge/React-18-blue) ![Node](https://img.shields.io/badge/Node.js-18-green) ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)

---

## 🌐 Live Demo

Frontend: https://distinguished-trust-production-cadc.up.railway.app  
Backend API: https://taskflow-production-6a36.up.railway.app

## 🚀 Features

- 🔐 **Authentication** — JWT-based signup/login with role selection (Admin/Member)
- 📁 **Projects** — Create, edit, delete projects with color coding, priority, due dates
- 🗂️ **Kanban Board** — Drag-free visual task board with 4 columns (To Do → In Progress → Review → Done)
- ✅ **Task Management** — Create tasks, assign members, set priority, due dates, comments
- 📊 **Dashboard** — Charts, stats, overdue alerts, personal task view
- 👥 **Team Management** — Add/remove members per project with roles
- 🛡️ **Role-Based Access** — Admin panel to manage all users and roles
- ⏰ **Overdue Detection** — Highlights and tracks overdue tasks
- 📱 **Responsive UI** — Works on desktop and tablet

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TailwindCSS, React Query |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose |
| Auth | JWT (JSON Web Tokens) |
| Charts | Recharts |
| Deployment | Railway |

---

## 📦 Project Structure

```
taskflow/
├── backend/                 # Express API
│   ├── models/              # Mongoose schemas (User, Project, Task)
│   ├── routes/              # REST API routes
│   ├── middleware/          # Auth middleware
│   ├── seed.js              # Demo data seeder
│   ├── server.js            # Entry point
│   └── .env                 # Environment variables
│
├── frontend/                # React app
│   ├── src/
│   │   ├── components/      # Reusable components (Layout, UI)
│   │   ├── context/         # Auth context (global state)
│   │   ├── pages/           # Route pages
│   │   └── utils/           # API client (axios)
│   └── index.html
│
└── package.json             # Root scripts (run both services)
```

---

## ⚙️ Local Setup (VS Code)

### Prerequisites
- [Node.js 18+](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/try/download/community) installed locally **OR** a free [MongoDB Atlas](https://cloud.mongodb.com) cluster
- [Git](https://git-scm.com/)

---

### Step 1 — Clone / Open in VS Code

If you downloaded as a ZIP, extract it. Then open the `taskflow` folder in VS Code:
```
File → Open Folder → select "taskflow"
```

Open the **integrated terminal**: `` Ctrl+` `` (backtick)

---

### Step 2 — Install Dependencies

```bash
# From the taskflow root folder:
npm install

# Install backend deps
cd backend && npm install

# Install frontend deps
cd ../frontend && npm install

# Go back to root
cd ..
```

---

### Step 3 — Configure Environment

The backend `.env` file is already created for local development:

```
backend/.env
```

**If using local MongoDB** (default), it works as-is.

**If using MongoDB Atlas**, replace `MONGO_URI`:
```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/taskflow
```

---

### Step 4 — Start MongoDB (local)

If using local MongoDB, start it:
- **Windows**: Run "MongoDB" from Start Menu, or `net start MongoDB` in cmd
- **Mac**: `brew services start mongodb-community`
- **Linux**: `sudo systemctl start mongod`

---

### Step 5 — Seed Demo Data (Optional but Recommended)

```bash
cd backend
npm run seed
cd ..
```

This creates 3 demo users, 3 projects, and 16 tasks.

**Demo accounts after seeding:**
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | demo1234 |
| Member | member@demo.com | demo1234 |
| Dev | alex@demo.com | demo1234 |

---

### Step 6 — Run the App

Open **two terminals** in VS Code (`+` button in terminal panel):

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```
You should see: `✅ MongoDB connected` and `🚀 Server running on port 5000`

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
You should see: `Local: http://localhost:3000`

Open **http://localhost:3000** in your browser. 🎉

---

## 🌐 Deploy to Railway

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/taskflow.git
git push -u origin main
```

### Step 2 — Create MongoDB Atlas Database
1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free cluster
3. Create a database user
4. Get your connection string: `mongodb+srv://...`

### Step 3 — Deploy Backend on Railway
1. Go to [railway.app](https://railway.app) → New Project
2. Click **Deploy from GitHub repo** → select your repo
3. Click **Add Service** → select the `backend` folder (or set root directory to `/backend`)
4. Add these **Environment Variables**:
   ```
   MONGO_URI = mongodb+srv://your-atlas-connection-string
   JWT_SECRET = your_random_secret_at_least_32_chars
   NODE_ENV = production
   CLIENT_URL = https://your-frontend-url.railway.app
   PORT = 5000
   ```
5. Deploy → copy the generated URL (e.g. `https://taskflow-backend.railway.app`)

### Step 4 — Deploy Frontend on Railway
1. In same Railway project → **New Service** → GitHub repo
2. Set root directory to `/frontend`
3. Add Environment Variable:
   ```
   VITE_API_URL = https://taskflow-backend.railway.app
   ```
4. Deploy → your frontend URL is live!

### Step 5 — Seed Production Database
In Railway backend service → **Shell** tab:
```bash
node seed.js
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | Get all user projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project details |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| POST | `/api/projects/:id/members` | Add member |
| DELETE | `/api/projects/:id/members/:userId` | Remove member |
| GET | `/api/projects/:id/stats` | Project stats |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Get all tasks (with filters) |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/:id` | Get task details |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| POST | `/api/tasks/:id/comments` | Add comment |

### Users (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Search users |
| GET | `/api/users/dashboard` | Dashboard stats |
| GET | `/api/users/all` | All users (Admin only) |
| PUT | `/api/users/:id/role` | Change role (Admin only) |

---

## 🎯 Role Permissions

| Action | Admin | Member |
|--------|-------|--------|
| Create project | ✅ | ✅ |
| Delete own project | ✅ | ✅ |
| Add/remove members | ✅ (project admin) | ❌ |
| Create/edit tasks | ✅ | ✅ |
| Delete any task | ✅ | ❌ (own tasks only) |
| Access Admin Panel | ✅ | ❌ |
| Change user roles | ✅ | ❌ |

---

## 🧑‍💻 VS Code Recommended Extensions

Install these for the best experience:
- **ESLint** — Code linting
- **Tailwind CSS IntelliSense** — Autocomplete for Tailwind classes
- **Prettier** — Code formatting
- **MongoDB for VS Code** — Browse your database
- **Thunder Client** — Test API endpoints (like Postman, built into VS Code)

---

## 📝 Troubleshooting

**MongoDB connection failed:**
- Make sure MongoDB is running locally
- Or check your Atlas connection string in `.env`

**Port already in use:**
```bash
# Kill port 5000
npx kill-port 5000
# Kill port 3000
npx kill-port 3000
```

**npm install errors:**
```bash
# Clear cache and retry
npm cache clean --force
rm -rf node_modules
npm install
```

---

## 📄 License

MIT © 2024 TaskFlow
