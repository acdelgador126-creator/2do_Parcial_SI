    -- ==============================================================================
    -- DDL DE CREACION DE BASE DE DATOS - SISTEMA CUP FICCT
    -- MOTOR: PostgreSQL 16+
    -- Esquema alineado con las migraciones Laravel del repositorio (33 migraciones).
    -- Diagrama conceptual PlantUML: BASE_DE_DATOS/modelo_conceptual_bd.puml
    -- Visualizar en: https://www.planttext.com/
    -- ==============================================================================

    BEGIN;

    -- Tabla: carreras
    CREATE TABLE carreras (
        id bigserial PRIMARY KEY,
        nombre character varying(100) NOT NULL,
        codigo character varying(10) NOT NULL
    );

    -- Tabla: gestiones
    CREATE TABLE gestiones (
        id bigserial PRIMARY KEY,
        codigo character varying(10) NOT NULL,
        activa boolean NOT NULL,
        fecha_inicio date NOT NULL,
        fecha_fin date NOT NULL,
        created_at timestamp(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla: users
    CREATE TABLE users (
        id bigserial PRIMARY KEY,
        name character varying(255) NOT NULL,
        email character varying(255) NOT NULL,
        email_verified_at timestamp(0) without time zone,
        password character varying(255) NOT NULL,
        remember_token character varying(100),
        created_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP,
        role character varying(50) NOT NULL DEFAULT 'Postulante',
        active boolean NOT NULL DEFAULT true,
        intentos_fallidos integer NOT NULL DEFAULT 0,
        bloqueado_hasta timestamp(0) without time zone
    );

    -- Tabla: postulantes
    CREATE TABLE postulantes (
        id bigserial PRIMARY KEY,
        ci character varying(20) NOT NULL,
        nombres character varying(150) NOT NULL,
        apellidos character varying(150) NOT NULL,
        fecha_nacimiento date NOT NULL,
        sexo character(1) NOT NULL,
        direccion character varying(255),
        telefono character varying(20),
        email character varying(150) NOT NULL,
        colegio_procedencia character varying(150),
        ciudad character varying(100) NOT NULL DEFAULT 'Santa Cruz de la Sierra',
        titulo_bachiller character varying(255),
        primera_opcion_id bigint NOT NULL,
        segunda_opcion_id bigint NOT NULL,
        turno_preferencia character varying(20) NOT NULL,
        gestion_id bigint NOT NULL,
        estado character varying(50) NOT NULL DEFAULT 'Preinscrito',
        recurrente boolean NOT NULL DEFAULT false,
        user_id bigint,
        created_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla: admisiones
    CREATE TABLE admisiones (
        id bigserial PRIMARY KEY,
        postulante_id bigint NOT NULL,
        carrera_id bigint NOT NULL,
        via character varying(50) NOT NULL,
        fecha_admision timestamp(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla: docentes (CU12 + CU24/CU25 postulacion docente)
    CREATE TABLE docentes (
        id bigserial PRIMARY KEY,
        ci character varying(20) NOT NULL,
        nombres character varying(150) NOT NULL,
        apellidos character varying(150) NOT NULL,
        especialidad character varying(100) NOT NULL,
        grado_academico character varying(100) NOT NULL,
        correo character varying(150) NOT NULL,
        telefono character varying(30),
        fecha_nacimiento date,
        area_id bigint,
        estado character varying(30) NOT NULL DEFAULT 'Aceptado',
        hoja_vida_path character varying(255),
        respaldos_path character varying(255),
        motivo_rechazo text,
        user_id bigint,
        created_at timestamp(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla: especialidades (CU24 — especialidades declaradas por el aspirante docente)
    CREATE TABLE especialidades (
        id bigserial PRIMARY KEY,
        docente_id bigint NOT NULL,
        nombre character varying(150) NOT NULL,
        area_id bigint,
        created_at timestamp(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla: horarios_grupo_materia (CU12 — carga horaria institucional fija por grupo/materia)
    CREATE TABLE horarios_grupo_materia (
        id bigserial PRIMARY KEY,
        grupo_id bigint NOT NULL,
        materia_id bigint NOT NULL,
        dia_semana smallint NOT NULL,
        hora_inicio time(0) without time zone NOT NULL,
        hora_fin time(0) without time zone NOT NULL,
        created_at timestamp(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla: aulas
    CREATE TABLE aulas (
        id bigserial PRIMARY KEY,
        nombre character varying(50) NOT NULL,
        capacidad integer NOT NULL,
        ubicacion character varying(100)
    );

    -- Tabla: grupos
    CREATE TABLE grupos (
        id bigserial PRIMARY KEY,
        numero integer NOT NULL,
        gestion_id bigint NOT NULL,
        turno character varying(20) NOT NULL,
        aula_id bigint NOT NULL,
        created_at timestamp(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla: materias
    CREATE TABLE materias (
        id bigserial PRIMARY KEY,
        nombre character varying(50) NOT NULL,
        codigo character varying(10) NOT NULL
    );

    -- Tabla: asignaciones_docente
    CREATE TABLE asignaciones_docente (
        id bigserial PRIMARY KEY,
        docente_id bigint NOT NULL,
        grupo_id bigint NOT NULL,
        materia_id bigint NOT NULL,
        created_at timestamp(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla: asignaciones_grupo
    CREATE TABLE asignaciones_grupo (
        id bigserial PRIMARY KEY,
        postulante_id bigint NOT NULL,
        grupo_id bigint NOT NULL,
        created_at timestamp(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla: examenes
    CREATE TABLE examenes (
        id bigserial PRIMARY KEY,
        postulante_id bigint NOT NULL,
        materia_id bigint NOT NULL,
        numero_examen integer NOT NULL,
        nota numeric(5,2) NOT NULL,
        created_at timestamp(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla: auditoria_notas
    CREATE TABLE auditoria_notas (
        id bigserial PRIMARY KEY,
        examen_id bigint NOT NULL,
        usuario_modificador_id bigint NOT NULL,
        nota_anterior numeric(5,2),
        nota_nueva numeric(5,2) NOT NULL,
        motivo text,
        fecha_modificacion timestamp(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla: bitacora_accesos
    CREATE TABLE bitacora_accesos (
        id bigserial PRIMARY KEY,
        user_id bigint NOT NULL,
        ip_address character varying(45) NOT NULL,
        action character varying(255) NOT NULL,
        created_at timestamp(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla: cache
    CREATE TABLE cache (
        key character varying(255) PRIMARY KEY,
        value text NOT NULL,
        expiration integer NOT NULL
    );

    -- Tabla: cache_locks
    CREATE TABLE cache_locks (
        key character varying(255) PRIMARY KEY,
        owner character varying(255) NOT NULL,
        expiration integer NOT NULL
    );

    -- Tabla: conversaciones_chatbot
    CREATE TABLE conversaciones_chatbot (
        id bigserial PRIMARY KEY,
        postulante_id bigint NOT NULL,
        pregunta text NOT NULL,
        respuesta text,
        resuelta boolean NOT NULL,
        fecha timestamp(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla: cupos_gestion
    CREATE TABLE cupos_gestion (
        id bigserial PRIMARY KEY,
        gestion_id bigint NOT NULL,
        carrera_id bigint NOT NULL,
        cupo_maximo integer NOT NULL,
        cupos_disponibles integer NOT NULL,
        created_at timestamp(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla: failed_jobs
    CREATE TABLE failed_jobs (
        id bigserial PRIMARY KEY,
        uuid character varying(255) NOT NULL,
        connection text NOT NULL,
        queue text NOT NULL,
        payload text NOT NULL,
        exception text NOT NULL,
        failed_at timestamp(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla: job_batches
    CREATE TABLE job_batches (
        id character varying(255) PRIMARY KEY,
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
        id bigserial PRIMARY KEY,
        queue character varying(255) NOT NULL,
        payload text NOT NULL,
        attempts smallint NOT NULL,
        reserved_at integer,
        available_at integer NOT NULL,
        created_at integer NOT NULL
    );

    -- Tabla: materias
    -- (Ya declarada arriba antes de asignaciones_docente)

    -- Tabla: migrations
    CREATE TABLE migrations (
        id serial PRIMARY KEY,
        migration character varying(255) NOT NULL,
        batch integer NOT NULL
    );

    -- Tabla: notas_finales
    CREATE TABLE notas_finales (
        id bigserial PRIMARY KEY,
        postulante_id bigint NOT NULL,
        materia_id bigint NOT NULL,
        promedio numeric(5,2) NOT NULL,
        estado character varying(20) NOT NULL,
        updated_at timestamp(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        observaciones character varying(255)
    );

    -- Tabla: notificaciones
    CREATE TABLE notificaciones (
        id bigserial PRIMARY KEY,
        usuario_id bigint NOT NULL,
        tipo_evento character varying(50) NOT NULL,
        mensaje text NOT NULL,
        estado character varying(15) NOT NULL,
        fecha_generacion timestamp(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
        fecha_lectura timestamp(0) without time zone
    );

    -- Tabla: pagos
    CREATE TABLE pagos (
        id bigserial PRIMARY KEY,
        postulante_id bigint NOT NULL,
        stripe_checkout_id character varying(255) NOT NULL,
        monto numeric(10,2) NOT NULL,
        estado_pago character varying(50) NOT NULL,
        fecha_pago timestamp(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla: password_reset_tokens
    CREATE TABLE password_reset_tokens (
        email character varying(255) PRIMARY KEY,
        token character varying(255) NOT NULL,
        created_at timestamp(0) without time zone
    );

    -- Tabla: personal_access_tokens
    CREATE TABLE personal_access_tokens (
        id bigserial PRIMARY KEY,
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

    -- Tabla: preguntas_simulacro
    CREATE TABLE preguntas_simulacro (
        id bigserial PRIMARY KEY,
        materia_id bigint NOT NULL,
        enunciado text NOT NULL,
        opciones text NOT NULL,
        respuesta_correcta character varying(255) NOT NULL,
        created_at timestamp(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla: requisitos_documentales
    CREATE TABLE requisitos_documentales (
        id bigserial PRIMARY KEY,
        postulante_id bigint NOT NULL,
        ci_digitalizado boolean NOT NULL DEFAULT false,
        certificado_nacimiento boolean NOT NULL DEFAULT false,
        titulo_bachiller_legalizado boolean NOT NULL DEFAULT false,
        formulario_preinscripcion boolean NOT NULL DEFAULT false,
        verificado_bd_externa boolean NOT NULL DEFAULT false,
        updated_at timestamp(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla: sessions
    CREATE TABLE sessions (
        id character varying(255) PRIMARY KEY,
        user_id bigint,
        ip_address character varying(45),
        user_agent text,
        payload text NOT NULL,
        last_activity integer NOT NULL
    );

    -- ==============================================================================
    -- CONSTRAINTS (FOREIGN KEYS Y CHECKS)
    -- ==============================================================================

    -- admisiones
    ALTER TABLE admisiones ADD CONSTRAINT admisiones_carrera_id_foreign FOREIGN KEY (carrera_id) REFERENCES carreras(id);
    ALTER TABLE admisiones ADD CONSTRAINT admisiones_postulante_id_foreign FOREIGN KEY (postulante_id) REFERENCES postulantes(id) ON DELETE CASCADE;

    -- asignaciones_docente
    ALTER TABLE asignaciones_docente ADD CONSTRAINT asignaciones_docente_docente_id_foreign FOREIGN KEY (docente_id) REFERENCES docentes(id) ON DELETE CASCADE;
    ALTER TABLE asignaciones_docente ADD CONSTRAINT asignaciones_docente_grupo_id_foreign FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE;
    ALTER TABLE asignaciones_docente ADD CONSTRAINT asignaciones_docente_materia_id_foreign FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE;

    -- asignaciones_grupo
    ALTER TABLE asignaciones_grupo ADD CONSTRAINT asignaciones_grupo_grupo_id_foreign FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE;
    ALTER TABLE asignaciones_grupo ADD CONSTRAINT asignaciones_grupo_postulante_id_foreign FOREIGN KEY (postulante_id) REFERENCES postulantes(id) ON DELETE CASCADE;

    -- auditoria_notas
    ALTER TABLE auditoria_notas ADD CONSTRAINT auditoria_notas_examen_id_foreign FOREIGN KEY (examen_id) REFERENCES examenes(id) ON DELETE CASCADE;
    ALTER TABLE auditoria_notas ADD CONSTRAINT auditoria_notas_usuario_modificador_id_foreign FOREIGN KEY (usuario_modificador_id) REFERENCES users(id) ON DELETE CASCADE;

    -- bitacora_accesos
    ALTER TABLE bitacora_accesos ADD CONSTRAINT bitacora_accesos_user_id_foreign FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

    -- conversaciones_chatbot
    ALTER TABLE conversaciones_chatbot ADD CONSTRAINT conversaciones_chatbot_postulante_id_foreign FOREIGN KEY (postulante_id) REFERENCES postulantes(id) ON DELETE CASCADE;

    -- cupos_gestion
    ALTER TABLE cupos_gestion ADD CONSTRAINT cupos_gestion_carrera_id_foreign FOREIGN KEY (carrera_id) REFERENCES carreras(id) ON DELETE CASCADE;
    ALTER TABLE cupos_gestion ADD CONSTRAINT cupos_gestion_gestion_id_foreign FOREIGN KEY (gestion_id) REFERENCES gestiones(id) ON DELETE CASCADE;

    -- examenes
    ALTER TABLE examenes ADD CONSTRAINT examenes_materia_id_foreign FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE;
    ALTER TABLE examenes ADD CONSTRAINT examenes_postulante_id_foreign FOREIGN KEY (postulante_id) REFERENCES postulantes(id) ON DELETE CASCADE;

    -- grupos
    ALTER TABLE grupos ADD CONSTRAINT grupos_aula_id_foreign FOREIGN KEY (aula_id) REFERENCES aulas(id);
    ALTER TABLE grupos ADD CONSTRAINT grupos_gestion_id_foreign FOREIGN KEY (gestion_id) REFERENCES gestiones(id) ON DELETE CASCADE;

    -- notas_finales
    ALTER TABLE notas_finales ADD CONSTRAINT notas_finales_materia_id_foreign FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE;
    ALTER TABLE notas_finales ADD CONSTRAINT notas_finales_postulante_id_foreign FOREIGN KEY (postulante_id) REFERENCES postulantes(id) ON DELETE CASCADE;

    -- notificaciones
    ALTER TABLE notificaciones ADD CONSTRAINT notificaciones_usuario_id_foreign FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE;

    -- pagos
    ALTER TABLE pagos ADD CONSTRAINT pagos_postulante_id_foreign FOREIGN KEY (postulante_id) REFERENCES postulantes(id) ON DELETE CASCADE;

    -- postulantes
    ALTER TABLE postulantes ADD CONSTRAINT postulantes_gestion_id_foreign FOREIGN KEY (gestion_id) REFERENCES gestiones(id);
    ALTER TABLE postulantes ADD CONSTRAINT postulantes_primera_opcion_id_foreign FOREIGN KEY (primera_opcion_id) REFERENCES carreras(id);
    ALTER TABLE postulantes ADD CONSTRAINT postulantes_segunda_opcion_id_foreign FOREIGN KEY (segunda_opcion_id) REFERENCES carreras(id);
    ALTER TABLE postulantes ADD CONSTRAINT postulantes_user_id_foreign FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

    -- docentes
    ALTER TABLE docentes ADD CONSTRAINT docentes_user_id_foreign FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
    ALTER TABLE docentes ADD CONSTRAINT docentes_area_id_foreign FOREIGN KEY (area_id) REFERENCES materias(id) ON DELETE SET NULL;

    -- especialidades
    ALTER TABLE especialidades ADD CONSTRAINT especialidades_docente_id_foreign FOREIGN KEY (docente_id) REFERENCES docentes(id) ON DELETE CASCADE;
    ALTER TABLE especialidades ADD CONSTRAINT especialidades_area_id_foreign FOREIGN KEY (area_id) REFERENCES materias(id) ON DELETE SET NULL;

    -- horarios_grupo_materia
    ALTER TABLE horarios_grupo_materia ADD CONSTRAINT horarios_grupo_materia_grupo_id_foreign FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE;
    ALTER TABLE horarios_grupo_materia ADD CONSTRAINT horarios_grupo_materia_materia_id_foreign FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE;

    -- preguntas_simulacro
    ALTER TABLE preguntas_simulacro ADD CONSTRAINT preguntas_simulacro_materia_id_foreign FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE;

    -- requisitos_documentales
    ALTER TABLE requisitos_documentales ADD CONSTRAINT requisitos_documentales_postulante_id_foreign FOREIGN KEY (postulante_id) REFERENCES postulantes(id) ON DELETE CASCADE;

    -- users
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['Administrador'::character varying, 'Coordinador'::character varying, 'Docente'::character varying, 'Postulante'::character varying])::text[])));

    -- ==============================================================================
    -- INDICES
    -- ==============================================================================

    CREATE UNIQUE INDEX admisiones_postulante_id_unique ON public.admisiones USING btree (postulante_id);
    CREATE UNIQUE INDEX asignaciones_docente_grupo_id_materia_id_unique ON public.asignaciones_docente USING btree (grupo_id, materia_id);
    CREATE UNIQUE INDEX asignaciones_grupo_postulante_id_unique ON public.asignaciones_grupo USING btree (postulante_id);
    CREATE UNIQUE INDEX carreras_codigo_unique ON public.carreras USING btree (codigo);
    CREATE UNIQUE INDEX carreras_nombre_unique ON public.carreras USING btree (nombre);
    CREATE UNIQUE INDEX cupos_gestion_gestion_id_carrera_id_unique ON public.cupos_gestion USING btree (gestion_id, carrera_id);
    CREATE UNIQUE INDEX docentes_ci_unique ON public.docentes USING btree (ci);
    CREATE UNIQUE INDEX examenes_postulante_id_materia_id_numero_examen_unique ON public.examenes USING btree (postulante_id, materia_id, numero_examen);
    CREATE UNIQUE INDEX failed_jobs_uuid_unique ON public.failed_jobs USING btree (uuid);
    CREATE UNIQUE INDEX gestiones_codigo_unique ON public.gestiones USING btree (codigo);
    CREATE UNIQUE INDEX grupos_gestion_id_turno_numero_unique ON public.grupos USING btree (gestion_id, turno, numero);
    CREATE UNIQUE INDEX materias_codigo_unique ON public.materias USING btree (codigo);
    CREATE UNIQUE INDEX materias_nombre_unique ON public.materias USING btree (nombre);
    CREATE UNIQUE INDEX notas_finales_postulante_id_materia_id_unique ON public.notas_finales USING btree (postulante_id, materia_id);
    CREATE UNIQUE INDEX pagos_stripe_checkout_id_unique ON public.pagos USING btree (stripe_checkout_id);
    CREATE INDEX personal_access_tokens_expires_at_index ON public.personal_access_tokens USING btree (expires_at);
    CREATE UNIQUE INDEX personal_access_tokens_token_unique ON public.personal_access_tokens USING btree (token);
    CREATE INDEX personal_access_tokens_tokenable_type_tokenable_id_index ON public.personal_access_tokens USING btree (tokenable_type, tokenable_id);
    CREATE UNIQUE INDEX postulantes_ci_unique ON public.postulantes USING btree (ci);
    CREATE UNIQUE INDEX requisitos_documentales_postulante_id_unique ON public.requisitos_documentales USING btree (postulante_id);
    CREATE INDEX sessions_last_activity_index ON public.sessions USING btree (last_activity);
    CREATE INDEX sessions_user_id_index ON public.sessions USING btree (user_id);
    CREATE UNIQUE INDEX users_email_unique ON public.users USING btree (email);
    CREATE UNIQUE INDEX horario_grupo_materia_dia_unique ON public.horarios_grupo_materia USING btree (grupo_id, materia_id, dia_semana);

    COMMIT;