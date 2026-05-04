from flask import Flask, request, jsonify, render_template
import json
import os

app = Flask(__name__)

# Archivo donde se guardan los datos
DATA_FILE = "data.json"

# Crear archivo si no existe
def inicializar_data():
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, "w") as f:
            json.dump([], f, indent=4)

inicializar_data()


# Leer datos
def leer_datos():
    with open(DATA_FILE, "r") as f:
        return json.load(f)


# Guardar datos
def guardar_datos(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=4)


# Ruta principal
@app.route("/")
def inicio():
    return render_template("index.html")


# Guardar cliente
@app.route("/clientes", methods=["POST"])
def crear_cliente():
    nuevo_cliente = request.json

    clientes = leer_datos()

    # Generar ID automático
    nuevo_cliente["id"] = len(clientes) + 1

    clientes.append(nuevo_cliente)
    guardar_datos(clientes)

    return jsonify({
        "mensaje": "Cliente guardado correctamente",
        "data": nuevo_cliente
    })


# Obtener todos los clientes
@app.route("/clientes", methods=["GET"])
def obtener_clientes():
    clientes = leer_datos()
    return jsonify(clientes)


# Actualizar clientes
@app.route("/clientes/<int:id>", methods=["PUT"])
def actualizar_cliente(id):
    datos_actualizados = request.json
    clientes = leer_datos()

    for cliente in clientes:
        if cliente["id"] == id:
            cliente.update(datos_actualizados)
            guardar_datos(clientes)
            return jsonify({"mensaje": "Cliente actualizado"})

    return jsonify({"error": "Cliente no encontrado"}), 404


# Eliminar cliente
@app.route("/clientes/<int:id>", methods=["DELETE"])
def eliminar_cliente(id):
    clientes = leer_datos()

    nuevos_clientes = [c for c in clientes if c["id"] != id]

    guardar_datos(nuevos_clientes)

    return jsonify({"mensaje": "Cliente eliminado"})


# Ejecutar servidor
if __name__ == "__main__":
    app.run(debug=True)