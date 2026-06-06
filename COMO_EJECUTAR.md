# 🚀 Guía Rápida para Ejecutar el Proyecto Localmente

Esta guía te explica cómo iniciar los servidores de desarrollo y cómo reiniciar la base de datos PostgreSQL cuando lo necesites.

---

## 💻 Ejecución Diaria (Levantar el Proyecto)

Para trabajar en el proyecto, necesitas ejecutar el **Backend** y el **Frontend** al mismo tiempo en terminales separadas. Asegúrate de que tu servicio local de PostgreSQL esté activo.

### Paso 1: Iniciar el Backend (Laravel API)
1. Abre una terminal.
2. Navega al directorio `backend`:
   ```bash
   cd backend
   ```
3. Inicia el servidor web de PHP:
   ```bash
   php -S 127.0.0.1:8000 -t public public/index.php
   ```
   *(Esto levantará la API de Laravel en `http://127.0.0.1:8000` con soporte para rutas amigables).*

---

### Paso 2: Iniciar el Frontend (React + Vite)
1. Abre una **segunda** terminal.
2. Navega al directorio `frontend`:
   ```bash
   cd frontend
   ```
3. Inicia el servidor de desarrollo de Vite:
   ```bash
   npm run dev
   ```
4. Abre tu navegador e ingresa a: **[http://localhost:5173](http://localhost:5173)**

*Nota: Todas las llamadas de la interfaz a `/api/*` se redirigirán automáticamente al servidor API del backend en el puerto 8000.*

---

## 🔄 Cómo Reiniciar la Base de Datos (Opcional)

Si en algún momento deseas limpiar la base de datos PostgreSQL, borrar los registros y volver a crear todas las tablas con los datos de prueba desde cero, sigue estos pasos:

1. Abre una terminal en el directorio `backend`:
   ```bash
   cd backend
   ```
2. Ejecuta el comando de refresco y siembra de Laravel:
   ```bash
   php artisan migrate:fresh --seed
   ```
   *Este comando eliminará todas las tablas existentes en la base de datos `cup_v2`, las volverá a crear y las poblará con más de 500+ registros de prueba (postulantes, docentes, aulas, exámenes, etc.).*

3. Si deseas verificar que las tablas se hayan creado correctamente, puedes correr el script de diagnóstico:
   ```bash
   php check_tables.php
   ```
