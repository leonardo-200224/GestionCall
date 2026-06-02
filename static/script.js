/**
 * GestionCall Pro — Frontend Controller
 * Arquitectura: módulos separados por responsabilidad.
 * No hay dependencias externas salvo Chart.js (cargado en HTML).
 */

"use strict";

// ─── Estado global ────────────────────────────────────────────────────────────

const State = (() => {
  let _clientes = [];
  let _editingId = null;
  let _chart = null;
  let _chartType = "estado";
  let _filters = { q: "", estado: "", jefe: "", tipo: "" };
  let _sortKey = null;
  let _sortDir = 1; // 1 = asc, -1 = desc

  return {
    get clientes()   { return _clientes; },
    set clientes(v)  { _clientes = v; },
    get editingId()  { return _editingId; },
    set editingId(v) { _editingId = v; },
    get chart()      { return _chart; },
    set chart(v)     { _chart = v; },
    get chartType()  { return _chartType; },
    set chartType(v) { _chartType = v; },
    get filters()    { return { ..._filters }; },
    setFilter(key, val) { _filters[key] = val; },
    get sortKey()    { return _sortKey; },
    get sortDir()    { return _sortDir; },
    toggleSort(key) {
      if (_sortKey === key) _sortDir *= -1;
      else { _sortKey = key; _sortDir = 1; }
    },
  };
})();


// ─── API layer ────────────────────────────────────────────────────────────────

const API = {
  async _fetch(url, options = {}) {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    const json = await res.json().catch(() => ({ ok: false, mensaje: "Respuesta inválida del servidor." }));
    if (!res.ok) throw Object.assign(new Error(json.mensaje || "Error desconocido"), { errors: json.errors, status: res.status });
    return json;
  },

  getClientes: ()            => API._fetch("/clientes"),
  getStats:    ()            => API._fetch("/stats"),
  createCliente: (body)      => API._fetch("/clientes", { method: "POST",   body: JSON.stringify(body) }),
  updateCliente: (id, body)  => API._fetch(`/clientes/${id}`, { method: "PUT",    body: JSON.stringify(body) }),
  deleteCliente: (id)        => API._fetch(`/clientes/${id}`, { method: "DELETE" }),
};


// ─── Toast notifications ──────────────────────────────────────────────────────

const Toast = (() => {
  let container;

  function _ensureContainer() {
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      document.body.appendChild(container);
    }
  }

  function show(message, type = "info", duration = 3500) {
    _ensureContainer();
    const t = document.createElement("div");
    t.className = `toast toast-${type}`;
    const icons = { success: "✓", error: "✕", info: "ℹ", warning: "⚠" };
    t.innerHTML = `<span class="toast-icon">${icons[type] || "ℹ"}</span><span>${esc(message)}</span>`;
    container.appendChild(t);
    requestAnimationFrame(() => t.classList.add("toast-show"));
    setTimeout(() => {
      t.classList.remove("toast-show");
      t.addEventListener("transitionend", () => t.remove(), { once: true });
    }, duration);
  }

  return {
    success: (m) => show(m, "success"),
    error:   (m) => show(m, "error", 5000),
    info:    (m) => show(m, "info"),
    warning: (m) => show(m, "warning"),
  };
})();


// ─── Utilidades ───────────────────────────────────────────────────────────────

function esc(str) {
  return String(str ?? "").replace(/[&<>"']/g, (m) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m])
  );
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function getField(id) {
  return document.getElementById(id)?.value?.trim() ?? "";
}

function setField(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val ?? "";
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(dateStr + "T00:00:00"));
  } catch {
    return dateStr;
  }
}

function debounce(fn, delay = 250) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}


// ─── Navigation ───────────────────────────────────────────────────────────────

const Navigation = (() => {
  const titles = {
    dashboard:   ["Dashboard",       "Resumen general"],
    registrar:   ["Nuevo Cliente",   "Registrar solicitud"],
    solicitudes: ["Solicitudes",     "Listado de clientes"],
  };

  function navigate(section) {
    document.querySelectorAll(".section").forEach((s) => s.classList.remove("active"));
    document.querySelectorAll(".nav-item").forEach((n) => n.classList.remove("active"));

    document.getElementById(`sec-${section}`)?.classList.add("active");
    document.getElementById(`nav-${section}`)?.classList.add("active");

    if (titles[section]) {
      document.getElementById("pageTitle").textContent = titles[section][0];
      document.getElementById("pageSub").textContent   = titles[section][1];
    }

    if (window.innerWidth <= 900) Sidebar.close();
    return false;
  }

  return { navigate };
})();

function navigate(s) { Navigation.navigate(s); }


// ─── Sidebar ──────────────────────────────────────────────────────────────────

const Sidebar = {
  toggle() {
    document.getElementById("sidebar").classList.toggle("open");
    document.getElementById("overlay").classList.toggle("show");
  },
  close() {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("overlay").classList.remove("show");
  },
};

function toggleSidebar() { Sidebar.toggle(); }
function closeSidebar()  { Sidebar.close(); }


// ─── KPIs ─────────────────────────────────────────────────────────────────────

function countUp(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const from = parseInt(el.textContent) || 0;
  if (from === target) { el.textContent = target; return; }
  const steps = 28, dur = 550;
  let i = 0;
  const ease = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  const iv = setInterval(() => {
    i++;
    el.textContent = Math.round(from + (target - from) * ease(i / steps));
    if (i >= steps) { el.textContent = target; clearInterval(iv); }
  }, dur / steps);
}

function renderKPIs(clientes) {
  const total      = clientes.length;
  const pendientes = clientes.filter((c) => c.estado === "Pendiente").length;
  const proceso    = clientes.filter((c) => c.estado === "En proceso").length;
  const resueltos  = clientes.filter((c) => c.estado === "Resuelto").length;

  countUp("total",      total);
  countUp("pendientes", pendientes);
  countUp("proceso",    proceso);
  countUp("resueltos",  resueltos);

  if (total > 0) {
    setTimeout(() => {
      document.getElementById("bar-total").style.width = "100%";
      document.getElementById("bar-pend").style.width  = `${(pendientes / total) * 100}%`;
      document.getElementById("bar-proc").style.width  = `${(proceso    / total) * 100}%`;
      document.getElementById("bar-res").style.width   = `${(resueltos  / total) * 100}%`;
    }, 180);
  }
}


// ─── Badge ────────────────────────────────────────────────────────────────────

const BADGE_MAP = {
  "Pendiente":  "badge-pending",
  "En proceso": "badge-process",
  "Resuelto":   "badge-resolved",
};

function badge(estado) {
  return `<span class="badge ${BADGE_MAP[estado] || ""}">${esc(estado)}</span>`;
}


// ─── Tabla ────────────────────────────────────────────────────────────────────

function _applyFiltersAndSort(clientes) {
  const { q, estado, jefe, tipo } = State.filters;

  let result = clientes.filter((c) => {
    if (estado && c.estado !== estado) return false;
    if (jefe   && c.jefe   !== jefe)   return false;
    if (tipo   && c.tipo   !== tipo)   return false;
    if (q) {
      const search = q.toLowerCase();
      if (!c.nombre.toLowerCase().includes(search) && !c.telefono.includes(search)) return false;
    }
    return true;
  });

  const key = State.sortKey;
  if (key) {
    result.sort((a, b) => {
      const va = (a[key] ?? "").toString().toLowerCase();
      const vb = (b[key] ?? "").toString().toLowerCase();
      return va < vb ? -State.sortDir : va > vb ? State.sortDir : 0;
    });
  }

  return result;
}

function renderTabla(clientes) {
  const filtered = _applyFiltersAndSort(clientes);
  const tbody    = document.getElementById("tablaClientes");
  const rowCount = document.getElementById("rowCount");
  const filteredCount = document.getElementById("filteredCount");

  if (rowCount)    rowCount.textContent = clientes.length;
  if (filteredCount) {
    const hidden = clientes.length - filtered.length;
    filteredCount.textContent = hidden > 0 ? `(${filtered.length} visibles)` : "";
  }

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr><td colspan="9">
        <div class="empty">
          <div class="empty-icon">⊘</div>
          <p>${clientes.length === 0 ? "Sin registros aún" : "Ningún cliente coincide con los filtros"}</p>
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((c) => `
    <tr data-id="${esc(c.id)}">
      <td class="td-name">${esc(c.nombre)}</td>
      <td class="td-phone">${esc(c.telefono)}</td>
      <td>${esc(c.tipo)}</td>
      <td>${badge(c.estado)}</td>
      <td>${esc(c.linea)}</td>
      <td>${esc(c.jefe)}</td>
      <td class="td-date">${formatDate(c.fecha_inicio)}</td>
      <td class="td-date">${formatDate(c.fecha_fin)}</td>
      <td>
        <div class="actions">
          <button class="act act-edit" title="Editar"   onclick="editarCliente('${esc(c.id)}')">✎</button>
          <button class="act act-del"  title="Eliminar" onclick="confirmarEliminar('${esc(c.id)}', '${esc(c.nombre)}')">✕</button>
        </div>
      </td>
    </tr>`).join("");
}


// ─── Carga de datos ───────────────────────────────────────────────────────────

async function cargarClientes() {
  try {
    const json = await API.getClientes();
    State.clientes = json; // el endpoint devuelve array directamente
    renderTabla(State.clientes);
    renderKPIs(State.clientes);
  } catch (e) {
    Toast.error("No se pudo cargar la lista de clientes.");
    console.error(e);
  }
}


// ─── Filtros y búsqueda ───────────────────────────────────────────────────────

const _onSearch = debounce((val) => {
  State.setFilter("q", val);
  renderTabla(State.clientes);
});

function onFilterChange(key, val) {
  State.setFilter(key, val);
  renderTabla(State.clientes);
}

function limpiarFiltros() {
  ["q", "estado", "jefe", "tipo"].forEach((k) => State.setFilter(k, ""));
  setField("searchInput", "");
  setField("filterEstado", "");
  setField("filterJefe",   "");
  setField("filterTipo",   "");
  renderTabla(State.clientes);
}

function sortBy(key) {
  State.toggleSort(key);
  renderTabla(State.clientes);
}


// ─── Guardar cliente ──────────────────────────────────────────────────────────

async function guardarCliente() {
  const campos = ["nombre", "telefono", "tipo", "estado", "linea", "jefe"];
  const payload = {};

  for (const k of campos) {
    const v = getField(k);
    if (!v) { Toast.warning("Todos los campos son obligatorios."); return; }
    payload[k] = v;
  }

  payload.fecha_inicio = today();
  payload.fecha_fin    = null;

  const btn = document.querySelector(".btn-save");
  if (btn) { btn.disabled = true; btn.textContent = "Guardando…"; }

  try {
    await API.createCliente(payload);
    campos.forEach((k) => setField(k, ""));
    await cargarClientes();
    navigate("solicitudes");
    Toast.success("Cliente registrado correctamente.");
  } catch (e) {
    const detail = e.errors?.join(" ") ?? e.message;
    Toast.error(detail || "No se pudo registrar el cliente.");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "Guardar cliente →"; }
  }
}


// ─── Editar cliente ───────────────────────────────────────────────────────────

function editarCliente(id) {
  const c = State.clientes.find((x) => String(x.id) === String(id));
  if (!c) { Toast.error("Cliente no encontrado."); return; }

  ["nombre", "telefono", "tipo", "estado", "linea", "jefe"].forEach((k) =>
    setField(`edit_${k}`, c[k] ?? "")
  );

  State.editingId = id;
  Modal.open("modalEditar");
}

async function guardarEdicion() {
  const campos = ["nombre", "telefono", "tipo", "estado", "linea", "jefe"];
  const payload = {};

  for (const k of campos) {
    const v = getField(`edit_${k}`);
    if (!v) { Toast.warning("Todos los campos son obligatorios."); return; }
    payload[k] = v;
  }

  const btn = document.querySelector(".btn-confirm");
  if (btn) { btn.disabled = true; btn.textContent = "Actualizando…"; }

  try {
    await API.updateCliente(State.editingId, payload);
    Modal.close("modalEditar");
    await cargarClientes();
    Toast.success("Cliente actualizado correctamente.");
  } catch (e) {
    const detail = e.errors?.join(" ") ?? e.message;
    Toast.error(detail || "No se pudo actualizar el cliente.");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "Actualizar →"; }
  }
}


// ─── Eliminar cliente ─────────────────────────────────────────────────────────

function confirmarEliminar(id, nombre) {
  ConfirmDialog.show(
    `¿Eliminar a <strong>${esc(nombre)}</strong>? Esta acción no se puede deshacer.`,
    async () => {
      try {
        await API.deleteCliente(id);
        await cargarClientes();
        Toast.success("Cliente eliminado.");
      } catch (e) {
        Toast.error(e.message || "No se pudo eliminar el cliente.");
      }
    }
  );
}

// Alias de compatibilidad con HTML antiguo
function eliminarCliente(id) {
  const c = State.clientes.find((x) => String(x.id) === String(id));
  confirmarEliminar(id, c?.nombre ?? id);
}


// ─── Modal ────────────────────────────────────────────────────────────────────

const Modal = {
  open(id) {
    const el = document.getElementById(id);
    if (el) { el.style.display = "flex"; document.body.style.overflow = "hidden"; }
  },
  close(id) {
    const el = document.getElementById(id);
    if (el) { el.style.display = "none"; document.body.style.overflow = ""; }
    if (id === "modalEditar") State.editingId = null;
  },
};

function cerrarModal()        { Modal.close("modalEditar"); }
function abrirEstadisticas()  { Modal.open("modalStats"); cargarEstadisticas(); }
function cerrarEstadisticas() { Modal.close("modalStats"); }

// Cerrar modal al hacer clic en el backdrop
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal")) Modal.close(e.target.id);
});


// ─── Confirm Dialog ───────────────────────────────────────────────────────────

const ConfirmDialog = {
  _cb: null,

  show(htmlMessage, onConfirm) {
    document.getElementById("confirmMessage").innerHTML = htmlMessage;
    this._cb = onConfirm;
    Modal.open("modalConfirm");
  },

  confirm() {
    Modal.close("modalConfirm");
    if (this._cb) { this._cb(); this._cb = null; }
  },

  cancel() {
    Modal.close("modalConfirm");
    this._cb = null;
  },
};


// ─── Estadísticas ─────────────────────────────────────────────────────────────

function cambiarGrafica(tipo, btn) {
  State.chartType = tipo;
  document.querySelectorAll(".stab").forEach((b) => b.classList.remove("active"));
  btn?.classList.add("active");
  cargarEstadisticas();
}

async function cargarEstadisticas() {
  try {
    const stats = await API.getStats();
    _renderChart(stats);
  } catch (e) {
    Toast.error("No se pudieron cargar las estadísticas.");
  }
}

function _renderChart(stats) {
  const dataMap = {
    estado: stats.por_estado,
    tipo:   stats.por_tipo,
    jefe:   stats.por_jefe,
    linea:  stats.por_linea,
  };

  // Filtro de tiempo (client-side sobre los datos del endpoint /stats)
  // El filtro requeriría pasar rango de fechas al backend; por ahora usa todos los datos
  const raw    = dataMap[State.chartType] ?? {};
  const labels = Object.keys(raw);
  const values = Object.values(raw);

  const palette = ["#00c2ff", "#00e5a0", "#ffac30", "#ff4d6a", "#a78bfa", "#34d399"];

  if (State.chart) State.chart.destroy();

  State.chart = new Chart(document.getElementById("graficaGeneral"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: labels.map((_, i) => palette[i % palette.length] + "22"),
        borderColor:     labels.map((_, i) => palette[i % palette.length]),
        borderWidth: 1.5,
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#16202e",
          borderColor: "rgba(255,255,255,0.1)",
          borderWidth: 1,
          titleColor: "#e8eef5",
          bodyColor: "#8a9bb0",
          cornerRadius: 8,
          padding: 10,
        },
      },
      scales: {
        x: {
          ticks: { color: "#4a5a6e", font: { family: "IBM Plex Mono", size: 11 } },
          grid:  { color: "rgba(255,255,255,0.04)" },
          border: { color: "rgba(255,255,255,0.06)" },
        },
        y: {
          ticks: { color: "#4a5a6e", font: { family: "IBM Plex Mono", size: 11 }, stepSize: 1 },
          grid:  { color: "rgba(255,255,255,0.04)" },
          border: { color: "rgba(255,255,255,0.06)" },
          beginAtZero: true,
        },
      },
    },
  });
}


// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  cargarClientes();
  navigate("dashboard");

  // Buscador en tiempo real
  const searchInput = document.getElementById("searchInput");
  searchInput?.addEventListener("input", (e) => _onSearch(e.target.value));

  // Atajo de teclado: Escape cierra modales
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      ["modalEditar", "modalStats", "modalConfirm"].forEach((id) => {
        const el = document.getElementById(id);
        if (el?.style.display === "flex") Modal.close(id);
      });
    }
  });
});
