// Simple UI client for API using HttpOnly cookie auth
// Important: fetch must use credentials: "include"

const el = (id) => document.getElementById(id);

const state = {
  apiBase: localStorage.getItem("apiBase") || "http://localhost:3000",
  me: null,
  tasks: [],
};

function setApiBase(value) {
  state.apiBase = value.replace(/\/+$/, "");
  localStorage.setItem("apiBase", state.apiBase);
  el("apiBase").value = state.apiBase;
  log(`API base set to: ${state.apiBase}`);
}

function log(msg, data) {
  const box = el("logBox");
  const line = `[${new Date().toLocaleTimeString()}] ${msg}`;
  box.textContent += line + (data ? `\n${JSON.stringify(data, null, 2)}` : "") + "\n\n";
  box.scrollTop = box.scrollHeight;
}

function pretty(obj) {
  return JSON.stringify(obj, null, 2);
}

async function api(path, { method = "GET", body } = {}) {
  const url = `${state.apiBase}${path}`;
  const headers = { "Content-Type": "application/json" };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  // 204 has no body
  const text = res.status === 204 ? "" : await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }

  if (!res.ok) {
    const errMsg = json?.error || `HTTP ${res.status}`;
    const err = new Error(errMsg);
    err.status = res.status;
    err.body = json || text;
    throw err;
  }

  return json;
}

function setAuthState() {
  const pill = el("authState");
  if (state.me?.user) {
    pill.textContent = `Logged in: ${state.me.user.email} (${state.me.user.role})`;
    pill.style.borderColor = "rgba(34,197,94,.4)";
  } else {
    pill.textContent = "Not logged in";
    pill.style.borderColor = "rgba(255,255,255,.15)";
  }
}

async function refreshMe() {
  try {
    const data = await api("/auth/me");
    state.me = data;
    el("meBox").textContent = pretty(data);
    setAuthState();
    log("ME OK", data);
  } catch (e) {
    state.me = null;
    el("meBox").textContent = `Not authenticated.\n${e.message}`;
    setAuthState();
    log("ME FAIL", { status: e.status, message: e.message, body: e.body });
  }
}

async function register() {
  const email = el("regEmail").value.trim();
  const password = el("regPass").value;
  if (!email || !password) return log("Register: missing email/password");

  try {
    const data = await api("/auth/register", { method: "POST", body: { email, password } });
    log("REGISTER OK", data);
  } catch (e) {
    log("REGISTER FAIL", { status: e.status, message: e.message, body: e.body });
  }
}

async function login() {
  const email = el("logEmail").value.trim();
  const password = el("logPass").value;
  if (!email || !password) return log("Login: missing email/password");

  try {
    const data = await api("/auth/login", { method: "POST", body: { email, password } });
    log("LOGIN OK", data);
    await refreshMe();
    await loadTasks();
  } catch (e) {
    log("LOGIN FAIL", { status: e.status, message: e.message, body: e.body });
  }
}

async function logout() {
  try {
    const data = await api("/auth/logout", { method: "POST" });
    log("LOGOUT OK", data);
  } catch (e) {
    log("LOGOUT FAIL", { status: e.status, message: e.message, body: e.body });
  } finally {
    await refreshMe();
    renderTasks([]);
  }
}

async function createTask() {
  const title = el("taskTitle").value.trim();
  const description = el("taskDesc").value.trim();

  try {
    const data = await api("/tasks", { method: "POST", body: { title, description } });
    log("CREATE TASK OK", data);
    el("taskTitle").value = "";
    el("taskDesc").value = "";
    await loadTasks();
  } catch (e) {
    log("CREATE TASK FAIL", { status: e.status, message: e.message, body: e.body });
  }
}

async function loadTasks() {
  try {
    const data = await api("/tasks");
    state.tasks = data.tasks || [];
    log("LOAD TASKS OK", { count: state.tasks.length });
    renderTasks(state.tasks);
  } catch (e) {
    log("LOAD TASKS FAIL", { status: e.status, message: e.message, body: e.body });
    renderTasks([]);
  }
}

function renderTasks(tasks) {
  const list = el("tasksList");
  list.innerHTML = "";

  const hideCompleted = el("hideCompleted").checked;
  const filtered = hideCompleted ? tasks.filter(t => t.status !== "completed") : tasks;

  if (!filtered.length) {
    list.innerHTML = `<div class="muted small">No tasks</div>`;
    return;
  }

  for (const t of filtered) {
    const statusClass = t.status === "completed" ? "ok" : "pending";
    const item = document.createElement("div");
    item.className = "task";
    item.innerHTML = `
      <div>
        <h4>${escapeHtml(t.title)}</h4>
        <div class="muted small">${escapeHtml(t.description)}</div>
        <div class="meta">
          <span class="badge ${statusClass}">${t.status}</span>
          <span>id: <code>${t._id}</code></span>
          <span>created: ${formatDate(t.createdAt)}</span>
          <span>updated: ${formatDate(t.updatedAt)}</span>
        </div>
      </div>
      <div class="actions">
        <button class="btn" data-action="toggle" data-id="${t._id}">
          Toggle
        </button>
        <button class="btn danger" data-action="delete" data-id="${t._id}">
          Delete
        </button>
      </div>
    `;
    list.appendChild(item);
  }

  list.querySelectorAll("button[data-action]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      const action = btn.getAttribute("data-action");
      if (action === "toggle") await toggleStatus(id);
      if (action === "delete") await deleteTask(id);
    });
  });
}

async function toggleStatus(id) {
  const task = state.tasks.find(t => t._id === id);
  if (!task) return;

  const next = task.status === "completed" ? "pending" : "completed";
  try {
    const data = await api(`/tasks/${id}`, { method: "PATCH", body: { status: next } });
    log("PATCH OK", data);
    await loadTasks();
  } catch (e) {
    log("PATCH FAIL", { status: e.status, message: e.message, body: e.body });
  }
}

async function deleteTask(id) {
  if (!confirm("Delete this task?")) return;
  try {
    await api(`/tasks/${id}`, { method: "DELETE" });
    log("DELETE OK", { id });
    await loadTasks();
  } catch (e) {
    log("DELETE FAIL", { status: e.status, message: e.message, body: e.body });
  }
}

async function getTaskById() {
  const id = el("taskIdInput").value.trim();
  if (!id) return;

  try {
    const data = await api(`/tasks/${id}`);
    el("taskByIdBox").textContent = pretty(data);
    log("GET BY ID OK", data);
  } catch (e) {
    el("taskByIdBox").textContent = `Error: ${e.message}\n${pretty(e.body)}`;
    log("GET BY ID FAIL", { status: e.status, message: e.message, body: e.body });
  }
}

function formatDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  return isNaN(d.getTime()) ? String(v) : d.toLocaleString();
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Wire up
el("saveApi").addEventListener("click", () => setApiBase(el("apiBase").value));
el("btnRegister").addEventListener("click", register);
el("btnLogin").addEventListener("click", login);
el("btnLogout").addEventListener("click", logout);
el("btnMe").addEventListener("click", refreshMe);
el("btnCreateTask").addEventListener("click", createTask);
el("btnLoadTasks").addEventListener("click", loadTasks);
el("btnGetById").addEventListener("click", getTaskById);
el("btnClearLogs").addEventListener("click", () => (el("logBox").textContent = ""));
el("hideCompleted").addEventListener("change", () => renderTasks(state.tasks));

// Init
setApiBase(state.apiBase);
refreshMe();
