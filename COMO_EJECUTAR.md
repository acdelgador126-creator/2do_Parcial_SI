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

## 🔄 Cómo Reiniciar y Poblar la Base de Datos desde Cero

Si deseas limpiar la base de datos PostgreSQL, recrear la estructura de tablas limpia y poblar el sistema con la población completa de **1600 postulantes**, sigue estos pasos:

1. Abre una terminal en el directorio `backend`:
   ```bash
   cd backend
   ```
2. Ejecuta el comando de refresco y siembra de Laravel:
   ```bash
   php artisan migrate:fresh --seed
   ```
   *Este comando eliminará todas las tablas en la base de datos PostgreSQL, volverá a crearlas ejecutando todas las migraciones del sistema, las poblará con los 1,600+ registros reales de la población usando `INSERTS_POBLACION_COMPLETA.sql`, y realizará las siguientes configuraciones automáticas:*
   - **Gestión activa:** Se activa la gestión `1-2026` y se asocian todos los postulantes a ella.
   - **Estado Inscrito:** Todos los postulantes quedan en estado `Inscrito`, listos para ser asignados a paralelos/grupos, asignación de docentes, o realizar simulacros de examen.
   - **Requisitos y pagos:** Se marcan todos sus requisitos como validados al 100% y se les genera un historial de pago exitoso de matrícula por Stripe.
   - **Cuentas administrativas:** Se crean/actualizan las cuentas de acceso del personal con contraseñas conocidas.
   - **Sincronización:** Se alinean las secuencias auto-incrementables de PostgreSQL para evitar colisiones de llaves duplicadas.

3. Para listar y verificar las tablas creadas, puedes ejecutar:
   ```bash
   php check_tables.php
   ```

---

## 🔑 Credenciales de Acceso por Defecto

Para iniciar sesión en el portal (`http://localhost:5173`), utiliza las siguientes credenciales:

| Rol | Correo Electrónico | Contraseña |
| --- | --- | --- |
| **Administrador** | `admin@ficct.uagrm.edu.bo` | `Admin2026!` |
| **Coordinador** | `coordinador@ficct.uagrm.edu.bo` | `Coord2026!` |
| **Docente** | `docente@ficct.uagrm.edu.bo` | `Docente2026!` |
| **Postulante de Prueba** | `postulante@gmail.com` | `Post2026!` |

---

## 🎯 Estado Inicial del Sistema para Casos de Uso

Una vez sembrada la base de datos, el sistema se encuentra listo para probar los siguientes flujos de trabajo sin necesidad de pasos previos:

1. **Gestión de Grupos y Paralelos:** Ingresa como **Administrador** o **Coordinador**, ve a la pestaña de **Grupos** y haz clic en **Planificación / Asignación Masiva** para distribuir de forma automática a los 1,600+ estudiantes en paralelos de hasta 70 personas por aula.
2. **Asignación de Docentes:** Desde la pestaña **Docentes**, asigna docentes a las materias del paralelo asegurando que no excedan las 4 materias de carga académica.
3. **Simulacro de Examen:** Ingresa como **Postulante de Prueba** y realiza simulacros de examen interactivos con carga de preguntas reales.
4. **Calificaciones y Admisiones:** Utiliza el panel administrativo para asentar notas, auditar los cambios en las notas, y determinar los admitidos según la capacidad de cupos de cada carrera.
