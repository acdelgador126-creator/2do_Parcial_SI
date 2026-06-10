"""Add conceptual database class diagram to diagramas.qea (Enterprise Architect)."""
import sqlite3
import shutil
import uuid
import datetime
import os
import random

base = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(base, "diagramas.qea")
backup_path = os.path.join(base, "diagramas_backup_modelo_conceptual_bd.qea")

PKG = 51  # baseDeDatos
DIAGRAM_NAME = "Diagrama de Clases \u2014 Modelo Conceptual CUP-FICCT"

CLASSES = {
    "User": {
        "attrs": [
            ("id", "Long"), ("name", "String"), ("email", "String"), ("password", "String"),
            ("role", "String"), ("active", "Boolean"), ("intentosFallidos", "Int"),
            ("bloqueadoHasta", "Date"),
        ],
        "ops": [
            ("iniciarSesion()", "Boolean"), ("cerrarSesion()", "void"),
            ("validarCredenciales()", "Boolean"), ("bloquearCuenta()", "void"),
        ],
    },
    "BitacoraAcceso": {
        "attrs": [
            ("id", "Long"), ("ipAddress", "String"), ("action", "String"), ("createdAt", "Date"),
        ],
        "ops": [("registrarAcceso()", "void")],
    },
    "Notificacion": {
        "attrs": [
            ("id", "Long"), ("tipoEvento", "String"), ("mensaje", "Text"), ("estado", "String"),
            ("fechaGeneracion", "Date"), ("fechaLectura", "Date"),
        ],
        "ops": [("marcarComoLeida()", "void")],
    },
    "GestionAcademica": {
        "attrs": [
            ("id", "Long"), ("codigo", "String"), ("activa", "Boolean"),
            ("fechaInicio", "Date"), ("fechaFin", "Date"), ("createdAt", "Date"),
        ],
        "ops": [("estaVigente()", "Boolean"), ("activar()", "void")],
    },
    "Carrera": {
        "attrs": [("id", "Long"), ("nombre", "String"), ("codigo", "String")],
        "ops": [],
    },
    "CupoGestion": {
        "attrs": [
            ("id", "Long"), ("cupoMaximo", "Integer"), ("cuposDisponibles", "Integer"),
            ("createdAt", "Date"),
        ],
        "ops": [("verificarDisponibilidad()", "Boolean"), ("decrementarCupo()", "void")],
    },
    "Admision": {
        "attrs": [("id", "Long"), ("via", "String"), ("fechaAdmision", "Date")],
        "ops": [("ejecutarAsignacion()", "void"), ("reasignarCarrera()", "void")],
    },
    "Postulante": {
        "attrs": [
            ("id", "Long"), ("ci", "String"), ("nombres", "String"), ("apellidos", "String"),
            ("fechaNacimiento", "Date"), ("sexo", "Char"), ("direccion", "String"),
            ("ciudad", "String"), ("telefono", "String"), ("email", "String"),
            ("colegioProcedencia", "String"), ("tituloBachiller", "String"),
            ("turnoPreferencia", "String"), ("estado", "String"), ("recurrente", "Boolean"),
            ("createdAt", "Date"), ("updatedAt", "Date"),
        ],
        "ops": [
            ("registrar()", "void"), ("verificarRequisitos()", "Boolean"),
            ("detectarRecurrente()", "Boolean"), ("cambiarEstado()", "void"),
        ],
    },
    "RequisitosDocumentales": {
        "attrs": [
            ("id", "Long"), ("ciDigitalizado", "Boolean"), ("certificadoNacimiento", "Boolean"),
            ("tituloBachillerLegalizado", "Boolean"), ("formularioPreinscripcion", "Boolean"),
            ("verificadoBdExterna", "Boolean"), ("updatedAt", "Date"),
        ],
        "ops": [("estaCompleto()", "Boolean")],
    },
    "Pago": {
        "attrs": [
            ("id", "Long"), ("monto", "Decimal"), ("estadoPago", "String"),
            ("stripeCheckoutId", "String"), ("fechaPago", "Date"),
        ],
        "ops": [("confirmarPago()", "void"), ("verificarEstado()", "String")],
    },
    "ConversacionChatbot": {
        "attrs": [
            ("id", "Long"), ("pregunta", "Text"), ("respuesta", "Text"),
            ("resuelta", "Boolean"), ("fecha", "Date"),
        ],
        "ops": [("resolver()", "void")],
    },
    "Aula": {
        "attrs": [
            ("id", "Long"), ("nombre", "String"), ("capacidad", "Integer"), ("ubicacion", "String"),
        ],
        "ops": [],
    },
    "Grupo": {
        "attrs": [
            ("id", "Long"), ("numero", "Integer"), ("turno", "String"), ("createdAt", "Date"),
        ],
        "ops": [
            ("estaCompleto()", "Boolean"), ("agregarEstudiante()", "void"),
            ("calcularCantidadGrupos()", "Integer"),
        ],
    },
    "AsignacionGrupo": {
        "attrs": [("id", "Long"), ("createdAt", "Date")],
        "ops": [("asignar()", "void")],
    },
    "Materia": {
        "attrs": [("id", "Long"), ("nombre", "String"), ("codigo", "String")],
        "ops": [],
    },
    "Docente": {
        "attrs": [
            ("id", "Long"), ("ci", "String"), ("nombres", "String"), ("apellidos", "String"),
            ("especialidad", "String"), ("gradoAcademico", "String"), ("correo", "String"),
            ("telefono", "String"), ("fechaNacimiento", "Date"), ("estado", "String"),
            ("createdAt", "Date"),
        ],
        "ops": [("getCargaHoraria()", "Integer"), ("puedeAsignarGrupo()", "Boolean")],
    },
    "Especialidad": {
        "attrs": [("id", "Long"), ("nombre", "String"), ("createdAt", "Date")],
        "ops": [],
    },
    "AsignacionDocente": {
        "attrs": [("id", "Long"), ("createdAt", "Date")],
        "ops": [("asignar()", "void")],
    },
    "HorarioGrupoMateria": {
        "attrs": [
            ("id", "Long"), ("diaSemana", "Integer"), ("horaInicio", "Time"),
            ("horaFin", "Time"), ("createdAt", "Date"),
        ],
        "ops": [],
    },
    "PreguntaSimulacro": {
        "attrs": [
            ("id", "Long"), ("enunciado", "Text"), ("opciones", "Text"),
            ("respuestaCorrecta", "String"), ("createdAt", "Date"),
        ],
        "ops": [],
    },
    "Examen": {
        "attrs": [
            ("id", "Long"), ("numeroExamen", "Integer"), ("nota", "Decimal"), ("createdAt", "Date"),
        ],
        "ops": [("validarRangoNota()", "Boolean"), ("calcularNotaPonderada()", "Decimal")],
    },
    "NotaFinal": {
        "attrs": [
            ("id", "Long"), ("promedio", "Decimal"), ("estado", "String"),
            ("observaciones", "String"), ("updatedAt", "Date"),
        ],
        "ops": [("calcularPromedio()", "Decimal"), ("determinarEstado()", "String")],
    },
    "AuditoriaNota": {
        "attrs": [
            ("id", "Long"), ("notaAnterior", "Decimal"), ("notaNueva", "Decimal"),
            ("motivo", "Text"), ("fechaModificacion", "Date"),
        ],
        "ops": [("registrarCambio()", "void")],
    },
}

# left, top, width, height (EA: top/bottom negative, bottom = top - height)
LAYOUT = {
    "User": (40, -40, 260, 300),
    "BitacoraAcceso": (340, -40, 260, 220),
    "Notificacion": (640, -40, 280, 260),
    "GestionAcademica": (40, -380, 280, 260),
    "Carrera": (360, -380, 220, 160),
    "CupoGestion": (620, -380, 260, 220),
    "Admision": (920, -380, 220, 180),
    "RequisitosDocumentales": (40, -680, 300, 260),
    "Postulante": (380, -680, 340, 460),
    "Pago": (760, -680, 240, 220),
    "ConversacionChatbot": (1040, -680, 300, 240),
    "Aula": (40, -1180, 220, 180),
    "Grupo": (300, -1180, 220, 220),
    "AsignacionGrupo": (560, -1180, 260, 180),
    "Materia": (860, -1180, 220, 160),
    "Docente": (1120, -1180, 280, 320),
    "Especialidad": (1440, -1180, 240, 180),
    "AsignacionDocente": (40, -1440, 280, 180),
    "HorarioGrupoMateria": (360, -1440, 300, 200),
    "PreguntaSimulacro": (720, -1440, 300, 220),
    "Examen": (1060, -1440, 240, 220),
    "NotaFinal": (1340, -1440, 240, 220),
    "AuditoriaNota": (1620, -1440, 280, 220),
}

RELATIONS = [
    ("User", "BitacoraAcceso", "1", "0..*", "registra", None),
    ("User", "Notificacion", "1", "0..*", "recibe", None),
    ("User", "Postulante", "1", "0..1", "es", None),
    ("User", "Docente", "1", "0..1", "es", None),
    ("User", "AuditoriaNota", "1", "0..*", "modifica", None),
    ("GestionAcademica", "Postulante", "1", "0..*", "convoca", None),
    ("GestionAcademica", "Grupo", "1", "0..*", "organiza", None),
    ("GestionAcademica", "CupoGestion", "1", "0..*", "define", None),
    ("Carrera", "CupoGestion", "1", "0..*", "tiene", None),
    ("Carrera", "Admision", "1", "0..*", "recibe", None),
    ("Carrera", "Postulante", "1", "0..*", "primera opcion", "primera opcion"),
    ("Carrera", "Postulante", "1", "0..*", "segunda opcion", "segunda opcion"),
    ("Postulante", "RequisitosDocumentales", "1", "1", "cumple", None),
    ("Postulante", "Pago", "1", "0..*", "realiza", None),
    ("Postulante", "AsignacionGrupo", "1", "0..1", "asignado en", "asignado en"),
    ("Postulante", "Admision", "1", "0..1", "admitido en", "admitido en"),
    ("Postulante", "Examen", "1", "0..*", "rinde", None),
    ("Postulante", "NotaFinal", "1", "0..*", "obtiene", None),
    ("Postulante", "ConversacionChatbot", "1", "0..*", "consulta", None),
    ("Aula", "Grupo", "1", "0..*", "alberga", None),
    ("Grupo", "AsignacionGrupo", "1", "0..*", "contiene", None),
    ("Grupo", "AsignacionDocente", "1", "0..*", "requiere", None),
    ("Grupo", "HorarioGrupoMateria", "1", "0..*", "programado", None),
    ("Docente", "AsignacionDocente", "1", "0..*", "imparte", None),
    ("Docente", "Especialidad", "1", "0..*", "declara", None),
    ("Materia", "Docente", "1", "0..*", "area", "area"),
    ("Materia", "AsignacionDocente", "1", "0..*", "dicta", None),
    ("Materia", "HorarioGrupoMateria", "1", "0..*", "horario", None),
    ("Materia", "Especialidad", "1", "0..*", "area", "area"),
    ("Materia", "Examen", "1", "0..*", "evalua", None),
    ("Materia", "NotaFinal", "1", "0..*", "resultados", None),
    ("Materia", "PreguntaSimulacro", "1", "0..*", "banco", None),
    ("Examen", "AuditoriaNota", "1", "0..*", "auditada", None),
]


def guid():
    return "{" + str(uuid.uuid4()).upper() + "}"


def now():
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def duid():
    return "DUID=%08X;" % random.randint(0, 0xFFFFFFFF)


print(f"Backing up {db_path} -> {backup_path} ...")
shutil.copyfile(db_path, backup_path)
print("Backup created.")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute(
        "SELECT Diagram_ID FROM t_diagram WHERE Name = ? AND Package_ID = ?",
        (DIAGRAM_NAME, PKG),
    )
    existing = cursor.fetchone()
    if existing:
        diag_id = existing[0]
        print(f"Diagram already exists (Diagram_ID={diag_id}). Cleaning up old elements...")
        
        # Get all objects placed on this diagram
        cursor.execute("SELECT Object_ID FROM t_diagramobjects WHERE Diagram_ID = ?", (diag_id,))
        obj_ids = [row[0] for row in cursor.fetchall()]
        
        if obj_ids:
            # Delete connectors associated with these objects
            placeholders = ",".join("?" for _ in obj_ids)
            cursor.execute(
                f"DELETE FROM t_connector WHERE Start_Object_ID IN ({placeholders}) OR End_Object_ID IN ({placeholders})",
                obj_ids + obj_ids
            )
            
            # Delete attributes
            cursor.execute(f"DELETE FROM t_attribute WHERE Object_ID IN ({placeholders})", obj_ids)
            
            # Delete operations
            cursor.execute(f"DELETE FROM t_operation WHERE Object_ID IN ({placeholders})", obj_ids)
            
            # Delete objects
            cursor.execute(f"DELETE FROM t_object WHERE Object_ID IN ({placeholders})", obj_ids)
            
            # Delete from t_diagramobjects
            cursor.execute("DELETE FROM t_diagramobjects WHERE Diagram_ID = ?", (diag_id,))
            
        # Delete the diagram itself
        cursor.execute("DELETE FROM t_diagram WHERE Diagram_ID = ?", (diag_id,))
        print("Cleanup completed.")

    cursor.execute(
        """
        INSERT INTO t_diagram
            (Package_ID, ParentID, Diagram_Type, Name, Version, Author, ShowDetails, Notes,
             AttPub, AttPri, AttPro, Orientation, cx, cy, Scale, CreatedDate, ModifiedDate,
             ShowForeign, ShowBorder, ShowPackageContents, PDATA, Locked, ea_guid, Swimlanes, StyleEx)
        VALUES (?, 0, 'Class', ?, '1.0', 'User', 0,
                'Modelo Conceptual CUP-FICCT (FICCT_v2.sql)',
                1, 1, 1, 'L', 2200, 1800, 100, ?, ?,
                0, 1, 1,
                'HideRel=0;ShowTags=0;ShowReqs=0;ShowCons=0;OpParams=1;ShowSN=0;ScalePI=0;PPgs.cx=1;PPgs.cy=1;PSize=9;ShowIcons=1;SuppCN=0;HideProps=0;HideParents=0;UseAlias=0;HideAtts=0;HideOps=0;HideStereo=0;HideEStereo=0;ShowRec=1;ShowRes=0;ShowShape=1;FormName=;',
                0, ?,
                'locked=false;orientation=0;width=0;inbar=false;names=false;color=-1;bold=false;fcol=0;tcol=-1;ofCol=-1;ufCol=-1;hl=1;ufh=0;hh=0;cls=0;bw=0;hli=0;bro=0;',
                'ExcludeRTF=0;DocAll=0;HideQuals=0;AttPkg=1;ShowTests=0;ShowMaint=0;SuppressFOC=1;MatrixActive=0;SwimlanesActive=1;KanbanActive=0;MatrixLineWidth=1;MatrixLineClr=0;MatrixLocked=0;TConnectorNotation=UML 2.1;TExplicitNavigability=0;AdvancedElementProps=1;AdvancedFeatureProps=1;AdvancedConnectorProps=1;m_bElementClassifier=1;SPT=1;MDGDgm=;STBLDgm=;ShowNotes=0;VisibleAttributeDetail=0;ShowOpRetType=1;SuppressBrackets=0;SuppConnectorLabels=0;PrintPageHeadFoot=0;ShowAsList=0;SuppressedCompartments=;Theme=:119;SaveTag=C6EDDB1A;')
        """,
        (PKG, DIAGRAM_NAME, now(), now(), guid()),
    )
    diagram_id = cursor.lastrowid
    print(f"Created diagram Diagram_ID={diagram_id}")

    class_ids = {}

    def new_class(name):
        cursor.execute(
            """
            INSERT INTO t_object
                (Object_Type, Diagram_ID, Name, Version, Package_ID, Stereotype, NType, Complexity, Effort,
                 Backcolor, BorderStyle, BorderWidth, Fontcolor, Bordercolor,
                 CreatedDate, ModifiedDate, Status, Tagged, Scope, ea_guid, ParentID,
                 IsRoot, IsLeaf, IsSpec, IsActive)
            VALUES ('Class', 0, ?, '1.0', ?, '', 0, '1', 0,
                    0, 0, 0, 0, 0,
                    ?, ?, 'Proposed', 0, 'Public', ?, 0,
                    0, 0, 0, 0)
            """,
            (name, PKG, now(), now(), guid()),
        )
        return cursor.lastrowid

    def add_attrs(obj_id, attrs):
        for pos, (name, atype) in enumerate(attrs):
            cursor.execute(
                """
                INSERT INTO t_attribute (Object_ID, Name, Scope, IsStatic, IsCollection, IsOrdered, AllowDuplicates, Pos, Type, ea_guid)
                VALUES (?, ?, 'Private', 0, 0, 0, 0, ?, ?, ?)
                """,
                (obj_id, name, pos, atype, guid()),
            )

    def add_ops(obj_id, ops):
        for pos, (name, ret) in enumerate(ops):
            cursor.execute(
                """
                INSERT INTO t_operation (Object_ID, Name, Scope, Type, ea_guid, Pos, Pure, IsRoot, IsLeaf, IsQuery)
                VALUES (?, ?, 'Public', ?, ?, ?, 0, 0, 0, 0)
                """,
                (obj_id, name, ret, guid(), pos),
            )

    for name, spec in CLASSES.items():
        obj_id = new_class(name)
        add_attrs(obj_id, spec["attrs"])
        add_ops(obj_id, spec["ops"])
        class_ids[name] = obj_id
        print(f"  Class {name} -> Object_ID={obj_id}")

    seqz = [1000]

    def place(name):
        left, top, width, height = LAYOUT[name]
        seqz[0] -= 1
        cursor.execute(
            """
            INSERT INTO t_diagramobjects (Diagram_ID, Object_ID, RectTop, RectLeft, RectRight, RectBottom, Sequence, ObjectStyle)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                diagram_id,
                class_ids[name],
                top,
                left,
                left + width,
                top - height,
                seqz[0],
                duid(),
            ),
        )

    for name in CLASSES:
        place(name)
    print("Placed all classes on diagram.")

    def association(start_name, end_name, src_card, dest_card, label, dest_role):
        cursor.execute(
            """
            INSERT INTO t_connector
                (Name, Direction, Connector_Type, Start_Object_ID, End_Object_ID,
                 SourceCard, DestCard, DestRole, RouteStyle, LineColor, DiagramID, ea_guid,
                 SourceIsNavigable, DestIsNavigable, IsRoot, IsLeaf, SourceStyle, DestStyle)
            VALUES (?, 'Unspecified', 'Association', ?, ?,
                    ?, ?, ?, 3, -1, ?, ?, 0, 0, 0, 0,
                    'Union=0;Derived=0;AllowDuplicates=0;Owned=0;Navigable=Unspecified;',
                    'Union=0;Derived=0;AllowDuplicates=0;Owned=0;Navigable=Unspecified;')
            """,
            (
                label,
                class_ids[start_name],
                class_ids[end_name],
                src_card,
                dest_card,
                dest_role or "",
                diagram_id,
                guid(),
            ),
        )

    for rel in RELATIONS:
        association(*rel)
    print(f"Added {len(RELATIONS)} associations.")

    conn.commit()
    print(f"\nDONE. Conceptual class diagram committed. Diagram_ID={diagram_id}")
except Exception as e:
    conn.rollback()
    print("\nError, rolled back:", e)
    raise
finally:
    conn.close()
