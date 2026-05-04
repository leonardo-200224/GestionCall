const tabla = document.getElementById("tablaClientes");
let grafica;
let editandoId = null;
let graficaEstados, graficaJefes, graficaTipos, graficaLineas; 
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


// LIMPIAR FORMULARIO
function limpiarFormulario() {
    document.getElementById("nombre").value = "";
    document.getElementById("telefono").value = "";
    document.getElementById("tipo").value = "";
    document.getElementById("estado").value = "";
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

    // destruir gráfica anterior
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
        },
        options: {
            responsive: true
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
        jefe
    };

    if (estado === "Resuelto") {
        datos.fecha_fin = new Date().toISOString().split("T")[0];
    } else {
        datos.fecha_fin = null;
    }

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



function abrirEstadisticas() {
    document.getElementById("modalStats").style.display = "flex";
    cargarEstadisticas();
}

function cerrarEstadisticas() {
    document.getElementById("modalStats").style.display = "none";
}


function cargarEstadisticas() {

    fetch("/clientes")
        .then(res => res.json())
        .then(data => {

            const filtro = document.getElementById("filtroTiempo").value;

            if (filtro !== "todos") {
                const hoy = new Date();

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


function filtrarPorFecha(clientes, filtro) {

    const hoy = new Date();

    return clientes.filter(c => {

        if (!c.fecha_inicio) return true;

        const fecha = new Date(c.fecha_inicio);
        const diff = (hoy - fecha) / (1000 * 60 * 60 * 24);

        if (filtro === "hoy") return diff < 1;
        if (filtro === "semana") return diff <= 7;
        if (filtro === "mes") return diff <= 30;

        return true;
    });
}


function crearGraficaEstados(clientes) {

    let pendientes = 0, proceso = 0, resueltos = 0;

    clientes.forEach(c => {
        if (c.estado === "Pendiente") pendientes++;
        if (c.estado === "En proceso") proceso++;
        if (c.estado === "Resuelto") resueltos++;
    });

    if (graficaEstados) graficaEstados.destroy();

    graficaEstados = new Chart(document.getElementById("graficaEstados"), {
        type: "doughnut",
        data: {
            labels: ["Pendiente", "Proceso", "Resuelto"],
            datasets: [{
                data: [pendientes, proceso, resueltos]
            }]
        }
    });
}


function crearGraficaJefes(clientes) {

    const conteo = {};

    clientes.forEach(c => {
        conteo[c.jefe] = (conteo[c.jefe] || 0) + 1;
    });

    if (graficaJefes) graficaJefes.destroy();

    graficaJefes = new Chart(document.getElementById("graficaJefes"), {
        type: "bar",
        data: {
            labels: Object.keys(conteo),
            datasets: [{
                label: "Clientes por jefe",
                data: Object.values(conteo)
            }]
        }
    });
}



function crearGraficaTipos(clientes) {

    const conteo = {};

    clientes.forEach(c => {
        conteo[c.tipo] = (conteo[c.tipo] || 0) + 1;
    });

    if (graficaTipos) graficaTipos.destroy();

    graficaTipos = new Chart(document.getElementById("graficaTipos"), {
        type: "bar",
        data: {
            labels: Object.keys(conteo),
            datasets: [{
                label: "Solicitudes por tipo",
                data: Object.values(conteo)
            }]
        }
    });
}


function crearGraficaLineas(clientes) {

    const conteo = {};

    clientes.forEach(c => {
        conteo[c.linea] = (conteo[c.linea] || 0) + 1;
    });

    if (graficaLineas) graficaLineas.destroy();

    graficaLineas = new Chart(document.getElementById("graficaLineas"), {
        type: "bar",
        data: {
            labels: Object.keys(conteo),
            datasets: [{
                label: "Clientes por línea",
                data: Object.values(conteo)
            }]
        }
    });
}

function cambiarGrafica(tipo) {
    tipoGrafica = tipo;
    cargarEstadisticas();
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

    const labels = Object.keys(datos);
    const valores = Object.values(datos);

    const ctx = document.getElementById("graficaGeneral");

    if (graficaStats) {
        graficaStats.destroy();
    }

    graficaStats = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: titulo,
                data: valores
            }]
        },
        options: {
            responsive: true
        }
    });
}