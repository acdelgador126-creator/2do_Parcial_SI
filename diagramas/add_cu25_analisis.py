import sqlite3
import shutil
import uuid
import datetime
import os
import random

base = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(base, "diagramas.qea")
backup_path = os.path.join(base, "diagramas_backup_cu25_analisis.qea")

print(f"Backing up {db_path} -> {backup_path} ...")
shutil.copyfile(db_path, backup_path)
print("Backup created.")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

def guid():
    return "{" + str(uuid.uuid4()).upper() + "}"

def now():
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def duid():
    return "DUID=%08X;" % random.randint(0, 0xFFFFFFFF)

PKG = 83  # ciclo2
ADMIN_ID = 20  # Administrador
COORD_ID = 21  # Coordinador

try:
    cursor.execute("SELECT Diagram_ID FROM t_diagram WHERE Name LIKE 'CU25%An%lisis de Clases'")
    existing = cursor.fetchone()
    if existing:
        raise RuntimeError(f"CU25 Analisis de Clases already exists (Diagram_ID={existing[0]}). Aborting.")

    cursor.execute("""
        INSERT INTO t_diagram
            (Package_ID, ParentID, Diagram_Type, Name, Version, Author, ShowDetails, Notes,
             AttPub, AttPri, AttPro, Orientation, cx, cy, Scale, CreatedDate, ModifiedDate,
             ShowForeign, ShowBorder, ShowPackageContents, PDATA, Locked, ea_guid, Swimlanes, StyleEx)
        VALUES (?, 0, 'Logical', ?, '1.0', 'User', 0, 'UML Analysis Class Diagram',
                1, 1, 1, 'P', 827, 1169, 100, ?, ?,
                0, 1, 1,
                'HideRel=0;ShowTags=0;ShowReqs=0;ShowCons=0;OpParams=1;ShowSN=0;ScalePI=0;PPgs.cx=1;PPgs.cy=1;PSize=9;ShowIcons=1;SuppCN=0;HideProps=0;HideParents=0;UseAlias=0;HideAtts=0;HideOps=0;HideStereo=0;HideEStereo=0;ShowRec=1;ShowRes=0;ShowShape=1;FormName=;',
                0, ?,
                'locked=false;orientation=0;width=0;inbar=false;names=false;color=-1;bold=false;fcol=0;tcol=-1;ofCol=-1;ufCol=-1;hl=1;ufh=0;hh=0;cls=0;bw=0;hli=0;bro=0;',
                'ExcludeRTF=0;DocAll=0;HideQuals=0;AttPkg=1;ShowTests=0;ShowMaint=0;SuppressFOC=1;MatrixActive=0;SwimlanesActive=1;KanbanActive=0;MatrixLineWidth=1;MatrixLineClr=0;MatrixLocked=0;TConnectorNotation=UML 2.1;TExplicitNavigability=0;AdvancedElementProps=1;AdvancedFeatureProps=1;AdvancedConnectorProps=1;m_bElementClassifier=1;SPT=1;MDGDgm=;STBLDgm=;ShowNotes=0;VisibleAttributeDetail=0;ShowOpRetType=1;SuppressBrackets=0;SuppConnectorLabels=0;PrintPageHeadFoot=0;ShowAsList=0;SuppressedCompartments=;Theme=:119;SaveTag=C6EDDB1A;')
    """, (PKG, 'CU25: Aceptar Postulaci\u00f3n de Docente - An\u00e1lisis de Clases', now(), now(), guid()))
    diagram_id = cursor.lastrowid
    print(f"Created analysis diagram, Diagram_ID={diagram_id}")

    def new_class(name):
        cursor.execute("""
            INSERT INTO t_object
                (Object_Type, Diagram_ID, Name, Version, Package_ID, Stereotype, NType, Complexity, Effort,
                 Backcolor, BorderStyle, BorderWidth, Fontcolor, Bordercolor,
                 CreatedDate, ModifiedDate, Status, Tagged, Scope, ea_guid, ParentID,
                 IsRoot, IsLeaf, IsSpec, IsActive)
            VALUES ('Class', 0, ?, '1.0', ?, '', 0, '1', 0,
                    0, 0, 0, 0, 0,
                    ?, ?, 'Proposed', 0, 'Public', ?, 0,
                    0, 0, 0, 0)
        """, (name, PKG, now(), now(), guid()))
        return cursor.lastrowid

    def add_attrs(obj_id, attrs):
        for pos, (name, atype) in enumerate(attrs):
            cursor.execute("""
                INSERT INTO t_attribute (Object_ID, Name, Scope, IsStatic, IsCollection, IsOrdered, AllowDuplicates, Pos, Type, ea_guid)
                VALUES (?, ?, 'Public', 0, 0, 0, 0, ?, ?, ?)
            """, (obj_id, name, pos, atype, guid()))

    def add_ops(obj_id, ops):
        for pos, name in enumerate(ops):
            cursor.execute("""
                INSERT INTO t_operation (Object_ID, Name, Scope, Type, ea_guid, Pos, Pure, IsRoot, IsLeaf, IsQuery)
                VALUES (?, ?, 'Public', 'void', ?, ?, 0, 0, 0, 0)
            """, (obj_id, name, guid(), pos))

    interfaz = new_class('InterfazRevisionDocentes')
    add_attrs(interfaz, [('docenteId', 'integer'), ('motivoRechazo', 'string')])
    add_ops(interfaz, [
        'seleccionarPostulacion(docenteId)', 'aceptarPostulacion()',
        'rechazarPostulacion(motivo)', 'mostrarDocenteAceptado()',
        'mostrarValidacionEspecialidad()',
    ])

    control = new_class('ControladorDocentes')
    add_ops(control, [
        'revisar(docenteId)', 'aceptar(docenteId)',
        'rechazar(docenteId, motivo)', 'validarEspecialidadVsArea(especialidad, area)',
    ])

    docente = new_class('Docente')
    add_attrs(docente, [
        ('id', 'integer'), ('ci', 'string'), ('nombres', 'string'), ('apellidos', 'string'),
        ('correo', 'string'), ('estado', 'string'), ('area_id', 'integer'),
    ])

    especialidad = new_class('Especialidad')
    add_attrs(especialidad, [
        ('id', 'integer'), ('docente_id', 'integer'), ('nombre', 'string'), ('area_id', 'integer'),
    ])

    materia = new_class('Materia')
    add_attrs(materia, [('id', 'integer'), ('nombre', 'string')])

    user = new_class('User')
    add_attrs(user, [
        ('id', 'integer'), ('name', 'string'), ('email', 'string'),
        ('password', 'string'), ('role', 'string'), ('active', 'boolean'),
    ])

    print(f"Created classes: Interfaz={interfaz}, Control={control}, Docente={docente}, Especialidad={especialidad}, Materia={materia}, User={user}")

    seqz = [12]
    def place(obj_id, top, left, right, bottom):
        seqz[0] -= 1
        cursor.execute("""
            INSERT INTO t_diagramobjects (Diagram_ID, Object_ID, RectTop, RectLeft, RectRight, RectBottom, Sequence, ObjectStyle)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (diagram_id, obj_id, top, left, right, bottom, seqz[0], duid()))

    place(ADMIN_ID,     -60,   50,   90, -160)
    place(COORD_ID,    -300,   50,   90, -400)
    place(interfaz,     -20,  240,  480, -360)
    place(control,     -120,  580,  820, -300)
    place(docente,      120,  920, 1150, -120)
    place(especialidad,-180,  920, 1150, -320)
    place(materia,     -380,  920, 1150, -480)
    place(user,        -540,  920, 1150, -720)
    print("Placed elements on the diagram.")

    def association(start_id, end_id):
        cursor.execute("""
            INSERT INTO t_connector
                (Name, Direction, Connector_Type, Start_Object_ID, End_Object_ID,
                 RouteStyle, LineColor, DiagramID, ea_guid,
                 SourceIsNavigable, DestIsNavigable, IsRoot, IsLeaf, SourceStyle, DestStyle)
            VALUES (NULL, 'Unspecified', 'Association', ?, ?,
                    3, -1, 0, ?, 0, 0, 0, 0,
                    'Union=0;Derived=0;AllowDuplicates=0;Owned=0;Navigable=Unspecified;',
                    'Union=0;Derived=0;AllowDuplicates=0;Owned=0;Navigable=Unspecified;')
        """, (start_id, end_id, guid()))

    association(ADMIN_ID, interfaz)
    association(COORD_ID, interfaz)
    association(interfaz, control)
    association(control, docente)
    association(control, especialidad)
    association(control, materia)
    association(control, user)
    print("Added 7 associations.")

    conn.commit()
    print(f"\nDONE. CU25 Analisis de Clases committed. Diagram_ID={diagram_id}")
except Exception as e:
    conn.rollback()
    print("\nError, rolled back:", e)
    raise
finally:
    conn.close()
