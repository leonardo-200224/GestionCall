const tabla = document.getElementById("tablaClientes");
let grafica;
let editandoId = null;
let graficaStats;
let tipoGrafica = "estado";

//  Cargar datos al iniciar
document.addEventListener("DOMContentLoaded", () => {
    cargarClientes();
});


// OBTENER CLIENTES DESDE FLASK
function cargarClientes() {
    fetch("/clientes")
        .then(res => res.json())
        .then(data => {
            mostrarTabla(data);
            actualizarDashboard(data);
            actualizarGrafica(data);
        });
}


// GUARDAR CLIENTE
function guardarCliente() {

    const nombre = document.getElementById("nombre").value;
    const telefono = document.getElementById("telefono").value;
    const tipo = document.getElementById("tipo").value;
    const estado = document.getElementById("estado").value;
    const linea = document.getElementById("linea").value;
    const jefe = document.getElementById("jefe").value;

    if (!nombre || !telefono || !tipo || !estado || !linea || !jefe) {
        alert("Todos los campos son obligatorios");
        return;
    }

    const cliente = {
        nombre,
        telefono,
        tipo,
        estado,
        linea,
        jefe,
        fecha_inicio: new Date().toISOString().split("T")[0],
        fecha_fin: null
    };

    fetch("/clientes", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(cliente)
    })
    .then(() => {
        alert("Cliente creado correctamente");
        resetFormulario();
        cargarClientes();
    });
}


// MOSTRAR TABLA
function mostrarTabla(clientes) {
    tabla.innerHTML = "";

    clientes.forEach(cliente => {
        const fila = `
        <tr>
            <td>${cliente.nombre}</td>
            <td>${cliente.telefono}</td>
            <td>${cliente.tipo}</td>
            <td>${cliente.estado}</td>
            <td>${cliente.linea}</td>
            <td>${cliente.jefe}</td>
            <td>${cliente.fecha_inicio}</td>
            <td>${cliente.fecha_fin || "-"}</td>
            <td>
                <button onclick="editarCliente(${cliente.id})">Editar</button>
                <button onclick="eliminarCliente(${cliente.id})">Eliminar</button>
            </td>
        </tr>
        `;
        tabla.innerHTML += fila;
    });
}


// ELIMINAR CLIENTE
function eliminarCliente(id) {

    const confirmacion = confirm("¿Estás seguro de eliminar este cliente?");

    if (!confirmacion) return;

    fetch(`/clientes/${id}`, {
        method: "DELETE"
    })
    .then(() => {
        alert("Cliente eliminado correctamente");
        cargarClientes();
    });
}


// DASHBOARD
function actualizarDashboard(clientes) {

    let pendientes = 0;
    let proceso = 0;
    let resueltos = 0;

    clientes.forEach(c => {
        if (c.estado === "Pendiente") pendientes++;
        if (c.estado === "En proceso") proceso++;
        if (c.estado === "Resuelto") resueltos++;
    });

    document.getElementById("total").textContent = clientes.length;
    document.getElementById("pendientes").textContent = pendientes;
    document.getElementById("proceso").textContent = proceso;
    document.getElementById("resueltos").textContent = resueltos;
}


// GRÁFICA DINÁMICA
function actualizarGrafica(clientes) {

    let pendientes = 0;
    let proceso = 0;
    let resueltos = 0;

    clientes.forEach(c => {
        if (c.estado === "Pendiente") pendientes++;
        if (c.estado === "En proceso") proceso++;
        if (c.estado === "Resuelto") resueltos++;
    });

    const datos = [pendientes, proceso, resueltos];

    const ctx = document.getElementById("miGrafica");

    if (grafica) {
        grafica.destroy();
    }

    grafica = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Pendientes", "En proceso", "Resueltas"],
            datasets: [{
                data: datos
            }]
        }
    });
}


// EDITAR CLIENTE
function editarCliente(id) {

    fetch("/clientes")
        .then(res => res.json())
        .then(clientes => {

            const c = clientes.find(cliente => cliente.id === id);

            document.getElementById("edit_nombre").value = c.nombre;
            document.getElementById("edit_telefono").value = c.telefono;
            document.getElementById("edit_tipo").value = c.tipo;
            document.getElementById("edit_estado").value = c.estado;
            document.getElementById("edit_linea").value = c.linea;
            document.getElementById("edit_jefe").value = c.jefe;

            editandoId = id;

            document.getElementById("modalEditar").style.display = "flex";
            document.body.style.overflow = "hidden";
        });
}


// GUARDAR EDICIÓN
function guardarEdicion() {

    const nombre = document.getElementById("edit_nombre").value;
    const telefono = document.getElementById("edit_telefono").value;
    const tipo = document.getElementById("edit_tipo").value;
    const estado = document.getElementById("edit_estado").value;
    const linea = document.getElementById("edit_linea").value;
    const jefe = document.getElementById("edit_jefe").value;

    if (!nombre || !telefono || !tipo || !estado || !linea || !jefe) {
        alert("Todos los campos son obligatorios");
        return;
    }

    const datos = {
        nombre,
        telefono,
        tipo,
        estado,
        linea,
        jefe,
        fecha_fin: estado === "Resuelto"
            ? new Date().toISOString().split("T")[0]
            : null
    };

    fetch(`/clientes/${editandoId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(datos)
    })
    .then(() => {
        alert("Cliente actualizado correctamente");
        cerrarModal();
        cargarClientes();
    });
}


// CERRAR MODAL
function cerrarModal() {
    document.getElementById("modalEditar").style.display = "none";
    document.body.style.overflow = "auto";
    editandoId = null;
}


// LIMPIAR FORMULARIO COMPLETO
function resetFormulario() {
    document.getElementById("nombre").value = "";
    document.getElementById("telefono").value = "";
    document.getElementById("tipo").value = "";
    document.getElementById("estado").value = "";
    document.getElementById("linea").value = "";
    document.getElementById("jefe").value = "";
}


// =====================
// ESTADÍSTICAS
// =====================

function abrirEstadisticas() {
    document.getElementById("modalStats").style.display = "flex";
    document.body.style.overflow = "hidden";
    cargarEstadisticas();
}

function cerrarEstadisticas() {
    document.getElementById("modalStats").style.display = "none";
    document.body.style.overflow = "auto";
}

function cambiarGrafica(tipo) {
    tipoGrafica = tipo;
    cargarEstadisticas();
}

function cargarEstadisticas() {

    fetch("/clientes")
        .then(res => res.json())
        .then(data => {

            const filtro = document.getElementById("filtroTiempo").value;
            const hoy = new Date();

            if (filtro !== "todos") {
                data = data.filter(c => {
                    const fecha = new Date(c.fecha_inicio);
                    const diff = (hoy - fecha) / (1000 * 60 * 60 * 24);

                    if (filtro === "hoy") return diff <= 1;
                    if (filtro === "semana") return diff <= 7;
                    if (filtro === "mes") return diff <= 30;
                });
            }

            actualizarGraficaModal(data);
        });
}


function actualizarGraficaModal(clientes) {

    let datos = {};
    let titulo = "";

    if (tipoGrafica === "estado") {
        titulo = "Estados";
        clientes.forEach(c => {
            datos[c.estado] = (datos[c.estado] || 0) + 1;
        });
    }

    if (tipoGrafica === "jefe") {
        titulo = "Clientes por Jefe";
        clientes.forEach(c => {
            datos[c.jefe] = (datos[c.jefe] || 0) + 1;
        });
    }

    if (tipoGrafica === "tipo") {
        titulo = "Tipos de Solicitud";
        clientes.forEach(c => {
            datos[c.tipo] = (datos[c.tipo] || 0) + 1;
        });
    }

    if (tipoGrafica === "linea") {
        titulo = "Líneas de WhatsApp";
        clientes.forEach(c => {
            datos[c.linea] = (datos[c.linea] || 0) + 1;
        });
    }

    const ctx = document.getElementById("graficaGeneral");

    if (graficaStats) {
        graficaStats.destroy();
    }

    graficaStats = new Chart(ctx, {
        type: "bar",
        data: {
            labels: Object.keys(datos),
            datasets: [{
                label: titulo,
                data: Object.values(datos)
            }]
        }
    });
}

// MENU SIDEBAR
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.querySelector(".sidebar");

menuBtn.addEventListener("click", () => {
    sidebar.classList.toggle("active");
});

document.querySelectorAll(".sidebar a").forEach(link => {
    link.addEventListener("click", () => {
        sidebar.classList.remove("active");
    });
});

document.addEventListener("click", (e) => {
    if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
        sidebar.classList.remove("active");
    }
});