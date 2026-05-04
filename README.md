# Sistema de Gestión de Clientes para Call Center

## Descripción

Sistema web para la **gestión y seguimiento de solicitudes de clientes en un Call Center**, con el objetivo de centralizar la información, mejorar la trazabilidad de los casos y optimizar la toma de decisiones.

La solución surge como respuesta a la problemática actual identificada en el proceso de atención, donde la información se encuentra dispersa entre herramientas como Excel y CRM, generando errores, duplicidad de datos y dificultad en el seguimiento de solicitudes.

Este sistema permite registrar, visualizar, eliminar y analizar solicitudes de clientes mediante una interfaz web sencilla e intuitiva, apoyándose en tecnologías ligeras y fáciles de implementar.

---

## Objetivo General

Diseñar e implementar una solución web funcional que permita:

- Centralizar la información de clientes
- Gestionar solicitudes de manera estructurada
- Visualizar estadísticas en tiempo real
- Mejorar el control y seguimiento de casos

---

##  Tecnologías Utilizadas

- **Backend:** Python + Flask  
- **Frontend:** HTML5, CSS3, JavaScript  
- **Base de datos:** Archivo JSON -simulación de base de datos- 
- **Visualización de datos:** Chart.js  

---

##  Arquitectura del Sistema

El sistema sigue una arquitectura básica cliente-servidor:

- **Frontend:** Interfaz visual donde el usuario interactúa
- **Backend:** API REST en Flask que gestiona la lógica
- **Persistencia:** Archivo `data.json` que almacena los datos

---

##  Estructura

```
 GestionCall
├── app.py # Backend Flask -API REST CRUD-
├── data.json # Base de datos -almacenamiento de clientes-
├── templates/
│ └── index.html # Interfaz principal
├── static/
│ ├── styles.css # Estilos de la aplicación
│ └── script.js # Lógica del frontend
```

---

##  Funcionalidades Principales

###  Gestión de Clientes -CRUD-
- Registrar nuevos clientes
- Visualizar lista de solicitudes
- Eliminar registros
- Preparado para actualización

###  Dashboard Interactivo
- Total de solicitudes
- Solicitudes pendientes
- Solicitudes en proceso
- Solicitudes resueltas

###  Visualización de Datos
- Gráfica dinámica tipo *doughnut*
- Actualización automática al registrar/eliminar datos

###  Interfaz Responsiva
- Diseño adaptable a diferentes dispositivos
- Menú lateral desplegable

---

##  Flujo de Funcionamiento

1. El usuario ingresa datos en el formulario
2. El frontend envía la información al backend -Flask-
3. El backend guarda los datos en `data.json`
4. Se actualiza la tabla automáticamente
5. Se recalculan estadísticas
6. Se actualiza la gráfica en tiempo real

---

##  Ejecución
### 1. Clonar el repositorio
```
git clone https://github.com/leonardo-200224/GestionCall.git
2. Instalar dependencias
pip install flask
3. Ejecutar el servidor
python app.py
4. Abrir en navegador
http://127.0.0.1:5000
```
