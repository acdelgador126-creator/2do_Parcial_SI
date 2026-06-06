-- ==============================================================================
-- DDL DE CREACION DE BASE DE DATOS - SISTEMA CUP FICCT
-- MOTOR: PostgreSQL 16+
-- 21 tablas en total
-- DESCRIPCIÓN: Define la estructura lógica y física de la base de datos relacional
--              para el Sistema de Admisión y Curso Preuniversitario (CUP) de la FICCT.
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- 1. MÓDULO DE AUTENTICACIÓN, ROLES Y AUDITORÍA DE ACCESOS
-- ==============================================================================

-- Tabla: users
-- Propósito: Almacena las cuentas de acceso al sistema con contraseñas encriptadas.
-- Roles permitidos: Administrador, Coordinador, Docente, Postulante.
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL, -- Nombre de usuario para el login
    password VARCHAR(255) NOT NULL, -- Almacenada como hash Bcrypt
    role VARCHAR(50) NOT NULL CHECK (role IN ('Administrador', 'Coordinador', 'Docente', 'Postulante')),
    active BOOLEAN DEFAULT TRUE, -- Habilita o deshabilita la cuenta
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: bitacora_accesos
-- Propósito: Bitácora inmutable para registrar el historial de ingresos y salidas del sistema.
CREATE TABLE bitacora_accesos (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    ip_address VARCHAR(45) NOT NULL, -- Dirección IP del dispositivo
    action VARCHAR(255) NOT NULL, -- Detalle de la acción (ej. "LOGIN", "LOGOUT")
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==============================================================================
-- 2. MÓDULO DE CONFIGURACIÓN ACADÉMICA Y CONTROL DE CUPOS
-- ==============================================================================

-- Tabla: gestiones
-- Propósito: Configura los períodos académicos del CUP (ej. '1-2026', '2-2026').
CREATE TABLE gestiones (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(10) UNIQUE NOT NULL, -- Código identificador único
    activa BOOLEAN DEFAULT FALSE, -- Solo una gestión puede estar activa a la vez
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: carreras
-- Propósito: Catálogo maestro de las carreras evaluadas en la FICCT.
CREATE TABLE carreras (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    codigo VARCHAR(10) UNIQUE NOT NULL -- Código de carrera asignado por la UAGRM
);

-- Tabla: cupos_gestion
-- Propósito: Define el límite máximo de admisión y el stock de vacantes por carrera en cada gestión.
CREATE TABLE cupos_gestion (
    id BIGSERIAL PRIMARY KEY,
    gestion_id BIGINT NOT NULL,
    carrera_id BIGINT NOT NULL,
    cupo_maximo INT NOT NULL CHECK (cupo_maximo >= 0),
    cupos_disponibles INT NOT NULL CHECK (cupos_disponibles >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gestion_id) REFERENCES gestiones(id) ON DELETE CASCADE,
    FOREIGN KEY (carrera_id) REFERENCES carreras(id) ON DELETE CASCADE,
    UNIQUE (gestion_id, carrera_id)
);

-- ==============================================================================
-- 3. MÓDULO DE REGISTRO, VERIFICACIÓN Y PAGOS DEL POSTULANTE
-- ==============================================================================

-- Tabla: postulantes
-- Propósito: Almacena los perfiles de los postulantes, sus preferencias de carrera y estado académico.
CREATE TABLE postulantes (
    id BIGSERIAL PRIMARY KEY,
    ci VARCHAR(20) UNIQUE NOT NULL, -- Cédula de Identidad única
    nombres VARCHAR(150) NOT NULL,
    apellidos VARCHAR(150) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    sexo CHAR(1) NOT NULL CHECK (sexo IN ('M', 'F')),
    direccion VARCHAR(255),
    telefono VARCHAR(20),
    email VARCHAR(150) NOT NULL,
    colegio_procedencia VARCHAR(150),
    ciudad VARCHAR(100) DEFAULT 'Santa Cruz de la Sierra',
    titulo_bachiller VARCHAR(255), -- Ruta o URL del documento digitalizado
    primera_opcion_id BIGINT NOT NULL,
    segunda_opcion_id BIGINT NOT NULL,
    turno_preferencia VARCHAR(20) NOT NULL CHECK (turno_preferencia IN ('Manana', 'Tarde', 'Noche')),
    gestion_id BIGINT NOT NULL,
    estado VARCHAR(50) DEFAULT 'Preinscrito' CHECK (
        estado IN ('Preinscrito', 'Verificado', 'Inscrito', 'En Evaluacion', 'Aprobado', 'Reprobado', 'Pendiente Reasignacion')
    ),
    recurrente BOOLEAN DEFAULT FALSE, -- Flag para detectar postulantes recurrentes
    user_id BIGINT DEFAULT NULL, -- Vinculación con su cuenta de acceso
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (primera_opcion_id) REFERENCES carreras(id),
    FOREIGN KEY (segunda_opcion_id) REFERENCES carreras(id),
    FOREIGN KEY (gestion_id) REFERENCES gestiones(id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_opciones_diferentes CHECK (primera_opcion_id <> segunda_opcion_id)
);

-- Tabla: requisitos_documentales
-- Propósito: Lista de control digitalizada de la documentación requerida por el postulante.
CREATE TABLE requisitos_documentales (
    id BIGSERIAL PRIMARY KEY,
    postulante_id BIGINT UNIQUE NOT NULL,
    ci_digitalizado BOOLEAN DEFAULT FALSE,
    certificado_nacimiento BOOLEAN DEFAULT FALSE,
    titulo_bachiller_legalizado BOOLEAN DEFAULT FALSE,
    formulario_preinscripcion BOOLEAN DEFAULT FALSE,
    verificado_bd_externa BOOLEAN DEFAULT FALSE, -- Confirmación de APIs SEGIP/SEDUCA
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (postulante_id) REFERENCES postulantes(id) ON DELETE CASCADE
);

-- Tabla: pagos
-- Propósito: Registra las transacciones financieras exitosas procesadas por Stripe.
CREATE TABLE pagos (
    id BIGSERIAL PRIMARY KEY,
    postulante_id BIGINT NOT NULL,
    stripe_checkout_id VARCHAR(255) UNIQUE NOT NULL, -- Identificador único de Stripe
    monto DECIMAL(10,2) NOT NULL CHECK (monto > 0),
    estado_pago VARCHAR(50) NOT NULL, -- Estado del pago (succeeded, pending, etc.)
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (postulante_id) REFERENCES postulantes(id) ON DELETE CASCADE
);

-- ==============================================================================
-- 4. MÓDULO DE PLANIFICACIÓN DE GRUPOS, HORARIOS Y MATERIAS
-- ==============================================================================

-- Tabla: materias
-- Propósito: Catálogo maestro de las materias evaluadas en el CUP (Computación, Física, etc.).
CREATE TABLE materias (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    codigo VARCHAR(10) UNIQUE NOT NULL
);

-- Tabla: aulas
-- Propósito: Registro de aulas físicas de la FICCT con su capacidad límite.
CREATE TABLE aulas (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    capacidad INT NOT NULL CHECK (capacidad > 0),
    ubicacion VARCHAR(100)
);

-- Tabla: grupos
-- Propósito: Grupos habilitados por gestión, asignados a un aula y horario/turno específico.
CREATE TABLE grupos (
    id BIGSERIAL PRIMARY KEY,
    numero INT NOT NULL, -- Número secuencial de grupo
    gestion_id BIGINT NOT NULL,
    turno VARCHAR(20) NOT NULL CHECK (turno IN ('Manana', 'Tarde', 'Noche')),
    aula_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gestion_id) REFERENCES gestiones(id) ON DELETE CASCADE,
    FOREIGN KEY (aula_id) REFERENCES aulas(id),
    UNIQUE (gestion_id, turno, numero)
);

-- Tabla: asignaciones_grupo
-- Propósito: Asigna a cada postulante a un grupo de estudio único por gestión.
CREATE TABLE asignaciones_grupo (
    id BIGSERIAL PRIMARY KEY,
    postulante_id BIGINT UNIQUE NOT NULL,
    grupo_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (postulante_id) REFERENCES postulantes(id) ON DELETE CASCADE,
    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE
);

-- ==============================================================================
-- 5. MÓDULO DE GESTIÓN DE DOCENTES Y ASIGNACIONES DE CÁTEDRA
-- ==============================================================================

-- Tabla: docentes
-- Propósito: Perfil profesional del docente contratado para dictar clases en el CUP.
CREATE TABLE docentes (
    id BIGSERIAL PRIMARY KEY,
    ci VARCHAR(20) UNIQUE NOT NULL,
    nombres VARCHAR(150) NOT NULL,
    apellidos VARCHAR(150) NOT NULL,
    especialidad VARCHAR(100) NOT NULL,
    grado_academico VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL,
    user_id BIGINT DEFAULT NULL, -- Vinculación con su cuenta de acceso
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabla: asignaciones_docente
-- Propósito: Relaciona a un docente con el grupo y la materia que imparte (máximo 4 grupos).
CREATE TABLE asignaciones_docente (
    id BIGSERIAL PRIMARY KEY,
    docente_id BIGINT NOT NULL,
    grupo_id BIGINT NOT NULL,
    materia_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (docente_id) REFERENCES docentes(id) ON DELETE CASCADE,
    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE,
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
    UNIQUE (grupo_id, materia_id) -- Un grupo solo tiene un docente por materia
);

-- ==============================================================================
-- 6. MÓDULO DE EVALUACIÓN ACADÉMICA Y ADMISIÓN MERITOCRÁTICA
-- ==============================================================================

-- Tabla: examenes
-- Propósito: Almacena las calificaciones parciales de los 3 exámenes por materia por postulante.
CREATE TABLE examenes (
    id BIGSERIAL PRIMARY KEY,
    postulante_id BIGINT NOT NULL,
    materia_id BIGINT NOT NULL,
    numero_examen INT NOT NULL CHECK (numero_examen IN (1, 2, 3)),
    nota DECIMAL(5,2) NOT NULL CHECK (nota BETWEEN 0 AND 100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (postulante_id) REFERENCES postulantes(id) ON DELETE CASCADE,
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
    UNIQUE (postulante_id, materia_id, numero_examen) -- Restringe a 3 exámenes máximos
);

-- Tabla: notas_finales
-- Propósito: Almacena el promedio ponderado calculado (30%-30%-40%) y el estado por materia.
CREATE TABLE notas_finales (
    id BIGSERIAL PRIMARY KEY,
    postulante_id BIGINT NOT NULL,
    materia_id BIGINT NOT NULL,
    promedio DECIMAL(5,2) NOT NULL CHECK (promedio BETWEEN 0 AND 100),
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('APROBADO', 'REPROBADO')),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (postulante_id) REFERENCES postulantes(id) ON DELETE CASCADE,
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
    UNIQUE (postulante_id, materia_id)
);

-- Tabla: admisiones
-- Propósito: Registro definitivo de la admisión del postulante a una carrera.
CREATE TABLE admisiones (
    id BIGSERIAL PRIMARY KEY,
    postulante_id BIGINT UNIQUE NOT NULL,
    carrera_id BIGINT NOT NULL,
    via VARCHAR(50) NOT NULL CHECK (via IN ('1ra Opcion', '2da Opcion', 'Reasignacion Administrativa')),
    fecha_admision TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (postulante_id) REFERENCES postulantes(id) ON DELETE CASCADE,
    FOREIGN KEY (carrera_id) REFERENCES carreras(id)
);

-- Tabla: preguntas_simulacro
-- Propósito: Banco de preguntas de opción múltiple con respuestas correctas para práctica de postulantes.
CREATE TABLE preguntas_simulacro (
    id BIGSERIAL PRIMARY KEY,
    materia_id BIGINT NOT NULL,
    enunciado TEXT NOT NULL,
    opciones TEXT NOT NULL, -- Guardado como formato estructurado JSON en texto
    respuesta_correcta VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE
);

-- ==============================================================================
-- 7. MÓDULOS DE COMUNICACIÓN Y AUDITORÍA DE CALIFICACIONES (DIFERENCIADORES)
-- ==============================================================================

-- Tabla: notificaciones
-- Propósito: Almacena las alertas y mensajes en tiempo real generados por el sistema.
CREATE TABLE notificaciones (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    tipo_evento VARCHAR(50) NOT NULL, -- Categoría del mensaje
    mensaje TEXT NOT NULL,
    estado VARCHAR(15) DEFAULT 'NO_LEIDA' CHECK (estado IN ('LEIDA', 'NO_LEIDA')),
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_lectura TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla: conversaciones_chatbot
-- Propósito: Guarda el historial de interacciones del chatbot con los postulantes.
CREATE TABLE conversaciones_chatbot (
    id BIGSERIAL PRIMARY KEY,
    postulante_id BIGINT NOT NULL,
    pregunta TEXT NOT NULL,
    respuesta TEXT,
    resuelta BOOLEAN DEFAULT FALSE,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (postulante_id) REFERENCES postulantes(id) ON DELETE CASCADE
);

-- Tabla: auditoria_notas
-- Propósito: Bitácora para auditar cambios manuales de notas realizados por el Administrador.
CREATE TABLE auditoria_notas (
    id BIGSERIAL PRIMARY KEY,
    examen_id BIGINT NOT NULL,
    usuario_modificador_id BIGINT NOT NULL,
    nota_anterior DECIMAL(5,2),
    nota_nueva DECIMAL(5,2),
    motivo TEXT,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (examen_id) REFERENCES examenes(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_modificador_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==============================================================================
-- 8. ÍNDICES DE RENDIMIENTO (OPTIMIZACIÓN DE CONSULTAS)
-- ==============================================================================

CREATE INDEX idx_postulantes_ci ON postulantes(ci);
CREATE INDEX idx_postulantes_estado ON postulantes(estado);
CREATE INDEX idx_postulantes_primera_opcion ON postulantes(primera_opcion_id);
CREATE INDEX idx_postulantes_segunda_opcion ON postulantes(segunda_opcion_id);
CREATE INDEX idx_examenes_postulante ON examenes(postulante_id);
CREATE INDEX idx_notas_finales_postulante ON notas_finales(postulante_id);
CREATE INDEX idx_asignaciones_grupo_postulante ON asignaciones_grupo(postulante_id);
CREATE INDEX idx_preguntas_simulacro_materia ON preguntas_simulacro(materia_id);
CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX idx_conversaciones_chatbot_postulante ON conversaciones_chatbot(postulante_id);
CREATE INDEX idx_auditoria_notas_examen ON auditoria_notas(examen_id);

COMMIT;
