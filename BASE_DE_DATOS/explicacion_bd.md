# Documentación Completa de la Base de Datos
## Sistema Web de Gestión del Proceso de Admisión y Curso Preuniversitario (CUP) — FICCT UAGRM

---

## ¿Qué es este documento?

Este documento explica **todas las decisiones de diseño** que tomamos para construir la base de datos del sistema CUP de la FICCT. No solo describe qué tablas existen, sino **por qué existen**, **cómo se relacionan** entre sí y **qué reglas de negocio** del enunciado del parcial están reflejadas directamente en la estructura de datos.

El script SQL que acompaña a este documento (`script_bd.sql`) está listo para ejecutarse en **PostgreSQL** y crea las 23 tablas del sistema con todas sus restricciones.

---

## Parte 1: Del Diagrama de Clases a PostgreSQL

### ¿Qué es el Diagrama de Clases y por qué lo hicimos primero?

Antes de escribir una sola línea de SQL, construimos un **Diagrama de Clases UML**. Este diagrama es el "plano arquitectónico" de la base de datos. Nos permite:

1. **Identificar las entidades** del negocio (postulantes, docentes, grupos, etc.).
2. **Definir los atributos** de cada entidad (qué datos necesita guardar).
3. **Establecer las relaciones** entre entidades (¿cómo se conectan?).
4. **Definir los métodos** (qué operaciones puede realizar cada entidad).

Cada **clase** del diagrama se convierte en una **tabla** en PostgreSQL. Cada **atributo** de la clase se convierte en una **columna** de esa tabla. Cada **relación** entre clases se implementa mediante **Llaves Foráneas (FOREIGN KEY / FK)**.

### ¿Qué tiene una clase en el Diagrama de Clases?

Una clase en UML tiene 3 compartimentos:

```
┌─────────────────────────┐
│       NombreClase       │  ← 1er compartimento: Nombre
├─────────────────────────┤
│  +tipo atributo1        │  ← 2do compartimento: ATRIBUTOS
│  +tipo atributo2        │     (se convierten en columnas SQL)
├─────────────────────────┤
│  +metodo1() : tipo      │  ← 3er compartimento: MÉTODOS
│  +metodo2() : tipo      │     (se convierten en funciones de Laravel)
└─────────────────────────┘
```

Los **métodos** son las acciones que la clase puede realizar. Por ejemplo:
- `verificarRequisitos() : Boolean` → Una función que revisa si el postulante cumplió todos los requisitos y devuelve `true` o `false`.
- `detectarRecurrente(ci) : Boolean` → Busca si ese Carnet de Identidad ya existe en la BD de intentos anteriores.
- `calcularPromedioPonderado() : DECIMAL` → Hace el cálculo matemático 30%+30%+40%.
- `getCargaHoraria() : INT` → Cuenta cuántos grupos tiene asignados un docente.

---

## Parte 2: Las 23 Tablas — Organizadas por Módulo

Las tablas se crearon en un orden específico: primero las que no dependen de nadie (tablas catálogo), y luego las que referencian a las anteriores. Esto es obligatorio en SQL porque si intentas crear una tabla que apunta a otra que aún no existe, PostgreSQL lanza un error.

### GRUPO 1: Tablas Catálogo (Sin dependencias)

Estas tablas son el "diccionario" del sistema. Se crean primero porque todas las demás las necesitan.

| Tabla | ¿Para qué sirve? |
|---|---|
| `roles` | Guarda los 4 tipos de usuario: Administrador, Coordinador, Docente y Postulante |
| `gestiones_academicas` | Guarda los semestres académicos (ej: "1-2026", "2-2026") |
| `carreras` | Las 4 carreras de la FICCT: Informática, Sistemas, Redes, Robótica |
| `materias` | Las 4 materias del CUP: Computación, Matemáticas, Inglés, Física |
| `aulas` | Las aulas físicas de la facultad con su número y capacidad |
| `requisitos` | El catálogo de documentos que debe presentar el postulante (CI, Título de Bachiller, etc.) |

### GRUPO 2: Tablas Principales de Usuario y Seguridad

| Tabla | ¿Para qué sirve? |
|---|---|
| `usuarios` | Las credenciales de acceso al sistema (email, contraseña, rol). Solo existen si el postulante pagó |
| `bitacora_accesos` | Registro inmutable de cada vez que alguien entra o sale del sistema (LOGIN/LOGOUT) |

### GRUPO 3: Tablas de Negocio

| Tabla | ¿Para qué sirve? |
|---|---|
| `cupos_carreras` | Define cuántos cupos tiene cada carrera en cada gestión. Controla cuánto se ha ocupado |
| `postulantes` | La entidad más importante: todos los datos del aspirante al CUP |
| `docentes` | Los profesores contratados para dar clases en el CUP |
| `grupos` | Los grupos de estudio organizados por turno (Mañana, Tarde, Noche) |

### GRUPO 4: Tablas Intermedias (Relaciones M:N)

| Tabla | ¿Para qué sirve? |
|---|---|
| `pagos` | Registra el pago realizado por cada postulante mediante Stripe |
| `requisitos_postulantes` | Controla cuáles requisitos cumplió cada postulante específico |
| `postulantes_grupos` | Asigna a cada postulante a su grupo de estudio |
| `asignaciones_docentes` | Asigna a cada docente a un grupo para enseñar una materia |

### GRUPO 5: Tablas de Evaluación

| Tabla | ¿Para qué sirve? |
|---|---|
| `examenes` | Guarda las notas individuales de cada examen (3 por materia) |
| `auditoria_notas` | Registro de quién modificó una nota, cuándo y por qué |
| `resultados_materias` | El promedio ponderado calculado por cada materia (¿aprobó esa materia específica?) |
| `resultados_finales` | El estado final del postulante: APROBADO o REPROBADO |

### GRUPO 6: Tablas de Admisión y Comunicación

| Tabla | ¿Para qué sirve? |
|---|---|
| `admisiones` | La carrera a la que fue admitido un postulante aprobado |
| `notificaciones` | Mensajes en tiempo real enviados a los usuarios del sistema |
| `conversaciones_chatbot` | Historial de preguntas y respuestas del asistente virtual |

---

## Parte 3: Las Clases Intermedias (Tablas Pivote)

Este fue uno de los temas más importantes que analizamos. Una **clase intermedia** nace cuando dos o más entidades tienen una relación de **Muchos a Muchos (M:N)**, y además esa relación tiene **datos propios**.

### ¿Por qué no se puede modelar M:N directamente?

Imagina esta situación sin tabla intermedia: Un postulante tiene varios requisitos. Si intentaras guardar esto en la tabla `postulantes`, necesitarías columnas como `requisito1`, `requisito2`, `requisito3`... Eso es un diseño terrible porque:
- No sabes cuántos requisitos puede haber en el futuro.
- No puedes guardar datos sobre **cada requisito** (¿lo cumplió?, ¿cuándo?, ¿subió el PDF?).

**La solución es la tabla intermedia:** cada fila representa un cruce específico entre un postulante y un requisito.

### Las Clases Intermedias del Sistema

#### 1. `requisitos_postulantes` (Postulante ↔ Requisito)
```
Postulante ──────────────────── RequisitoPostulante ──────────────────── Requisito
 (Juan Pérez)                  ┌──────────────────┐                    (Título Bachiller)
                               │ postulante_id: 5 │
                               │ requisito_id: 2  │
                               │ cumplido: TRUE   │
                               │ documento_url:.. │
                               │ fecha_verif: ... │
                               └──────────────────┘
```
Esta tabla también es la "llave de acceso" al pago: si todos los `cumplido` de un postulante son `TRUE`, recién se habilita el botón de pago Stripe.

#### 2. `postulantes_grupos` (Postulante ↔ Grupo)
```
Postulante ──────────────────── PostulanteGrupo ──────────────────── Grupo
 (Juan Pérez)                  ┌─────────────────┐                  (Grupo 3, Mañana)
                               │ postulante_id: 5│
                               │ grupo_id: 3     │
                               │ fecha_asignacion│
                               └─────────────────┘
```
Un grupo tiene máximo 70 postulantes. Esta tabla permite saber exactamente quién está en qué grupo.

#### 3. `asignaciones_docentes` (Docente ↔ Grupo, con Materia como asociación)

Esta fue la tabla más interesante que debatimos. Hay dos formas válidas de modelarla:

**Opción A (Relación Ternaria):** Los tres participan en igualdad.
```
Docente ──┐
          ├── AsignacionDocente
Grupo ────┤
          │
Materia ──┘
```

**Opción B (Tu propuesta, más semántica):** La relación principal es Docente-Grupo, y la Materia es lo que "propósito" le da a esa asignación.
```
Docente ──┐
          ├── AsignacionDocente ──► Materia
Grupo ────┘   (la intermedia apunta a la materia)
```

**La segunda opción es más correcta semánticamente** porque la pregunta de negocio real es: *"¿A qué grupo fue asignado este docente, y para enseñar qué materia?"*. La materia es el motivo de la asignación, no un participante de igual jerarquía. En la base de datos ambas generan la misma tabla, pero en el Diagrama de Clases la segunda lectura es más natural.

---

## Parte 4: El Flujo del Pago y el Acceso al Sistema

Uno de los temas más importantes que discutimos: **¿cómo sabe el sistema que un postulante ya pagó y puede acceder?**

### El flujo secuencial (Gate por Gate)

```
PASO 1                PASO 2                   PASO 3             PASO 4
┌──────────────┐     ┌─────────────────────┐   ┌──────────────┐  ┌────────────────┐
│  Postulante  │────►│ ¿Todos los          │──►│  Pasarela    │─►│  Se crea el    │
│  se registra │     │ requisitos          │   │  Stripe      │  │  Usuario con   │
│  estado:     │     │ cumplido = TRUE?    │   │  procesa     │  │  estado:ACTIVO │
│  PREINSCRITO │     │                     │   │  el pago     │  │  usuario_id FK │
└──────────────┘     └─────────────────────┘   └──────────────┘  └────────────────┘
 usuario_id = NULL      Gate 1: Requisitos      Gate 2: Pago       Gate 3: Acceso
```

### ¿Qué pasa con los postulantes que NO pagan?

Simplemente se quedan en la tabla `postulantes` con:
- `estado = 'PREINSCRITO'`
- `usuario_id = NULL`

Como `usuario_id` es `NULL`, **nunca podrán iniciar sesión** porque no existen en la tabla `usuarios`. Esta es la protección arquitectónica principal.

Para que no se acumulen indefinidamente, el sistema implementa dos estrategias:
1. **Limpieza por Gestión:** Cuando el Administrador cierra una gestión académica, todos los `PREINSCRITOS` pasan a `estado = 'ANULADO'`.
2. **Postulante Recurrente:** Si la misma persona vuelve el próximo semestre, el método `detectarRecurrente(ci)` la identifica por su CI y reutiliza su registro (no crea un duplicado), simplemente lo actualiza a la nueva gestión.

---

## Parte 5: El Sistema de Roles (RBAC)

La clase `Rol` existe para implementar **RBAC (Role-Based Access Control)** — Control de Acceso Basado en Roles. En lugar de asignar permisos usuario por usuario, se definen una vez en el rol y todos los usuarios de ese rol los heredan automáticamente.

La tabla `roles` tiene exactamente **4 registros** que representan los 4 actores del sistema:

| ID | Rol | ¿Qué puede hacer? |
|---|---|---|
| 1 | **Administrador** | Control total: gestiones, cupos, notas, usuarios. Es el único que registra las notas de los exámenes |
| 2 | **Coordinador** | Supervisión: revisa grupos, docentes, ejecuta asignación de carreras, genera reportes |
| 3 | **Docente** | Acceso restringido: solo ve sus propios grupos asignados y las estadísticas de sus estudiantes |
| 4 | **Postulante** | Acceso personal: ve su grupo, horario, notas propias y resultado final |

El campo `rol_id` en la tabla `usuarios` es la FK que conecta a cada usuario con uno de estos 4 roles. Cuando Laravel hace el login, lee ese campo y decide qué menús y funcionalidades mostrar.

---

## Parte 6: El Atributo `es_recurrente` en Postulantes

Este campo `BOOLEAN` responde a una regla de negocio específica del enunciado del parcial:

> *"Un postulante que reprobó y desea volver a intentarlo en la siguiente gestión, NO debe re-registrarse como nuevo. Debe conservar su código original."*

**Funcionamiento:**
- Primera inscripción: `es_recurrente = FALSE`
- Si reprueba y vuelve a inscribirse el siguiente semestre: el sistema detecta su CI, actualiza su `gestion_id` a la nueva gestión, cambia el estado a `PREINSCRITO` y pone `es_recurrente = TRUE`

**¿Para qué sirve en reportes?** Permite saber cuántos de los inscritos son **nuevos** vs cuántos son **intentos repetidos**, lo cual es una estadística valiosa para las autoridades de la FICCT.

---

## Parte 7: Las Reglas de Negocio Implementadas en la BD

Estas son las reglas del enunciado del parcial que están **blindadas directamente en la base de datos** (no solo en el código PHP), para que sea imposible violarlas:

### Regla 1: Solo 3 exámenes por materia
```sql
numero_examen INT CHECK (numero_examen IN (1, 2, 3)),
UNIQUE(postulante_id, materia_id, numero_examen)
```
- `CHECK`: La columna solo acepta el valor 1, 2 o 3. Nada más.
- `UNIQUE` compuesto: Un mismo postulante no puede tener dos filas con la misma materia y el mismo número de examen. Es decir, no puede haber dos "Examen 1 de Matemáticas" para Juan.

### Regla 2: Notas entre 0 y 100
```sql
nota DECIMAL(5,2) CHECK (nota >= 0 AND nota <= 100)
```
PostgreSQL rechaza automáticamente cualquier nota fuera de ese rango, sin importar qué diga el código PHP.

### Regla 3: Aprobación ≥ 60 por CADA materia (no el promedio general)
Esta es la regla de negocio más crítica que mencionó el profesor. No basta con que el promedio general de las 4 materias sea ≥ 60. **Cada materia individualmente** debe ser ≥ 60.

Se implementa así:
- La tabla `resultados_materias` guarda el `promedio_ponderado` y el `estado_materia` ('APROBADO'/'REPROBADO') por cada materia individual.
- La tabla `resultados_finales` solo marca `estado_final = 'APROBADO'` si **las 4 filas** correspondientes a ese postulante en `resultados_materias` tienen `estado_materia = 'APROBADO'`.

### Regla 4: Asignación de carrera (1ª opción → 2ª opción)
Se controla con la tabla `cupos_carreras` que tiene los campos `cupo_maximo` y `cupo_ocupado`. El algoritmo de asignación:
1. Revisa si `cupo_ocupado < cupo_maximo` en la primera carrera del postulante.
2. Si hay cupo, registra en `admisiones` con `mecanismo_asignacion = 'Primera opción'`.
3. Si no hay cupo, revisa la segunda carrera.
4. Si tampoco hay, queda como `'Reasignación administrativa'`.

### Regla 5: Docente máximo 4 grupos
```sql
UNIQUE(docente_id, grupo_id, materia_id)
```
El método `puedeAsignarGrupo()` en Laravel cuenta cuántas filas existen en `asignaciones_docentes` para ese `docente_id`. Si son 4, bloquea la asignación.

---

## Parte 8: Conceptos Clave del SQL Utilizado

A continuación se explica en detalle cada palabra clave usada en el script:

### `SERIAL PRIMARY KEY`
`SERIAL` es un tipo de dato especial de PostgreSQL que genera automáticamente un número entero que se va incrementando (1, 2, 3, 4...) cada vez que insertas un nuevo registro. Al ser `PRIMARY KEY`, garantiza que ese número sea único en toda la tabla y que nunca sea NULL. Es el identificador único de cada fila.

### `FOREIGN KEY / REFERENCES`
```sql
rol_id INT REFERENCES roles(id)
```
Establece un vínculo entre dos tablas. Le dice a PostgreSQL: *"El valor que se ingrese en `rol_id` de esta tabla DEBE existir como `id` en la tabla `roles`"*. Si intentas insertar un `rol_id = 99` y ese ID no existe en `roles`, PostgreSQL rechaza la operación. Esto se llama **integridad referencial**.

### `ON DELETE CASCADE / RESTRICT / SET NULL`
Define qué pasa con los registros "hijos" si se borra el registro "padre":
- **CASCADE:** Borrado en cascada. Si eliminas un Postulante, se eliminan automáticamente todos sus pagos, notas y requisitos. No quedan datos huérfanos.
- **RESTRICT:** Protección del padre. Si intentas borrar un Rol que tiene usuarios asignados, PostgreSQL lo impide. Primero debes reasignar o borrar los usuarios.
- **SET NULL:** Si borras el padre, el hijo no se borra, pero su campo FK queda como `NULL`. Ejemplo: si borras la cuenta `Usuario` de un docente, el registro del `Docente` sigue existiendo en la BD pero sin usuario vinculado.

### `UNIQUE`
Garantiza que un valor (o combinación de valores) no se repita en toda la tabla.
- **Simple:** `ci VARCHAR(20) UNIQUE` → Dos postulantes no pueden tener el mismo Carnet de Identidad.
- **Compuesto:** `UNIQUE(carrera_id, gestion_id)` → No puede haber dos filas de cupos para la misma carrera en la misma gestión.

### `CHECK`
Una validación que el propio motor de PostgreSQL ejecuta antes de aceptar un dato.
```sql
estado VARCHAR(20) CHECK (estado IN ('ACTIVO', 'INACTIVO', 'BLOQUEADO'))
```
Es una barrera de seguridad adicional e independiente del código PHP.

### `DEFAULT`
Valor que PostgreSQL asigna automáticamente si no se especifica uno al insertar.
- `eliminado BOOLEAN DEFAULT FALSE` → Todo registro nuevo nace sin estar eliminado.
- `intentos_fallidos INT DEFAULT 0` → Todo usuario nuevo comienza con 0 intentos fallidos.
- `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP` → La fecha y hora se guardan automáticamente al momento de la inserción.

### `TIMESTAMP`
Tipo de dato que guarda fecha y hora juntas (ej: `2026-05-29 20:30:00`). Se usa para:
- `created_at`: Saber cuándo se creó el registro.
- `updated_at`: Saber cuándo se modificó por última vez.
- `ultimo_acceso`: Saber cuándo inició sesión por última vez un usuario.
- `fecha_pago`: Cuándo se procesó el pago exactamente.

### `BOOLEAN`
Tipo de dato que solo acepta `TRUE` o `FALSE`. Se usa para banderas (flags):
- `eliminado`: ¿Fue "borrado" lógicamente?
- `es_recurrente`: ¿Es un postulante que ya intentó antes?
- `cumplido`: ¿Entregó este requisito?
- `activa`: ¿Está activa esta materia/carrera?

### `DECIMAL(5,2)`
Número con decimales. El `5` es el total de dígitos y el `2` son los que van después del punto.
- `DECIMAL(5,2)` puede guardar hasta `999.99`.
- Se usa para notas (`85.50`) y montos de pago (`500.00`).

### Soft Delete (Eliminación Lógica)
En lugar de ejecutar `DELETE FROM postulantes WHERE id = 5`, el sistema solo actualiza:
```sql
UPDATE postulantes SET eliminado = TRUE WHERE id = 5;
```
El postulante "desaparece" de las pantallas del administrador, pero el historial completo (sus notas, pagos, asignaciones) permanece intacto en la base de datos. Esto es obligatorio en sistemas académicos para mantener trazabilidad histórica.

---

## Resumen Final: Del Enunciado a la Base de Datos

| Requisito del Enunciado | Implementación en la BD |
|---|---|
| "Verificar requisitos antes del pago" | Tabla `requisitos_postulantes` con campo `cumplido`. `usuario_id = NULL` hasta el pago |
| "Pago mediante pasarela (Stripe)" | Tabla `pagos` con campo `stripe_payment_id` |
| "Solo 3 exámenes por materia" | `CHECK (numero_examen IN (1,2,3))` + `UNIQUE(postulante_id, materia_id, numero_examen)` |
| "Ponderación 30%-30%-40%" | Campo `ponderacion` en tabla `examenes` |
| "Aprobado ≥ 60 por CADA materia" | Tablas `resultados_materias` y `resultados_finales` separadas |
| "Máximo 70 estudiantes por grupo" | Campo `cantidad_estudiantes` controlado por lógica en `postulantes_grupos` |
| "Docente máximo 4 grupos" | Lógica sobre tabla `asignaciones_docentes` |
| "1ª opción → 2ª opción de carrera" | Tabla `cupos_carreras` con `cupo_ocupado` vs `cupo_maximo` + tabla `admisiones` |
| "Postulante recurrente mantiene código" | Campo `es_recurrente` + método `detectarRecurrente(ci)` |
| "Roles y privilegios diferenciados" | Tabla `roles` + campo `rol_id` en `usuarios` (RBAC) |
| "Auditoría de notas modificadas" | Tabla `auditoria_notas` con quién, cuándo y valor anterior/nuevo |
| "Notificaciones en tiempo real" | Tabla `notificaciones` (se combina con WebSockets en Laravel) |
| "Chatbot / Asistente Virtual" | Tabla `conversaciones_chatbot` para guardar el historial |
