"""
GestionCall Pro — Backend API
Flask REST API para gestión de clientes de call center.
"""

import json
import logging
import os
import uuid
from datetime import datetime, timezone
from functools import wraps
from typing import Any

from flask import Flask, jsonify, render_template, request

# ─── Configuración ────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False

DATA_FILE = os.environ.get("DATA_FILE", "data.json")

# ─── Campos permitidos y valores válidos ──────────────────────────────────────

REQUIRED_FIELDS = {"nombre", "telefono", "tipo", "estado", "linea", "jefe"}

VALID_VALUES: dict[str, set[str]] = {
    "tipo":   {"Cita médica", "Taxes", "Asesoría"},
    "estado": {"Pendiente", "En proceso", "Resuelto"},
    "linea":  {f"Línea {i}" for i in range(1, 7)},
    "jefe":   {"Jefe 1", "Jefe 2", "Jefe 3"},
}

MAX_NOMBRE_LEN    = 120
MAX_TELEFONO_LEN  = 30


# ─── Persistencia ─────────────────────────────────────────────────────────────

def _load() -> list[dict]:
    """Lee el archivo de datos; retorna lista vacía si no existe o está corrupto."""
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, list) else []
    except (json.JSONDecodeError, OSError) as exc:
        logger.error("No se pudo leer %s: %s", DATA_FILE, exc)
        return []


def _save(data: list[dict]) -> None:
    """Escribe los datos de forma atómica (write + rename)."""
    tmp = DATA_FILE + ".tmp"
    try:
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp, DATA_FILE)
    except OSError as exc:
        logger.error("No se pudo guardar %s: %s", DATA_FILE, exc)
        raise


# ─── Validación ───────────────────────────────────────────────────────────────

def _validate_cliente(payload: dict[str, Any], *, partial: bool = False) -> list[str]:
    """
    Valida el payload del cliente.
    partial=True permite omitir campos (para PUT parcial).
    Retorna lista de mensajes de error; vacía si es válido.
    """
    errors: list[str] = []

    fields_to_check = payload.keys() if partial else REQUIRED_FIELDS

    for field in fields_to_check:
        if field not in REQUIRED_FIELDS:
            continue  # ignorar campos desconocidos silenciosamente

        value = payload.get(field)

        if not partial and (value is None or str(value).strip() == ""):
            errors.append(f"El campo '{field}' es obligatorio.")
            continue

        if value is None:
            continue

        value = str(value).strip()

        if field in VALID_VALUES and value not in VALID_VALUES[field]:
            valid = ", ".join(sorted(VALID_VALUES[field]))
            errors.append(f"Valor inválido para '{field}'. Permitidos: {valid}.")

        if field == "nombre" and len(value) > MAX_NOMBRE_LEN:
            errors.append(f"'nombre' no puede superar {MAX_NOMBRE_LEN} caracteres.")

        if field == "telefono" and len(value) > MAX_TELEFONO_LEN:
            errors.append(f"'telefono' no puede superar {MAX_TELEFONO_LEN} caracteres.")

    return errors


# ─── Helpers de respuesta ─────────────────────────────────────────────────────

def ok(data: Any = None, mensaje: str | None = None, status: int = 200):
    body: dict[str, Any] = {"ok": True}
    if mensaje:
        body["mensaje"] = mensaje
    if data is not None:
        body["data"] = data
    return jsonify(body), status


def err(mensaje: str, status: int = 400, errors: list[str] | None = None):
    body: dict[str, Any] = {"ok": False, "mensaje": mensaje}
    if errors:
        body["errors"] = errors
    return jsonify(body), status


# ─── Rutas ────────────────────────────────────────────────────────────────────

@app.route("/")
def inicio():
    return render_template("index.html")


@app.route("/clientes", methods=["GET"])
def listar_clientes():
    clientes = _load()

    # Filtros opcionales via query string
    estado = request.args.get("estado")
    jefe   = request.args.get("jefe")
    tipo   = request.args.get("tipo")
    q      = request.args.get("q", "").strip().lower()

    if estado:
        clientes = [c for c in clientes if c.get("estado") == estado]
    if jefe:
        clientes = [c for c in clientes if c.get("jefe") == jefe]
    if tipo:
        clientes = [c for c in clientes if c.get("tipo") == tipo]
    if q:
        clientes = [
            c for c in clientes
            if q in c.get("nombre", "").lower() or q in c.get("telefono", "")
        ]

    return jsonify(clientes), 200


@app.route("/clientes", methods=["POST"])
def crear_cliente():
    payload = request.get_json(silent=True)
    if payload is None:
        return err("El cuerpo de la solicitud debe ser JSON válido.", 400)

    errors = _validate_cliente(payload)
    if errors:
        return err("Datos inválidos.", 422, errors)

    clientes = _load()

    now = datetime.now(timezone.utc).date().isoformat()
    nuevo = {
        "id":           str(uuid.uuid4()),
        "nombre":       payload["nombre"].strip(),
        "telefono":     payload["telefono"].strip(),
        "tipo":         payload["tipo"],
        "estado":       payload["estado"],
        "linea":        payload["linea"],
        "jefe":         payload["jefe"],
        "fecha_inicio": payload.get("fecha_inicio") or now,
        "fecha_fin":    payload.get("fecha_fin"),
        "created_at":   datetime.now(timezone.utc).isoformat(),
    }

    clientes.append(nuevo)
    _save(clientes)

    logger.info("Cliente creado: %s (%s)", nuevo["nombre"], nuevo["id"])
    return ok(nuevo, "Cliente registrado correctamente.", 201)


@app.route("/clientes/<cliente_id>", methods=["PUT"])
def actualizar_cliente(cliente_id: str):
    payload = request.get_json(silent=True)
    if payload is None:
        return err("El cuerpo de la solicitud debe ser JSON válido.", 400)

    errors = _validate_cliente(payload, partial=True)
    if errors:
        return err("Datos inválidos.", 422, errors)

    clientes = _load()
    for cliente in clientes:
        if str(cliente["id"]) == cliente_id:
            for field in REQUIRED_FIELDS:
                if field in payload:
                    cliente[field] = str(payload[field]).strip() if field in ("nombre", "telefono") else payload[field]

            # Fecha fin automática al resolver
            if payload.get("estado") == "Resuelto" and not cliente.get("fecha_fin"):
                cliente["fecha_fin"] = datetime.now(timezone.utc).date().isoformat()
            elif payload.get("estado") in ("Pendiente", "En proceso"):
                cliente["fecha_fin"] = None

            cliente["updated_at"] = datetime.now(timezone.utc).isoformat()
            _save(clientes)
            logger.info("Cliente actualizado: %s", cliente_id)
            return ok(cliente, "Cliente actualizado correctamente.")

    return err("Cliente no encontrado.", 404)


@app.route("/clientes/<cliente_id>", methods=["DELETE"])
def eliminar_cliente(cliente_id: str):
    clientes = _load()
    original_len = len(clientes)
    clientes = [c for c in clientes if str(c["id"]) != cliente_id]

    if len(clientes) == original_len:
        return err("Cliente no encontrado.", 404)

    _save(clientes)
    logger.info("Cliente eliminado: %s", cliente_id)
    return ok(mensaje="Cliente eliminado correctamente.")


@app.route("/stats", methods=["GET"])
def estadisticas():
    """Endpoint dedicado de estadísticas para evitar múltiples fetches desde el front."""
    clientes = _load()

    from collections import Counter

    resumen = {
        "total":     len(clientes),
        "por_estado": dict(Counter(c.get("estado", "—") for c in clientes)),
        "por_tipo":   dict(Counter(c.get("tipo",   "—") for c in clientes)),
        "por_jefe":   dict(Counter(c.get("jefe",   "—") for c in clientes)),
        "por_linea":  dict(Counter(c.get("linea",  "—") for c in clientes)),
    }
    return jsonify(resumen), 200


# ─── Error handlers globales ──────────────────────────────────────────────────

@app.errorhandler(404)
def not_found(_):
    return err("Ruta no encontrada.", 404)


@app.errorhandler(405)
def method_not_allowed(_):
    return err("Método no permitido.", 405)


@app.errorhandler(500)
def internal_error(exc):
    logger.exception("Error interno: %s", exc)
    return err("Error interno del servidor.", 500)


# ─── Entry point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    # Inicializar archivo si no existe
    if not os.path.exists(DATA_FILE):
        _save([])
        logger.info("Archivo de datos inicializado: %s", DATA_FILE)

    app.run(debug=True, port=5000)
