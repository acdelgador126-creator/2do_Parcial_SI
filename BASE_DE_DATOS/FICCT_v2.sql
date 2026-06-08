-- ==============================================================================
-- DDL DE CREACION DE BASE DE DATOS - SISTEMA CUP FICCT
-- MOTOR: PostgreSQL 18.3
-- GENERADO AUTOMÁTICAMENTE DESDE ficct_cup_db
-- ==============================================================================

BEGIN;

-- Tabla: admisiones
CREATE TABLE admisiones (
    id bigint NOT NULL,
    postulante_id bigint NOT NULL,
    carrera_id bigint NOT NULL,
    via character varying(50) NOT NULL,
    fecha_admision timestamp(0) without time zone NOT NULL
);

-- Tabla: asignaciones_docente
CREATE TABLE asignaciones_docente (
    id bigint NOT NULL,
    docente_id bigint NOT NULL,
    grupo_id bigint NOT NULL,
    materia_id bigint NOT NULL,
    created_at timestamp(0) without time zone NOT NULL
);

-- Tabla: asignaciones_grupo
CREATE TABLE asignaciones_grupo (
    id bigint NOT NULL,
    postulante_id bigint NOT NULL,
    grupo_id bigint NOT NULL,
    created_at timestamp(0) without time zone NOT NULL
);

-- Tabla: auditoria_notas
CREATE TABLE auditoria_notas (
    id bigint NOT NULL,
    examen_id bigint NOT NULL,
    usuario_modificador_id bigint NOT NULL,
    nota_anterior numeric(5,2),
    nota_nueva numeric(5,2) NOT NULL,
    motivo text,
    fecha_modificacion timestamp(0) without time zone NOT NULL
);

-- Tabla: aulas
CREATE TABLE aulas (
    id bigint NOT NULL,
    nombre character varying(50) NOT NULL,
    capacidad integer NOT NULL,
    ubicacion character varying(100)
);

-- Tabla: bitacora_accesos
CREATE TABLE bitacora_accesos (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    ip_address character varying(45) NOT NULL,
    action character varying(255) NOT NULL,
    created_at timestamp(0) without time zone NOT NULL
);

-- Tabla: cache
CREATE TABLE cache (
    key character varying(255) NOT NULL,
    value text NOT NULL,
    expiration integer NOT NULL
);

-- Tabla: cache_locks
CREATE TABLE cache_locks (
    key character varying(255) NOT NULL,
    owner character varying(255) NOT NULL,
    expiration integer NOT NULL
);

-- Tabla: carreras
CREATE TABLE carreras (
    id bigint NOT NULL,
    nombre character varying(100) NOT NULL,
    codigo character varying(10) NOT NULL
);

-- Tabla: conversaciones_chatbot
CREATE TABLE conversaciones_chatbot (
    id bigint NOT NULL,
    postulante_id bigint NOT NULL,
    pregunta text NOT NULL,
    respuesta text,
    resuelta boolean NOT NULL,
    fecha timestamp(0) without time zone NOT NULL
);

-- Tabla: cupos_gestion
CREATE TABLE cupos_gestion (
    id bigint NOT NULL,
    gestion_id bigint NOT NULL,
    carrera_id bigint NOT NULL,
    cupo_maximo integer NOT NULL,
    cupos_disponibles integer NOT NULL,
    created_at timestamp(0) without time zone NOT NULL
);

-- Tabla: docentes
CREATE TABLE docentes (
    id bigint NOT NULL,
    ci character varying(20) NOT NULL,
    nombres character varying(150) NOT NULL,
    apellidos character varying(150) NOT NULL,
    especialidad character varying(100) NOT NULL,
    grado_academico character varying(100) NOT NULL,
    correo character varying(150) NOT NULL,
    created_at timestamp(0) without time zone NOT NULL
);

-- Tabla: examenes
CREATE TABLE examenes (
    id bigint NOT NULL,
    postulante_id bigint NOT NULL,
    materia_id bigint NOT NULL,
    numero_examen integer NOT NULL,
    nota numeric(5,2) NOT NULL,
    created_at timestamp(0) without time zone NOT NULL
);

-- Tabla: failed_jobs
CREATE TABLE failed_jobs (
    id bigint NOT NULL,
    uuid character varying(255) NOT NULL,
    connection text NOT NULL,
    queue text NOT NULL,
    payload text NOT NULL,
    exception text NOT NULL,
    failed_at timestamp(0) without time zone NOT NULL
);

-- Tabla: gestiones
CREATE TABLE gestiones (
    id bigint NOT NULL,
    codigo character varying(10) NOT NULL,
    activa boolean NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    created_at timestamp(0) without time zone NOT NULL
);

-- Tabla: grupos
CREATE TABLE grupos (
    id bigint NOT NULL,
    numero integer NOT NULL,
    gestion_id bigint NOT NULL,
    turno character varying(20) NOT NULL,
    aula_id bigint NOT NULL,
    created_at timestamp(0) without time zone NOT NULL
);

-- Tabla: job_batches
CREATE TABLE job_batches (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    total_jobs integer NOT NULL,
    pending_jobs integer NOT NULL,
    failed_jobs integer NOT NULL,
    failed_job_ids text NOT NULL,
    options text,
    cancelled_at integer,
    created_at integer NOT NULL,
    finished_at integer
);

-- Tabla: jobs
CREATE TABLE jobs (
    id bigint NOT NULL,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    attempts smallint NOT NULL,
    reserved_at integer,
    available_at integer NOT NULL,
    created_at integer NOT NULL
);

-- Tabla: materias
CREATE TABLE materias (
    id bigint NOT NULL,
    nombre character varying(50) NOT NULL,
    codigo character varying(10) NOT NULL
);

-- Tabla: migrations
CREATE TABLE migrations (
    id integer NOT NULL,
    migration character varying(255) NOT NULL,
    batch integer NOT NULL
);

-- Tabla: notas_finales
CREATE TABLE notas_finales (
    id bigint NOT NULL,
    postulante_id bigint NOT NULL,
    materia_id bigint NOT NULL,
    promedio numeric(5,2) NOT NULL,
    estado character varying(20) NOT NULL,
    updated_at timestamp(0) without time zone NOT NULL,
    observaciones character varying(255)
);

-- Tabla: notificaciones
CREATE TABLE notificaciones (
    id bigint NOT NULL,
    usuario_id bigint NOT NULL,
    tipo_evento character varying(50) NOT NULL,
    mensaje text NOT NULL,
    estado character varying(15) NOT NULL,
    fecha_generacion timestamp(0) without time zone NOT NULL,
    fecha_lectura timestamp(0) without time zone
);

-- Tabla: pagos
CREATE TABLE pagos (
    id bigint NOT NULL,
    postulante_id bigint NOT NULL,
    stripe_checkout_id character varying(255) NOT NULL,
    monto numeric(10,2) NOT NULL,
    estado_pago character varying(50) NOT NULL,
    fecha_pago timestamp(0) without time zone NOT NULL
);

-- Tabla: password_reset_tokens
CREATE TABLE password_reset_tokens (
    email character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    created_at timestamp(0) without time zone
);

-- Tabla: personal_access_tokens
CREATE TABLE personal_access_tokens (
    id bigint NOT NULL,
    tokenable_type character varying(255) NOT NULL,
    tokenable_id bigint NOT NULL,
    name text NOT NULL,
    token character varying(64) NOT NULL,
    abilities text,
    last_used_at timestamp(0) without time zone,
    expires_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);

-- Tabla: postulantes
CREATE TABLE postulantes (
    id bigint NOT NULL,
    ci character varying(20) NOT NULL,
    nombres character varying(150) NOT NULL,
    apellidos character varying(150) NOT NULL,
    fecha_nacimiento date NOT NULL,
    sexo character(1) NOT NULL,
    direccion character varying(255),
    telefono character varying(20),
    email character varying(150) NOT NULL,
    colegio_procedencia character varying(150),
    ciudad character varying(100) NOT NULL,
    titulo_bachiller character varying(255),
    primera_opcion_id bigint NOT NULL,
    segunda_opcion_id bigint NOT NULL,
    turno_preferencia character varying(20) NOT NULL,
    gestion_id bigint NOT NULL,
    estado character varying(50) NOT NULL,
    recurrente boolean NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);

-- Tabla: preguntas_simulacro
CREATE TABLE preguntas_simulacro (
    id bigint NOT NULL,
    materia_id bigint NOT NULL,
    enunciado text NOT NULL,
    opciones text NOT NULL,
    respuesta_correcta character varying(255) NOT NULL,
    created_at timestamp(0) without time zone NOT NULL
);

-- Tabla: requisitos_documentales
CREATE TABLE requisitos_documentales (
    id bigint NOT NULL,
    postulante_id bigint NOT NULL,
    ci_digitalizado boolean NOT NULL,
    certificado_nacimiento boolean NOT NULL,
    titulo_bachiller_legalizado boolean NOT NULL,
    formulario_preinscripcion boolean NOT NULL,
    verificado_bd_externa boolean NOT NULL,
    updated_at timestamp(0) without time zone NOT NULL
);

-- Tabla: sessions
CREATE TABLE sessions (
    id character varying(255) NOT NULL,
    user_id bigint,
    ip_address character varying(45),
    user_agent text,
    payload text NOT NULL,
    last_activity integer NOT NULL
);

-- Tabla: users
CREATE TABLE users (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    email_verified_at timestamp(0) without time zone,
    password character varying(255) NOT NULL,
    remember_token character varying(100),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    role character varying(50) NOT NULL,
    active boolean NOT NULL,
    intentos_fallidos integer NOT NULL,
    bloqueado_hasta timestamp(0) without time zone
);

-- admisiones_carrera_id_foreign en admisiones
ALTER TABLE admisiones ADD CONSTRAINT admisiones_carrera_id_foreign FOREIGN KEY (carrera_id) REFERENCES carreras(id);
-- admisiones_carrera_id_not_null en admisiones
ALTER TABLE admisiones ADD CONSTRAINT admisiones_carrera_id_not_null NOT NULL carrera_id;
-- admisiones_fecha_admision_not_null en admisiones
ALTER TABLE admisiones ADD CONSTRAINT admisiones_fecha_admision_not_null NOT NULL fecha_admision;
-- admisiones_id_not_null en admisiones
ALTER TABLE admisiones ADD CONSTRAINT admisiones_id_not_null NOT NULL id;
-- admisiones_postulante_id_foreign en admisiones
ALTER TABLE admisiones ADD CONSTRAINT admisiones_postulante_id_foreign FOREIGN KEY (postulante_id) REFERENCES postulantes(id) ON DELETE CASCADE;
-- admisiones_postulante_id_not_null en admisiones
ALTER TABLE admisiones ADD CONSTRAINT admisiones_postulante_id_not_null NOT NULL postulante_id;
-- admisiones_via_not_null en admisiones
ALTER TABLE admisiones ADD CONSTRAINT admisiones_via_not_null NOT NULL via;
-- asignaciones_docente_created_at_not_null en asignaciones_docente
ALTER TABLE asignaciones_docente ADD CONSTRAINT asignaciones_docente_created_at_not_null NOT NULL created_at;
-- asignaciones_docente_docente_id_foreign en asignaciones_docente
ALTER TABLE asignaciones_docente ADD CONSTRAINT asignaciones_docente_docente_id_foreign FOREIGN KEY (docente_id) REFERENCES docentes(id) ON DELETE CASCADE;
-- asignaciones_docente_docente_id_not_null en asignaciones_docente
ALTER TABLE asignaciones_docente ADD CONSTRAINT asignaciones_docente_docente_id_not_null NOT NULL docente_id;
-- asignaciones_docente_grupo_id_foreign en asignaciones_docente
ALTER TABLE asignaciones_docente ADD CONSTRAINT asignaciones_docente_grupo_id_foreign FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE;
-- asignaciones_docente_grupo_id_not_null en asignaciones_docente
ALTER TABLE asignaciones_docente ADD CONSTRAINT asignaciones_docente_grupo_id_not_null NOT NULL grupo_id;
-- asignaciones_docente_id_not_null en asignaciones_docente
ALTER TABLE asignaciones_docente ADD CONSTRAINT asignaciones_docente_id_not_null NOT NULL id;
-- asignaciones_docente_materia_id_foreign en asignaciones_docente
ALTER TABLE asignaciones_docente ADD CONSTRAINT asignaciones_docente_materia_id_foreign FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE;
-- asignaciones_docente_materia_id_not_null en asignaciones_docente
ALTER TABLE asignaciones_docente ADD CONSTRAINT asignaciones_docente_materia_id_not_null NOT NULL materia_id;
-- asignaciones_grupo_created_at_not_null en asignaciones_grupo
ALTER TABLE asignaciones_grupo ADD CONSTRAINT asignaciones_grupo_created_at_not_null NOT NULL created_at;
-- asignaciones_grupo_grupo_id_foreign en asignaciones_grupo
ALTER TABLE asignaciones_grupo ADD CONSTRAINT asignaciones_grupo_grupo_id_foreign FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE;
-- asignaciones_grupo_grupo_id_not_null en asignaciones_grupo
ALTER TABLE asignaciones_grupo ADD CONSTRAINT asignaciones_grupo_grupo_id_not_null NOT NULL grupo_id;
-- asignaciones_grupo_id_not_null en asignaciones_grupo
ALTER TABLE asignaciones_grupo ADD CONSTRAINT asignaciones_grupo_id_not_null NOT NULL id;
-- asignaciones_grupo_postulante_id_foreign en asignaciones_grupo
ALTER TABLE asignaciones_grupo ADD CONSTRAINT asignaciones_grupo_postulante_id_foreign FOREIGN KEY (postulante_id) REFERENCES postulantes(id) ON DELETE CASCADE;
-- asignaciones_grupo_postulante_id_not_null en asignaciones_grupo
ALTER TABLE asignaciones_grupo ADD CONSTRAINT asignaciones_grupo_postulante_id_not_null NOT NULL postulante_id;
-- auditoria_notas_examen_id_foreign en auditoria_notas
ALTER TABLE auditoria_notas ADD CONSTRAINT auditoria_notas_examen_id_foreign FOREIGN KEY (examen_id) REFERENCES examenes(id) ON DELETE CASCADE;
-- auditoria_notas_examen_id_not_null en auditoria_notas
ALTER TABLE auditoria_notas ADD CONSTRAINT auditoria_notas_examen_id_not_null NOT NULL examen_id;
-- auditoria_notas_fecha_modificacion_not_null en auditoria_notas
ALTER TABLE auditoria_notas ADD CONSTRAINT auditoria_notas_fecha_modificacion_not_null NOT NULL fecha_modificacion;
-- auditoria_notas_id_not_null en auditoria_notas
ALTER TABLE auditoria_notas ADD CONSTRAINT auditoria_notas_id_not_null NOT NULL id;
-- auditoria_notas_nota_nueva_not_null en auditoria_notas
ALTER TABLE auditoria_notas ADD CONSTRAINT auditoria_notas_nota_nueva_not_null NOT NULL nota_nueva;
-- auditoria_notas_usuario_modificador_id_foreign en auditoria_notas
ALTER TABLE auditoria_notas ADD CONSTRAINT auditoria_notas_usuario_modificador_id_foreign FOREIGN KEY (usuario_modificador_id) REFERENCES users(id) ON DELETE CASCADE;
-- auditoria_notas_usuario_modificador_id_not_null en auditoria_notas
ALTER TABLE auditoria_notas ADD CONSTRAINT auditoria_notas_usuario_modificador_id_not_null NOT NULL usuario_modificador_id;
-- aulas_capacidad_not_null en aulas
ALTER TABLE aulas ADD CONSTRAINT aulas_capacidad_not_null NOT NULL capacidad;
-- aulas_id_not_null en aulas
ALTER TABLE aulas ADD CONSTRAINT aulas_id_not_null NOT NULL id;
-- aulas_nombre_not_null en aulas
ALTER TABLE aulas ADD CONSTRAINT aulas_nombre_not_null NOT NULL nombre;
-- bitacora_accesos_action_not_null en bitacora_accesos
ALTER TABLE bitacora_accesos ADD CONSTRAINT bitacora_accesos_action_not_null NOT NULL action;
-- bitacora_accesos_created_at_not_null en bitacora_accesos
ALTER TABLE bitacora_accesos ADD CONSTRAINT bitacora_accesos_created_at_not_null NOT NULL created_at;
-- bitacora_accesos_id_not_null en bitacora_accesos
ALTER TABLE bitacora_accesos ADD CONSTRAINT bitacora_accesos_id_not_null NOT NULL id;
-- bitacora_accesos_ip_address_not_null en bitacora_accesos
ALTER TABLE bitacora_accesos ADD CONSTRAINT bitacora_accesos_ip_address_not_null NOT NULL ip_address;
-- bitacora_accesos_user_id_foreign en bitacora_accesos
ALTER TABLE bitacora_accesos ADD CONSTRAINT bitacora_accesos_user_id_foreign FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
-- bitacora_accesos_user_id_not_null en bitacora_accesos
ALTER TABLE bitacora_accesos ADD CONSTRAINT bitacora_accesos_user_id_not_null NOT NULL user_id;
-- cache_expiration_not_null en cache
ALTER TABLE cache ADD CONSTRAINT cache_expiration_not_null NOT NULL expiration;
-- cache_key_not_null en cache
ALTER TABLE cache ADD CONSTRAINT cache_key_not_null NOT NULL key;
-- cache_value_not_null en cache
ALTER TABLE cache ADD CONSTRAINT cache_value_not_null NOT NULL value;
-- cache_locks_expiration_not_null en cache_locks
ALTER TABLE cache_locks ADD CONSTRAINT cache_locks_expiration_not_null NOT NULL expiration;
-- cache_locks_key_not_null en cache_locks
ALTER TABLE cache_locks ADD CONSTRAINT cache_locks_key_not_null NOT NULL key;
-- cache_locks_owner_not_null en cache_locks
ALTER TABLE cache_locks ADD CONSTRAINT cache_locks_owner_not_null NOT NULL owner;
-- carreras_codigo_not_null en carreras
ALTER TABLE carreras ADD CONSTRAINT carreras_codigo_not_null NOT NULL codigo;
-- carreras_id_not_null en carreras
ALTER TABLE carreras ADD CONSTRAINT carreras_id_not_null NOT NULL id;
-- carreras_nombre_not_null en carreras
ALTER TABLE carreras ADD CONSTRAINT carreras_nombre_not_null NOT NULL nombre;
-- conversaciones_chatbot_fecha_not_null en conversaciones_chatbot
ALTER TABLE conversaciones_chatbot ADD CONSTRAINT conversaciones_chatbot_fecha_not_null NOT NULL fecha;
-- conversaciones_chatbot_id_not_null en conversaciones_chatbot
ALTER TABLE conversaciones_chatbot ADD CONSTRAINT conversaciones_chatbot_id_not_null NOT NULL id;
-- conversaciones_chatbot_postulante_id_foreign en conversaciones_chatbot
ALTER TABLE conversaciones_chatbot ADD CONSTRAINT conversaciones_chatbot_postulante_id_foreign FOREIGN KEY (postulante_id) REFERENCES postulantes(id) ON DELETE CASCADE;
-- conversaciones_chatbot_postulante_id_not_null en conversaciones_chatbot
ALTER TABLE conversaciones_chatbot ADD CONSTRAINT conversaciones_chatbot_postulante_id_not_null NOT NULL postulante_id;
-- conversaciones_chatbot_pregunta_not_null en conversaciones_chatbot
ALTER TABLE conversaciones_chatbot ADD CONSTRAINT conversaciones_chatbot_pregunta_not_null NOT NULL pregunta;
-- conversaciones_chatbot_resuelta_not_null en conversaciones_chatbot
ALTER TABLE conversaciones_chatbot ADD CONSTRAINT conversaciones_chatbot_resuelta_not_null NOT NULL resuelta;
-- cupos_gestion_carrera_id_foreign en cupos_gestion
ALTER TABLE cupos_gestion ADD CONSTRAINT cupos_gestion_carrera_id_foreign FOREIGN KEY (carrera_id) REFERENCES carreras(id) ON DELETE CASCADE;
-- cupos_gestion_carrera_id_not_null en cupos_gestion
ALTER TABLE cupos_gestion ADD CONSTRAINT cupos_gestion_carrera_id_not_null NOT NULL carrera_id;
-- cupos_gestion_created_at_not_null en cupos_gestion
ALTER TABLE cupos_gestion ADD CONSTRAINT cupos_gestion_created_at_not_null NOT NULL created_at;
-- cupos_gestion_cupo_maximo_not_null en cupos_gestion
ALTER TABLE cupos_gestion ADD CONSTRAINT cupos_gestion_cupo_maximo_not_null NOT NULL cupo_maximo;
-- cupos_gestion_cupos_disponibles_not_null en cupos_gestion
ALTER TABLE cupos_gestion ADD CONSTRAINT cupos_gestion_cupos_disponibles_not_null NOT NULL cupos_disponibles;
-- cupos_gestion_gestion_id_foreign en cupos_gestion
ALTER TABLE cupos_gestion ADD CONSTRAINT cupos_gestion_gestion_id_foreign FOREIGN KEY (gestion_id) REFERENCES gestiones(id) ON DELETE CASCADE;
-- cupos_gestion_gestion_id_not_null en cupos_gestion
ALTER TABLE cupos_gestion ADD CONSTRAINT cupos_gestion_gestion_id_not_null NOT NULL gestion_id;
-- cupos_gestion_id_not_null en cupos_gestion
ALTER TABLE cupos_gestion ADD CONSTRAINT cupos_gestion_id_not_null NOT NULL id;
-- docentes_apellidos_not_null en docentes
ALTER TABLE docentes ADD CONSTRAINT docentes_apellidos_not_null NOT NULL apellidos;
-- docentes_ci_not_null en docentes
ALTER TABLE docentes ADD CONSTRAINT docentes_ci_not_null NOT NULL ci;
-- docentes_correo_not_null en docentes
ALTER TABLE docentes ADD CONSTRAINT docentes_correo_not_null NOT NULL correo;
-- docentes_created_at_not_null en docentes
ALTER TABLE docentes ADD CONSTRAINT docentes_created_at_not_null NOT NULL created_at;
-- docentes_especialidad_not_null en docentes
ALTER TABLE docentes ADD CONSTRAINT docentes_especialidad_not_null NOT NULL especialidad;
-- docentes_grado_academico_not_null en docentes
ALTER TABLE docentes ADD CONSTRAINT docentes_grado_academico_not_null NOT NULL grado_academico;
-- docentes_id_not_null en docentes
ALTER TABLE docentes ADD CONSTRAINT docentes_id_not_null NOT NULL id;
-- docentes_nombres_not_null en docentes
ALTER TABLE docentes ADD CONSTRAINT docentes_nombres_not_null NOT NULL nombres;
-- examenes_created_at_not_null en examenes
ALTER TABLE examenes ADD CONSTRAINT examenes_created_at_not_null NOT NULL created_at;
-- examenes_id_not_null en examenes
ALTER TABLE examenes ADD CONSTRAINT examenes_id_not_null NOT NULL id;
-- examenes_materia_id_foreign en examenes
ALTER TABLE examenes ADD CONSTRAINT examenes_materia_id_foreign FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE;
-- examenes_materia_id_not_null en examenes
ALTER TABLE examenes ADD CONSTRAINT examenes_materia_id_not_null NOT NULL materia_id;
-- examenes_nota_not_null en examenes
ALTER TABLE examenes ADD CONSTRAINT examenes_nota_not_null NOT NULL nota;
-- examenes_numero_examen_not_null en examenes
ALTER TABLE examenes ADD CONSTRAINT examenes_numero_examen_not_null NOT NULL numero_examen;
-- examenes_postulante_id_foreign en examenes
ALTER TABLE examenes ADD CONSTRAINT examenes_postulante_id_foreign FOREIGN KEY (postulante_id) REFERENCES postulantes(id) ON DELETE CASCADE;
-- examenes_postulante_id_not_null en examenes
ALTER TABLE examenes ADD CONSTRAINT examenes_postulante_id_not_null NOT NULL postulante_id;
-- failed_jobs_connection_not_null en failed_jobs
ALTER TABLE failed_jobs ADD CONSTRAINT failed_jobs_connection_not_null NOT NULL connection;
-- failed_jobs_exception_not_null en failed_jobs
ALTER TABLE failed_jobs ADD CONSTRAINT failed_jobs_exception_not_null NOT NULL exception;
-- failed_jobs_failed_at_not_null en failed_jobs
ALTER TABLE failed_jobs ADD CONSTRAINT failed_jobs_failed_at_not_null NOT NULL failed_at;
-- failed_jobs_id_not_null en failed_jobs
ALTER TABLE failed_jobs ADD CONSTRAINT failed_jobs_id_not_null NOT NULL id;
-- failed_jobs_payload_not_null en failed_jobs
ALTER TABLE failed_jobs ADD CONSTRAINT failed_jobs_payload_not_null NOT NULL payload;
-- failed_jobs_queue_not_null en failed_jobs
ALTER TABLE failed_jobs ADD CONSTRAINT failed_jobs_queue_not_null NOT NULL queue;
-- failed_jobs_uuid_not_null en failed_jobs
ALTER TABLE failed_jobs ADD CONSTRAINT failed_jobs_uuid_not_null NOT NULL uuid;
-- gestiones_activa_not_null en gestiones
ALTER TABLE gestiones ADD CONSTRAINT gestiones_activa_not_null NOT NULL activa;
-- gestiones_codigo_not_null en gestiones
ALTER TABLE gestiones ADD CONSTRAINT gestiones_codigo_not_null NOT NULL codigo;
-- gestiones_created_at_not_null en gestiones
ALTER TABLE gestiones ADD CONSTRAINT gestiones_created_at_not_null NOT NULL created_at;
-- gestiones_fecha_fin_not_null en gestiones
ALTER TABLE gestiones ADD CONSTRAINT gestiones_fecha_fin_not_null NOT NULL fecha_fin;
-- gestiones_fecha_inicio_not_null en gestiones
ALTER TABLE gestiones ADD CONSTRAINT gestiones_fecha_inicio_not_null NOT NULL fecha_inicio;
-- gestiones_id_not_null en gestiones
ALTER TABLE gestiones ADD CONSTRAINT gestiones_id_not_null NOT NULL id;
-- grupos_aula_id_foreign en grupos
ALTER TABLE grupos ADD CONSTRAINT grupos_aula_id_foreign FOREIGN KEY (aula_id) REFERENCES aulas(id);
-- grupos_aula_id_not_null en grupos
ALTER TABLE grupos ADD CONSTRAINT grupos_aula_id_not_null NOT NULL aula_id;
-- grupos_created_at_not_null en grupos
ALTER TABLE grupos ADD CONSTRAINT grupos_created_at_not_null NOT NULL created_at;
-- grupos_gestion_id_foreign en grupos
ALTER TABLE grupos ADD CONSTRAINT grupos_gestion_id_foreign FOREIGN KEY (gestion_id) REFERENCES gestiones(id) ON DELETE CASCADE;
-- grupos_gestion_id_not_null en grupos
ALTER TABLE grupos ADD CONSTRAINT grupos_gestion_id_not_null NOT NULL gestion_id;
-- grupos_id_not_null en grupos
ALTER TABLE grupos ADD CONSTRAINT grupos_id_not_null NOT NULL id;
-- grupos_numero_not_null en grupos
ALTER TABLE grupos ADD CONSTRAINT grupos_numero_not_null NOT NULL numero;
-- grupos_turno_not_null en grupos
ALTER TABLE grupos ADD CONSTRAINT grupos_turno_not_null NOT NULL turno;
-- job_batches_created_at_not_null en job_batches
ALTER TABLE job_batches ADD CONSTRAINT job_batches_created_at_not_null NOT NULL created_at;
-- job_batches_failed_job_ids_not_null en job_batches
ALTER TABLE job_batches ADD CONSTRAINT job_batches_failed_job_ids_not_null NOT NULL failed_job_ids;
-- job_batches_failed_jobs_not_null en job_batches
ALTER TABLE job_batches ADD CONSTRAINT job_batches_failed_jobs_not_null NOT NULL failed_jobs;
-- job_batches_id_not_null en job_batches
ALTER TABLE job_batches ADD CONSTRAINT job_batches_id_not_null NOT NULL id;
-- job_batches_name_not_null en job_batches
ALTER TABLE job_batches ADD CONSTRAINT job_batches_name_not_null NOT NULL name;
-- job_batches_pending_jobs_not_null en job_batches
ALTER TABLE job_batches ADD CONSTRAINT job_batches_pending_jobs_not_null NOT NULL pending_jobs;
-- job_batches_total_jobs_not_null en job_batches
ALTER TABLE job_batches ADD CONSTRAINT job_batches_total_jobs_not_null NOT NULL total_jobs;
-- jobs_attempts_not_null en jobs
ALTER TABLE jobs ADD CONSTRAINT jobs_attempts_not_null NOT NULL attempts;
-- jobs_available_at_not_null en jobs
ALTER TABLE jobs ADD CONSTRAINT jobs_available_at_not_null NOT NULL available_at;
-- jobs_created_at_not_null en jobs
ALTER TABLE jobs ADD CONSTRAINT jobs_created_at_not_null NOT NULL created_at;
-- jobs_id_not_null en jobs
ALTER TABLE jobs ADD CONSTRAINT jobs_id_not_null NOT NULL id;
-- jobs_payload_not_null en jobs
ALTER TABLE jobs ADD CONSTRAINT jobs_payload_not_null NOT NULL payload;
-- jobs_queue_not_null en jobs
ALTER TABLE jobs ADD CONSTRAINT jobs_queue_not_null NOT NULL queue;
-- materias_codigo_not_null en materias
ALTER TABLE materias ADD CONSTRAINT materias_codigo_not_null NOT NULL codigo;
-- materias_id_not_null en materias
ALTER TABLE materias ADD CONSTRAINT materias_id_not_null NOT NULL id;
-- materias_nombre_not_null en materias
ALTER TABLE materias ADD CONSTRAINT materias_nombre_not_null NOT NULL nombre;
-- migrations_batch_not_null en migrations
ALTER TABLE migrations ADD CONSTRAINT migrations_batch_not_null NOT NULL batch;
-- migrations_id_not_null en migrations
ALTER TABLE migrations ADD CONSTRAINT migrations_id_not_null NOT NULL id;
-- migrations_migration_not_null en migrations
ALTER TABLE migrations ADD CONSTRAINT migrations_migration_not_null NOT NULL migration;
-- notas_finales_estado_not_null en notas_finales
ALTER TABLE notas_finales ADD CONSTRAINT notas_finales_estado_not_null NOT NULL estado;
-- notas_finales_id_not_null en notas_finales
ALTER TABLE notas_finales ADD CONSTRAINT notas_finales_id_not_null NOT NULL id;
-- notas_finales_materia_id_foreign en notas_finales
ALTER TABLE notas_finales ADD CONSTRAINT notas_finales_materia_id_foreign FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE;
-- notas_finales_materia_id_not_null en notas_finales
ALTER TABLE notas_finales ADD CONSTRAINT notas_finales_materia_id_not_null NOT NULL materia_id;
-- notas_finales_postulante_id_foreign en notas_finales
ALTER TABLE notas_finales ADD CONSTRAINT notas_finales_postulante_id_foreign FOREIGN KEY (postulante_id) REFERENCES postulantes(id) ON DELETE CASCADE;
-- notas_finales_postulante_id_not_null en notas_finales
ALTER TABLE notas_finales ADD CONSTRAINT notas_finales_postulante_id_not_null NOT NULL postulante_id;
-- notas_finales_promedio_not_null en notas_finales
ALTER TABLE notas_finales ADD CONSTRAINT notas_finales_promedio_not_null NOT NULL promedio;
-- notas_finales_updated_at_not_null en notas_finales
ALTER TABLE notas_finales ADD CONSTRAINT notas_finales_updated_at_not_null NOT NULL updated_at;
-- notificaciones_estado_not_null en notificaciones
ALTER TABLE notificaciones ADD CONSTRAINT notificaciones_estado_not_null NOT NULL estado;
-- notificaciones_fecha_generacion_not_null en notificaciones
ALTER TABLE notificaciones ADD CONSTRAINT notificaciones_fecha_generacion_not_null NOT NULL fecha_generacion;
-- notificaciones_id_not_null en notificaciones
ALTER TABLE notificaciones ADD CONSTRAINT notificaciones_id_not_null NOT NULL id;
-- notificaciones_mensaje_not_null en notificaciones
ALTER TABLE notificaciones ADD CONSTRAINT notificaciones_mensaje_not_null NOT NULL mensaje;
-- notificaciones_tipo_evento_not_null en notificaciones
ALTER TABLE notificaciones ADD CONSTRAINT notificaciones_tipo_evento_not_null NOT NULL tipo_evento;
-- notificaciones_usuario_id_foreign en notificaciones
ALTER TABLE notificaciones ADD CONSTRAINT notificaciones_usuario_id_foreign FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE;
-- notificaciones_usuario_id_not_null en notificaciones
ALTER TABLE notificaciones ADD CONSTRAINT notificaciones_usuario_id_not_null NOT NULL usuario_id;
-- pagos_estado_pago_not_null en pagos
ALTER TABLE pagos ADD CONSTRAINT pagos_estado_pago_not_null NOT NULL estado_pago;
-- pagos_fecha_pago_not_null en pagos
ALTER TABLE pagos ADD CONSTRAINT pagos_fecha_pago_not_null NOT NULL fecha_pago;
-- pagos_id_not_null en pagos
ALTER TABLE pagos ADD CONSTRAINT pagos_id_not_null NOT NULL id;
-- pagos_monto_not_null en pagos
ALTER TABLE pagos ADD CONSTRAINT pagos_monto_not_null NOT NULL monto;
-- pagos_postulante_id_foreign en pagos
ALTER TABLE pagos ADD CONSTRAINT pagos_postulante_id_foreign FOREIGN KEY (postulante_id) REFERENCES postulantes(id) ON DELETE CASCADE;
-- pagos_postulante_id_not_null en pagos
ALTER TABLE pagos ADD CONSTRAINT pagos_postulante_id_not_null NOT NULL postulante_id;
-- pagos_stripe_checkout_id_not_null en pagos
ALTER TABLE pagos ADD CONSTRAINT pagos_stripe_checkout_id_not_null NOT NULL stripe_checkout_id;
-- password_reset_tokens_email_not_null en password_reset_tokens
ALTER TABLE password_reset_tokens ADD CONSTRAINT password_reset_tokens_email_not_null NOT NULL email;
-- password_reset_tokens_token_not_null en password_reset_tokens
ALTER TABLE password_reset_tokens ADD CONSTRAINT password_reset_tokens_token_not_null NOT NULL token;
-- personal_access_tokens_id_not_null en personal_access_tokens
ALTER TABLE personal_access_tokens ADD CONSTRAINT personal_access_tokens_id_not_null NOT NULL id;
-- personal_access_tokens_name_not_null en personal_access_tokens
ALTER TABLE personal_access_tokens ADD CONSTRAINT personal_access_tokens_name_not_null NOT NULL name;
-- personal_access_tokens_token_not_null en personal_access_tokens
ALTER TABLE personal_access_tokens ADD CONSTRAINT personal_access_tokens_token_not_null NOT NULL token;
-- personal_access_tokens_tokenable_id_not_null en personal_access_tokens
ALTER TABLE personal_access_tokens ADD CONSTRAINT personal_access_tokens_tokenable_id_not_null NOT NULL tokenable_id;
-- personal_access_tokens_tokenable_type_not_null en personal_access_tokens
ALTER TABLE personal_access_tokens ADD CONSTRAINT personal_access_tokens_tokenable_type_not_null NOT NULL tokenable_type;
-- postulantes_apellidos_not_null en postulantes
ALTER TABLE postulantes ADD CONSTRAINT postulantes_apellidos_not_null NOT NULL apellidos;
-- postulantes_ci_not_null en postulantes
ALTER TABLE postulantes ADD CONSTRAINT postulantes_ci_not_null NOT NULL ci;
-- postulantes_ciudad_not_null en postulantes
ALTER TABLE postulantes ADD CONSTRAINT postulantes_ciudad_not_null NOT NULL ciudad;
-- postulantes_email_not_null en postulantes
ALTER TABLE postulantes ADD CONSTRAINT postulantes_email_not_null NOT NULL email;
-- postulantes_estado_not_null en postulantes
ALTER TABLE postulantes ADD CONSTRAINT postulantes_estado_not_null NOT NULL estado;
-- postulantes_fecha_nacimiento_not_null en postulantes
ALTER TABLE postulantes ADD CONSTRAINT postulantes_fecha_nacimiento_not_null NOT NULL fecha_nacimiento;
-- postulantes_gestion_id_foreign en postulantes
ALTER TABLE postulantes ADD CONSTRAINT postulantes_gestion_id_foreign FOREIGN KEY (gestion_id) REFERENCES gestiones(id);
-- postulantes_gestion_id_not_null en postulantes
ALTER TABLE postulantes ADD CONSTRAINT postulantes_gestion_id_not_null NOT NULL gestion_id;
-- postulantes_id_not_null en postulantes
ALTER TABLE postulantes ADD CONSTRAINT postulantes_id_not_null NOT NULL id;
-- postulantes_nombres_not_null en postulantes
ALTER TABLE postulantes ADD CONSTRAINT postulantes_nombres_not_null NOT NULL nombres;
-- postulantes_primera_opcion_id_foreign en postulantes
ALTER TABLE postulantes ADD CONSTRAINT postulantes_primera_opcion_id_foreign FOREIGN KEY (primera_opcion_id) REFERENCES carreras(id);
-- postulantes_primera_opcion_id_not_null en postulantes
ALTER TABLE postulantes ADD CONSTRAINT postulantes_primera_opcion_id_not_null NOT NULL primera_opcion_id;
-- postulantes_recurrente_not_null en postulantes
ALTER TABLE postulantes ADD CONSTRAINT postulantes_recurrente_not_null NOT NULL recurrente;
-- postulantes_segunda_opcion_id_foreign en postulantes
ALTER TABLE postulantes ADD CONSTRAINT postulantes_segunda_opcion_id_foreign FOREIGN KEY (segunda_opcion_id) REFERENCES carreras(id);
-- postulantes_segunda_opcion_id_not_null en postulantes
ALTER TABLE postulantes ADD CONSTRAINT postulantes_segunda_opcion_id_not_null NOT NULL segunda_opcion_id;
-- postulantes_sexo_not_null en postulantes
ALTER TABLE postulantes ADD CONSTRAINT postulantes_sexo_not_null NOT NULL sexo;
-- postulantes_turno_preferencia_not_null en postulantes
ALTER TABLE postulantes ADD CONSTRAINT postulantes_turno_preferencia_not_null NOT NULL turno_preferencia;
-- preguntas_simulacro_created_at_not_null en preguntas_simulacro
ALTER TABLE preguntas_simulacro ADD CONSTRAINT preguntas_simulacro_created_at_not_null NOT NULL created_at;
-- preguntas_simulacro_enunciado_not_null en preguntas_simulacro
ALTER TABLE preguntas_simulacro ADD CONSTRAINT preguntas_simulacro_enunciado_not_null NOT NULL enunciado;
-- preguntas_simulacro_id_not_null en preguntas_simulacro
ALTER TABLE preguntas_simulacro ADD CONSTRAINT preguntas_simulacro_id_not_null NOT NULL id;
-- preguntas_simulacro_materia_id_foreign en preguntas_simulacro
ALTER TABLE preguntas_simulacro ADD CONSTRAINT preguntas_simulacro_materia_id_foreign FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE;
-- preguntas_simulacro_materia_id_not_null en preguntas_simulacro
ALTER TABLE preguntas_simulacro ADD CONSTRAINT preguntas_simulacro_materia_id_not_null NOT NULL materia_id;
-- preguntas_simulacro_opciones_not_null en preguntas_simulacro
ALTER TABLE preguntas_simulacro ADD CONSTRAINT preguntas_simulacro_opciones_not_null NOT NULL opciones;
-- preguntas_simulacro_respuesta_correcta_not_null en preguntas_simulacro
ALTER TABLE preguntas_simulacro ADD CONSTRAINT preguntas_simulacro_respuesta_correcta_not_null NOT NULL respuesta_correcta;
-- requisitos_documentales_certificado_nacimiento_not_null en requisitos_documentales
ALTER TABLE requisitos_documentales ADD CONSTRAINT requisitos_documentales_certificado_nacimiento_not_null NOT NULL certificado_nacimiento;
-- requisitos_documentales_ci_digitalizado_not_null en requisitos_documentales
ALTER TABLE requisitos_documentales ADD CONSTRAINT requisitos_documentales_ci_digitalizado_not_null NOT NULL ci_digitalizado;
-- requisitos_documentales_formulario_preinscripcion_not_null en requisitos_documentales
ALTER TABLE requisitos_documentales ADD CONSTRAINT requisitos_documentales_formulario_preinscripcion_not_null NOT NULL formulario_preinscripcion;
-- requisitos_documentales_id_not_null en requisitos_documentales
ALTER TABLE requisitos_documentales ADD CONSTRAINT requisitos_documentales_id_not_null NOT NULL id;
-- requisitos_documentales_postulante_id_foreign en requisitos_documentales
ALTER TABLE requisitos_documentales ADD CONSTRAINT requisitos_documentales_postulante_id_foreign FOREIGN KEY (postulante_id) REFERENCES postulantes(id) ON DELETE CASCADE;
-- requisitos_documentales_postulante_id_not_null en requisitos_documentales
ALTER TABLE requisitos_documentales ADD CONSTRAINT requisitos_documentales_postulante_id_not_null NOT NULL postulante_id;
-- requisitos_documentales_titulo_bachiller_legalizado_not_null en requisitos_documentales
ALTER TABLE requisitos_documentales ADD CONSTRAINT requisitos_documentales_titulo_bachiller_legalizado_not_null NOT NULL titulo_bachiller_legalizado;
-- requisitos_documentales_updated_at_not_null en requisitos_documentales
ALTER TABLE requisitos_documentales ADD CONSTRAINT requisitos_documentales_updated_at_not_null NOT NULL updated_at;
-- requisitos_documentales_verificado_bd_externa_not_null en requisitos_documentales
ALTER TABLE requisitos_documentales ADD CONSTRAINT requisitos_documentales_verificado_bd_externa_not_null NOT NULL verificado_bd_externa;
-- sessions_id_not_null en sessions
ALTER TABLE sessions ADD CONSTRAINT sessions_id_not_null NOT NULL id;
-- sessions_last_activity_not_null en sessions
ALTER TABLE sessions ADD CONSTRAINT sessions_last_activity_not_null NOT NULL last_activity;
-- sessions_payload_not_null en sessions
ALTER TABLE sessions ADD CONSTRAINT sessions_payload_not_null NOT NULL payload;
-- users_active_not_null en users
ALTER TABLE users ADD CONSTRAINT users_active_not_null NOT NULL active;
-- users_email_not_null en users
ALTER TABLE users ADD CONSTRAINT users_email_not_null NOT NULL email;
-- users_id_not_null en users
ALTER TABLE users ADD CONSTRAINT users_id_not_null NOT NULL id;
-- users_intentos_fallidos_not_null en users
ALTER TABLE users ADD CONSTRAINT users_intentos_fallidos_not_null NOT NULL intentos_fallidos;
-- users_name_not_null en users
ALTER TABLE users ADD CONSTRAINT users_name_not_null NOT NULL name;
-- users_password_not_null en users
ALTER TABLE users ADD CONSTRAINT users_password_not_null NOT NULL password;
-- users_role_check en users
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['Administrador'::character varying, 'Coordinador'::character varying, 'Docente'::character varying, 'Postulante'::character varying])::text[])));
-- users_role_not_null en users
ALTER TABLE users ADD CONSTRAINT users_role_not_null NOT NULL role;

-- Índices de rendimiento
CREATE UNIQUE INDEX admisiones_pkey ON public.admisiones USING btree (id);
CREATE UNIQUE INDEX admisiones_postulante_id_unique ON public.admisiones USING btree (postulante_id);
CREATE UNIQUE INDEX asignaciones_docente_grupo_id_materia_id_unique ON public.asignaciones_docente USING btree (grupo_id, materia_id);
CREATE UNIQUE INDEX asignaciones_docente_pkey ON public.asignaciones_docente USING btree (id);
CREATE UNIQUE INDEX asignaciones_grupo_pkey ON public.asignaciones_grupo USING btree (id);
CREATE UNIQUE INDEX asignaciones_grupo_postulante_id_unique ON public.asignaciones_grupo USING btree (postulante_id);
CREATE UNIQUE INDEX auditoria_notas_pkey ON public.auditoria_notas USING btree (id);
CREATE UNIQUE INDEX aulas_pkey ON public.aulas USING btree (id);
CREATE UNIQUE INDEX bitacora_accesos_pkey ON public.bitacora_accesos USING btree (id);
CREATE UNIQUE INDEX cache_locks_pkey ON public.cache_locks USING btree (key);
CREATE UNIQUE INDEX cache_pkey ON public.cache USING btree (key);
CREATE UNIQUE INDEX carreras_codigo_unique ON public.carreras USING btree (codigo);
CREATE UNIQUE INDEX carreras_nombre_unique ON public.carreras USING btree (nombre);
CREATE UNIQUE INDEX carreras_pkey ON public.carreras USING btree (id);
CREATE UNIQUE INDEX conversaciones_chatbot_pkey ON public.conversaciones_chatbot USING btree (id);
CREATE UNIQUE INDEX cupos_gestion_gestion_id_carrera_id_unique ON public.cupos_gestion USING btree (gestion_id, carrera_id);
CREATE UNIQUE INDEX cupos_gestion_pkey ON public.cupos_gestion USING btree (id);
CREATE UNIQUE INDEX docentes_ci_unique ON public.docentes USING btree (ci);
CREATE UNIQUE INDEX docentes_pkey ON public.docentes USING btree (id);
CREATE UNIQUE INDEX examenes_pkey ON public.examenes USING btree (id);
CREATE UNIQUE INDEX examenes_postulante_id_materia_id_numero_examen_unique ON public.examenes USING btree (postulante_id, materia_id, numero_examen);
CREATE UNIQUE INDEX failed_jobs_pkey ON public.failed_jobs USING btree (id);
CREATE UNIQUE INDEX failed_jobs_uuid_unique ON public.failed_jobs USING btree (uuid);
CREATE UNIQUE INDEX gestiones_codigo_unique ON public.gestiones USING btree (codigo);
CREATE UNIQUE INDEX gestiones_pkey ON public.gestiones USING btree (id);
CREATE UNIQUE INDEX grupos_gestion_id_turno_numero_unique ON public.grupos USING btree (gestion_id, turno, numero);
CREATE UNIQUE INDEX grupos_pkey ON public.grupos USING btree (id);
CREATE UNIQUE INDEX job_batches_pkey ON public.job_batches USING btree (id);
CREATE UNIQUE INDEX jobs_pkey ON public.jobs USING btree (id);
CREATE INDEX jobs_queue_index ON public.jobs USING btree (queue);
CREATE UNIQUE INDEX materias_codigo_unique ON public.materias USING btree (codigo);
CREATE UNIQUE INDEX materias_nombre_unique ON public.materias USING btree (nombre);
CREATE UNIQUE INDEX materias_pkey ON public.materias USING btree (id);
CREATE UNIQUE INDEX migrations_pkey ON public.migrations USING btree (id);
CREATE UNIQUE INDEX notas_finales_pkey ON public.notas_finales USING btree (id);
CREATE UNIQUE INDEX notas_finales_postulante_id_materia_id_unique ON public.notas_finales USING btree (postulante_id, materia_id);
CREATE UNIQUE INDEX notificaciones_pkey ON public.notificaciones USING btree (id);
CREATE UNIQUE INDEX pagos_pkey ON public.pagos USING btree (id);
CREATE UNIQUE INDEX pagos_stripe_checkout_id_unique ON public.pagos USING btree (stripe_checkout_id);
CREATE UNIQUE INDEX password_reset_tokens_pkey ON public.password_reset_tokens USING btree (email);
CREATE INDEX personal_access_tokens_expires_at_index ON public.personal_access_tokens USING btree (expires_at);
CREATE UNIQUE INDEX personal_access_tokens_pkey ON public.personal_access_tokens USING btree (id);
CREATE UNIQUE INDEX personal_access_tokens_token_unique ON public.personal_access_tokens USING btree (token);
CREATE INDEX personal_access_tokens_tokenable_type_tokenable_id_index ON public.personal_access_tokens USING btree (tokenable_type, tokenable_id);
CREATE UNIQUE INDEX postulantes_ci_unique ON public.postulantes USING btree (ci);
CREATE UNIQUE INDEX postulantes_pkey ON public.postulantes USING btree (id);
CREATE UNIQUE INDEX preguntas_simulacro_pkey ON public.preguntas_simulacro USING btree (id);
CREATE UNIQUE INDEX requisitos_documentales_pkey ON public.requisitos_documentales USING btree (id);
CREATE UNIQUE INDEX requisitos_documentales_postulante_id_unique ON public.requisitos_documentales USING btree (postulante_id);
CREATE INDEX sessions_last_activity_index ON public.sessions USING btree (last_activity);
CREATE UNIQUE INDEX sessions_pkey ON public.sessions USING btree (id);
CREATE INDEX sessions_user_id_index ON public.sessions USING btree (user_id);
CREATE UNIQUE INDEX users_email_unique ON public.users USING btree (email);
CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

COMMIT;