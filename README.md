# TaskFlow 🗂️

A full-stack project and task management web application built with **Django REST Framework** on the backend and **Vanilla JavaScript** on the frontend. Users can create projects, manage members, assign tasks, track progress, and collaborate — all from a clean, responsive dashboard.

---

## 🌐 Live Demo

| Service | URL |
|---|---|
| Frontend | `https://taskflow.netlify.app` |
| Backend API | `taskflow-production-api.up.railway.app` |

---

## 📸 Screenshots

> Dashboard · Project Details · Task Management

---

## ✨ Features

### 🔐 Authentication
- JWT-based login and logout
- Auto token refresh using refresh tokens
- Protected routes — unauthenticated users redirected to login
- Tokens stored in `localStorage`, cleared on logout

### 📁 Projects
- Create new projects
- View all owned and member projects separately on the dashboard
- Owner and Member role tags on each project card
- Project metadata — member count, task count, created date
- Delete owned projects (with all tasks)
- Edit project description inline

### 👥 Members
- Add members to a project via username search with autocomplete
- Remove members from a project
- When a member is removed, their assigned tasks are automatically unassigned (via Django signal)
- Member chips with remove button on project details page

### ✅ Tasks
- Create tasks with title, description, assignee, due date
- Assign tasks to project owner or any project member
- Edit tasks inline — change title, description, assignee, status, due date
- Delete tasks
- Mark tasks as **Completed** or reopen back to **Pending** directly from dashboard
- Overdue tasks highlighted in red with ⚠ warning on dashboard
- Task count pill kept in sync on project details page

### 🧭 Dashboard
- Owned projects open in a **modal overlay** (full management)
- Member projects load tasks **inline** in the task panel (read-only)
- "My Tasks" view shows all tasks assigned to the current user across all projects
- Refresh button to reset task panel
- Time-based greeting (Good morning / afternoon / evening)

---

## 🏗️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Django | Web framework |
| Django REST Framework | REST API |
| SimpleJWT | JWT authentication |
| django-cors-headers | CORS for frontend-backend separation |
| PostgreSQL | Production database |
| SQLite | Development database |
| Gunicorn | Production WSGI server |
| Railway | Backend hosting |

### Frontend
| Technology | Purpose |
|---|---|
| HTML5 | Structure |
| CSS3 | Styling |
| Vanilla JavaScript | Logic and API calls |
| Google Fonts | Typography (Plus Jakarta Sans, Inter, Manrope) |
| Netlify | Frontend hosting |

---

## 📁 Project Structure

```
taskflow/
│
├── taskflow-backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── Procfile
│   ├── taskflow/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── projects/
│       ├── models.py          # Project, Task, ProjectMembership
│       ├── views.py           # ProjectViewSet, TaskViewSet, MembershipViewSet
│       ├── serializers.py     # All serializers
│       ├── permissions.py     # IsOwnerOrMember
│       ├── signals.py         # Auto-unassign tasks on member removal
│       ├── apps.py
│       └── urls.py
│
└── taskflow-frontend/
    ├── config.js              # API base URL config
    ├── index.html             # Dashboard
    ├── index.js               # Dashboard logic
    ├── index.css              # Dashboard styles
    ├── login.html             # Login page
    ├── project_details.html   # Project details page
    ├── pd.js                  # Project details logic
    └── create_project.html    # Create project page
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/token/` | Login — get access + refresh token |
| POST | `/api/token/refresh/` | Refresh access token |
| GET | `/api/me/` | Get current logged-in user |

### Projects
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects/` | Get owned projects |
| GET | `/api/projects/?m=1` | Get member projects |
| GET | `/api/projects/?project=:id` | Get single project with tasks and members |
| POST | `/api/projects/` | Create new project |
| PATCH | `/api/projects/:id/` | Update project (e.g. description) |
| DELETE | `/api/projects/:id/` | Delete project |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks/` | Get all tasks for current user |
| GET | `/api/tasks/?project=:id` | Get tasks for a specific project |
| POST | `/api/tasks/` | Create new task |
| PATCH | `/api/tasks/:id/` | Edit task |
| DELETE | `/api/tasks/:id/` | Delete task |

### Memberships
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projectMembership/` | Get memberships |
| POST | `/api/projectMembership/` | Add member to project |
| DELETE | `/api/projectMembership/:id/` | Remove member from project |

### User Search
| Method | Endpoint | Description |
|---|---|---|
| GET | `/users/search/?q=:query` | Search users by username |

---

## 🗄️ Database Models

### Project
| Field | Type | Description |
|---|---|---|
| name | CharField | Project name |
| description | TextField | Project description |
| owner | ForeignKey | User who owns the project |
| members | ManyToManyField | Members via ProjectMembership |
| created_at | DateTimeField | Auto timestamp |

### Task
| Field | Type | Description |
|---|---|---|
| title | CharField | Task title |
| description | TextField | Task description |
| project | ForeignKey | Project the task belongs to |
| assigned_to | ForeignKey | User assigned to the task |
| status | CharField | `pending` / `completed` |
| due_date | DateField | Optional due date |
| created_at | DateTimeField | Auto timestamp |

### ProjectMembership
| Field | Type | Description |
|---|---|---|
| user | ForeignKey | The member user |
| project | ForeignKey | The project |
| status | CharField | `invited` / `accepted` / `declined` |
| invited_at | DateTimeField | Auto timestamp |
| accepted_at | DateTimeField | When accepted |

---

## ⚙️ Local Development Setup

### Backend

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/taskflow-backend.git
cd taskflow-backend

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create .env file
echo "SECRET_KEY=your-secret-key-here" > .env
echo "DEBUG=True" >> .env

# 5. Run migrations
python manage.py migrate

# 6. Create superuser
python manage.py createsuperuser

# 7. Run server
python manage.py runserver
```

### Frontend

```bash
# Clone the repo
git clone https://github.com/yourusername/taskflow-frontend.git
cd taskflow-frontend

# Update config.js for local development
# const API_BASE = 'http://127.0.0.1:8000';

# Open index.html in browser or use Live Server in VS Code
```

---

## 🚀 Deployment

### Backend → Railway

1. Push backend to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add PostgreSQL plugin
4. Set environment variables:
   ```
   SECRET_KEY=your-production-secret-key
   DEBUG=False
   DATABASE_URL=postgresql://...  (auto-set by Railway)
   ```
5. Railway auto-detects `Procfile` and deploys

### Frontend → Netlify

1. Update `config.js` with your Railway URL:
   ```js
   const API_BASE = 'https://taskflow-api.railway.app';
   ```
2. Push frontend to GitHub
3. Go to [netlify.com](https://netlify.com) → New Site → Import from GitHub
4. Build command: *(leave empty)*
5. Publish directory: `/` *(root)*
6. Deploy

### CORS — Important
In Django `settings.py`, add your Netlify URL:
```python
CORS_ALLOWED_ORIGINS = [
    'https://taskflow.netlify.app',
]
```

---

## 🔒 Security Notes

- `SECRET_KEY` is always set via environment variable, never hardcoded
- JWT tokens stored in `localStorage` — access token short-lived, refresh token used to renew
- All API endpoints require authentication except `/api/token/`
- Owner-only actions (delete project, manage members) protected by `IsOwnerOrMember` permission class
- Frontend ownership checks are UX only — real protection is enforced on the backend

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'Add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — feel free to use this project for learning or as a base for your own apps.

---

<div align="center">
  Built with ❤️ using Django & Vanilla JS
</div>
