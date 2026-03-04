/*
  index.js — Dashboard
  Function names preserved from original: get_projects, get_tasks, showtask,
  get_all_tasks, create_project, openProject
  Added: renderProjectCard, modal logic, delete project/task, auth helpers
*/

let currentUserId = null;
const API_BASE = 'http://127.0.0.1:8000';

/* ── Auth ───────────────────────────────────────────────── */
async function refreshAccessToken() {
    const refresh = localStorage.getItem('refreshToken');
    if (!refresh) { window.location.href = 'login.html'; return null; }
    const response = await fetch(`${API_BASE}/api/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh })
    });
    if (response.ok) {
        const data = await response.json();
        localStorage.setItem('accessToken', data.access);
        return data.access;
    }
    localStorage.clear();
    window.location.href = 'login.html';
    return null;
}

async function safe_fetch(url, options = {}) {
    let token = localStorage.getItem('accessToken');
    options.headers = { ...options.headers, 'Authorization': 'Bearer ' + token };
    let response = await fetch(url, options);
    if (response.status === 401) {
        token = await refreshAccessToken();
        if (!token) return null;
        options.headers['Authorization'] = 'Bearer ' + token;
        response = await fetch(url, options);
    }
    return response;
}

/* ── Current user ───────────────────────────────────────── */
async function loadCurrentUser() {
    const res = await safe_fetch(`${API_BASE}/api/me/`);
    if (res && res.ok) {
        const data = await res.json();
        currentUserId = parseInt(data.id);
        const h = new Date().getHours();
        const g = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
        document.getElementById('welcomeSub').textContent = g + ', ' + data.username;
    } else {
        document.getElementById('welcomeSub').textContent = 'Welcome back';
    }
}

/* ── Sidebar nav ────────────────────────────────────────── */
document.getElementById('projectsBtn').addEventListener('click', () => {
    document.querySelector('.card').scrollIntoView({ behavior: 'smooth' });
    setActive('projectsBtn');
});
document.getElementById('tasksBtn').addEventListener('click', () => {
    document.querySelectorAll('.card')[1].scrollIntoView({ behavior: 'smooth' });
    setActive('tasksBtn');
    resetTaskPanel();
    get_all_tasks();
});
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
});
function setActive(id) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

/* ── Navigation ─────────────────────────────────────────── */
function create_project() {
    window.location.href = 'create_project.html';
}

/* ── get_projects: two separate calls (owned + member) ─── */
async function get_projects() {
    const container = document.getElementById('projectList');
    container.innerHTML = '<div class="empty-state"><span class="ei">⊞</span><p>Loading projects…</p></div>';

    // Two calls so we KNOW for sure which is owned and which is member
    const [ownedRes, memberRes] = await Promise.all([
        safe_fetch(`${API_BASE}/api/projects/`),
        safe_fetch(`${API_BASE}/api/projects/?m=1`)
    ]);

    const owned  = (ownedRes  && ownedRes.ok)  ? await ownedRes.json()  : [];
    const member = (memberRes && memberRes.ok) ? await memberRes.json() : [];

    console.log('Owned projects:', owned);
    console.log('Member projects:', member);

    if (!owned.length && !member.length) {
        container.innerHTML = '<div class="empty-state"><span class="ei">⊞</span><p>No projects yet. Create your first one!</p></div>';
        return;
    }

    container.innerHTML = '';
    owned.forEach(p  => renderProjectCard(p, true));
    member.forEach(p => renderProjectCard(p, false));
}

function renderProjectCard(project, isOwned) {
    const container = document.getElementById('projectList');

    // Task count — backend may return tasks array or task_count number
    const cnt = project.tasks ? project.tasks.length : (project.task_count ?? 0);

    // Member count — memberships array or member_count
    const memberCnt = project.members
        ? project.members.length
        : (project.member_count ?? 0);

    // Created date — formatted nicely if available
    const createdDate = project.created_at
        ? new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : null;

    const card = document.createElement('div');
    card.className = `project-card ${isOwned ? 'owned' : 'member'}`;

    // Owner opens modal, member loads tasks inline
    card.onclick = isOwned
        ? () => openProject(project.id)
        : () => get_tasks(project.id, project.name);

    card.innerHTML = `
        <div class="pc-top">
            <h3>${esc(project.name)}</h3>
            <span class="role-tag ${isOwned ? 'owned' : 'member'}">${isOwned ? 'Owner' : 'Member'}</span>
        </div>
        <p class="pc-desc">${esc(project.description || 'No description provided.')}</p>
        <div class="pc-meta">
            ${createdDate ? `<span class="pc-meta-item">📅 ${createdDate}</span>` : ''}
            <span class="pc-meta-item">👥 ${memberCnt} member${memberCnt !== 1 ? 's' : ''}</span>
        </div>
        <div class="pc-footer">
            <span class="pc-count"><span class="pc-dot"></span>${cnt} task${cnt !== 1 ? 's' : ''}</span>
            ${isOwned ? `<button class="btn-del-proj" title="Delete project">🗑</button>` : ''}
        </div>`;

    if (isOwned) {
        card.querySelector('.btn-del-proj').addEventListener('click', e => {
            e.stopPropagation();
            deleteProject(project.id);
        });
    }

    container.appendChild(card);
}

/* ── openProject: owner → open modal ───────────────────── */
function openProject(projectId) {
    window.location.href = `project_details.html?id=${projectId}`;
    
}


/* ── Delete owned project ───────────────────────────────── */
async function deleteProject(projectId) {
    if (!confirm('Delete this project and all its tasks? This cannot be undone.')) return;
    const res = await safe_fetch(`${API_BASE}/api/projects/` + projectId + '/', { method: 'DELETE' });
    if (!res) return;
    if (res.ok || res.status === 204) get_projects();
    else alert('Failed to delete project.');
}

/* ── get_tasks: member clicks project → show tasks inline ─ */
async function get_tasks(project_id, projectName) {
    document.querySelectorAll('.card')[1].scrollIntoView({ behavior: 'smooth' });

    // Update heading
    document.getElementById('tasksHeading').textContent = projectName || 'Project Tasks';
    const lbl = document.getElementById('tasksProjLabel');
    lbl.textContent = 'project tasks';
    lbl.style.display = 'inline-block';

    // Show loading
    document.getElementById('taskList').innerHTML =
        '<tr class="t-empty"><td colspan="6">Loading…</td></tr>';

    const url = `${API_BASE}/api/tasks/?project=${project_id}`;
    const response = await safe_fetch(url);

    if (!response) return;
    if (!response.ok) {
        console.error('Server error:', response.status);
        alert('Something went wrong. Try again.');
        return;
    }

    const tasks = await response.json();
    console.log('Tasks:', tasks);
    showtask(tasks);
}

/* ── showtask: render tasks into the table ──────────────── */
function showtask(tasks) {
    const tbody = document.getElementById('taskList');

    if (!tasks.length) {
        tbody.innerHTML = '<tr class="t-empty"><td colspan="6">No tasks found.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    tasks.forEach(task => {
        // Project name — may come as project_name string or just project id
        const proj = esc(String(task.project_name || task.project || '—'));

        // Assigned user — nested object or plain id
        const assignee = esc(String(
            task.assigned_user_detail?.username ?? task.assigned_to ?? '—'
        ));

        // Due date — highlight overdue
        const today = new Date().toISOString().split('T')[0];
        const isOverdue = task.due_date && task.due_date < today && task.status !== 'completed';
        const dueDateDisplay = task.due_date
            ? `<span style="color:${isOverdue ? 'var(--red)' : 'var(--muted)'};font-weight:${isOverdue ? '600' : '400'}">${task.due_date}${isOverdue ? ' ⚠' : ''}</span>`
            : '—';

        const isDone = task.status === 'completed';
        tbody.innerHTML += `
        <tr id="task-row-${task.id}">
            <td>
                <div class="t-title" style="${isDone ? 'text-decoration:line-through;opacity:.5' : ''}">${esc(task.title)}</div>
                ${task.description ? `<div class="t-desc">${esc(task.description)}</div>` : ''}
            </td>
            <td style="color:var(--sub)">${proj}</td>
            <td style="color:var(--sub)">${assignee}</td>
            <td><span class="badge ${badgeCls(task.status)}" id="badge-${task.id}">${task.status.replace('_', ' ')}</span></td>
            <td>${dueDateDisplay}</td>
            <td style="display:flex;align-items:center;gap:6px">
                <button class="t-status-btn ${isDone ? 'btn-reopen' : 'btn-complete'}"
                    onclick="toggleTaskStatus(${task.id}, '${task.status}', this)"
                    title="${isDone ? 'Mark as Pending' : 'Mark as Complete'}">
                    ${isDone ? '↩' : '✓'}
                </button>
                <button class="t-del" onclick="deleteTask(${task.id}, this)" title="Delete">🗑</button>
            </td>
        </tr>`;
    });
}

/* ── get_all_tasks: all tasks for current user ──────────── */
async function get_all_tasks() {
    document.getElementById('taskList').innerHTML =
        '<tr class="t-empty"><td colspan="6">Loading…</td></tr>';

    const response = await safe_fetch(`${API_BASE}/api/tasks/?s=l/`);

    if (!response) return;
    if (!response.ok) {
        console.error('Server error:', response.status);
        alert('Something went wrong. Try again.');
        return;
    }

    const tasks = await response.json();
    console.log('All tasks:', tasks);
    showtask(tasks);
}

/* ── Toggle task status: pending ↔ completed ────────────── */
async function toggleTaskStatus(id, currentStatus, btn) {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    btn.textContent = '…'; btn.disabled = true;

    const res = await safe_fetch(`${API_BASE}/api/tasks/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
    });

    if (!res || !res.ok) {
        alert('Could not update task status.');
        btn.textContent = currentStatus === 'completed' ? '↩' : '✓';
        btn.disabled = false;
        return;
    }

    const isDone = newStatus === 'completed';

    // Update badge
    const badge = document.getElementById(`badge-${id}`);
    if (badge) {
        badge.className = `badge ${badgeCls(newStatus)}`;
        badge.textContent = newStatus.replace('_', ' ');
    }

    // Strike through title if completed
    const row = document.getElementById(`task-row-${id}`);
    if (row) {
        const titleEl = row.querySelector('.t-title');
        if (titleEl) titleEl.style = isDone ? 'text-decoration:line-through;opacity:.5' : '';
    }

    // Update button
    btn.className   = `t-status-btn ${isDone ? 'btn-reopen' : 'btn-complete'}`;
    btn.textContent = isDone ? '↩' : '✓';
    btn.title       = isDone ? 'Mark as Pending' : 'Mark as Complete';
    btn.disabled    = false;

    // Update onclick to reflect new current status
    btn.setAttribute('onclick', `toggleTaskStatus(${id}, '${newStatus}', this)`);
}

/* ── Delete task ────────────────────────────────────────── */
async function deleteTask(id, btn) {
    if (!confirm('Delete this task?')) return;
    btn.textContent = '…'; btn.disabled = true;
    const res = await safe_fetch(`${API_BASE}/api/tasks/` + id + '/', { method: 'DELETE' });
    if (!res) return;
    if (res.ok || res.status === 204) {
        btn.closest('tr').remove();
        if (!document.getElementById('taskList').querySelector('tr'))
            document.getElementById('taskList').innerHTML =
                '<tr class="t-empty"><td colspan="6">No tasks found.</td></tr>';
    } else {
        alert('Could not delete task.');
        btn.textContent = '🗑';
        btn.disabled = false;
    }
}

/* ── Task panel helpers ─────────────────────────────────── */
function resetTaskPanel() {
    document.getElementById('tasksHeading').textContent = 'My Tasks';
    const lbl = document.getElementById('tasksProjLabel');
    lbl.style.display = 'none';
    lbl.textContent = '';
}

function badgeCls(s) {
    return s === 'pending' ? 'badge-pending'
         : s === 'in_progress' ? 'badge-progress'
         : 'badge-completed';
}

/* Refresh button */
document.getElementById('btnRefresh').addEventListener('click', async function () {
    this.classList.add('spin');
    resetTaskPanel();
    await get_all_tasks();
    setTimeout(() => this.classList.remove('spin'), 550);
});

/* ── Helpers ────────────────────────────────────────────── */
function esc(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ── Init ───────────────────────────────────────────────── */
(async () => {
    await loadCurrentUser();
    get_projects();
    get_all_tasks();
})();


/*----------------------------  LOGOUT--------------------------*/
document.getElementById('logoutBtn').addEventListener('click', async () => {
    const refresh = localStorage.getItem('refreshToken');
    if (refresh) {
        // Tell backend to blacklist the refresh token
        await fetch(`${API_BASE}/api/token/blacklist/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh })
        });
    }
    localStorage.clear();
    window.location.href = 'login.html';
});
