/*========================================================================================
  pd.js  —  Project Details
========================================================================================*/
const API_BASE = 'https://taskflow-production-api.up.railway.app';
const params = new URLSearchParams(window.location.search);
const project_id = params.get('id');

// Global members list — kept in sync so Assign To dropdown is always current
let projectMembers = [];

const COLORS = ['#4f46e5', '#0891b2', '#059669', '#b45309', '#9333ea', '#e06b6b', '#0d9488'];

/*──────────────────────────────────────────────────────────────────────────────
  AUTH HELPERS  
──────────────────────────────────────────────────────────────────────────────*/
async function refreshAccessToken() {
    const refresh = localStorage.getItem('refreshToken');
    if (!refresh) { window.location.href = 'login.html'; return null; }

    const res = await fetch(`${API_BASE}/api/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh })
    });

    if (res.ok) {
        const data = await res.json();
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

    let res = await fetch(url, options);
    if (res.status === 401) {
        token = await refreshAccessToken();
        if (!token) return null;
        options.headers['Authorization'] = 'Bearer ' + token;
        res = await fetch(url, options);
    }
    return res;
}

/*──────────────────────────────────────────────────────────────────────────────
  PROJECT DETAILS  — fetch & render
──────────────────────────────────────────────────────────────────────────────*/
async function project_details() {
    const res = await safe_fetch(`${API_BASE}/api/projects/?project=${project_id}`);
    if (!res) return alert('Session expired. Please login again.');
    if (!res.ok) return alert('Something went wrong. Try again.');

    const data = await res.json();
    if (!data || !data.length) {
        document.getElementById('members-list').textContent = 'Project not found.';
        return;
    }

    const project = data[0];
    document.getElementById('project-title').textContent = project.name;
    document.getElementById('description').textContent = project.description;

    window.projectOwner = project.owner_detail;

    // Store members globally, render chips + populate Assign To dropdown
    projectMembers = project.members || [];
    renderMemberChips();
    populateAssignTo();
    renderTasks(project.tasks || []);
}

project_details();

/*──────────────────────────────────────────────────────────────────────────────
  MEMBERS — render chips
──────────────────────────────────────────────────────────────────────────────*/
function renderMemberChips() {
    const el = document.getElementById('members-list');
    if (!projectMembers.length) {
        el.innerHTML = '<span style="color:#999;background:none;padding:0">No members yet</span>';
        return;
    }
    el.innerHTML = '';
    projectMembers.forEach(m => {
        const chip = document.createElement('span');
        chip.className = 'member-chip';
        chip.innerHTML = `${m.user_detail.username}<button class="chip-remove" title="Remove member">×</button>`;
        chip.querySelector('.chip-remove').addEventListener('click', (e) => {
            e.stopPropagation();
            removeMember(m.id, m.user_detail.username, chip);
        });
        el.appendChild(chip);
    });
}

/*──────────────────────────────────────────────────────────────────────────────
  ASSIGN TO SELECT — populated only from projectMembers (fetched from backend)
──────────────────────────────────────────────────────────────────────────────*/
function populateAssignTo() {
    const sel = document.getElementById('taskAssignTo');
    sel.innerHTML = '<option value="">— Select member —</option>';

    // Add owner first
    if (window.projectOwner) {
        const opt = document.createElement('option');
        opt.value = window.projectOwner.id;
        opt.textContent = window.projectOwner.username + ' (owner)';
        sel.appendChild(opt);
    }

    // Then add members
    projectMembers.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.user_detail.id;
        opt.textContent = m.user_detail.username;
        sel.appendChild(opt);
    });
}


/*──────────────────────────────────────────────────────────────────────────────
  TASK FORM — toggle
──────────────────────────────────────────────────────────────────────────────*/
document.getElementById('addTaskBtn').addEventListener('click', () => {
    const form = document.getElementById('taskForm');
    const open = form.style.display === 'block';
    form.style.display = open ? 'none' : 'block';
    if (!open) populateAssignTo(); // refresh list every time form opens
});

/*──────────────────────────────────────────────────────────────────────────────
  CREATE TASK  — POST /api/tasks/
──────────────────────────────────────────────────────────────────────────────*/
function appendTaskRow(task) {
    const empty = document.querySelector('#task-list .empty-row');
    if (empty) empty.remove();

    const cls = task.status === 'pending' ? 'pending'
        : task.status === 'in_progress' ? 'progress'
            : 'completed';

    const label = task.status === 'in_progress' ? 'In Progress'
        : task.status === 'pending' ? 'Pending'
            : 'Completed';

    const row = document.createElement('div');
    row.className = 'task-row';
    row.dataset.taskId = task.id;
    row.innerHTML = `
        <div class="task-title-cell">
            <span class="task-title-text">${task.title}</span>
            ${task.description ? `<span class="task-sub">${task.description}</span>` : ''}
        </div>
        <div>${task.assigned_user_detail ? task.assigned_user_detail.username : '—'}</div>
        <div><span class="status ${cls}">${label}</span></div>
        <div>${task.due_date || '—'}</div>
        <div class="task-actions">
            <button class="task-edit-btn" onclick="openEditTask(${task.id}, this)" title="Edit task">✏</button>
            <button class="task-del-btn"  onclick="deleteTask(${task.id}, this)"   title="Delete task">🗑</button>
        </div>`;
    document.getElementById('task-list').appendChild(row);
}

function renderTasks(tasks) {
    document.getElementById('task-list').innerHTML = `
        <div class="task-row header">
            <div>Task</div><div>Assigned To</div><div>Status</div><div>Due Date</div><div></div>
        </div>`;
    if (tasks.length) tasks.forEach(appendTaskRow);
    else document.getElementById('task-list').innerHTML +=
        `<div class="task-row empty-row"><div style="color:#999;grid-column:1/-1">No tasks yet</div></div>`;
}

document.getElementById('taskForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('taskTitle').value.trim();
    const assignedTo = document.getElementById('taskAssignTo').value;
    const dueDate = document.getElementById('taskDueDate').value;
    const description = document.getElementById('taskdescription').value;

    if (!title) return alert('Please enter a task title.');
    if (!assignedTo) return alert('Please select a member to assign.');
    if (!dueDate) return alert('Please pick a due date.');
    if (!description) return alert('Please enter task description');

    const btn = e.target.querySelector('.submit-btn');
    btn.textContent = 'Creating...'; btn.disabled = true;

    const res = await safe_fetch(`${API_BASE}/api/tasks/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title,
            description,
            assigned_to: parseInt(assignedTo),
            due_date: dueDate,
            project: parseInt(project_id)
        })
    });

    btn.textContent = 'Create Task'; btn.disabled = false;

    if (!res || !res.ok) {
        const err = res ? await res.json() : {};
        console.error('Task error:', err);
        return alert('Failed to create task. See console.');
    }

    const newTask = await res.json();
    appendTaskRow(newTask);

    // reset form
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskAssignTo').value = '';
    document.getElementById('taskDueDate').value = '';
    document.getElementById('taskdescription').value = '';
    document.getElementById('taskForm').style.display = 'none';
});

/*──────────────────────────────────────────────────────────────────────────────
  ADD MEMBER  — + button → search panel → POST /api/projectMembership/
──────────────────────────────────────────────────────────────────────────────*/

// Toggle panel open / close
document.getElementById('addMemberBtn').addEventListener('click', () => {
    const panel = document.getElementById('memberPanel');
    const opening = panel.style.display !== 'block';
    panel.style.display = opening ? 'block' : 'none';
    if (!opening) resetMemberSearch();
});

document.getElementById('cancelMember').addEventListener('click', () => {
    document.getElementById('memberPanel').style.display = 'none';
    resetMemberSearch();
});

function resetMemberSearch() {
    document.getElementById('memberInput').value = '';
    document.getElementById('memberUserId').value = '';
    document.getElementById('memberClear').classList.remove('on');
    closeDrop('memberDrop');
}

// Confirm — POST membership
document.getElementById('confirmAddMember').addEventListener('click', async () => {
    const userId = document.getElementById('memberUserId').value;
    const username = document.getElementById('memberInput').value.trim();
    if (!userId) return alert('Please select a user first.');

    const btn = document.getElementById('confirmAddMember');
    btn.textContent = 'Adding...'; btn.disabled = true;

    const res = await safe_fetch(`${API_BASE}/api/projectMembership/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: parseInt(project_id), user: parseInt(userId) })
    });

    btn.textContent = 'Add Member'; btn.disabled = false;

    if (!res || !res.ok) {
        const err = res ? await res.json() : {};
        console.error('Add member error:', err);
        return alert('Could not add member. They may already be in the project.');
    }

    const membership = await res.json();

    // Push into global array so Assign To dropdown stays in sync
    projectMembers.push({
        id: membership.id,
        user_detail: { id: parseInt(userId), username }
    });

    renderMemberChips();   // update member chips instantly
    populateAssignTo();    // update Assign To dropdown instantly

    document.getElementById('memberPanel').style.display = 'none';
    resetMemberSearch();
});

/*──────────────────────────────────────────────────────────────────────────────
  USER SEARCH AUTOCOMPLETE  (for Add Member panel only)
  Searches ALL users via /users/search/?q=
──────────────────────────────────────────────────────────────────────────────*/

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function highlight(text, q) {
    if (!q) return text;
    return text.replace(
        new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
        '<mark>$1</mark>'
    );
}

function closeDrop(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
}

async function searchAllUsers(query) {
    if (!query.trim()) return [];
    const res = await safe_fetch(`${API_BASE}/users/search/?q=${query}`);
    if (!res || !res.ok) alert('search failed');
    const data = await res.json();
    return data.slice(0, 10).map(u => ({
        id: u.id,
        name: u.username || u.name,
        color: COLORS[u.id % COLORS.length]
    }));
}

function renderDrop(dropId, users, query, onSelect) {
    const drop = document.getElementById(dropId);
    if (!users.length) {
        drop.innerHTML = `<div class="s-empty">No users found</div>`;
    } else {
        drop.innerHTML = users.map((u, i) => `
            <div class="s-item" data-i="${i}">
                <div class="s-avatar" style="background:${u.color}">${getInitials(u.name)}</div>
                <span>${highlight(u.name, query)}</span>
            </div>`).join('');

        drop.querySelectorAll('.s-item').forEach((el, i) => {
            el.addEventListener('mousedown', e => {
                e.preventDefault();
                onSelect(users[i]);
            });
        });
    }
    drop.classList.add('open');
}

// Wire up member search input
const memberInput = document.getElementById('memberInput');
const memberClear = document.getElementById('memberClear');
let memberDebounce;

memberInput.addEventListener('input', () => {
    const q = memberInput.value;
    memberClear.classList.toggle('on', q.length > 0);
    document.getElementById('memberUserId').value = '';
    clearTimeout(memberDebounce);
    memberDebounce = setTimeout(async () => {
        if (!q.trim()) { closeDrop('memberDrop'); return; }
        const results = await searchAllUsers(q);
        console.log(results)
        renderDrop('memberDrop', results, q, (user) => {
            memberInput.value = user.name;
            document.getElementById('memberUserId').value = user.id;
            memberClear.classList.add('on');
            closeDrop('memberDrop');
        });
    }, 150);
});

memberInput.addEventListener('focus', async () => {
    if (memberInput.value.trim()) {
        const results = await searchAllUsers(memberInput.value);
        renderDrop('memberDrop', results, memberInput.value, (user) => {
            memberInput.value = user.name;
            document.getElementById('memberUserId').value = user.id;
            memberClear.classList.add('on');
            closeDrop('memberDrop');
        });
    }
});

memberInput.addEventListener('blur', () => setTimeout(() => closeDrop('memberDrop'), 150));

memberClear.addEventListener('click', () => {
    memberInput.value = '';
    document.getElementById('memberUserId').value = '';
    memberClear.classList.remove('on');
    closeDrop('memberDrop');
    memberInput.focus();
});

// Keyboard nav for member dropdown
memberInput.addEventListener('keydown', (e) => {
    const items = document.querySelectorAll('#memberDrop .s-item');
    if (!items.length) return;
    let active = [...items].findIndex(el => el.classList.contains('active'));

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        active = Math.min(active + 1, items.length - 1);
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        active = Math.max(active - 1, 0);
    } else if (e.key === 'Enter' && active >= 0) {
        e.preventDefault();
        items[active].dispatchEvent(new MouseEvent('mousedown'));
        return;
    } else if (e.key === 'Escape') {
        closeDrop('memberDrop'); return;
    }
    items.forEach((el, i) => el.classList.toggle('active', i === active));
});

/*──────────────────────────────────────────────────────────────────────────────
  DELETE TASK  — DELETE /api/tasks/:id/
  Called by the 🗑 button rendered in each task row
──────────────────────────────────────────────────────────────────────────────*/
async function deleteTask(taskId, btn) {
    if (!confirm('Delete this task? This cannot be undone.')) return;
    btn.textContent = '…'; btn.disabled = true;

    const res = await safe_fetch(`${API_BASE}/api/tasks/${taskId}/`, { method: 'DELETE' });
    if (!res) return;

    if (res.ok || res.status === 204) {
        const row = btn.closest('.task-row');
        row.style.opacity = '0';
        row.style.transform = 'translateX(8px)';
        row.style.transition = 'opacity .2s, transform .2s';
        setTimeout(() => {
            row.remove();
            // Show empty state if no tasks left
            const list = document.getElementById('task-list');
            const remaining = list.querySelectorAll('.task-row:not(.header)');
            if (!remaining.length) {
                list.innerHTML += `<div class="task-row empty-row"><div style="color:#999;grid-column:1/-1">No tasks yet</div></div>`;
            }
        }, 210);
    } else {
        alert('Could not delete task.');
        btn.textContent = '🗑'; btn.disabled = false;
    }
}

/*──────────────────────────────────────────────────────────────────────────────
  EDIT DESCRIPTION  — PATCH /api/projects/:id/
  Inline editing on the description card
──────────────────────────────────────────────────────────────────────────────*/
function enableEditDescription() {
    const descEl = document.getElementById('description');
    const editBtn = document.getElementById('editDescBtn');
    const saveBtn = document.getElementById('saveDescBtn');
    const cancelBtn = document.getElementById('cancelDescBtn');

    const original = descEl.textContent;

    // Switch to textarea
    const ta = document.createElement('textarea');
    ta.id = 'descTextarea';
    ta.value = original;
    ta.className = 'desc-textarea';
    descEl.replaceWith(ta);
    ta.focus();

    editBtn.style.display = 'none';
    saveBtn.style.display = 'inline-flex';
    cancelBtn.style.display = 'inline-flex';

    // Cancel — restore original
    cancelBtn.onclick = () => {
        const p = document.createElement('p');
        p.id = 'description';
        p.className = 'desc-text';
        p.textContent = original;
        ta.replaceWith(p);
        editBtn.style.display = 'inline-flex';
        saveBtn.style.display = 'none';
        cancelBtn.style.display = 'none';
    };

    // Save — PATCH
    saveBtn.onclick = async () => {
        const newDesc = ta.value.trim();
        if (!newDesc) return alert('Description cannot be empty.');
        saveBtn.textContent = 'Saving…'; saveBtn.disabled = true;

        const res = await safe_fetch(`${API_BASE}/api/projects/${project_id}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description: newDesc })
        });

        saveBtn.textContent = 'Save'; saveBtn.disabled = false;

        if (!res || !res.ok) return alert('Failed to update description.');

        const p = document.createElement('p');
        p.id = 'description';
        p.className = 'desc-text';
        p.textContent = newDesc;
        ta.replaceWith(p);
        editBtn.style.display = 'inline-flex';
        saveBtn.style.display = 'none';
        cancelBtn.style.display = 'none';
    };
}

/*──────────────────────────────────────────────────────────────────────────────
  REMOVE MEMBER  — DELETE /api/projectMembership/:id/
  Called by the × button on each member chip
──────────────────────────────────────────────────────────────────────────────*/
async function removeMember(membershipId, username, chipEl) {
    if (!confirm(`Remove ${username} from this project?`)) return;

    chipEl.style.opacity = '0.4';

    const res = await safe_fetch(`${API_BASE}/api/projectMembership/${membershipId}/`, {
        method: 'DELETE'
    });

    if (!res) { chipEl.style.opacity = '1'; return; }

    if (res.ok || res.status === 204) {
        // Remove from global array
        projectMembers = projectMembers.filter(m => m.id !== membershipId);
        renderMemberChips();
        populateAssignTo();
        // Reload tasks — removed member's tasks become unassigned (null) on backend
        await reloadTasks();
    } else {
        alert('Could not remove member.');
        chipEl.style.opacity = '1';
    }
}

/*──────────────────────────────────────────────────────────────────────────────
  BACK NAVIGATION  — close modal if inside iframe, else navigate
──────────────────────────────────────────────────────────────────────────────*/
function handleBack(e) {
    try {
        if (window.parent && window.parent !== window && typeof window.parent.closeProjectModal === 'function') {
            e.preventDefault();
            window.parent.closeProjectModal();
        }
    } catch (err) { /* standalone: follow link normally */ }
}
/*──────────────────────────────────────────────────────────────────────────────
  RELOAD TASKS  — re-fetch tasks from backend and re-render
  Called after member removal so unassigned tasks show correctly
──────────────────────────────────────────────────────────────────────────────*/
async function reloadTasks() {
    const res = await safe_fetch(`${API_BASE}/api/tasks/?projectid=${project_id}`);
    if (!res || !res.ok) return;
    const tasks = await res.json();
    renderTasks(tasks);
}

/*──────────────────────────────────────────────────────────────────────────────
  EDIT TASK  — opens an inline edit panel below the task row
  PATCH /api/tasks/:id/  with changed fields only
──────────────────────────────────────────────────────────────────────────────*/
function openEditTask(taskId, btn) {
    // If another edit panel is already open, close it first
    const existing = document.querySelector('.edit-panel');
    if (existing) existing.remove();

    const row = btn.closest('.task-row');

    // Read current values from the row
    const currentTitle = row.querySelector('.task-title-text')?.textContent || '';
    const currentDesc = row.querySelector('.task-sub')?.textContent || '';
    const currentStatus = row.querySelector('.status')?.classList[1] === 'pending' ? 'pending'
        : row.querySelector('.status')?.classList[1] === 'progress' ? 'in_progress'
            : 'completed';
    const currentDue = row.querySelector('[data-due]')?.dataset.due || '';

    // Build member options
    // Owner option first
    const ownerOption = window.projectOwner
        ? `<option value="${window.projectOwner.id}">${window.projectOwner.username} (owner)</option>`
        : '';

    const memberOptions = ownerOption + projectMembers.map(m =>
        `<option value="${m.user_detail.id}">${m.user_detail.username}</option>`
    ).join('');

    // Build the edit panel element
    const panel = document.createElement('div');
    panel.className = 'edit-panel';
    panel.dataset.editingId = taskId;
    panel.innerHTML = `
        <div class="edit-panel-inner">
            <div class="edit-panel-title">Edit Task</div>
            <div class="edit-grid">
                <div class="edit-field">
                    <label>Title</label>
                    <input type="text" id="editTitle_${taskId}" value="${esc(currentTitle)}" placeholder="Task title">
                </div>
                <div class="edit-field">
                    <label>Assign To</label>
                    <select id="editAssign_${taskId}">
                        <option value="">— Unassigned —</option>
                        ${memberOptions}
                    </select>
                </div>
                <div class="edit-field">
                    <label>Status</label>
                    <select id="editStatus_${taskId}">
                        <option value="pending"     ${currentStatus === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="in_progress" ${currentStatus === 'in_progress' ? 'selected' : ''}>In Progress</option>
                        <option value="completed"   ${currentStatus === 'completed' ? 'selected' : ''}>Completed</option>
                    </select>
                </div>
                <div class="edit-field">
                    <label>Due Date</label>
                    <input type="date" id="editDue_${taskId}" value="${currentDue}">
                </div>
            </div>
            <div class="edit-field" style="margin-top:10px">
                <label>Description</label>
                <textarea id="editDesc_${taskId}" placeholder="Description…">${esc(currentDesc)}</textarea>
            </div>
            <div class="edit-actions">
                <button class="confirm-member-btn" onclick="saveEditTask(${taskId})">Save Changes</button>
                <button class="cancel-member-btn"  onclick="closeEditPanel()">Cancel</button>
            </div>
        </div>`;

    // Insert right after the task row
    row.insertAdjacentElement('afterend', panel);

    // Pre-select current assignee if we can read it from the row
    const assignedName = row.querySelectorAll('div:not(.task-title-cell):not(.task-actions)')[0]?.textContent?.trim();
    if (assignedName && assignedName !== '—') {
        const match = projectMembers.find(m => m.user_detail.username === assignedName);
        if (match) document.getElementById(`editAssign_${taskId}`).value = match.user_detail.id;
    }

    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closeEditPanel() {
    const panel = document.querySelector('.edit-panel');
    if (panel) {
        panel.style.opacity = '0';
        panel.style.transform = 'translateY(-6px)';
        setTimeout(() => panel.remove(), 180);
    }
}

async function saveEditTask(taskId) {
    const title = document.getElementById(`editTitle_${taskId}`)?.value.trim();
    const assign = document.getElementById(`editAssign_${taskId}`)?.value;
    const status = document.getElementById(`editStatus_${taskId}`)?.value;
    const due = document.getElementById(`editDue_${taskId}`)?.value;
    const desc = document.getElementById(`editDesc_${taskId}`)?.value.trim();

    if (!title) return alert('Title cannot be empty.');

    const saveBtn = document.querySelector('.edit-panel .confirm-member-btn');
    saveBtn.textContent = 'Saving…'; saveBtn.disabled = true;

    const body = { title, status };
    if (desc) body.description = desc;
    if (due) body.due_date = due;
    body.assigned_to = assign ? parseInt(assign) : null;

    const res = await safe_fetch(`${API_BASE}/api/tasks/${taskId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    saveBtn.textContent = 'Save Changes'; saveBtn.disabled = false;

    if (!res || !res.ok) {
        const err = res ? await res.json() : {};
        console.error('Edit task error:', err);
        return alert('Failed to save task. See console.');
    }

    // Close panel and reload tasks to reflect all changes cleanly
    closeEditPanel();
    await reloadTasks();
}

// Helper used in edit panel template
function esc(s) {
    return String(s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}


