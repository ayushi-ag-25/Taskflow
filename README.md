# TaskFlow 🗂️

A full-stack project and task management web application built with **Django REST Framework** on the backend and **Vanilla JavaScript** on the frontend. Users can create projects, manage members, assign tasks, track progress, and collaborate — all from a clean, responsive dashboard.

---

## 🚀 [Try the Live App →](https://projects-with-taskflow.netlify.app/)

> 💡 **Demo credentials — use these to log in and explore:**
>
> | Field | Value |
> |---|---|
> | 👤 Username | `client1` |
> | 🔑 Password | `passwordclient1` |

---

## 🌐 Live Demo

| Service | Link |
|---|---|
| 🖥️ Frontend | [Open TaskFlow App](https://projects-with-taskflow.netlify.app/) |

---

## ✨ Features

### 🔐 Authentication
- JWT-based login and logout
- Auto token refresh using refresh tokens
- Protected routes — unauthenticated users redirected to login automatically
- Tokens stored in `localStorage`, cleared on logout

### 📁 Projects
- Create new projects with name and description
- View all **owned** and **member** projects separately on the dashboard
- Owner and Member role tags on each project card
- Project metadata — member count, task count, created date
- Delete owned projects (cascades to all tasks)
- Edit project description inline with Save/Cancel

### 👥 Members
- Add members via username search with live autocomplete dropdown
- Remove members from a project with one click
- When a member is removed, their assigned tasks are automatically **unassigned** via Django signal
- Member chips displayed with × remove button

### ✅ Tasks
- Create tasks with title, description, assignee, due date
- Assign tasks to project **owner** or any project member
- Edit tasks inline — change title, description, assignee, status, due date
- Delete tasks with confirmation
- Mark tasks as **Completed** or reopen back to **Pending** directly from dashboard
- Overdue tasks highlighted in red with ⚠ warning
- Task count pill kept in sync on project details page
- After editing or creating a task — task list reloads from backend automatically

### 🧭 Dashboard
- Owned projects open in a **modal overlay** (full management UI)
- Member projects load tasks **inline** in the task panel (read-only view)
- "My Tasks" panel shows all tasks assigned to current user across all projects
- Refresh button to reset task panel back to all tasks
- Time-based greeting (Good morning / afternoon / evening)
- Overdue task detection with red highlight

---

## 🏗️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Django | Web framework |
| Django REST Framework | REST API |
| SimpleJWT | JWT authentication |
| django-cors-headers | CORS for frontend-backend separation |
| PostgreSQL | Production database (Railway) |
| SQLite | Local development database |
| Gunicorn | Production WSGI server |
| Whitenoise | Static file serving |
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
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── Procfile
│   ├── create_superuser.py
│   ├── taskflow/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── projects/
│   │   ├── models.py          # Project, Task, ProjectMembership
│   │   ├── views.py           # ProjectViewSet, TaskViewSet, MembershipViewSet
│   │   ├── serializers.py     # All serializers
│   │   ├── permissions.py     # IsOwnerOrMember
│   │   ├── signals.py         # Auto-unassign tasks on member removal
│   │   ├── apps.py            # Signal registration
│   │   └── urls.py
│   └── accounts/
│       ├── models.py          # Custom User model
│       ├── views.py           # User search endpoint
│       └── serializers.py
│
├── frontend/
│   ├── config.js              # API base URL
│   ├── index.html             # Dashboard page
│   ├── index.js               # Dashboard logic
│   ├── index.css              # Dashboard styles
│   ├── login.html             # Login page
│   ├── project_details.html   # Project details page
│   ├── pd.js                  # Project details logic
│   └── create_project.html    # Create project page
│
├── netlify.toml               # Netlify deploy config
├── railway.json               # Railway deploy config
├── README.md
└── .gitignore
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/token/` | Login — returns access + refresh token |
| POST | `/api/token/refresh/` | Refresh expired access token |
| GET | `/api/me/` | Get current logged-in user info |

### Projects
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects/` | Get owned projects |
| GET | `/api/projects/?m=1` | Get member projects |
| GET | `/api/projects/?project=:id` | Get single project with tasks and members |
| POST | `/api/projects/` | Create new project |
| PATCH | `/api/projects/:id/` | Update project description |
| DELETE | `/api/projects/:id/` | Delete project and all its tasks |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks/` | Get all tasks for current user |
| GET | `/api/tasks/?project=:id` | Get tasks for a specific project |
| POST | `/api/tasks/` | Create new task |
| PATCH | `/api/tasks/:id/` | Edit task fields |
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
| GET | `/users/search/?q=:query` | Search users by username (autocomplete) |

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
| assigned_to | ForeignKey | User assigned (SET_NULL on delete) |
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
git clone https://github.com/ayushi-ag-25/Taskflow.git
cd Taskflow/backend

# 2. Create virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run migrations
python manage.py migrate

# 5. Create superuser
python manage.py createsuperuser

# 6. Run server
python manage.py runserver
```

### Frontend

```bash
# Navigate to frontend folder
cd Taskflow/frontend

# Update config.js for local development
# const API_BASE = 'http://127.0.0.1:8000';

# Open index.html with Live Server in VS Code
```

---

## 🚀 Deployment

### Backend → [Railway](https://railway.app)

1. Connect GitHub repo on Railway
2. Set root directory to `backend/`
3. Add PostgreSQL database
4. Set environment variables:
   ```
   SECRET_KEY=your-production-secret-key
   DEBUG=False
   DATABASE_URL=postgresql://...  (auto-set by Railway PostgreSQL plugin)
   ```
5. Set start command:
   ```
   cd backend && python manage.py migrate && python manage.py collectstatic --noinput && python create_superuser.py && gunicorn taskflow.wsgi --bind 0.0.0.0:$PORT
   ```

### Frontend → [Netlify](https://netlify.com)

1. Update `config.js` with Railway URL:
   ```js
   const API_BASE = 'https://taskflow-production-api.up.railway.app';
   ```
2. Connect GitHub repo on Netlify
3. Set publish directory to `frontend`
4. Deploy — no build command needed

---

## 🔒 Security Notes

- `SECRET_KEY` is set via Railway environment variable — never hardcoded
- JWT access tokens are short-lived, refresh tokens renew them automatically
- All API endpoints require authentication except `/api/token/`
- Owner-only actions protected by `IsOwnerOrMember` permission class on backend
- Frontend ownership checks are UX only — real protection enforced on backend
- CORS configured to allow only trusted origins

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
  <br><br>
  <a href="https://projects-with-taskflow.netlify.app/">🖥️ Live App</a> &nbsp;·&nbsp;
  <a href="https://github.com/ayushi-ag-25/Taskflow">📦 GitHub Repo</a>
</div>
