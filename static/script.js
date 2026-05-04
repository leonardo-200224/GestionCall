const tabla = document.getElementById("tablaClientes");
let grafica;

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

    const fecha_inicio = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const cliente = {
        nombre,
        telefono,
        tipo,
        estado,
        linea,
        jefe,
        fecha_inicio,
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
            limpiarFormulario();
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
                <button onclick="resolverCliente(${cliente.id})">Resolver</button>
                <button onclick="eliminarCliente(${cliente.id})">Eliminar</button>
            </td>
        </tr>
        `;
        tabla.innerHTML += fila;
    });
}


// ELIMINAR CLIENTE
function eliminarCliente(id) {
    fetch(`/clientes/${id}`, {
        method: "DELETE"
    })
        .then(() => cargarClientes());
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

function resolverCliente(id) {

    const fecha_fin = new Date().toISOString().split("T")[0];

    fetch(`/clientes/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            estado: "Resuelto",
            fecha_fin: fecha_fin
        })
    })
    .then(() => cargarClientes());
}