import sqlite3
import shutil
import uuid
import datetime
import os

base = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(base, "diagramas.qea")
backup_path = os.path.join(base, "diagramas_backup_cu25.qea")

print(f"Backing up {db_path} -> {backup_path} ...")
shutil.copyfile(db_path, backup_path)
print("Backup created.")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

def guid():
    return "{" + str(uuid.uuid4()).upper() + "}"

def now():
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

PKG = 83  # ciclo2

# Reuse existing canonical actors from the use case model
ADMIN_ID = 20   # Administrador
COORD_ID = 21   # Coordinador

try:
    cursor.execute("SELECT Diagram_ID FROM t_diagram WHERE Name LIKE 'CU25%' AND Diagram_Type='Use Case'")
    existing = cursor.fetchone()
    if existing:
        raise RuntimeError(f"A CU25 Use Case diagram already exists (Diagram_ID={existing[0]}). Aborting to avoid duplicates.")

    # --- 1. Diagram ---
    diag_guid = guid()
    cursor.execute("""
        INSERT INTO t_diagram
            (Package_ID, ParentID, Diagram_Type, Name, Version, Author, ShowDetails, Notes,
             AttPub, AttPri, AttPro, Orientation, cx, cy, Scale, CreatedDate, ModifiedDate,
             ShowForeign, ShowBorder, ShowPackageContents, PDATA, Locked, ea_guid, Swimlanes, StyleEx)
        VALUES (?, 0, 'Use Case', ?, '1.0', 'User', 0, 'Diagrama del Caso de Uso CU25',
                1, 1, 1, 'P', 827, 1169, 100, ?, ?,
                0, 1, 1,
                'HideRel=0;ShowTags=0;ShowReqs=0;ShowCons=0;OpParams=1;ShowSN=0;ScalePI=0;PPgs.cx=1;PPgs.cy=1;PSize=9;ShowIcons=1;SuppCN=0;HideProps=0;HideParents=0;UseAlias=0;HideAtts=0;HideOps=0;HideStereo=0;HideEStereo=0;ShowRec=1;ShowRes=0;ShowShape=1;FormName=;',
                0, ?,
                'locked=false;orientation=0;width=0;inbar=false;names=false;color=-1;bold=false;fcol=0;tcol=-1;ofCol=-1;ufCol=-1;hl=1;ufh=0;hh=0;cls=0;bw=0;hli=0;bro=0;',
                'ExcludeRTF=0;DocAll=0;HideQuals=0;AttPkg=1;ShowTests=0;ShowMaint=0;SuppressFOC=1;MatrixActive=0;SwimlanesActive=1;KanbanActive=0;MatrixLineWidth=1;MatrixLineClr=0;MatrixLocked=0;TConnectorNotation=UML 2.1;TExplicitNavigability=0;AdvancedElementProps=1;AdvancedFeatureProps=1;AdvancedConnectorProps=1;m_bElementClassifier=1;SPT=1;MDGDgm=;STBLDgm=;ShowNotes=0;VisibleAttributeDetail=0;ShowOpRetType=1;SuppressBrackets=0;SuppConnectorLabels=0;PrintPageHeadFoot=0;ShowAsList=0;SuppressedCompartments=;Theme=:119;SaveTag=C6EDDB1A;')
    """, (PKG, 'CU25: Aceptar Postulaci\u00f3n de Docente', now(), now(), diag_guid))
    diagram_id = cursor.lastrowid
    print(f"Created Use Case diagram CU25, Diagram_ID={diagram_id}")

    # --- 2. New use case elements ---
    def new_usecase(name, alias=None):
        cursor.execute("""
            INSERT INTO t_object
                (Object_Type, Diagram_ID, Name, Alias, Version, Package_ID, NType, Complexity, Effort,
                 Backcolor, BorderStyle, BorderWidth, Fontcolor, Bordercolor,
                 CreatedDate, ModifiedDate, Status, Tagged, Scope, ea_guid, ParentID,
                 IsRoot, IsLeaf, IsSpec, IsActive)
            VALUES ('UseCase', 0, ?, ?, '1.0', ?, 0, '1', 0,
                    0, 0, 0, 0, 0,
                    ?, ?, 'Proposed', 0, 'Public', ?, 0,
                    0, 0, 0, 0)
        """, (name, alias, PKG, now(), now(), guid()))
        return cursor.lastrowid

    cu25_id    = new_usecase('CU25: Aceptar Postulaci\u00f3n de Docente', alias='CU25')
    validar_id = new_usecase('Validar Especialidad vs \u00c1rea')
    crear_id   = new_usecase('Crear Cuenta de Usuario (Rol Docente)')
    rechazar_id= new_usecase('Rechazar Postulaci\u00f3n (con motivo)')
    print(f"Created use cases: CU25={cu25_id}, ValidarEsp={validar_id}, CrearUser={crear_id}, Rechazar={rechazar_id}")

    # --- 3. Place elements (RectTop less-negative = higher) ---
    def place(obj_id, top, left, right, bottom):
        cursor.execute("""
            INSERT INTO t_diagramobjects (Diagram_ID, Object_ID, RectTop, RectLeft, RectRight, RectBottom, Sequence)
            VALUES (?, ?, ?, ?, ?, ?, 0)
        """, (diagram_id, obj_id, top, left, right, bottom))

    place(ADMIN_ID,  -120,  80,  130, -200)   # actor top-left
    place(COORD_ID,  -340,  80,  130, -420)   # actor bottom-left
    place(cu25_id,   -225, 280,  500, -300)   # center
    place(validar_id, -60, 640,  900, -130)   # right top
    place(crear_id,  -230, 640,  900, -300)   # right middle
    place(rechazar_id,-400,640,  900, -470)   # right bottom
    print("Placed elements on the diagram.")

    # --- 4. Connectors ---
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

    def dependency(start_id, end_id, stereotype):
        cursor.execute("""
            INSERT INTO t_connector
                (Name, Direction, Connector_Type, Stereotype, Start_Object_ID, End_Object_ID,
                 RouteStyle, LineColor, DiagramID, ea_guid,
                 SourceIsNavigable, DestIsNavigable, IsRoot, IsLeaf, SourceStyle, DestStyle)
            VALUES (NULL, 'Source -> Destination', 'Dependency', ?, ?, ?,
                    3, -1, 0, ?, 0, 0, 0, 0,
                    'Union=0;Derived=0;AllowDuplicates=0;Owned=0;Navigable=Unspecified;',
                    'Union=0;Derived=0;AllowDuplicates=0;Owned=0;Navigable=Unspecified;')
        """, (stereotype, start_id, end_id, guid()))

    association(ADMIN_ID, cu25_id)            # Admin --> CU25
    association(COORD_ID, cu25_id)            # Coord --> CU25
    dependency(cu25_id, validar_id, 'include')  # CU25 ..> ValidarEsp : <<include>>
    dependency(cu25_id, crear_id,  'include')   # CU25 ..> CrearUser  : <<include>>
    dependency(rechazar_id, cu25_id, 'extend')  # CU25 <.. Rechazar   : <<extend>>
    print("Added connectors (2 associations + 2 include + 1 extend).")

    conn.commit()
    print(f"\nDONE. CU25 diagram committed. Diagram_ID={diagram_id}")
except Exception as e:
    conn.rollback()
    print("\nError, rolled back:", e)
    raise
finally:
    conn.close()
