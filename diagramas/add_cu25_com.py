import sqlite3
import shutil
import uuid
import datetime
import os
import random

base = os.path.dirname(os.path.abspath(__file__))
db_path = os.path.join(base, "diagramas.qea")
backup_path = os.path.join(base, "diagramas_backup_cu25_com.qea")

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

PKG = 89  # Realizaciones_Ciclo2

try:
    cursor.execute("SELECT Diagram_ID FROM t_diagram WHERE Name='Com_CU25'")
    existing = cursor.fetchone()
    if existing:
        raise RuntimeError(f"Com_CU25 already exists (Diagram_ID={existing[0]}). Aborting.")

    cursor.execute("""
        INSERT INTO t_diagram
            (Package_ID, ParentID, Diagram_Type, Name, Version, Author, ShowDetails, Notes,
             AttPub, AttPri, AttPro, Orientation, cx, cy, Scale, CreatedDate, ModifiedDate,
             ShowForeign, ShowBorder, ShowPackageContents, PDATA, Locked, ea_guid, Swimlanes, StyleEx)
        VALUES (?, 0, 'Collaboration', 'Com_CU25', '1.0', 'User', 0, 'Diagrama de Comunicaci\u00f3n del Caso de Uso CU25',
                1, 1, 1, 'P', 827, 1169, 100, ?, ?,
                0, 1, 1,
                'HideRel=0;ShowTags=0;ShowReqs=0;ShowCons=0;OpParams=1;ShowSN=0;ScalePI=0;PPgs.cx=2;PPgs.cy=1;PSize=9;ShowIcons=1;SuppCN=0;HideProps=0;HideParents=0;UseAlias=0;HideAtts=0;HideOps=0;HideStereo=0;HideEStereo=0;ShowRec=1;ShowRes=0;ShowShape=1;FormName=;',
                0, ?,
                'locked=false;orientation=0;width=0;inbar=false;names=false;color=-1;bold=false;fcol=0;tcol=-1;ofCol=-1;ufCol=-1;hl=1;ufh=0;hh=0;cls=0;bw=0;hli=0;bro=0;',
                'ExcludeRTF=0;DocAll=0;HideQuals=0;AttPkg=1;ShowTests=0;ShowMaint=0;SuppressFOC=1;MatrixActive=0;SwimlanesActive=1;KanbanActive=0;MatrixLineWidth=1;MatrixLineClr=0;MatrixLocked=0;TConnectorNotation=UML 2.1;TExplicitNavigability=0;AdvancedElementProps=1;AdvancedFeatureProps=1;AdvancedConnectorProps=1;m_bElementClassifier=1;SPT=1;MDGDgm=;STBLDgm=;ShowNotes=0;VisibleAttributeDetail=0;ShowOpRetType=1;SuppressBrackets=0;SuppConnectorLabels=0;PrintPageHeadFoot=0;ShowAsList=0;SuppressedCompartments=;Theme=:119;SaveTag=E700E9D8;')
    """, (PKG, now(), now(), guid()))
    diagram_id = cursor.lastrowid
    print(f"Created Collaboration diagram Com_CU25, Diagram_ID={diagram_id}")

    def new_element(otype, name, stereotype=None):
        cursor.execute("""
            INSERT INTO t_object
                (Object_Type, Diagram_ID, Name, Version, Package_ID, Stereotype, NType, Complexity, Effort,
                 Backcolor, BorderStyle, BorderWidth, Fontcolor, Bordercolor,
                 CreatedDate, ModifiedDate, Status, Tagged, Scope, ea_guid, ParentID,
                 IsRoot, IsLeaf, IsSpec, IsActive)
            VALUES (?, 0, ?, '1.0', ?, ?, 0, '1', 0,
                    0, 0, 0, 0, 0,
                    ?, ?, 'Proposed', 0, 'Public', ?, 0,
                    0, 0, 0, 0)
        """, (otype, name, PKG, stereotype, now(), now(), guid()))
        return cursor.lastrowid

    act  = new_element('Actor',  'Administrador / Coordinador')
    bint = new_element('Object', 'IU_RevisionDocentes', 'boundary')
    ctrl = new_element('Object', 'CTR_Docentes', 'control')
    edoc = new_element('Object', 'CE_Docente', 'entity')
    eesp = new_element('Object', 'CE_Especialidad', 'entity')
    emat = new_element('Object', 'CE_Materia', 'entity')
    eusu = new_element('Object', 'CE_Usuario', 'entity')
    print(f"Created: Act={act}, IU={bint}, CTR={ctrl}, Doc={edoc}, Esp={eesp}, Mat={emat}, Usu={eusu}")

    # --- Single horizontal row layout (clean, no overlap) ---
    # order follows the message flow; entities spread out to the right
    row = [
        (act,  100,  140),
        (bint, 300,  390),
        (ctrl, 540,  630),
        (edoc, 780,  870),
        (eesp, 1020, 1110),
        (emat, 1260, 1350),
        (eusu, 1500, 1590),
    ]
    TOP, BOTTOM, ACTOR_BOTTOM = -300, -400, -380
    centers = {}
    seqz = len(row) + 1
    for oid, left, right in row:
        seqz -= 1
        bottom = ACTOR_BOTTOM if oid == act else BOTTOM
        cursor.execute("""
            INSERT INTO t_diagramobjects (Diagram_ID, Object_ID, RectTop, RectLeft, RectRight, RectBottom, Sequence, ObjectStyle)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (diagram_id, oid, TOP, left, right, bottom, seqz, duid()))
        centers[oid] = (left + right) // 2
    print("Placed elements in a single horizontal row.")

    # --- Sequence messages ---
    seq = [0]
    y = [-135]
    def msg(name, start_id, end_id):
        seq[0] += 1
        sx = centers[start_id]
        ex = centers[end_id] if end_id != start_id else centers[start_id] + 60
        cursor.execute("""
            INSERT INTO t_connector
                (Name, Direction, Connector_Type, Start_Object_ID, End_Object_ID, SeqNo, DiagramID, ea_guid,
                 PtStartX, PtStartY, PtEndX, PtEndY,
                 RouteStyle, LineColor, SourceIsNavigable, DestIsNavigable, IsRoot, IsLeaf, SourceStyle, DestStyle)
            VALUES (?, 'Source -> Destination', 'Sequence', ?, ?, ?, ?, ?,
                    ?, ?, ?, ?,
                    0, -1, 0, 0, 0, 0,
                    'Union=0;Derived=0;AllowDuplicates=0;Owned=0;Navigable=Unspecified;',
                    'Union=0;Derived=0;AllowDuplicates=0;Owned=0;Navigable=Unspecified;')
        """, (name, start_id, end_id, seq[0], diagram_id, guid(), sx, y[0], ex, y[0]))
        y[0] -= 35

    msg('1: + SeleccionarPostulacion(docenteId)', act, bint)
    msg('2: + revisar(docenteId)', bint, ctrl)
    msg('3: + findOrFail(docente_id)', ctrl, edoc)
    msg('4: + DatosDocente', edoc, ctrl)
    msg("5: + where('docente_id', docente_id)", ctrl, eesp)
    msg('6: + Especialidad', eesp, ctrl)
    msg('7: + findOrFail(area_id)', ctrl, emat)
    msg('8: + DatosArea', emat, ctrl)
    msg('8.1: + ValidarEspecialidadVsArea(especialidad, area.nombre)', ctrl, ctrl)
    msg("9: + update(['estado' => 'Aceptado'])", ctrl, edoc)
    msg("10: + create(['rol' => 'Docente', 'activo' => true])", ctrl, eusu)
    msg('11: + ConfirmarAceptacion()', ctrl, bint)
    msg('12: + MostrarDocenteAceptado()', bint, act)
    print(f"Added {seq[0]} sequence messages.")

    conn.commit()
    print(f"\nDONE. Com_CU25 committed. Diagram_ID={diagram_id}")
except Exception as e:
    conn.rollback()
    print("\nError, rolled back:", e)
    raise
finally:
    conn.close()
